package com.example

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.print.PrintManager
import android.print.PrintAttributes
import android.webkit.WebView
import android.webkit.WebViewClient
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.LeadEntity
import com.example.ui.theme.*
import com.example.viewmodel.AssessmentViewModel
import com.example.viewmodel.ScreenStep
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                MainAppContainer()
            }
        }
    }
}

@Composable
fun MainAppContainer(
    viewModel: AssessmentViewModel = viewModel()
) {
    val currentStep by viewModel.currentStep.collectAsStateWithLifecycle()
    val leadsList by viewModel.allCapturedLeads.collectAsStateWithLifecycle()

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        contentWindowInsets = WindowInsets.safeDrawing
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Screen router
            when (currentStep) {
                ScreenStep.WELCOME -> WelcomeScreen(viewModel)
                ScreenStep.BASIC_INFO -> BasicInfoScreen(viewModel)
                ScreenStep.BODY_STATS -> BodyStatsScreen(viewModel)
                ScreenStep.GOALS -> GoalsScreen(viewModel)
                ScreenStep.LEAD_CAPTURE -> LeadCaptureScreen(viewModel)
                ScreenStep.RESULTS -> ResultsScreen(viewModel)
                ScreenStep.ADMIN_LEADS -> AdminLeadsScreen(viewModel, leadsList)
                ScreenStep.CODE_EXPORTER -> CodeExporterScreen(viewModel)
            }
        }
    }
}

// ==================== WELCOME SCREEN ====================
@Composable
fun WelcomeScreen(viewModel: AssessmentViewModel) {
    val context = LocalContext.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(GymBlack, GymSlate)
                )
            )
            .padding(24.dp)
    ) {
        // Subtle admin door in top-right
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Gym Brand Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.FitnessCenter,
                    contentDescription = "IronPulse Logo",
                    tint = GymRed,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = "IRONPULSE",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        letterSpacing = 1.sp,
                        color = TextWhite
                    )
                }
            }

            // Quick Actions (Admin Leads Only)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(
                    onClick = { viewModel.navigateTo(ScreenStep.ADMIN_LEADS) },
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(GymSlateLight)
                        .testTag("admin_leads_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Analytics,
                        contentDescription = "Admin Leads",
                        tint = GymRed
                    )
                }
            }
        }

        // Main welcome contents
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.Center)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Branded Generated Dumbbell Image
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .clip(RoundedCornerShape(32.dp))
                    .border(BorderStroke(1.dp, GymRedLight.copy(alpha = 0.2f)), RoundedCornerShape(32.dp))
                    .background(GymSlate)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_gym_logo),
                    contentDescription = "Premium dumbbell emblem",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "Get Your Free Personalized\nFitness Plan in 60 Seconds",
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                textAlign = TextAlign.Center,
                lineHeight = 32.sp,
                color = TextWhite,
                modifier = Modifier.padding(horizontal = 8.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Our high-precision assessment calculates your BMI, daily caloric targets, and macronutrient ratios to unlock elite, done-for-you progression.",
                fontSize = 14.sp,
                color = TextGray,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp),
                lineHeight = 20.sp
            )

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { viewModel.navigateTo(ScreenStep.BASIC_INFO) },
                colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .testTag("start_assessment_button")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "START FREE ASSESSMENT",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = "Go",
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        // Trust Indicators removed
    }
}

@Composable
fun TrustBadge(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = GymRedLight.copy(alpha = 0.8f),
            modifier = Modifier.size(14.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(text = text, fontSize = 11.sp, color = TextGray, fontWeight = FontWeight.Medium)
    }
}


// ==================== STEP 2: BASIC INFO SCREEN ====================
@Composable
fun BasicInfoScreen(viewModel: AssessmentViewModel) {
    val name by viewModel.name.collectAsStateWithLifecycle()
    val age by viewModel.age.collectAsStateWithLifecycle()
    val gender by viewModel.gender.collectAsStateWithLifecycle()
    val city by viewModel.city.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GymBlack)
            .padding(24.dp)
    ) {
        StepHeader(currentStepNum = 1, stepTitle = "Tell Us About Yourself", progress = viewModel.formProgress) {
            viewModel.goBack()
        }

        Spacer(modifier = Modifier.height(24.dp))

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Full Name Input
            Column {
                Text(
                    text = "WHAT IS YOUR NAME?",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextGray,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { viewModel.name.value = it },
                    placeholder = { Text("e.g. John Doe", color = TextGrayMuted) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite,
                        focusedBorderColor = GymRed,
                        unfocusedBorderColor = GymSlateLight,
                        focusedContainerColor = GymSlate,
                        unfocusedContainerColor = GymSlate
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("name_input_field")
                )
            }

            // Age & Gender
            Row(modifier = Modifier.fillMaxWidth()) {
                // Age Input
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "AGE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextGray,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    OutlinedTextField(
                        value = age,
                        onValueChange = { viewModel.age.value = it },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedBorderColor = GymRed,
                            unfocusedBorderColor = GymSlateLight,
                            focusedContainerColor = GymSlate,
                            unfocusedContainerColor = GymSlate
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("age_input_field")
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                // Gender Select
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "GENDER",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextGray,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(GymSlate)
                            .border(1.dp, GymSlateLight, RoundedCornerShape(12.dp))
                            .padding(2.dp)
                    ) {
                        GenderButton(
                            label = "MALE",
                            isSelected = gender == "Male",
                            modifier = Modifier.weight(1f)
                        ) {
                            viewModel.gender.value = "Male"
                        }
                        GenderButton(
                            label = "FEMALE",
                            isSelected = gender == "Female",
                            modifier = Modifier.weight(1f)
                        ) {
                            viewModel.gender.value = "Female"
                        }
                    }
                }
            }

            // City Input
            Column {
                Text(
                    text = "CITY / LOCATION",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextGray,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = city,
                    onValueChange = { viewModel.city.value = it },
                    placeholder = { Text("e.g. New York", color = TextGrayMuted) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite,
                        focusedBorderColor = GymRed,
                        unfocusedBorderColor = GymSlateLight,
                        focusedContainerColor = GymSlate,
                        unfocusedContainerColor = GymSlate
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("city_input_field")
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Navigation Footer
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedButton(
                onClick = { viewModel.goBack() },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextWhite),
                border = BorderStroke(1.dp, GymSlateLight),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
            ) {
                Text("BACK", fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { viewModel.navigateTo(ScreenStep.BODY_STATS) },
                enabled = name.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = GymRed, disabledContainerColor = GymSlateLight),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(2f)
                    .height(52.dp)
                    .testTag("step_2_next_button")
            ) {
                Text("CONTINUE", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun GenderButton(label: String, isSelected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) GymRed else Color.Transparent)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = if (isSelected) TextWhite else TextGray,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            letterSpacing = 1.sp
        )
    }
}


// ==================== STEP 3: BODY STATS SCREEN ====================
@Composable
fun BodyStatsScreen(viewModel: AssessmentViewModel) {
    val weight by viewModel.weight.collectAsStateWithLifecycle()
    val weightUnit by viewModel.weightUnit.collectAsStateWithLifecycle()
    val height by viewModel.height.collectAsStateWithLifecycle()
    val heightUnit by viewModel.heightUnit.collectAsStateWithLifecycle()
    val heightFeet by viewModel.heightFeet.collectAsStateWithLifecycle()
    val heightInches by viewModel.heightInches.collectAsStateWithLifecycle()
    val activityLevel by viewModel.activityLevel.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GymBlack)
            .padding(24.dp)
    ) {
        StepHeader(currentStepNum = 2, stepTitle = "Enter Your Body Dimensions", progress = viewModel.formProgress) {
            viewModel.goBack()
        }

        Spacer(modifier = Modifier.height(24.dp))

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Weight Toggle and Input
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "CURRENT WEIGHT",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextGray,
                        letterSpacing = 1.sp
                    )
                    // Toggle
                    Row(
                        modifier = Modifier
                            .width(100.dp)
                            .height(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(GymSlate)
                            .border(1.dp, GymSlateLight, RoundedCornerShape(8.dp))
                            .padding(2.dp)
                    ) {
                        UnitToggleOption(label = "KG", isSelected = weightUnit == "kg", modifier = Modifier.weight(1f)) {
                            viewModel.weightUnit.value = "kg"
                        }
                        UnitToggleOption(label = "LBS", isSelected = weightUnit == "lbs", modifier = Modifier.weight(1f)) {
                            viewModel.weightUnit.value = "lbs"
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = weight,
                    onValueChange = { viewModel.weight.value = it },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite,
                        focusedBorderColor = GymRed,
                        unfocusedBorderColor = GymSlateLight,
                        focusedContainerColor = GymSlate,
                        unfocusedContainerColor = GymSlate
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("weight_input_field")
                )
            }

            // Height Toggle and Input
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "HEIGHT",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextGray,
                        letterSpacing = 1.sp
                    )
                    // Toggle
                    Row(
                        modifier = Modifier
                            .width(120.dp)
                            .height(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(GymSlate)
                            .border(1.dp, GymSlateLight, RoundedCornerShape(8.dp))
                            .padding(2.dp)
                    ) {
                        UnitToggleOption(label = "CM", isSelected = heightUnit == "cm", modifier = Modifier.weight(1f)) {
                            viewModel.heightUnit.value = "cm"
                        }
                        UnitToggleOption(label = "FT/IN", isSelected = heightUnit == "ft/in", modifier = Modifier.weight(1f)) {
                            viewModel.heightUnit.value = "ft/in"
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))

                if (heightUnit == "cm") {
                    OutlinedTextField(
                        value = height,
                        onValueChange = { viewModel.height.value = it },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedBorderColor = GymRed,
                            unfocusedBorderColor = GymSlateLight,
                            focusedContainerColor = GymSlate,
                            unfocusedContainerColor = GymSlate
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("height_input_field")
                    )
                } else {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = heightFeet,
                            onValueChange = { viewModel.heightFeet.value = it },
                            placeholder = { Text("Feet", color = TextGrayMuted) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedBorderColor = GymRed,
                                unfocusedBorderColor = GymSlateLight,
                                focusedContainerColor = GymSlate,
                                unfocusedContainerColor = GymSlate
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("height_feet_input_field")
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        OutlinedTextField(
                            value = heightInches,
                            onValueChange = { viewModel.heightInches.value = it },
                            placeholder = { Text("Inches", color = TextGrayMuted) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedBorderColor = GymRed,
                                unfocusedBorderColor = GymSlateLight,
                                focusedContainerColor = GymSlate,
                                unfocusedContainerColor = GymSlate
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("height_inches_input_field")
                        )
                    }
                }
            }

            // Activity Level Cards
            Column {
                Text(
                    text = "CURRENT WEEKLY ACTIVITY LEVEL",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextGray,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 10.dp)
                )
                val levels = listOf(
                    "Sedentary" to "Little to no formal exercise",
                    "Light" to "Active workouts 1-3 days/week",
                    "Moderate" to "High-intensity training 3-5 days/week",
                    "Active" to "Heavy athletic sessions 6-7 days/week",
                    "Very Active" to "Elite multi-session athlete / job"
                )
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    levels.forEach { (lvl, desc) ->
                        ActivityCard(
                            title = lvl,
                            description = desc,
                            isSelected = activityLevel == lvl
                        ) {
                            viewModel.activityLevel.value = lvl
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Navigation Footer
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedButton(
                onClick = { viewModel.goBack() },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextWhite),
                border = BorderStroke(1.dp, GymSlateLight),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
            ) {
                Text("BACK", fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { viewModel.navigateTo(ScreenStep.GOALS) },
                enabled = weight.isNotBlank() && (height.isNotBlank() || heightUnit == "ft/in"),
                colors = ButtonDefaults.buttonColors(containerColor = GymRed, disabledContainerColor = GymSlateLight),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(2f)
                    .height(52.dp)
                    .testTag("step_3_next_button")
            ) {
                Text("CONTINUE", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun UnitToggleOption(label: String, isSelected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(6.dp))
            .background(if (isSelected) GymRed else Color.Transparent)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = if (isSelected) TextWhite else TextGray,
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp
        )
    }
}

@Composable
fun ActivityCard(title: String, description: String, isSelected: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) GymRed.copy(alpha = 0.08f) else GymSlate
        ),
        border = BorderStroke(
            1.dp,
            if (isSelected) GymRed else GymSlateLight
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = isSelected,
                onClick = onClick,
                colors = RadioButtonDefaults.colors(
                    selectedColor = GymRed,
                    unselectedColor = TextGrayMuted
                )
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(text = title, fontWeight = FontWeight.Bold, color = TextWhite, fontSize = 13.sp)
                Text(text = description, color = TextGray, fontSize = 11.sp, lineHeight = 14.sp)
            }
        }
    }
}


// ==================== STEP 4: GOALS SCREEN ====================
@Composable
fun GoalsScreen(viewModel: AssessmentViewModel) {
    val primaryGoal by viewModel.primaryGoal.collectAsStateWithLifecycle()
    val limitations by viewModel.limitations.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GymBlack)
            .padding(24.dp)
    ) {
        StepHeader(currentStepNum = 3, stepTitle = "Establish Your Benchmarks", progress = viewModel.formProgress) {
            viewModel.goBack()
        }

        Spacer(modifier = Modifier.height(24.dp))

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Objective Grid selector
            Column {
                Text(
                    text = "PRIMARY FITNESS OBJECTIVE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextGray,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 10.dp)
                )

                val goalOptions = listOf(
                    "Lose Fat" to "Trim fat while retaining hard muscle",
                    "Build Muscle" to "Trigger lean fiber hypertrophy & power",
                    "General Fitness" to "Improve cardiovascular & health metrics",
                    "Improve Stamina" to "Sustain performance & lactic durability"
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    goalOptions.forEach { (gl, sbt) ->
                        GoalSelectorCard(
                            goal = gl,
                            subtext = sbt,
                            isSelected = primaryGoal == gl
                        ) {
                            viewModel.primaryGoal.value = gl
                        }
                    }
                }
            }

            // Injury and Limitations
            Column {
                Text(
                    text = "INJURIES OR KINETIC LIMITATIONS (OPTIONAL)",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextGray,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = limitations,
                    onValueChange = { viewModel.limitations.value = it },
                    placeholder = { Text("e.g. Left knee soreness, lower back tightness, none", color = TextGrayMuted) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextWhite,
                        unfocusedTextColor = TextWhite,
                        focusedBorderColor = GymRed,
                        unfocusedBorderColor = GymSlateLight,
                        focusedContainerColor = GymSlate,
                        unfocusedContainerColor = GymSlate
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("limitations_input_field")
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Navigation Footer
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedButton(
                onClick = { viewModel.goBack() },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextWhite),
                border = BorderStroke(1.dp, GymSlateLight),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(1f)
                    .height(52.dp)
            ) {
                Text("BACK", fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { viewModel.calculateAndProceed() },
                colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .weight(2f)
                    .height(52.dp)
                    .testTag("calculate_plan_button")
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("CALCULATE PLAN", fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
fun GoalSelectorCard(goal: String, subtext: String, isSelected: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) GymRed.copy(alpha = 0.08f) else GymSlate
        ),
        border = BorderStroke(1.dp, if (isSelected) GymRed else GymSlateLight)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(text = goal, fontWeight = FontWeight.Bold, color = TextWhite, fontSize = 13.sp)
                Text(text = subtext, color = TextGray, fontSize = 11.sp)
            }
            if (isSelected) {
                Icon(imageVector = Icons.Default.Check, contentDescription = "Checked", tint = GymRed)
            }
        }
    }
}


// ==================== STEP 5: LEAD CAPTURE SCREEN (LOCK WALL) ====================
@Composable
fun LeadCaptureScreen(viewModel: AssessmentViewModel) {
    val name by viewModel.name.collectAsStateWithLifecycle()
    val phone by viewModel.phone.collectAsStateWithLifecycle()
    val email by viewModel.email.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(GymBlack, GymSlate)
                )
            )
            .padding(24.dp)
    ) {
        StepHeader(currentStepNum = 4, stepTitle = "Full Access Unlocked", progress = viewModel.formProgress) {
            viewModel.goBack()
        }

        Spacer(modifier = Modifier.height(24.dp))

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(BmiEmerald.copy(alpha = 0.15f))
                    .border(1.dp, BmiEmerald.copy(alpha = 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.LockOpen,
                    contentDescription = "Full Access Unlocked",
                    tint = BmiEmerald,
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Full Access — No Subscription Needed!",
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextWhite
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "You have complete, unrestricted access to your custom calorie targets, macronutrient ratios, AI meal plans, and workout protocols. No payment, Razorpay, or email registration required.",
                fontSize = 12.sp,
                color = TextGray,
                textAlign = TextAlign.Center,
                lineHeight = 16.sp,
                modifier = Modifier.padding(horizontal = 12.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Fields card
            Card(
                colors = CardDefaults.cardColors(containerColor = GymSlate),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, GymSlateLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Pre-filled Name
                    OutlinedTextField(
                        value = name,
                        onValueChange = { viewModel.name.value = it },
                        label = { Text("FULL NAME (OPTIONAL)", color = TextGray) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedBorderColor = GymRed,
                            unfocusedBorderColor = GymSlateLight,
                            focusedContainerColor = GymBlack,
                            unfocusedContainerColor = GymBlack
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("lead_name_input")
                    )

                    // WhatsApp Input
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { viewModel.phone.value = it },
                        label = { Text("WHATSAPP / PHONE (OPTIONAL)", color = TextGray) },
                        placeholder = { Text("e.g. +1 (555) 019-2811", color = TextGrayMuted) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedBorderColor = GymRed,
                            unfocusedBorderColor = GymSlateLight,
                            focusedContainerColor = GymBlack,
                            unfocusedContainerColor = GymBlack
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("lead_phone_input")
                    )

                    // Email Input
                    OutlinedTextField(
                        value = email,
                        onValueChange = { viewModel.email.value = it },
                        label = { Text("EMAIL ADDRESS (OPTIONAL)", color = TextGray) },
                        placeholder = { Text("e.g. name@domain.com", color = TextGrayMuted) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedBorderColor = GymRed,
                            unfocusedBorderColor = GymSlateLight,
                            focusedContainerColor = GymBlack,
                            unfocusedContainerColor = GymBlack
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("lead_email_input")
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { viewModel.submitLeadAndUnlock() },
            enabled = true,
            colors = ButtonDefaults.buttonColors(containerColor = GymRed),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .testTag("submit_lead_button")
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Text("ACCESS FULL REPORT NOW (100% FREE)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedButton(
            onClick = {
                if (viewModel.name.value.isBlank()) viewModel.name.value = "Guest User"
                viewModel.submitLeadAndUnlock()
            },
            colors = ButtonDefaults.outlinedButtonColors(contentColor = TextWhite),
            border = BorderStroke(1.dp, GymSlateLight),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
        ) {
            Text("SKIP SIGN IN & OPEN DASHBOARD DIRECTLY", fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}


enum class ResultsTab {
    REPORT,
    BMI,
    CALORIES,
    DIET,
    WEIGHT_TIME
}

// ==================== STEP 6: RESULTS SCREEN (DASHBOARD) ====================
@Composable
fun ResultsScreen(viewModel: AssessmentViewModel) {
    val name by viewModel.name.collectAsStateWithLifecycle()
    val city by viewModel.city.collectAsStateWithLifecycle()
    val gender by viewModel.gender.collectAsStateWithLifecycle()
    val bmi by viewModel.bmi.collectAsStateWithLifecycle()
    val bmiCategory by viewModel.bmiCategory.collectAsStateWithLifecycle()
    val calorieTarget by viewModel.calorieTarget.collectAsStateWithLifecycle()
    val primaryGoal by viewModel.primaryGoal.collectAsStateWithLifecycle()
    val protein by viewModel.proteinGrams.collectAsStateWithLifecycle()
    val carbs by viewModel.carbGrams.collectAsStateWithLifecycle()
    val fats by viewModel.fatGrams.collectAsStateWithLifecycle()
    val coachAdvice by viewModel.coachAdvice.collectAsStateWithLifecycle()
    val isGeneratingAdvice by viewModel.isGeneratingAdvice.collectAsStateWithLifecycle()

    // Additional flows for interactive features
    val calorieLogs by viewModel.calorieLogs.collectAsStateWithLifecycle()
    val weightLogs by viewModel.weightLogs.collectAsStateWithLifecycle()
    val dietPlan by viewModel.dietPlan.collectAsStateWithLifecycle()
    val isGeneratingDietPlan by viewModel.isGeneratingDietPlan.collectAsStateWithLifecycle()
    val workoutPlan by viewModel.workoutPlan.collectAsStateWithLifecycle()
    val isGeneratingWorkoutPlan by viewModel.isGeneratingWorkoutPlan.collectAsStateWithLifecycle()
    val showThankYouDialog by viewModel.showThankYouDialog.collectAsStateWithLifecycle()

    val context = LocalContext.current
    var activeTab by remember { mutableStateOf(ResultsTab.REPORT) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GymBlack)
            .padding(16.dp)
    ) {
        // Results Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "ATHLETE PLATFORM",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = GymRed,
                    letterSpacing = 1.sp
                )
                Text(
                    text = name,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = TextWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Share
                IconButton(
                    onClick = {
                        sharePlanText(context, name, bmi, bmiCategory, calorieTarget, primaryGoal, protein, carbs, fats, coachAdvice)
                    },
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(GymSlate)
                ) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = "Share Profile", tint = TextWhite)
                }

                // Restart
                IconButton(
                    onClick = { viewModel.navigateTo(ScreenStep.WELCOME) },
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(GymSlate)
                ) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = "Restart Assessment", tint = GymRed)
                }
            }
        }

        // Custom Horizontal Pills-Based Tab Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val tabs = listOf(
                ResultsTab.REPORT to "Coach Report",
                ResultsTab.BMI to "BMI Recalc",
                ResultsTab.CALORIES to "Calorie Log",
                ResultsTab.DIET to "Diet & Workout",
                ResultsTab.WEIGHT_TIME to "Weight Projection"
            )
            tabs.forEach { (tab, label) ->
                val isSelected = activeTab == tab
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(0.dp))
                        .background(if (isSelected) GymRed else GymSlate)
                        .border(
                            width = 1.5.dp,
                            color = if (isSelected) GymRedLight else GymSlateLight,
                            shape = RoundedCornerShape(0.dp)
                        )
                        .clickable { activeTab = tab }
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = label,
                        color = if (isSelected) Color.White else TextGray,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Tab Content Area
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            when (activeTab) {
                ResultsTab.REPORT -> {
                    // Dashboard Row 1: BMI and Calories (Geometric Balance: 0.dp rounded corners, sharp high-contrast border lines)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        // BMI Card
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = GymSlate),
                            shape = RoundedCornerShape(0.dp),
                            border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f))
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(text = "YOUR BMI", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextGray)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = bmi.toString(), fontSize = 28.sp, fontWeight = FontWeight.Black, color = TextWhite)
                                Spacer(modifier = Modifier.height(4.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(0.dp))
                                        .background(
                                            when (bmiCategory) {
                                                "Normal weight" -> BmiEmerald.copy(alpha = 0.15f)
                                                "Overweight" -> BmiAmber.copy(alpha = 0.15f)
                                                else -> GymRed.copy(alpha = 0.15f)
                                            }
                                        )
                                        .border(
                                            1.dp,
                                            when (bmiCategory) {
                                                "Normal weight" -> BmiEmerald
                                                "Overweight" -> BmiAmber
                                                else -> GymRedLight
                                            },
                                            RoundedCornerShape(0.dp)
                                        )
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = bmiCategory.uppercase(),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = when (bmiCategory) {
                                            "Normal weight" -> BmiEmerald
                                            "Overweight" -> BmiAmber
                                            else -> GymRedLight
                                        }
                                    )
                                }
                            }
                        }

                        // Caloric Blueprint Card
                        Card(
                            modifier = Modifier.weight(1.5f),
                            colors = CardDefaults.cardColors(containerColor = GymSlate),
                            shape = RoundedCornerShape(0.dp),
                            border = BorderStroke(1.5.dp, GymRedLight)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(text = "DAILY FUEL TARGET", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextGray)
                                    Icon(imageVector = Icons.Default.LocalFireDepartment, contentDescription = null, tint = GymRed, modifier = Modifier.size(16.dp))
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "$calorieTarget kcal", fontSize = 28.sp, fontWeight = FontWeight.Black, color = GymRedLight)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "Calibrated for $primaryGoal", fontSize = 10.sp, color = TextGray)
                            }
                        }
                    }

                    // BMI Slider Visual Representation
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        shape = RoundedCornerShape(0.dp),
                        border = BorderStroke(1.5.dp, GymSlateLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "BMI SPECTRUM PLACEMENT", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextGray)
                            Spacer(modifier = Modifier.height(10.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(0.dp))
                                    .background(
                                        Brush.horizontalGradient(
                                            colors = listOf(BmiAmber, BmiEmerald, BmiAmber, GymRed)
                                        )
                                    )
                            ) {
                                val fraction = ((bmi - 15.0) / 20.0).coerceIn(0.0, 1.0).toFloat()
                                Box(
                                    modifier = Modifier
                                        .fillMaxHeight()
                                        .fillMaxWidth(fraction)
                                        .background(Color.Transparent)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(12.dp)
                                            .align(Alignment.CenterEnd)
                                            .clip(RoundedCornerShape(0.dp))
                                            .background(TextWhite)
                                            .border(1.dp, GymBlack, RoundedCornerShape(0.dp))
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("15.0", fontSize = 8.sp, color = TextGrayMuted)
                                Text("NORMAL (18.5 - 24.9)", fontSize = 8.sp, color = BmiEmerald, fontWeight = FontWeight.Bold)
                                        Text("35.0", fontSize = 8.sp, color = TextGrayMuted)
                            }
                        }
                    }

                    // Target Macros Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        shape = RoundedCornerShape(0.dp),
                        border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "TARGET MACRONUTRIENT RATIOS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextGray)
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                MacroColumn(name = "PROTEIN", value = "${protein}g", color = GymRedLight, modifier = Modifier.weight(1f))
                                MacroColumn(name = "CARBS", value = "${carbs}g", color = BmiAmber, modifier = Modifier.weight(1f))
                                MacroColumn(name = "FATS", value = "${fats}g", color = Color(0xFF3B82F6), modifier = Modifier.weight(1f))
                            }
                        }
                    }

                    // Coach Advice Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        shape = RoundedCornerShape(0.dp),
                        border = BorderStroke(1.5.dp, GymSlateLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(imageVector = Icons.Default.Face, contentDescription = null, tint = GymRed, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(text = "COACH ADVICE SUMMARY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextGray)
                                }
                                if (isGeneratingAdvice) {
                                    CircularProgressIndicator(color = GymRed, strokeWidth = 1.5.dp, modifier = Modifier.size(12.dp))
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            if (isGeneratingAdvice && coachAdvice.isBlank()) {
                                Text(
                                    text = "Drafting your athletic advice via elite model server...",
                                    fontStyle = FontStyle.Italic,
                                    fontSize = 12.sp,
                                    color = TextGrayMuted
                                )
                            } else {
                                Text(
                                    text = coachAdvice,
                                    fontSize = 12.sp,
                                    color = TextWhite,
                                    lineHeight = 18.sp,
                                    fontStyle = FontStyle.Italic
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(GymSlateLight))
                            Spacer(modifier = Modifier.height(10.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(RoundedCornerShape(0.dp))
                                        .background(GymSlateLight),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(text = "MT", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = TextWhite)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(text = "Marcus Tanner", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = TextWhite)
                                    Text(text = "Elite Performance Specialist • IronPulse", fontSize = 9.sp, color = TextGray)
                                }
                            }
                        }
                    }

                    // Interactive PDF Generation Card
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        shape = RoundedCornerShape(0.dp),
                        border = BorderStroke(2.dp, BmiEmerald),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Description,
                                    contentDescription = null,
                                    tint = BmiEmerald,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "CAN I MAKE A PDF FOR THIS?",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BmiEmerald,
                                    letterSpacing = 0.5.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Get a formatted, high-print quality PDF of your customized 4-week iron pulse meal and lifting plans to keep on your phone or print.",
                                fontSize = 11.sp,
                                color = TextGray,
                                lineHeight = 15.sp
                            )
                            Spacer(modifier = Modifier.height(14.dp))

                            var pdfGeneratingState by remember { mutableStateOf(0) } // 0: Idle, 1: Loading, 2: Success
                            val coroutineScope = rememberCoroutineScope()

                            if (pdfGeneratingState == 0) {
                                Button(
                                    onClick = {
                                        pdfGeneratingState = 1
                                        coroutineScope.launch {
                                            kotlinx.coroutines.delay(1500)
                                            generateAndPrintPdf(
                                                context = context,
                                                name = name,
                                                goal = primaryGoal,
                                                bmi = bmi.toString(),
                                                category = bmiCategory,
                                                calories = calorieTarget,
                                                protein = protein,
                                                carbs = carbs,
                                                fats = fats,
                                                coachAdvice = coachAdvice,
                                                dietPlan = dietPlan,
                                                workoutPlan = workoutPlan
                                            )
                                            pdfGeneratingState = 2
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = BmiEmerald),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.fillMaxWidth().height(42.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.FileDownload, contentDescription = null, tint = GymBlack, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Download My Plan as PDF", color = GymBlack, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            } else if (pdfGeneratingState == 1) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(42.dp)
                                        .clip(RoundedCornerShape(0.dp))
                                        .background(BmiEmerald.copy(alpha = 0.1f))
                                        .border(1.5.dp, BmiEmerald, RoundedCornerShape(0.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        CircularProgressIndicator(color = BmiEmerald, strokeWidth = 2.dp, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Compiling high-print quality PDF...", color = BmiEmerald, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            } else {
                                Button(
                                    onClick = {
                                        pdfGeneratingState = 1
                                        coroutineScope.launch {
                                            kotlinx.coroutines.delay(1000)
                                            generateAndPrintPdf(
                                                context = context,
                                                name = name,
                                                goal = primaryGoal,
                                                bmi = bmi.toString(),
                                                category = bmiCategory,
                                                calories = calorieTarget,
                                                protein = protein,
                                                carbs = carbs,
                                                fats = fats,
                                                coachAdvice = coachAdvice,
                                                dietPlan = dietPlan,
                                                workoutPlan = workoutPlan
                                            )
                                            pdfGeneratingState = 2
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = BmiEmerald),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.fillMaxWidth().height(42.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.FileDownload, contentDescription = null, tint = GymBlack, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Download Again", color = GymBlack, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    // Direct Contact to Owner Panel
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        shape = RoundedCornerShape(0.dp),
                        border = BorderStroke(2.dp, GymRed),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.ContactSupport, contentDescription = null, tint = GymRed, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "DIRECT WHATSAPP & EMAIL TO OWNER ONLY",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GymRed,
                                    letterSpacing = 0.5.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Submit your biometrics, target calories, and coach advice report directly to Head Gym Owner shadowfall07042008@gmail.com (+918796300923) via WhatsApp or Email.",
                                fontSize = 11.sp,
                                color = TextGray,
                                lineHeight = 15.sp
                            )
                            Spacer(modifier = Modifier.height(14.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        val message = """
                                            🏋️‍♂️ *IRONPULSE FIT PLAN* 🏋️‍♂️
                                            *Client Name:* $name
                                            *Fitness Goal:* $primaryGoal
                                            *Biometrics:* BMI $bmi ($bmiCategory)
                                            *Caloric Target:* $calorieTarget kcal/day
                                            *Macros:* P: ${protein}g | C: ${carbs}g | F: ${fats}g
                                            
                                            *Coach Advice Advice:*
                                            $coachAdvice
                                        """.trimIndent()
                                        try {
                                            val url = "https://api.whatsapp.com/send?phone=918796300923&text=" + java.net.URLEncoder.encode(message, "UTF-8")
                                            val intent = Intent(Intent.ACTION_VIEW).apply {
                                                data = Uri.parse(url)
                                            }
                                            context.startActivity(intent)
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Could not open WhatsApp. Try Email!", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366)),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(imageVector = Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("WhatsApp", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }

                                Button(
                                    onClick = {
                                        val subject = "IronPulse Fitness Report: $name"
                                        val body = """
                                            🏋️‍♂️ IRONPULSE FIT PLAN REPORT 🏋️‍♂️
                                            
                                            Client Name: $name
                                            Fitness Goal: $primaryGoal
                                            Biometrics: BMI $bmi ($bmiCategory)
                                            Daily Calorie Target: $calorieTarget kcal/day
                                            
                                            Macronutrient Breakdown:
                                            - Protein: ${protein}g
                                            - Carbohydrates: ${carbs}g
                                            - Healthy Fats: ${fats}g
                                            
                                            Personalized Coach Summary:
                                            $coachAdvice
                                            
                                            Submitted directly to Owner ShadowFall.
                                        """.trimIndent()
                                        val intent = Intent(Intent.ACTION_SENDTO).apply {
                                            data = Uri.parse("mailto:")
                                            putExtra(Intent.EXTRA_EMAIL, arrayOf("shadowfall07042008@gmail.com"))
                                            putExtra(Intent.EXTRA_SUBJECT, subject)
                                            putExtra(Intent.EXTRA_TEXT, body)
                                        }
                                        try {
                                            context.startActivity(intent)
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Mail applications not found.", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(imageVector = Icons.Default.Email, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Email Owner", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                ResultsTab.BMI -> {
                    // STANDALONE INTERACTIVE BMI CALCULATOR TAB
                    val initialWeightD = viewModel.weight.value.toDoubleOrNull() ?: 70.0
                    val initialHeightD = viewModel.height.value.toDoubleOrNull() ?: 175.0
                    var bmiWeight by remember { mutableStateOf(initialWeightD) }
                    var bmiHeight by remember { mutableStateOf(initialHeightD) }
                    var isKg by remember { mutableStateOf(viewModel.weightUnit.value == "kg") }
                    var isCm by remember { mutableStateOf(viewModel.heightUnit.value == "cm") }

                    val weightInKg = if (isKg) bmiWeight else bmiWeight * 0.45359237
                    val heightInM = if (isCm) bmiHeight / 100.0 else (bmiHeight * 2.54) / 100.0
                    val calculatedBmi = if (heightInM > 0) (weightInKg / (heightInM * heightInM)) else 0.0
                    val roundedBmi = Math.round(calculatedBmi * 10.0) / 10.0
                    val calcCat = when {
                        calculatedBmi < 18.5 -> "Underweight"
                        calculatedBmi < 25.0 -> "Normal weight"
                        calculatedBmi < 30.0 -> "Overweight"
                        else -> "Obese"
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                        shape = RoundedCornerShape(0.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "INTERACTIVE BMI CALCULATOR",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = GymRed,
                                letterSpacing = 1.sp,
                                modifier = Modifier.align(Alignment.Start)
                            )
                            Spacer(modifier = Modifier.height(16.dp))

                            // Large Visual Score
                            Box(
                                modifier = Modifier
                                    .size(110.dp)
                                    .clip(CircleShape)
                                    .background(GymBlack)
                                    .border(
                                        2.dp,
                                        when (calcCat) {
                                            "Normal weight" -> BmiEmerald
                                            "Overweight" -> BmiAmber
                                            else -> GymRed
                                        },
                                        CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = roundedBmi.toString(),
                                        fontSize = 32.sp,
                                        fontWeight = FontWeight.Black,
                                        color = TextWhite
                                    )
                                    Text(
                                        text = calcCat.uppercase(),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = when (calcCat) {
                                            "Normal weight" -> BmiEmerald
                                            "Overweight" -> BmiAmber
                                            else -> GymRedLight
                                        }
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Metric toggles
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    RadioButton(selected = isKg, onClick = { isKg = true })
                                    Text("Metric (kg)", color = TextWhite, fontSize = 12.sp)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    RadioButton(selected = !isKg, onClick = { isKg = false })
                                    Text("Imperial (lbs)", color = TextWhite, fontSize = 12.sp)
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceEvenly
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    RadioButton(selected = isCm, onClick = { isCm = true })
                                    Text("Metric (cm)", color = TextWhite, fontSize = 12.sp)
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    RadioButton(selected = !isCm, onClick = { isCm = false })
                                    Text("Imperial (in)", color = TextWhite, fontSize = 12.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Weight Slider
                            val minWeight = if (isKg) 35f else 80f
                            val maxWeight = if (isKg) 160f else 350f
                            val weightVal = bmiWeight.coerceIn(minWeight.toDouble(), maxWeight.toDouble())
                            Text(
                                text = "Adjust Weight: ${Math.round(weightVal)} ${if (isKg) "kg" else "lbs"}",
                                color = TextWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.align(Alignment.Start)
                            )
                            Slider(
                                value = weightVal.toFloat(),
                                onValueChange = { bmiWeight = it.toDouble() },
                                valueRange = minWeight..maxWeight,
                                colors = SliderDefaults.colors(
                                    thumbColor = GymRed,
                                    activeTrackColor = GymRedLight
                                )
                            )

                            // Height Slider
                            val minHeight = if (isCm) 110f else 45f
                            val maxHeight = if (isCm) 220f else 90f
                            val heightVal = bmiHeight.coerceIn(minHeight.toDouble(), maxHeight.toDouble())
                            Text(
                                text = "Adjust Height: ${Math.round(heightVal)} ${if (isCm) "cm" else "inches"}",
                                color = TextWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.align(Alignment.Start)
                            )
                            Slider(
                                value = heightVal.toFloat(),
                                onValueChange = { bmiHeight = it.toDouble() },
                                valueRange = minHeight..maxHeight,
                                colors = SliderDefaults.colors(
                                    thumbColor = GymRed,
                                    activeTrackColor = GymRedLight
                                )
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            // Dynamic Guidance Card
                            Card(
                                colors = CardDefaults.cardColors(containerColor = GymBlack),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    val advice = when (calcCat) {
                                        "Underweight" -> "Focus on a moderate caloric surplus (+300 to 500 kcal) with rich protein sources to build clean muscle tissue safely."
                                        "Normal weight" -> "Excellent metabolic alignment! Maintain progress with active macro ratios, balanced resistance training, and hydration."
                                        "Overweight" -> "Recommend a light caloric deficit (-300 to 500 kcal) combined with high-protein intake to guard muscle mass while losing body fat."
                                        else -> "Incorporate a structured nutritional plan and consistent physical activity. Focus on consistent whole food logging and steady progress."
                                    }
                                    Text(text = "HEALTH RANGE DIAGNOSIS", color = GymRedLight, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(text = advice, color = TextGray, fontSize = 11.sp, lineHeight = 15.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    // Live recalculate daily calories and macros in ViewModel
                                    viewModel.recalculateMetrics(
                                        newWeight = bmiWeight,
                                        newHeight = bmiHeight,
                                        newWeightUnit = if (isKg) "kg" else "lbs",
                                        newHeightUnit = if (isCm) "cm" else "in"
                                    )
                                    viewModel.submitLeadAndUnlock()
                                    Toast.makeText(context, "Calculations applied and saved to profile!", Toast.LENGTH_SHORT).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("APPLY & SAVE NEW METRICS", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }

                ResultsTab.CALORIES -> {
                    // DYNAMIC CALORIE TRACKER TAB
                    val totalCaloriesLogged = calorieLogs.sumOf { it.calories }
                    val remainingCalories = (calorieTarget - totalCaloriesLogged).coerceAtLeast(0)

                    // Calculate logged macros
                    val totalP = calorieLogs.sumOf { it.protein }
                    val totalC = calorieLogs.sumOf { it.carbs }
                    val totalF = calorieLogs.sumOf { it.fats }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        border = BorderStroke(1.dp, GymSlateLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "DAILY CALORIE TRACKER & RING",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = GymRed,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Dynamic Ring representation
                                Box(
                                    modifier = Modifier
                                        .size(100.dp)
                                        .clip(CircleShape)
                                        .background(GymBlack),
                                    contentAlignment = Alignment.Center
                                ) {
                                    val completionFraction = (totalCaloriesLogged.toFloat() / calorieTarget.toFloat()).coerceIn(0f, 1f)
                                    CircularProgressIndicator(
                                        progress = { completionFraction },
                                        color = GymRed,
                                        strokeWidth = 6.dp,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(text = "$totalCaloriesLogged", fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextWhite)
                                        Text(text = "LOGGED", fontSize = 8.sp, color = TextGray)
                                    }
                                }

                                Spacer(modifier = Modifier.width(20.dp))

                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text(text = "Remaining: $remainingCalories kcal", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BmiEmerald)
                                    Text(text = "Daily Target: $calorieTarget kcal", fontSize = 12.sp, color = TextGray)
                                    Text(text = "Logged Foods: ${calorieLogs.size} items", fontSize = 11.sp, color = TextGrayMuted)
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Macros progress bars
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                val pFraction = (totalP.toFloat() / protein.toFloat()).coerceIn(0f, 1f)
                                val cFraction = (totalC.toFloat() / carbs.toFloat()).coerceIn(0f, 1f)
                                val fFraction = (totalF.toFloat() / fats.toFloat()).coerceIn(0f, 1f)

                                Column {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("PROTEIN", fontSize = 10.sp, color = GymRedLight, fontWeight = FontWeight.Bold)
                                        Text("$totalP / ${protein}g", fontSize = 10.sp, color = TextWhite)
                                    }
                                    LinearProgressIndicator(progress = { pFraction }, color = GymRedLight, trackColor = GymBlack, modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape))
                                }

                                Column {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("CARBS", fontSize = 10.sp, color = BmiAmber, fontWeight = FontWeight.Bold)
                                        Text("$totalC / ${carbs}g", fontSize = 10.sp, color = TextWhite)
                                    }
                                    LinearProgressIndicator(progress = { cFraction }, color = BmiAmber, trackColor = GymBlack, modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape))
                                }

                                Column {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("FATS", fontSize = 10.sp, color = Color(0xFF3B82F6), fontWeight = FontWeight.Bold)
                                        Text("$totalF / ${fats}g", fontSize = 10.sp, color = TextWhite)
                                    }
                                    LinearProgressIndicator(progress = { fFraction }, color = Color(0xFF3B82F6), trackColor = GymBlack, modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape))
                                }
                            }
                        }
                    }

                    // Add Meal Log Form
                    var customMealName by remember { mutableStateOf("") }
                    var customCalories by remember { mutableStateOf("") }
                    var customP by remember { mutableStateOf("") }
                    var customC by remember { mutableStateOf("") }
                    var customF by remember { mutableStateOf("") }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                        shape = RoundedCornerShape(0.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = "LOG A MEAL OR FOOD", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextWhite)
                            Spacer(modifier = Modifier.height(12.dp))

                            // Quick Log templates
                            Text(text = "Quick Log Templates:", color = TextGray, fontSize = 10.sp)
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                val quickFoods = listOf(
                                    Triple("Eggs & Toast", 290, Triple(18, 25, 12)),
                                    Triple("Oatmeal & Protein", 360, Triple(30, 48, 6)),
                                    Triple("Chicken & Rice", 520, Triple(45, 60, 10)),
                                    Triple("Beef & Potato", 610, Triple(42, 55, 20)),
                                    Triple("Whey Shake", 180, Triple(30, 5, 2)),
                                    Triple("Greek Yogurt Cup", 150, Triple(15, 15, 1))
                                )
                                quickFoods.forEach { (name, cal, macros) ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(0.dp))
                                            .background(GymBlack)
                                            .clickable {
                                                viewModel.addCalorieLog(name, cal, macros.first, macros.second, macros.third)
                                                Toast.makeText(context, "$name added!", Toast.LENGTH_SHORT).show()
                                            }
                                            .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp))
                                            .padding(horizontal = 10.dp, vertical = 6.dp)
                                    ) {
                                        Text(text = "$name (${cal}k)", color = TextWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            // Manual entry
                            OutlinedTextField(
                                value = customMealName,
                                onValueChange = { customMealName = it },
                                label = { Text("Food / Meal Name", color = TextGray) },
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = GymRed,
                                    unfocusedBorderColor = GymSlateLight,
                                    focusedContainerColor = GymBlack,
                                    unfocusedContainerColor = GymBlack,
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                ),
                                shape = RoundedCornerShape(0.dp),
                                modifier = Modifier.fillMaxWidth()
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = customCalories,
                                    onValueChange = { customCalories = it },
                                    label = { Text("Calories (kcal)", color = TextGray) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = GymRed,
                                        unfocusedBorderColor = GymSlateLight,
                                        focusedContainerColor = GymBlack,
                                        unfocusedContainerColor = GymBlack,
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1f)
                                )

                                OutlinedTextField(
                                    value = customP,
                                    onValueChange = { customP = it },
                                    label = { Text("Protein (g)", color = TextGray) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = GymRed,
                                        unfocusedBorderColor = GymSlateLight,
                                        focusedContainerColor = GymBlack,
                                        unfocusedContainerColor = GymBlack,
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = customC,
                                    onValueChange = { customC = it },
                                    label = { Text("Carbs (g)", color = TextGray) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = GymRed,
                                        unfocusedBorderColor = GymSlateLight,
                                        focusedContainerColor = GymBlack,
                                        unfocusedContainerColor = GymBlack,
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1f)
                                )

                                OutlinedTextField(
                                    value = customF,
                                    onValueChange = { customF = it },
                                    label = { Text("Fats (g)", color = TextGray) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = GymRed,
                                        unfocusedBorderColor = GymSlateLight,
                                        focusedContainerColor = GymBlack,
                                        unfocusedContainerColor = GymBlack,
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Button(
                                onClick = {
                                    val cal = customCalories.toIntOrNull() ?: 0
                                    if (customMealName.isNotBlank() && cal > 0) {
                                        viewModel.addCalorieLog(
                                            customMealName,
                                            cal,
                                            customP.toIntOrNull() ?: 0,
                                            customC.toIntOrNull() ?: 0,
                                            customF.toIntOrNull() ?: 0
                                        )
                                        customMealName = ""
                                        customCalories = ""
                                        customP = ""
                                        customC = ""
                                        customF = ""
                                        Toast.makeText(context, "Meal logged!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Please enter a valid Food Name and Calories", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                                shape = RoundedCornerShape(0.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(imageVector = Icons.Default.Add, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("LOG FOOD TO PROFILE", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Today's Logs list
                    Text(text = "TODAY'S LOGGED MEALS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextGray)
                    if (calorieLogs.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(80.dp)
                                .clip(RoundedCornerShape(0.dp))
                                .background(GymSlate)
                                .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No meals logged today. Use quick-logs above!", color = TextGray, fontSize = 12.sp)
                        }
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            calorieLogs.forEach { log ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = GymSlate),
                                    border = BorderStroke(1.dp, GymSlateLight),
                                    shape = RoundedCornerShape(0.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(text = log.mealName, fontWeight = FontWeight.Bold, color = TextWhite, fontSize = 13.sp)
                                            Text(text = "P: ${log.protein}g • C: ${log.carbs}g • F: ${log.fats}g", color = TextGray, fontSize = 10.sp)
                                        }
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(text = "${log.calories} kcal", fontWeight = FontWeight.Black, color = GymRedLight, fontSize = 13.sp)
                                            Spacer(modifier = Modifier.width(8.dp))
                                            IconButton(onClick = { viewModel.deleteCalorieLog(log.id) }) {
                                                Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = GymRed, modifier = Modifier.size(18.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                ResultsTab.DIET -> {
                    // AI DIET PLANNER SECTION
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                        shape = RoundedCornerShape(0.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "AI-GENERATED MEAL PLAN",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GymRed,
                                    letterSpacing = 1.sp
                                )
                                if (isGeneratingDietPlan) {
                                    CircularProgressIndicator(color = GymRed, strokeWidth = 1.5.dp, modifier = Modifier.size(12.dp))
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Calibrated tailored meal plans precisely targeting $calorieTarget kcal/day to support your primary fitness goal of $primaryGoal.",
                                fontSize = 11.sp,
                                color = TextGray,
                                lineHeight = 15.sp
                            )
                            Spacer(modifier = Modifier.height(14.dp))

                            Button(
                                onClick = { viewModel.generateDietPlan() },
                                colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                                shape = RoundedCornerShape(0.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(if (dietPlan.isEmpty()) "DRAFT CUSTOM PLAN WITH GEMINI" else "RE-DRAFT MEAL PLAN", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    if (isGeneratingDietPlan && dietPlan.isBlank()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .clip(RoundedCornerShape(0.dp))
                                .background(GymSlate)
                                .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                CircularProgressIndicator(color = GymRed, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.height(10.dp))
                                Text("Engaging elite dietetic model servers...", color = TextGray, fontSize = 12.sp)
                            }
                        }
                    } else if (dietPlan.isNotBlank()) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GymSlate),
                            border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                            shape = RoundedCornerShape(0.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(text = "YOUR NUTRITIONAL PROTOCOL", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = GymRedLight)
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = dietPlan,
                                    fontSize = 12.sp,
                                    color = TextWhite,
                                    lineHeight = 18.sp,
                                    modifier = Modifier.padding(2.dp)
                                )
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(100.dp)
                                .clip(RoundedCornerShape(0.dp))
                                .background(GymSlate)
                                .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No plan drafted yet. Click the draft button above!", color = TextGray, fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // AI WORKOUT PLANNER SECTION (WHAT TO DO & WHAT TO LIFT)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                        shape = RoundedCornerShape(0.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "AI-GENERATED WORKOUT PLAN",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GymRed,
                                    letterSpacing = 1.sp
                                )
                                if (isGeneratingWorkoutPlan) {
                                    CircularProgressIndicator(color = GymRed, strokeWidth = 1.5.dp, modifier = Modifier.size(12.dp))
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Calibrated tailored training splits, mobility exercises, cardio conditioning, and heavy compound lifting progressions customized for $primaryGoal.",
                                fontSize = 11.sp,
                                color = TextGray,
                                lineHeight = 15.sp
                            )
                            Spacer(modifier = Modifier.height(14.dp))

                            Button(
                                onClick = { viewModel.generateWorkoutPlan() },
                                colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                                shape = RoundedCornerShape(0.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(if (workoutPlan.isEmpty()) "DRAFT CUSTOM LIFTING PLAN WITH GEMINI" else "RE-DRAFT LIFTING PLAN", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    if (isGeneratingWorkoutPlan && workoutPlan.isBlank()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .clip(RoundedCornerShape(0.dp))
                                .background(GymSlate)
                                .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                CircularProgressIndicator(color = GymRed, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.height(10.dp))
                                Text("Engaging elite athletic model servers...", color = TextGray, fontSize = 12.sp)
                            }
                        }
                    } else if (workoutPlan.isNotBlank()) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GymSlate),
                            border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                            shape = RoundedCornerShape(0.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(text = "YOUR ATHLETIC WORKOUT PROTOCOL", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = GymRedLight)
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = workoutPlan,
                                    fontSize = 12.sp,
                                    color = TextWhite,
                                    lineHeight = 18.sp,
                                    modifier = Modifier.padding(2.dp)
                                )
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(100.dp)
                                .clip(RoundedCornerShape(0.dp))
                                .background(GymSlate)
                                .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No workout plan drafted yet. Click the draft button above!", color = TextGray, fontSize = 12.sp)
                        }
                    }
                }

                ResultsTab.WEIGHT_TIME -> {
                    // STANDALONE WEIGHT-TIME CALCULATOR TAB
                    val currentWeightD = viewModel.weight.value.toDoubleOrNull() ?: 70.0
                    var targetWeightInput by remember { mutableStateOf(currentWeightD - 5.0) }
                    var weeklyPaceInput by remember { mutableStateOf(0.5) } // kg per week

                    val weightDiff = Math.abs(currentWeightD - targetWeightInput)
                    val weeksNeeded = if (weeklyPaceInput > 0) Math.ceil(weightDiff / weeklyPaceInput).toInt() else 0
                    
                    val dateStr = remember(weeksNeeded) {
                        val cal = java.util.Calendar.getInstance()
                        cal.add(java.util.Calendar.WEEK_OF_YEAR, weeksNeeded)
                        val sdf = java.text.SimpleDateFormat("MMMM dd, yyyy", java.util.Locale.getDefault())
                        sdf.format(cal.time)
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        border = BorderStroke(1.dp, GymSlateLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "WEIGHT-TIME TIMELINE PROJECTION",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = GymRed,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Current Weight", color = TextGray, fontSize = 10.sp)
                                    Text("${viewModel.weight.value} kg", color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Target Weight", color = TextGray, fontSize = 10.sp)
                                    Text("${Math.round(targetWeightInput * 10.0) / 10.0} kg", color = GymRedLight, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            // Adjust target weight
                            Text(
                                text = "Adjust Target Weight: ${Math.round(targetWeightInput)} kg",
                                color = TextWhite,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Slider(
                                value = targetWeightInput.toFloat(),
                                onValueChange = { targetWeightInput = it.toDouble() },
                                valueRange = 40f..150f,
                                colors = SliderDefaults.colors(thumbColor = GymRed, activeTrackColor = GymRedLight)
                            )

                            // Adjust weekly pace
                            Text(
                                text = "Weekly Pace Rate: $weeklyPaceInput kg / week",
                                color = TextWhite,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                listOf(0.25, 0.5, 0.75, 1.0).forEach { pace ->
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(0.dp))
                                            .background(if (weeklyPaceInput == pace) GymRed else GymBlack)
                                            .clickable { weeklyPaceInput = pace }
                                            .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp))
                                            .padding(vertical = 8.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("$pace kg", color = TextWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Projection KPI card
                            Card(
                                colors = CardDefaults.cardColors(containerColor = GymBlack),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text("PROJECTED OUTCOMES", color = GymRedLight, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(text = "• Target Weeks Needed: $weeksNeeded Weeks", fontSize = 12.sp, color = TextWhite, fontWeight = FontWeight.Bold)
                                    Text(text = "• Estimated Completion Date: $dateStr", fontSize = 12.sp, color = TextWhite, fontWeight = FontWeight.Bold)
                                    val mode = if (targetWeightInput < currentWeightD) "deficit" else "surplus"
                                    val valKcal = if (targetWeightInput < currentWeightD) "-500" else "+500"
                                    Text(text = "• Caloric Mode: Requires a healthy daily $mode of approx $valKcal kcal.", fontSize = 11.sp, color = TextGray)
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Milestone checklist/timeline
                            Text(text = "MILESTONES TIMELINE CHECKLIST", color = GymRedLight, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(8.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                val checkpoints = listOf(
                                    "Starting Line" to 0f,
                                    "Aesthetic Adaptation" to 0.25f,
                                    "Midpoint Checkin" to 0.5f,
                                    "Goal Achieved! 🎉" to 1f
                                )
                                checkpoints.forEach { (title, frac) ->
                                    val diffVal = (currentWeightD - targetWeightInput) * frac
                                    val currentMilestoneW = currentWeightD - diffVal
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(0.dp))
                                            .background(GymBlack)
                                            .border(1.dp, GymSlateLight, RoundedCornerShape(0.dp))
                                            .padding(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = GymRedLight, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Text(text = title, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextWhite, modifier = Modifier.weight(1f))
                                        Text(text = "${Math.round(currentMilestoneW * 10.0) / 10.0} kg", fontSize = 11.sp, color = TextGray, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    // Weight history logs tracker inside SQLite
                    var newHistoryWeight by remember { mutableStateOf("") }
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlate),
                        border = BorderStroke(1.5.dp, Color.White.copy(alpha = 0.25f)),
                        shape = RoundedCornerShape(0.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(text = "LOG WEIGHT HISTORY READINGS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TextWhite)
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = newHistoryWeight,
                                    onValueChange = { newHistoryWeight = it },
                                    label = { Text("Weight Reading (kg)", color = TextGray) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = GymRed,
                                        unfocusedBorderColor = GymSlateLight,
                                        focusedContainerColor = GymBlack,
                                        unfocusedContainerColor = GymBlack,
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1.5f)
                                )

                                Button(
                                    onClick = {
                                        val wVal = newHistoryWeight.toDoubleOrNull() ?: 0.0
                                        if (wVal > 30.0) {
                                            viewModel.addWeightLog(wVal)
                                            newHistoryWeight = ""
                                            Toast.makeText(context, "Weight logged!", Toast.LENGTH_SHORT).show()
                                        } else {
                                            Toast.makeText(context, "Please enter a valid weight (e.g. 72)", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = GymRed),
                                    shape = RoundedCornerShape(0.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Add Log", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(text = "HISTORIC LOG JOURNEY:", color = TextGray, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            if (weightLogs.isEmpty()) {
                                Text("No weight history logs recorded yet.", color = TextGrayMuted, fontSize = 10.sp)
                            } else {
                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    weightLogs.forEach { log ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text("• Reading: ${log.weight} kg", color = TextWhite, fontSize = 11.sp)
                                            IconButton(onClick = { viewModel.deleteWeightLog(log.id) }, modifier = Modifier.size(24.dp)) {
                                                Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = GymRed, modifier = Modifier.size(14.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showThankYouDialog) {
            AlertDialog(
                onDismissRequest = { viewModel.dismissThankYouDialog() },
                title = {
                    Text(
                        text = "THANK YOU, ${name.uppercase()}!",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 16.sp,
                        color = GymRedLight
                    )
                },
                text = {
                    Text(
                        text = "Your elite assessment report, nutritional protocol, calorie and weight trackers, and AI workout & meal plans are now 100% unlocked for free with no subscription or payment required!",
                        fontSize = 12.sp,
                        color = TextWhite,
                        lineHeight = 16.sp
                    )
                },
                confirmButton = {
                    Button(
                        onClick = { viewModel.dismissThankYouDialog() },
                        colors = ButtonDefaults.buttonColors(containerColor = GymRed)
                    ) {
                        Text("START TRAINING", fontWeight = FontWeight.Bold, color = TextWhite)
                    }
                },
                containerColor = GymSlate,
                titleContentColor = GymRedLight,
                textContentColor = TextWhite
            )
        }
    }
}

@Composable
fun MacroColumn(name: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(GymBlack)
            .border(1.dp, GymSlateLight, RoundedCornerShape(10.dp))
            .padding(10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = name, color = color, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = value, color = TextWhite, fontSize = 18.sp, fontWeight = FontWeight.Black)
        }
    }
}

fun sharePlanText(
    context: Context,
    name: String,
    bmi: Double,
    bmiCat: String,
    calories: Int,
    goal: String,
    protein: Int,
    carbs: Int,
    fats: Int,
    advice: String
) {
    val text = """
        === IRONPULSE ATHLETIC REPORT ===
        Prepared For: $name
        Fitness Objective: $goal
        
        BIOMETRIC RATIOS:
        - BMI: $bmi ($bmiCat)
        - Target Intake: $calories kcal/day
        
        MACRONUTRIENT DAILY BLUEPRINT:
        - Protein: ${protein}g
        - Carbs: ${carbs}g
        - Fats: ${fats}g
        
        COACH RECON BLUEPRINT:
        $advice
        
        --- Prepared by IronPulse Gym ---
    """.trimIndent()

    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, "IronPulse Fitness Assessment - $name")
        putExtra(Intent.EXTRA_TEXT, text)
    }
    context.startActivity(Intent.createChooser(intent, "Share Assessment Report"))
}


// ==================== STEP HEADER ====================
@Composable
fun StepHeader(
    currentStepNum: Int,
    stepTitle: String,
    progress: Float,
    onBack: () -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = TextWhite
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stepTitle,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = TextWhite,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "STEP $currentStepNum OF 4",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextGray,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    for (i in 1..4) {
                        val isActive = i == currentStepNum
                        val isCompleted = i < currentStepNum
                        val width = if (isActive) 24.dp else 12.dp
                        val color = if (isActive || isCompleted) GymRed else GymSlateLight
                        Box(
                            modifier = Modifier
                                .width(width)
                                .height(4.dp)
                                .clip(CircleShape)
                                .background(color)
                        )
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(GymBorder)
        )
    }
}


// ==================== ADMIN LEADS PANEL (OWNER-FACING VALUE) ====================
@Composable
fun AdminLeadsScreen(viewModel: AssessmentViewModel, leads: List<LeadEntity>) {
    val context = LocalContext.current
    var searchQuery by remember { mutableStateOf("") }
    val filteredLeads = leads.filter {
        it.name.contains(searchQuery, ignoreCase = true) ||
                it.email.contains(searchQuery, ignoreCase = true) ||
                it.phone.contains(searchQuery, ignoreCase = true) ||
                it.city.contains(searchQuery, ignoreCase = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GymBlack)
            .padding(20.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { viewModel.navigateTo(ScreenStep.WELCOME) }) {
                    Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextWhite)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = "Leads Panel", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = TextWhite)
            }
            if (leads.isNotEmpty()) {
                TextButton(onClick = {
                    viewModel.clearAllCapturedLeads()
                    Toast.makeText(context, "Leads database cleared!", Toast.LENGTH_SHORT).show()
                }) {
                    Text("Clear All", color = GymRedLight, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Stats Row
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = GymSlate)
            ) {
                Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("TOTAL LEADS", fontSize = 9.sp, color = TextGray, fontWeight = FontWeight.Bold)
                    Text("${leads.size}", fontSize = 20.sp, fontWeight = FontWeight.Black, color = GymRedLight)
                }
            }
            Card(
                modifier = Modifier.weight(1.3f),
                colors = CardDefaults.cardColors(containerColor = GymSlate)
            ) {
                val avgCal = if (leads.isNotEmpty()) leads.map { it.calorieTarget }.average().toInt() else 0
                Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("AVG TARGET ENERGY", fontSize = 9.sp, color = TextGray, fontWeight = FontWeight.Bold)
                    Text("$avgCal kcal", fontSize = 20.sp, fontWeight = FontWeight.Black, color = TextWhite)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Private Owner Protocol Banner
        Card(
            colors = CardDefaults.cardColors(containerColor = BmiEmerald.copy(alpha = 0.08f)),
            border = BorderStroke(1.dp, BmiEmerald.copy(alpha = 0.2f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(imageVector = Icons.Default.Info, contentDescription = "Info", tint = BmiEmerald, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Owner Protocol Note: Full access is granted to all users freely without paywalls or mandatory sign in. Review captured submissions below, export CSV logs, or follow up with prospective clients.",
                    fontSize = 11.sp,
                    color = BmiEmerald,
                    lineHeight = 15.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search by name, email, city...", color = TextGrayMuted, fontSize = 13.sp) },
            leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = TextGray) },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = TextWhite,
                unfocusedTextColor = TextWhite,
                focusedBorderColor = GymRed,
                unfocusedBorderColor = GymSlateLight,
                focusedContainerColor = GymSlate,
                unfocusedContainerColor = GymSlate
            ),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth().height(52.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (filteredLeads.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(imageVector = Icons.Default.Analytics, contentDescription = null, tint = TextGrayMuted, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("No captured leads found", color = TextGray, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredLeads) { lead ->
                    LeadRowItem(lead) {
                        viewModel.deleteLead(lead.id)
                        Toast.makeText(context, "Lead deleted", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
}

@Composable
fun LeadRowItem(lead: LeadEntity, onDelete: () -> Unit) {
    val context = LocalContext.current
    var isExpanded by remember { mutableStateOf(false) }

    Card(
        colors = CardDefaults.cardColors(containerColor = GymSlate),
        border = BorderStroke(1.dp, GymSlateLight),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { isExpanded = !isExpanded }
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = lead.name, fontWeight = FontWeight.Bold, color = TextWhite, fontSize = 14.sp)
                    Text(text = "${lead.gender} • ${lead.age} y • ${lead.city}", fontSize = 11.sp, color = TextGray)
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(GymRed.copy(alpha = 0.1f))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(text = lead.goal.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Bold, color = GymRedLight)
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    Divider(color = GymSlateLight)
                    Spacer(modifier = Modifier.height(10.dp))

                    Text(text = "CONTACT DETAILS:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = GymRedLight)
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "WhatsApp: ${lead.phone}", fontSize = 11.sp, color = TextWhite)
                        IconButton(
                            onClick = {
                                val url = "https://api.whatsapp.com/send?phone=${lead.phone.replace("+", "").replace(" ", "")}"
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                context.startActivity(intent)
                            },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Phone, contentDescription = "WhatsApp Link", tint = BmiEmerald, modifier = Modifier.size(16.dp))
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Email: ${lead.email}", fontSize = 11.sp, color = TextWhite)
                        IconButton(
                            onClick = {
                                val intent = Intent(Intent.ACTION_SENDTO).apply {
                                    data = Uri.parse("mailto:${lead.email}")
                                    putExtra(Intent.EXTRA_SUBJECT, "IronPulse Custom Gym Program")
                                }
                                context.startActivity(intent)
                            },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Email, contentDescription = "Email Link", tint = Color(0xFF3B82F6), modifier = Modifier.size(16.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(text = "CALCULATED BIOMETRICS:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = GymRedLight)
                    Text(text = "BMI: ${lead.bmi} (${lead.bmiCategory})", fontSize = 11.sp, color = TextGray)
                    Text(text = "Energy target: ${lead.calorieTarget} kcal/day", fontSize = 11.sp, color = TextGray)
                    Text(text = "Protein: ${lead.proteinGrams}g | Carbs: ${lead.carbGrams}g | Fats: ${lead.fatGrams}g", fontSize = 11.sp, color = TextGray)
                    Text(text = "Injuries/Limitations: ${lead.limitations}", fontSize = 11.sp, color = TextGray)

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "4-WEEK DIET PROTOCOL:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = GymRedLight)
                    Spacer(modifier = Modifier.height(4.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlateLight.copy(alpha = 0.5f)),
                        border = BorderStroke(1.dp, GymSlateLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = lead.dietPlan.ifBlank { "No plan generated yet" },
                            fontSize = 10.5.sp,
                            color = TextWhite,
                            modifier = Modifier.padding(10.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "CUSTOMIZED ATHLETIC WORKOUT SPLITS:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = GymRedLight)
                    Spacer(modifier = Modifier.height(4.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GymSlateLight.copy(alpha = 0.5f)),
                        border = BorderStroke(1.dp, GymSlateLight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = lead.workoutPlan.ifBlank { "No plan generated yet" },
                            fontSize = 10.5.sp,
                            color = TextWhite,
                            modifier = Modifier.padding(10.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    OutlinedButton(
                        onClick = onDelete,
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = GymRedLight),
                        border = BorderStroke(1.dp, GymRedLight.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().height(36.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("DELETE RECORD", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}


// ==================== WEB CODE EXPORTER (DEVELOPER VALUE) ====================
@Composable
fun CodeExporterScreen(viewModel: AssessmentViewModel) {
    val context = LocalContext.current
    val htmlWidgetCode = remember { viewModel.getWebWidgetCode() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(GymBlack)
            .padding(20.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { viewModel.navigateTo(ScreenStep.WELCOME) }) {
                Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextWhite)
            }
            Spacer(modifier = Modifier.width(4.dp))
            Text(text = "Web Embed Exporter", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = TextWhite)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Copy this single-file HTML/JS lead generation calculator code to paste directly into WordPress, Wix, Webflow, or any client gym website. It includes all steps, biometrics formulas, PDF generation, and CRM webhook capabilities natively.",
            fontSize = 11.sp,
            color = TextGray,
            lineHeight = 15.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Code Area
        Card(
            colors = CardDefaults.cardColors(containerColor = GymSlate),
            border = BorderStroke(1.dp, GymSlateLight),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    Text(
                        text = htmlWidgetCode,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                        fontSize = 10.sp,
                        color = BmiEmerald,
                        lineHeight = 13.sp
                    )
                }

                // Copy float action button
                FloatingActionButton(
                    onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("Embed Widget HTML", htmlWidgetCode)
                        clipboard.setPrimaryClip(clip)
                        Toast.makeText(context, "HTML code copied to clipboard!", Toast.LENGTH_SHORT).show()
                    },
                    containerColor = GymRed,
                    contentColor = TextWhite,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(16.dp)
                        .testTag("copy_html_code_fab")
                ) {
                    Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "Copy Code")
                }
            }
        }
    }
}

fun generateAndPrintPdf(
    context: Context,
    name: String,
    goal: String,
    bmi: String,
    category: String,
    calories: Int,
    protein: Int,
    carbs: Int,
    fats: Int,
    coachAdvice: String,
    dietPlan: String,
    workoutPlan: String
) {
    val escapedName = name.replace("'", "\\'")
    val escapedGoal = goal.replace("'", "\\'")
    val escapedCategory = category.replace("'", "\\'")
    val escapedBmi = bmi.replace("'", "\\'")

    val htmlContent = """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            line-height: 1.5;
            margin: 30px;
            background-color: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #E53935;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            margin: 0;
            color: #111111;
            font-size: 26px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #E53935;
            font-weight: bold;
            font-size: 13px;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .section-title {
            color: #E53935;
            border-bottom: 1.5px solid #E53935;
            padding-bottom: 4px;
            margin-top: 25px;
            margin-bottom: 12px;
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-bottom: 15px;
          }
          .grid-row {
            display: table-row;
          }
          .grid-col {
            display: table-cell;
            padding: 8px 12px;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
          }
          .grid-col-title {
            font-size: 9px;
            color: #6c757d;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .grid-col-value {
            font-size: 14px;
            font-weight: bold;
            color: #111111;
          }
          .macro-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            color: #ffffff;
            font-size: 11px;
            margin-right: 6px;
          }
          .macro-protein { background-color: #E53935; }
          .macro-carbs { background-color: #4CAF50; }
          .macro-fats { background-color: #FFC107; color: #111111; }
          .content-box {
            background-color: #fdfdfd;
            border-left: 3.5px solid #E53935;
            padding: 12px 15px;
            margin-bottom: 18px;
            font-size: 12.5px;
            white-space: pre-wrap;
            border-top: 1px solid #f1f1f1;
            border-right: 1px solid #f1f1f1;
            border-bottom: 1px solid #f1f1f1;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 10px;
            color: #6c757d;
            border-top: 1px solid #e0e0e0;
            padding-top: 12px;
          }
        </style>
        </head>
        <body>
          <div class="header">
            <h1>IronPulse Athlete Plan</h1>
            <p>Premium Conditioning & Strength Coaching</p>
          </div>
          
          <div class="section-title">Client Profile & Biometrics</div>
          <div class="grid">
            <div class="grid-row">
              <div class="grid-col">
                <div class="grid-col-title">Client Name</div>
                <div class="grid-col-value">${escapedName}</div>
              </div>
              <div class="grid-col">
                <div class="grid-col-title">Primary Goal</div>
                <div class="grid-col-value">${escapedGoal}</div>
              </div>
            </div>
            <div class="grid-row" style="height: 8px;"></div>
            <div class="grid-row">
              <div class="grid-col">
                <div class="grid-col-title">Body Mass Index (BMI)</div>
                <div class="grid-col-value">${escapedBmi} (${escapedCategory})</div>
              </div>
              <div class="grid-col">
                <div class="grid-col-title">Daily Calorie Target</div>
                <div class="grid-col-value">${calories} kcal/day</div>
              </div>
            </div>
          </div>

          <div class="section-title">Macro Target Distribution</div>
          <div style="margin-bottom: 15px; padding: 10px 12px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px;">
            <span class="macro-badge macro-protein">Protein: ${protein}g</span>
            <span class="macro-badge macro-carbs">Carbs: ${carbs}g</span>
            <span class="macro-badge macro-fats">Fats: ${fats}g</span>
          </div>

          <div class="section-title">Coach AI Summary Analysis</div>
          <div class="content-box">${coachAdvice}</div>

          <div class="section-title">4-Week Customized Nutritional Protocol</div>
          <div class="content-box">${dietPlan.ifBlank { "Check the AI Diet Plan tab for details!" }}</div>

          <div class="section-title">Tailored Athletic Training Splits</div>
          <div class="content-box">${workoutPlan.ifBlank { "Check the AI Workout tab for details!" }}</div>

          <div class="footer">
            This plan is carefully calibrated to your biometrics. Formulated by Head Gym Owner Marcus Tanner.<br>
            &copy; 2026 IronPulse Elite Coaching. All rights reserved.
          </div>
        </body>
        </html>
    """.trimIndent()

    val webView = WebView(context)
    webView.webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
            val printAdapter = view?.createPrintDocumentAdapter("IronPulse_Plan_$name")
            val jobName = "IronPulse Plan - $name"
            if (printAdapter != null) {
                printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
            }
        }
    }
    webView.loadDataWithBaseURL(null, htmlContent, "text/html", "utf-8", null)
}
