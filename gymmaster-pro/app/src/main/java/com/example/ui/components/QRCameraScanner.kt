package com.example.ui.components

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QRCameraScanner(
    onDismiss: () -> Unit,
    onQrCodeScanned: (String) -> Unit,
    onError: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
        if (!isGranted) {
            onError("Camera permission denied. Please grant permission in settings to use the scanner.")
        }
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    // Camera State
    var lensFacing by remember { mutableIntStateOf(CameraSelector.LENS_FACING_BACK) }
    var camera: Camera? by remember { mutableStateOf(null) }
    var isTorchOn by remember { mutableStateOf(false) }
    var hasFlashUnit by remember { mutableStateOf(false) }
    var isInitializing by remember { mutableStateOf(true) }

    // Scanner state to prevent duplicates (3 seconds ignore)
    var isScanningActive by remember { mutableStateOf(true) }
    var lastScannedCode by remember { mutableStateOf("") }
    var lastScanTime by remember { mutableLongStateOf(0L) }

    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    val previewView = remember { PreviewView(context) }
    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }

    // Gallery Picker for QR images
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            scope.launch {
                isInitializing = true
                val bitmap = getBitmapFromUri(context, uri)
                if (bitmap != null) {
                    val decodedResult = decodeQrFromBitmap(bitmap)
                    if (decodedResult != null) {
                        onQrCodeScanned(decodedResult)
                    } else {
                        onError("No valid QR code detected in the uploaded image.")
                    }
                } else {
                    onError("Failed to read the selected image.")
                }
                isInitializing = false
            }
        }
    }

    // Laser Animation progress
    val infiniteTransition = rememberInfiniteTransition(label = "laserLine")
    val laserProgress by infiniteTransition.animateFloat(
        initialValue = 0.0f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laserProgress"
    )

    // Bind Camera lifecycle
    LaunchedEffect(lensFacing, hasCameraPermission) {
        if (!hasCameraPermission) return@LaunchedEffect
        isInitializing = true
        
        val cameraProvider = try {
            cameraProviderFuture.get()
        } catch (e: Exception) {
            Log.e("QRScanner", "Failed to get ProcessCameraProvider", e)
            onError("Failed to initialize camera: ${e.localizedMessage}")
            return@LaunchedEffect
        }

        val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()

        val preview = Preview.Builder().build()

        val imageAnalyzer = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .apply {
                setAnalyzer(cameraExecutor) { imageProxy ->
                    val mediaImage = imageProxy.image
                    if (mediaImage != null && isScanningActive) {
                        val image = InputImage.fromMediaImage(
                            mediaImage,
                            imageProxy.imageInfo.rotationDegrees
                        )
                        val scanner = BarcodeScanning.getClient()
                        scanner.process(image)
                            .addOnSuccessListener { barcodes ->
                                for (barcode in barcodes) {
                                    val rawValue = barcode.rawValue
                                    if (rawValue != null) {
                                        val now = System.currentTimeMillis()
                                        // Ignore duplicate scans of same code within 3 seconds
                                        if (rawValue != lastScannedCode || now - lastScanTime > 3000) {
                                            lastScannedCode = rawValue
                                            lastScanTime = now
                                            isScanningActive = false
                                            
                                            scope.launch {
                                                onQrCodeScanned(rawValue)
                                                // Resume scanning after 3 seconds
                                                delay(3000)
                                                isScanningActive = true
                                            }
                                        }
                                    }
                                }
                            }
                            .addOnFailureListener { e ->
                                Log.e("QRScanner", "Barcode analysis failed", e)
                            }
                            .addOnCompleteListener {
                                imageProxy.close()
                            }
                    } else {
                        imageProxy.close()
                    }
                }
            }

        try {
            cameraProvider.unbindAll()
            val boundCamera = cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageAnalyzer
            )
            camera = boundCamera
            hasFlashUnit = boundCamera.cameraInfo.hasFlashUnit()
            preview.setSurfaceProvider(previewView.surfaceProvider)
            isInitializing = false
        } catch (e: Exception) {
            Log.e("QRScanner", "Use case binding failed", e)
            onError("No camera matching the selection is available.")
            isInitializing = false
        }
    }

    LaunchedEffect(isTorchOn, camera) {
        camera?.cameraControl?.enableTorch(isTorchOn)
    }

    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color.Black
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            if (hasCameraPermission) {
                AndroidView(
                    factory = { previewView },
                    modifier = Modifier.fillMaxSize()
                )

                // Reticle Overlay
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        // Resized, larger Scanning Window
                        Box(
                            modifier = Modifier
                                .size(260.dp)
                                .border(2.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(16.dp))
                                .background(Color.Transparent)
                        ) {
                            // Scanning laser line
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val yOffset = size.height * laserProgress
                                drawLine(
                                    color = Color(0xFF10B981),
                                    start = Offset(0f, yOffset),
                                    end = Offset(size.width, yOffset),
                                    strokeWidth = 3.dp.toPx()
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Status Card
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.7f)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = if (isScanningActive) "Align QR Access Card Inside The Box" else "Processing QR Pass...",
                                color = if (isScanningActive) Color.White else Color(0xFF10B981),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(vertical = 8.dp, horizontal = 16.dp),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            } else {
                // Denied Permission Fallback UI
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.CameraEnhance,
                        contentDescription = "Camera Required",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Camera Permission Required",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "The QR scanner requires camera access to scan member badges. Please grant the permission on your device or upload a QR image from the gallery instead.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.7f),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = {
                            permissionLauncher.launch(Manifest.permission.CAMERA)
                        }
                    ) {
                        Text("Grant Permission")
                    }
                }
            }

            // Top Bar Controls (Torch, Close, Camera Switch)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .align(Alignment.TopCenter),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Close button
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                        .size(44.dp)
                ) {
                    Icon(Icons.Filled.Close, "Close", tint = Color.White)
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Flashlight toggle
                    if (hasFlashUnit) {
                        IconButton(
                            onClick = { isTorchOn = !isTorchOn },
                            modifier = Modifier
                                .background(
                                    if (isTorchOn) MaterialTheme.colorScheme.primary else Color.Black.copy(alpha = 0.5f),
                                    CircleShape
                                )
                                .size(44.dp)
                        ) {
                            Icon(
                                imageVector = if (isTorchOn) Icons.Filled.FlashOn else Icons.Filled.FlashOff,
                                contentDescription = "Flashlight",
                                tint = Color.White
                            )
                        }
                    }

                    // Camera Switch
                    IconButton(
                        onClick = {
                            lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
                                CameraSelector.LENS_FACING_FRONT
                            } else {
                                CameraSelector.LENS_FACING_BACK
                            }
                        },
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                            .size(44.dp)
                    ) {
                        Icon(Icons.Filled.FlipCameraAndroid, "Switch Camera", tint = Color.White)
                    }
                }
            }

            // Bottom Bar - Gallery Upload & Loader
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .align(Alignment.BottomCenter),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (isInitializing) {
                        CircularProgressIndicator(
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                    }

                    Button(
                        onClick = { galleryLauncher.launch("image/*") },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                        shape = RoundedCornerShape(12.dp),
                        elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp),
                        modifier = Modifier.height(48.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.PhotoLibrary,
                            contentDescription = "Upload QR Code Image",
                            tint = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Upload QR Image",
                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

// ZXing helpers
private fun getBitmapFromUri(context: Context, uri: Uri): Bitmap? {
    return try {
        val contentResolver = context.contentResolver
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver, uri)) { decoder, _, _ ->
                decoder.isMutableRequired = true
            }
        } else {
            @Suppress("DEPRECATION")
            MediaStore.Images.Media.getBitmap(contentResolver, uri)
        }
    } catch (e: Exception) {
        Log.e("QRScanner", "Error loading bitmap from URI", e)
        null
    }
}

private fun decodeQrFromBitmap(bitmap: Bitmap): String? {
    val width = bitmap.width
    val height = bitmap.height
    val pixels = IntArray(width * height)
    bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
    val source = RGBLuminanceSource(width, height, pixels)
    val binaryBitmap = BinaryBitmap(HybridBinarizer(source))
    return try {
        val reader = MultiFormatReader()
        val hints = mapOf(
            DecodeHintType.TRY_HARDER to true,
            DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE)
        )
        val result = reader.decode(binaryBitmap, hints)
        result.text
    } catch (e: Exception) {
        Log.e("QRScanner", "ZXing decoding failed", e)
        null
    }
}
