package com.example.util

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import android.print.PrintManager
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.example.data.model.Member
import com.example.ui.screens.PremiumAiPlan
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

object PdfPlanGenerator {

    /**
     * Generates a professional PDF containing member information, workout plan,
     * and nutrition plan, and returns the generated File in the cache directory.
     */
    fun generatePlanPdfFile(context: Context, member: Member, plan: PremiumAiPlan, trainerName: String?): File {
        val pdfDocument = PdfDocument()
        var pageNum = 1
        var pageInfo = PdfDocument.PageInfo.Builder(595, 842, pageNum).create()
        var page = pdfDocument.startPage(pageInfo)
        var canvas = page.canvas

        val textPaint = Paint().apply {
            color = Color.parseColor("#1E293B")
            textSize = 10f
            isAntiAlias = true
        }

        val boldPaint = Paint().apply {
            color = Color.parseColor("#0F172A")
            textSize = 11f
            isFakeBoldText = true
            isAntiAlias = true
        }

        val sectionTitlePaint = Paint().apply {
            color = Color.parseColor("#0F172A")
            textSize = 14f
            isFakeBoldText = true
            isAntiAlias = true
        }

        var currentY = 45f

        // Helper to draw the header on Page 1
        fun drawPage1Header() {
            // Header Banner
            val bannerPaint = Paint().apply { color = Color.parseColor("#0F172A") }
            canvas.drawRect(40f, 40f, 555f, 130f, bannerPaint)

            // Gym Logo (Dynamic circle vector + barbell design)
            val goldColor = Color.parseColor("#F59E0B")
            val logoPaint = Paint().apply {
                color = goldColor
                isAntiAlias = true
            }
            canvas.drawCircle(80f, 85f, 25f, logoPaint)
            logoPaint.color = Color.parseColor("#0F172A")
            canvas.drawCircle(80f, 85f, 22f, logoPaint)
            
            // Barbell visual decoration in logo
            logoPaint.color = goldColor
            canvas.drawRect(65f, 83f, 95f, 87f, logoPaint) // bar
            canvas.drawRoundRect(RectF(61f, 78f, 66f, 92f), 2f, 2f, logoPaint) // weight left
            canvas.drawRoundRect(RectF(94f, 78f, 99f, 92f), 2f, 2f, logoPaint) // weight right

            // Gym Master Title
            val titlePaint = Paint().apply {
                color = Color.WHITE
                textSize = 24f
                isFakeBoldText = true
                isAntiAlias = true
            }
            canvas.drawText("GymMaster Pro", 120f, 80f, titlePaint)

            // Subtitle
            val subPaint = Paint().apply {
                color = Color.parseColor("#94A3B8")
                textSize = 9f
                isAntiAlias = true
            }
            canvas.drawText("ELITE INTEGRATED ATHLETIC SCHEDULING SYSTEM", 120f, 105f, subPaint)

            // Metadata info block background
            val cardPaint = Paint().apply {
                color = Color.parseColor("#F8FAFC")
                isAntiAlias = true
            }
            canvas.drawRoundRect(RectF(40f, 145f, 555f, 245f), 8f, 8f, cardPaint)

            val borderPaint = Paint().apply {
                color = Color.parseColor("#E2E8F0")
                style = Paint.Style.STROKE
                strokeWidth = 1f
                isAntiAlias = true
            }
            canvas.drawRoundRect(RectF(40f, 145f, 555f, 245f), 8f, 8f, borderPaint)

            // Draw Member Metadata
            val metaBold = Paint(boldPaint).apply { textSize = 10f }
            val metaNormal = Paint(textPaint).apply { textSize = 10f }

            // Column 1
            canvas.drawText("MEMBER INFORMATION", 55f, 165f, Paint(sectionTitlePaint).apply { textSize = 11f; color = Color.parseColor("#1E293B") })
            canvas.drawText("Name:", 55f, 185f, metaBold)
            canvas.drawText(member.name, 110f, 185f, metaNormal)
            canvas.drawText("Age/Gender:", 55f, 205f, metaBold)
            canvas.drawText("${member.age} yrs / ${member.gender}", 130f, 205f, metaNormal)
            canvas.drawText("Biometrics:", 55f, 225f, metaBold)
            canvas.drawText("${member.weight} kg @ ${member.height} cm", 130f, 225f, metaNormal)

            // Column 2
            canvas.drawText("BMI:", 310f, 185f, metaBold)
            canvas.drawText("${member.bmi} (${member.bmiCategory})", 345f, 185f, metaNormal)
            canvas.drawText("Goal:", 310f, 205f, metaBold)
            canvas.drawText(plan.goal, 345f, 205f, metaNormal)
            canvas.drawText("Trainer:", 310f, 225f, metaBold)
            canvas.drawText(trainerName ?: "Assigned Personal Coach", 360f, 225f, metaNormal)

            // Date Badge
            val badgePaint = Paint().apply {
                color = Color.parseColor("#EEF2F6")
                isAntiAlias = true
            }
            canvas.drawRoundRect(RectF(380f, 153f, 545f, 171f), 4f, 4f, badgePaint)
            val dateLabelPaint = Paint().apply {
                color = Color.parseColor("#475569")
                textSize = 8f
                isFakeBoldText = true
                isAntiAlias = true
            }
            canvas.drawText("FORMULATED: ${plan.generatedDate}", 386f, 165f, dateLabelPaint)

            currentY = 270f
        }

        // Drawer for page footer
        fun drawPageFooter(canv: Canvas, pNum: Int) {
            val footerPaint = Paint().apply {
                color = Color.parseColor("#64748B")
                textSize = 9f
                isAntiAlias = true
            }
            val dividerPaint = Paint().apply {
                color = Color.parseColor("#CBD5E1")
                strokeWidth = 1f
            }
            canv.drawLine(40f, 800f, 555f, 800f, dividerPaint)
            canv.drawText("GymMaster Pro Smart Coach Plan  |  Developed by Arnav Bairagi", 40f, 815f, footerPaint)
            canv.drawText("© Arnav Bairagi. All Rights Reserved.", 40f, 828f, footerPaint)
            canv.drawText("Page $pNum", 520f, 815f, footerPaint)
        }

        // Setup first page header & footer
        drawPage1Header()
        drawPageFooter(canvas, pageNum)

        // Helper function to manage auto page breaks
        fun checkAndAddPage(lineCountNeeded: Int, currentPaint: Paint): Canvas {
            val requiredHeight = lineCountNeeded * (currentPaint.textSize + 5f)
            if (currentY + requiredHeight > 780f) {
                pdfDocument.finishPage(page)
                pageNum++
                pageInfo = PdfDocument.PageInfo.Builder(595, 842, pageNum).create()
                page = pdfDocument.startPage(pageInfo)
                canvas = page.canvas
                drawPageFooter(canvas, pageNum)
                currentY = 55f
            }
            return canvas
        }

        // Custom wrap text function that handles breaks
        fun drawSectionBlock(title: String, content: String) {
            if (content.isBlank()) return

            // Ensure spacing for title
            canvas = checkAndAddPage(2, boldPaint)
            canvas.drawText(title.uppercase(), 40f, currentY, boldPaint)
            currentY += 14f

            val words = content.split(" ")
            var currentLine = StringBuilder()
            val availableWidth = 515f // 555 - 40
            val rowHeight = textPaint.textSize + 5f

            for (word in words) {
                val testLine = if (currentLine.isEmpty()) word else "${currentLine} $word"
                val textWidth = textPaint.measureText(testLine)
                if (textWidth > availableWidth) {
                    canvas = checkAndAddPage(1, textPaint)
                    canvas.drawText(currentLine.toString(), 45f, currentY, textPaint)
                    currentY += rowHeight
                    currentLine = StringBuilder(word)
                } else {
                    currentLine.append(if (currentLine.isEmpty()) "" else " ").append(word)
                }
            }

            if (currentLine.isNotEmpty()) {
                canvas = checkAndAddPage(1, textPaint)
                canvas.drawText(currentLine.toString(), 45f, currentY, textPaint)
                currentY += rowHeight
            }
            
            currentY += 10f // Block margin bottom
        }

        // --- WORKOUT PLAN SECTION ---
        canvas = checkAndAddPage(3, sectionTitlePaint)
        // Main category background bar
        val categoryPaint = Paint().apply { color = Color.parseColor("#EEF2F6") }
        canvas.drawRect(40f, currentY - 14f, 555f, currentY + 12f, categoryPaint)
        canvas.drawText("1. HIGH-PERFORMANCE WORKOUT PLAN", 50f, currentY + 4f, sectionTitlePaint)
        currentY += 28f

        drawSectionBlock("Warm-up Routine", plan.warmup)
        drawSectionBlock("Strength Training Work", plan.strengthTraining)
        drawSectionBlock("Cardiovascular Conditioning", plan.cardio)
        drawSectionBlock("Core Stability & Power", plan.core)
        drawSectionBlock("Cool Down Routine", plan.cooldown)
        drawSectionBlock("Stretching Schedule", plan.stretching)
        drawSectionBlock("Recovery Tips & Tactics", plan.recoveryTips)
        drawSectionBlock("Workout General Coaching Notes", plan.workoutNotes)

        // --- NUTRITION PLAN SECTION ---
        canvas = checkAndAddPage(4, sectionTitlePaint)
        canvas.drawRect(40f, currentY - 14f, 555f, currentY + 12f, categoryPaint)
        canvas.drawText("2. ATHLETIC NUTRITION & MACROS", 50f, currentY + 4f, sectionTitlePaint)
        currentY += 28f

        // Macro Summary Grid
        canvas = checkAndAddPage(4, boldPaint)
        val macroBgPaint = Paint().apply { color = Color.parseColor("#ECFDF5") }
        canvas.drawRoundRect(RectF(40f, currentY, 555f, currentY + 40f), 6f, 6f, macroBgPaint)
        
        val macroTextBold = Paint(boldPaint).apply { color = Color.parseColor("#065F46"); textSize = 9f }
        val macroTextNormal = Paint(textPaint).apply { color = Color.parseColor("#047857"); textSize = 11f; isFakeBoldText = true }

        canvas.drawText("CALORIES", 60f, currentY + 15f, macroTextBold)
        canvas.drawText("${plan.calories} kcal", 60f, currentY + 32f, macroTextNormal)

        canvas.drawText("PROTEIN", 185f, currentY + 15f, macroTextBold)
        canvas.drawText("${plan.protein} g", 185f, currentY + 32f, macroTextNormal)

        canvas.drawText("CARBOHYDRATES", 310f, currentY + 15f, macroTextBold)
        canvas.drawText("${plan.carbs} g", 310f, currentY + 32f, macroTextNormal)

        canvas.drawText("FAT", 455f, currentY + 15f, macroTextBold)
        canvas.drawText("${plan.fat} g", 455f, currentY + 32f, macroTextNormal)

        currentY += 55f

        drawSectionBlock("Breakfast Meal", plan.breakfast)
        drawSectionBlock("Morning Snack", plan.morningSnack)
        drawSectionBlock("Lunch Meal", plan.lunch)
        drawSectionBlock("Pre-Workout Fuel", plan.preWorkout)
        drawSectionBlock("Post-Workout Recovery Fuel", plan.postWorkout)
        drawSectionBlock("Dinner Meal", plan.dinner)
        drawSectionBlock("Hydration & Fluids", plan.hydration)
        drawSectionBlock("Supplements Guide", plan.supplements)
        drawSectionBlock("Nutrition & Macro Cycling Notes", plan.nutritionNotes)

        pdfDocument.finishPage(page)

        val cacheFile = File(context.cacheDir, "GymMasterPro_Plan_${member.name.replace("\\s+".toRegex(), "_")}.pdf")
        FileOutputStream(cacheFile).use { out ->
            pdfDocument.writeTo(out)
        }
        pdfDocument.close()

        return cacheFile
    }

    /**
     * Downloads the professional PDF into the user's local Downloads folder.
     */
    fun downloadPlanPdfToDownloads(context: Context, member: Member, plan: PremiumAiPlan, trainerName: String?): String? {
        try {
            val pdfFile = generatePlanPdfFile(context, member, plan, trainerName)
            val resolver = context.contentResolver
            val displayName = "GymMasterPro_Plan_${member.name.replace("\\s+".toRegex(), "_")}.pdf"
            
            val contentValues = android.content.ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, displayName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                }
            }

            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                resolver.openOutputStream(uri)?.use { output ->
                    FileInputStream(pdfFile).use { input ->
                        input.copyTo(output)
                    }
                }
                return "Successfully downloaded to Downloads folder!"
            } else {
                // Fallback for older SDK
                val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
                val destination = File(downloadsDir, displayName)
                FileOutputStream(destination).use { output ->
                    FileInputStream(pdfFile).use { input ->
                        input.copyTo(output)
                    }
                }
                return "Saved to Downloads: ${destination.absolutePath}"
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    /**
     * Uses Android's Printing Framework to print the generated PDF document.
     */
    fun printPlanPdf(context: Context, member: Member, plan: PremiumAiPlan, trainerName: String?) {
        try {
            val pdfFile = generatePlanPdfFile(context, member, plan, trainerName)
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
            val jobName = "GymMaster Pro Plan - ${member.name}"
            
            printManager.print(jobName, object : PrintDocumentAdapter() {
                override fun onLayout(
                    oldAttributes: PrintAttributes?,
                    newAttributes: PrintAttributes?,
                    cancellationSignal: CancellationSignal?,
                    callback: LayoutResultCallback?,
                    extras: Bundle?
                ) {
                    if (cancellationSignal?.isCanceled == true) {
                        callback?.onLayoutCancelled()
                        return
                    }
                    val info = PrintDocumentInfo.Builder("plan.pdf")
                        .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                        .build()
                    callback?.onLayoutFinished(info, true)
                }

                override fun onWrite(
                    pages: Array<out PageRange>?,
                    destination: ParcelFileDescriptor?,
                    cancellationSignal: CancellationSignal?,
                    callback: WriteResultCallback?
                ) {
                    try {
                        FileInputStream(pdfFile).use { input ->
                            FileOutputStream(destination?.fileDescriptor).use { output ->
                                input.copyTo(output)
                            }
                        }
                        callback?.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
                    } catch (e: Exception) {
                        callback?.onWriteFailed(e.toString())
                    }
                }
            }, null)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Shares the plan as Text, Email, WhatsApp, or raw PDF document.
     */
    fun sharePlan(
        context: Context,
        member: Member,
        plan: PremiumAiPlan,
        trainerName: String?,
        method: String // "pdf", "text", "whatsapp", "email"
    ) {
        val emailSubject = "GymMaster Pro Personalized Athletic Regimen for ${member.name}"
        val textBody = """
            🏋️‍♂️ GYMMASTER PRO ATHLETIC REGIMEN 🏋️‍♂️
            ====================================
            Member Name: ${member.name}
            Age/Gender: ${member.age} yrs / ${member.gender}
            BMI: ${member.bmi} (${member.bmiCategory})
            Fitness Goal: ${plan.goal}
            Macronutrient Targets:
            - Calories: ${plan.calories} kcal
            - Protein: ${plan.protein} g
            - Carbohydrates: ${plan.carbs} g
            - Fat: ${plan.fat} g
            
            Formulated Date: ${plan.generatedDate}
            Coach/Trainer: ${trainerName ?: "Elite Team"}
            
            💪 WORKOUT HIGHLIGHTS:
            - Warm-up: ${plan.warmup.take(150)}...
            - Strength: ${plan.strengthTraining.take(150)}...
            - Cardio: ${plan.cardio.take(150)}...
            
            🥗 DIET HIGHLIGHTS:
            - Breakfast: ${plan.breakfast.take(100)}...
            - Lunch: ${plan.lunch.take(100)}...
            - Dinner: ${plan.dinner.take(100)}...
            
            ====================================
            Developed by Arnav Bairagi
            © Arnav Bairagi. All Rights Reserved.
        """.trimIndent()

        when (method.lowercase()) {
            "text" -> {
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, textBody)
                }
                context.startActivity(Intent.createChooser(intent, "Share Plan Summary via"))
            }
            "email" -> {
                val intent = Intent(Intent.ACTION_SENDTO).apply {
                    data = Uri.parse("mailto:")
                    putExtra(Intent.EXTRA_SUBJECT, emailSubject)
                    putExtra(Intent.EXTRA_TEXT, textBody)
                }
                context.startActivity(Intent.createChooser(intent, "Send Plan Email"))
            }
            "whatsapp" -> {
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, textBody)
                    `package` = "com.whatsapp"
                }
                try {
                    context.startActivity(intent)
                } catch (e: Exception) {
                    // WhatsApp not installed, fallback to chooser
                    context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, textBody)
                    }, "Share via"))
                }
            }
            "pdf" -> {
                try {
                    val pdfFile = generatePlanPdfFile(context, member, plan, trainerName)
                    val contentUri = FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.fileprovider",
                        pdfFile
                    )
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "application/pdf"
                        putExtra(Intent.EXTRA_SUBJECT, emailSubject)
                        putExtra(Intent.EXTRA_TEXT, "Here is your professional GymMaster Pro athletic regimen PDF document.")
                        putExtra(Intent.EXTRA_STREAM, contentUri)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                    context.startActivity(Intent.createChooser(intent, "Share PDF Document"))
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }
}
