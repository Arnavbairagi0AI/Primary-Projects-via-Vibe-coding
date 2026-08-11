/*
 * Developed by Arnav Bairagi
 * © Arnav Bairagi. All Rights Reserved.
 */

package com.example.util

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color as AndroidColor
import androidx.core.content.FileProvider
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.io.File
import java.io.FileOutputStream
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

object ShareHelper {

    fun generateAndShareQrCode(
        context: Context,
        qrText: String,
        userName: String,
        title: String,
        description: String,
        details: String
    ) {
        try {
            // Generate QR Code Bitmap
            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(qrText, BarcodeFormat.QR_CODE, 512, 512)
            val width = bitMatrix.width
            val height = bitMatrix.height
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            for (x in 0 until width) {
                for (y in 0 until height) {
                    bitmap.setPixel(x, y, if (bitMatrix.get(x, y)) AndroidColor.BLACK else AndroidColor.WHITE)
                }
            }

            // Save Bitmap to Cache directory
            val cachePath = File(context.cacheDir, "images")
            cachePath.mkdirs()
            val file = File(cachePath, "qr_${userName.replace("\\s+".toRegex(), "_")}.png")
            val stream = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            stream.close()

            // Get File Provider URI
            val contentUri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            if (contentUri != null) {
                val shareText = """
                    $title
                    
                    Hello $userName,
                    $description
                    
                    $details
                    
                    👉 Your Quick Access Scan Link:
                    $qrText
                    
                    Open this link on your phone to check-in/check-out or scan this attached QR Code at the gym desk!
                    
                    Stay Fit, Stay Strong! 💪
                    
                    Developed by Arnav Bairagi
                    © Arnav Bairagi. All Rights Reserved.
                """.trimIndent()

                val shareIntent = Intent().apply {
                    action = Intent.ACTION_SEND
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    putExtra(Intent.EXTRA_TEXT, shareText)
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    setDataAndType(contentUri, "image/png")
                    type = "image/png"
                }

                val chooser = Intent.createChooser(shareIntent, "Share Digital Pass")
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(chooser)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            
            // Fallback to text sharing if image generation fails
            val shareText = """
                $title
                
                Hello $userName,
                $description
                
                $details
                
                👉 Your Quick Access Scan Link:
                $qrText
                
                Developed by Arnav Bairagi
                © Arnav Bairagi. All Rights Reserved.
            """.trimIndent()

            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, shareText)
                type = "text/plain"
            }
            context.startActivity(Intent.createChooser(sendIntent, "Share Gym Pass via"))
        }
    }

    fun downloadQrAsPng(context: Context, qrText: String, userName: String): String? {
        try {
            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(qrText, BarcodeFormat.QR_CODE, 512, 512)
            val width = bitMatrix.width
            val height = bitMatrix.height
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            for (x in 0 until width) {
                for (y in 0 until height) {
                    bitmap.setPixel(x, y, if (bitMatrix.get(x, y)) AndroidColor.BLACK else AndroidColor.WHITE)
                }
            }

            val resolver = context.contentResolver
            val contentValues = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, "QR_${userName.replace("\\s+".toRegex(), "_")}.png")
                put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "image/png")
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                }
            }

            val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                resolver.openOutputStream(uri)?.use { stream ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
                }
                return "Saved to Downloads folder"
            } else {
                val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
                val file = File(downloadsDir, "QR_${userName.replace("\\s+".toRegex(), "_")}.png")
                FileOutputStream(file).use { stream ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
                }
                return "Saved to: ${file.absolutePath}"
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    fun downloadQrAsPdf(context: Context, qrText: String, userName: String, planName: String, status: String): String? {
        try {
            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(qrText, BarcodeFormat.QR_CODE, 250, 250)
            val width = bitMatrix.width
            val height = bitMatrix.height
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            for (x in 0 until width) {
                for (y in 0 until height) {
                    bitmap.setPixel(x, y, if (bitMatrix.get(x, y)) AndroidColor.BLACK else AndroidColor.WHITE)
                }
            }

            val pdfDocument = android.graphics.pdf.PdfDocument()
            val pageInfo = android.graphics.pdf.PdfDocument.PageInfo.Builder(595, 842, 1).create()
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas
            val paint = android.graphics.Paint()
            
            canvas.drawColor(AndroidColor.WHITE)

            // Header banner
            paint.color = AndroidColor.parseColor("#0F172A")
            canvas.drawRect(0f, 0f, 595f, 120f, paint)

            paint.color = AndroidColor.WHITE
            paint.textSize = 28f
            paint.isFakeBoldText = true
            canvas.drawText("GymMasters Pro", 40f, 60f, paint)

            paint.textSize = 14f
            paint.isFakeBoldText = false
            paint.color = AndroidColor.parseColor("#94A3B8")
            canvas.drawText("Official Digital Member Access Pass", 40f, 90f, paint)

            paint.color = AndroidColor.BLACK
            paint.textSize = 18f
            paint.isFakeBoldText = true
            canvas.drawText("Member Access Card", 40f, 170f, paint)

            paint.color = AndroidColor.parseColor("#CBD5E1")
            paint.strokeWidth = 2f
            canvas.drawLine(40f, 190f, 555f, 190f, paint)

            paint.color = AndroidColor.BLACK
            paint.isFakeBoldText = true
            paint.textSize = 14f
            canvas.drawText("Member Name:", 40f, 230f, paint)
            
            paint.isFakeBoldText = false
            paint.textSize = 16f
            paint.color = AndroidColor.parseColor("#1E293B")
            canvas.drawText(userName, 180f, 230f, paint)

            paint.color = AndroidColor.BLACK
            paint.isFakeBoldText = true
            paint.textSize = 14f
            canvas.drawText("Membership Plan:", 40f, 270f, paint)
            
            paint.isFakeBoldText = false
            paint.textSize = 16f
            paint.color = AndroidColor.parseColor("#1E293B")
            canvas.drawText(planName, 180f, 270f, paint)

            paint.color = AndroidColor.BLACK
            paint.isFakeBoldText = true
            paint.textSize = 14f
            canvas.drawText("Membership Status:", 40f, 310f, paint)
            
            paint.isFakeBoldText = true
            paint.textSize = 16f
            if (status.equals("active", ignoreCase = true)) {
                paint.color = AndroidColor.parseColor("#10B981")
            } else if (status.equals("expired", ignoreCase = true)) {
                paint.color = AndroidColor.parseColor("#EF4444")
            } else {
                paint.color = AndroidColor.parseColor("#F59E0B")
            }
            canvas.drawText(status.uppercase(), 180f, 310f, paint)

            paint.color = AndroidColor.BLACK
            paint.isFakeBoldText = true
            paint.textSize = 14f
            canvas.drawText("Scannable Access Pass:", 40f, 370f, paint)

            val qrLeft = (595f - 250f) / 2f
            canvas.drawBitmap(bitmap, qrLeft, 400f, null)

            paint.color = AndroidColor.parseColor("#E2E8F0")
            paint.style = android.graphics.Paint.Style.STROKE
            paint.strokeWidth = 1f
            canvas.drawRect(qrLeft - 5f, 395f, qrLeft + 255f, 655f, paint)

            paint.style = android.graphics.Paint.Style.FILL
            paint.color = AndroidColor.parseColor("#64748B")
            paint.textSize = 11f
            paint.isFakeBoldText = false
            val textWidth = paint.measureText(qrText)
            val urlLeft = (595f - textWidth) / 2f
            canvas.drawText(qrText, urlLeft, 680f, paint)

            paint.color = AndroidColor.parseColor("#F1F5F9")
            canvas.drawRect(0f, 780f, 595f, 842f, paint)

            paint.color = AndroidColor.parseColor("#64748B")
            paint.textSize = 10f
            canvas.drawText("This is an official document of GymMasters Pro. Please present this card at the reception scanner.", 40f, 810f, paint)
            canvas.drawText("Read-only Digital Pass Mode.", 40f, 825f, paint)

            pdfDocument.finishPage(page)

            val resolver = context.contentResolver
            val contentValues = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, "QR_${userName.replace("\\s+".toRegex(), "_")}.pdf")
                put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                }
            }

            val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                resolver.openOutputStream(uri)?.use { stream ->
                    pdfDocument.writeTo(stream)
                }
                pdfDocument.close()
                return "Saved to Downloads folder"
            } else {
                val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
                val file = File(downloadsDir, "QR_${userName.replace("\\s+".toRegex(), "_")}.pdf")
                FileOutputStream(file).use { stream ->
                    pdfDocument.writeTo(stream)
                }
                pdfDocument.close()
                return "Saved to: ${file.absolutePath}"
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    fun sendWhatsAppApiImage(
        token: String,
        phoneId: String,
        recipientPhone: String,
        imageUrl: String,
        caption: String,
        onResult: (Boolean, String) -> Unit
    ) {
        val cleanPhone = recipientPhone.replace("[^0-9]".toRegex(), "")
        val toPhone = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone

        val client = okhttp3.OkHttpClient()
        
        val jsonPayload = """
            {
              "messaging_product": "whatsapp",
              "recipient_type": "individual",
              "to": "$toPhone",
              "type": "image",
              "image": {
                "link": "$imageUrl",
                "caption": "$caption"
              }
            }
        """.trimIndent()

        val body = jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = okhttp3.Request.Builder()
            .url("https://graph.facebook.com/v18.0/$phoneId/messages")
            .addHeader("Authorization", "Bearer $token")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {
                onResult(false, e.localizedMessage ?: "Network error")
            }

            override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                response.use { resp ->
                    if (resp.isSuccessful) {
                        onResult(true, "Sent successfully!")
                    } else {
                        val errorBody = resp.body?.string() ?: ""
                        onResult(false, "API Error: ${resp.code} - $errorBody")
                    }
                }
            }
        })
    }
}
