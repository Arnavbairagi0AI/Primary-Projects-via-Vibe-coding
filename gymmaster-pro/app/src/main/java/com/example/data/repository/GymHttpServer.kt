package com.example.data.repository

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import java.net.NetworkInterface
import java.net.URLDecoder
import java.util.Collections
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class GymHttpServer(
    private val repository: GymRepository,
    private val onAttendanceLogged: (String) -> Unit
) {
    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private val scope = CoroutineScope(Dispatchers.IO)

    fun start() {
        if (isRunning) return
        isRunning = true
        scope.launch {
            try {
                serverSocket = ServerSocket(8080)
                onAttendanceLogged("Reception local QR server started on http://${getLocalIpAddress()}:8080/checkin")
                
                while (isRunning) {
                    val socket = serverSocket?.accept() ?: break
                    scope.launch {
                        handleClient(socket)
                    }
                }
            } catch (e: Throwable) {
                if (isRunning) {
                    e.printStackTrace()
                    onAttendanceLogged("Server error: ${e.localizedMessage}")
                }
            }
        }
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (e: Throwable) {
            e.printStackTrace()
        }
        serverSocket = null
    }

    fun getLocalIpAddress(): String {
        try {
            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (intf in interfaces) {
                val addrs = Collections.list(intf.inetAddresses)
                for (addr in addrs) {
                    if (!addr.isLoopbackAddress) {
                        val sAddr = addr.hostAddress ?: continue
                        val isIPv4 = sAddr.indexOf(':') < 0
                        if (isIPv4) {
                            return sAddr
                        }
                    }
                }
            }
        } catch (ex: Exception) {
            ex.printStackTrace()
        }
        return "127.0.0.1"
    }

    private suspend fun handleClient(socket: Socket) {
        try {
            val reader = BufferedReader(InputStreamReader(socket.getInputStream(), "UTF-8"))
            val firstLine = reader.readLine() ?: return
            
            val parts = firstLine.split(" ")
            if (parts.size < 2) {
                sendResponse(socket, 400, "Bad Request", "text/plain", "Bad Request")
                return
            }

            val method = parts[0]
            val fullPath = parts[1]

            if (method != "GET") {
                sendResponse(socket, 405, "Method Not Allowed", "text/plain", "Method not allowed")
                return
            }

            val questionIndex = fullPath.indexOf('?')
            val path = if (questionIndex != -1) fullPath.substring(0, questionIndex) else fullPath
            val queryString = if (questionIndex != -1) fullPath.substring(questionIndex + 1) else ""

            if (path == "/api/prepare-reminder") {
                val params = parseQuery(queryString)
                val memberId = params["memberId"] ?: ""
                val type = params["type"] ?: "membership_expiring"
                
                val member = repository.getMemberByIdDirect(memberId)
                if (member == null) {
                    val jsonError = "{\"error\": \"Member not found\"}"
                    sendResponse(socket, 404, "Not Found", "application/json", jsonError)
                    return
                }
                
                val settings = repository.getSettingsDirect()
                val gymName = settings?.gymName ?: "GymMasters Pro"
                val currency = settings?.currency ?: "₹"
                
                // Get pending amount due
                val payments = repository.getPaymentsForMemberDirect(memberId)
                val pendingAmount = payments.filter { it.status.equals("Pending", ignoreCase = true) }.sumOf { it.amount }
                val amountDueStr = "$currency$pendingAmount"
                
                val memberName = member.name
                val expiryDate = member.expiryDate
                
                val sb = StringBuilder()
                when (type) {
                    "membership_expiring" -> {
                        sb.append("🏋️ *${gymName}* 🏋️\n\n")
                        sb.append("Hello *${memberName}*,\n\n")
                        sb.append("This is a friendly reminder that your gym membership is expiring on *${expiryDate}*. ")
                        sb.append("We would love to continue training with you! Please renew at your earliest convenience to maintain uninterrupted access. Stay strong! 💪")
                    }
                    "fees_pending" -> {
                        sb.append("⚠️ *${gymName} - Payment Reminder* ⚠️\n\n")
                        sb.append("Hello *${memberName}*,\n\n")
                        sb.append("This is a friendly reminder that your membership fee of *${amountDueStr}* is currently *PENDING*. \n\n")
                        sb.append("Please clear your dues at the reception desk or online as soon as possible. Thank you for your cooperation! 🙏💪")
                    }
                    "payment_received" -> {
                        sb.append("✅ *${gymName} - Payment Received* ✅\n\n")
                        sb.append("Dear *${memberName}*,\n\n")
                        sb.append("We have successfully received your membership fee payment.\n\n")
                        sb.append("Thank you for choosing ${gymName}! Get ready to crush your goals! 🏋️🔥")
                    }
                    "membership_activated" -> {
                        sb.append("🎉 *Welcome to ${gymName}!* 🎉\n\n")
                        sb.append("Hello *${memberName}*,\n\n")
                        sb.append("Your membership plan has been successfully *ACTIVATED*! \n\n")
                        sb.append("We are super excited to help you achieve your fitness goals. Welcome to the family! 🏆🔥")
                    }
                    "membership_renewed" -> {
                        sb.append("⚡ *${gymName} - Membership Renewed!* ⚡\n\n")
                        sb.append("Hello *${memberName}*,\n\n")
                        sb.append("Your membership has been successfully *RENEWED*! \n\n")
                        sb.append("Thank you for your continued dedication to your health and fitness journey. Keep up the amazing work! 🏋️🦁")
                    }
                    "birthday_wishes" -> {
                        sb.append("🎂🎉 *Happy Birthday, ${memberName}!* 🎉🎂\n\n")
                        sb.append("From all of us at *${gymName}*, we wish you a fantastic birthday filled with happiness, health, and endless gains! 🥳🎈\n\n")
                        sb.append("Thank you for being an inspiring member of our gym community. Celebrate hard, stay active, and crush your goals this year! 🎁🦾")
                    }
                    else -> {
                        sb.append("Hope you are having a wonderful day and a great workout session at *${gymName}*! 🔥\n\n")
                        sb.append("Keep pushing your limits! 🏋️")
                    }
                }
                
                // Automatically include the 4 requested fields at the bottom
                sb.append("\n\n---\n")
                sb.append("📋 *Member Status Card*\n")
                sb.append("• Gym: *${gymName}*\n")
                sb.append("• Member: *${memberName}*\n")
                sb.append("• Expiry: *${expiryDate}*\n")
                sb.append("• Dues Outstanding: *${amountDueStr}*")
                
                val preparedMessage = sb.toString()
                
                // Return JSON
                val escapedMsg = preparedMessage.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t")
                    
                val jsonResponse = "{\n" +
                        "  \"memberId\": \"$memberId\",\n" +
                        "  \"phone\": \"${member.phone}\",\n" +
                        "  \"type\": \"$type\",\n" +
                        "  \"message\": \"$escapedMsg\"\n" +
                        "}"
                
                sendResponse(socket, 200, "OK", "application/json; charset=UTF-8", jsonResponse)
                return
            } else if (path.startsWith("/member/")) {
                val suffix = path.removePrefix("/member/")
                val memberId = if (suffix.startsWith("QR")) suffix.removePrefix("QR") else suffix
                val member = repository.getMemberByIdDirect(memberId)
                if (member != null) {
                    val settings = repository.getSettingsDirect()
                    val gymName = settings?.gymName ?: "GymMasters Pro"
                    val html = getPublicMemberPageHtml(member, gymName)
                    sendResponse(socket, 200, "OK", "text/html; charset=UTF-8", html)
                } else {
                    val html = getHtmlTemplate(
                        status = "NOT FOUND",
                        statusClass = "error",
                        memberName = "Member Not Found",
                        message = "The public digital pass contains an invalid Member ID: $memberId",
                        memberId = memberId,
                        timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
                        plan = "None"
                    )
                    sendResponse(socket, 404, "Not Found", "text/html; charset=UTF-8", html)
                }
            } else if (path == "/checkin" || path == "/") {
                val params = parseQuery(queryString)
                val memberId = params["memberId"] ?: params["id"]
                val trainerId = params["trainerId"]

                if (trainerId != null) {
                    val trainer = repository.getTrainerByIdDirect(trainerId)
                    if (trainer != null) {
                        val result = repository.markTrainerAttendance(trainerId)
                        onAttendanceLogged(result)

                        val isCheckOut = result.contains("Checked Out", ignoreCase = true)
                        val status = if (isCheckOut) "CHECK-OUT SUCCESS" else "CHECK-IN SUCCESS"
                        val statusClass = if (isCheckOut) "out" else ""
                        val message = result
                        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())

                        val html = getHtmlTemplate(
                            status = status,
                            statusClass = statusClass,
                            memberName = trainer.name,
                            message = message,
                            memberId = trainerId,
                            timestamp = timestamp,
                            plan = "Staff (Trainer)"
                        )
                        sendResponse(socket, 200, "OK", "text/html; charset=UTF-8", html)
                    } else {
                        val html = getHtmlTemplate(
                            status = "TRAINER NOT FOUND",
                            statusClass = "error",
                            memberName = "Unknown Trainer ID",
                            message = "The scanned QR code trainer ID ($trainerId) is valid, but doesn't match any registered Trainer staff in GymMasters Pro database.",
                            memberId = trainerId,
                            timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
                            plan = "None"
                        )
                        sendResponse(socket, 404, "Not Found", "text/html; charset=UTF-8", html)
                    }
                } else if (memberId != null) {
                    val member = repository.getMemberByIdDirect(memberId)
                    if (member != null) {
                        val result = repository.markAttendance(memberId)
                        onAttendanceLogged(result)

                        val isCheckOut = result.contains("Checked out", ignoreCase = true)
                        val isAlreadyCompleted = result.contains("already checked", ignoreCase = true)

                        val status = if (isCheckOut) "CHECK-OUT SUCCESS" else if (isAlreadyCompleted) "ALREADY COMPLETED" else "CHECK-IN SUCCESS"
                        val statusClass = if (isCheckOut) "out" else if (isAlreadyCompleted) "error" else ""
                        val message = result
                        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())

                        val html = getHtmlTemplate(
                            status = status,
                            statusClass = statusClass,
                            memberName = member.name,
                            message = message,
                            memberId = memberId,
                            timestamp = timestamp,
                            plan = member.membershipPlan
                        )

                        sendResponse(socket, 200, "OK", "text/html; charset=UTF-8", html)
                    } else {
                        // Check if it's a trainer ID!
                        val trainer = repository.getTrainerByIdDirect(memberId)
                        if (trainer != null) {
                            val result = repository.markTrainerAttendance(memberId)
                            onAttendanceLogged(result)

                            val isCheckOut = result.contains("Checked Out", ignoreCase = true)
                            val status = if (isCheckOut) "CHECK-OUT SUCCESS" else "CHECK-IN SUCCESS"
                            val statusClass = if (isCheckOut) "out" else ""
                            val message = result
                            val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())

                            val html = getHtmlTemplate(
                                status = status,
                                statusClass = statusClass,
                                memberName = trainer.name,
                                message = message,
                                memberId = memberId,
                                timestamp = timestamp,
                                plan = "Staff (Trainer)"
                            )
                            sendResponse(socket, 200, "OK", "text/html; charset=UTF-8", html)
                        } else {
                            val html = getHtmlTemplate(
                                status = "NOT FOUND",
                                statusClass = "error",
                                memberName = "Unknown Card / ID",
                                message = "The scanned QR code text ($memberId) is valid, but doesn't match any registered member ID or Trainer staff in GymMasters Pro database.",
                                memberId = memberId,
                                timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
                                plan = "None"
                            )
                            sendResponse(socket, 404, "Not Found", "text/html; charset=UTF-8", html)
                        }
                    }
                } else {
                    val html = getLandingPageHtml()
                    sendResponse(socket, 200, "OK", "text/html; charset=UTF-8", html)
                }
            } else {
                sendResponse(socket, 404, "Not Found", "text/plain", "404 Not Found")
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            try {
                socket.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun parseQuery(query: String): Map<String, String> {
        val params = mutableMapOf<String, String>()
        if (query.isEmpty()) return params
        val pairs = query.split("&")
        for (pair in pairs) {
            val idx = pair.indexOf("=")
            if (idx > 0) {
                try {
                    val key = URLDecoder.decode(pair.substring(0, idx), "UTF-8")
                    val value = URLDecoder.decode(pair.substring(idx + 1), "UTF-8")
                    params[key] = value
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        return params
    }

    private fun sendResponse(socket: Socket, statusCode: Int, statusText: String, contentType: String, content: String) {
        try {
            val output: OutputStream = socket.getOutputStream()
            val bytes = content.toByteArray(Charsets.UTF_8)
            val header = "HTTP/1.1 $statusCode $statusText\r\n" +
                    "Content-Type: $contentType\r\n" +
                    "Content-Length: ${bytes.size}\r\n" +
                    "Connection: close\r\n" +
                    "\r\n"
            output.write(header.toByteArray(Charsets.UTF_8))
            output.write(bytes)
            output.flush()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun getHtmlTemplate(
        status: String,
        statusClass: String,
        memberName: String,
        message: String,
        memberId: String,
        timestamp: String,
        plan: String
    ): String {
        val badgeColor = when (statusClass) {
            "out" -> "#f97316"
            "error" -> "#ef4444"
            else -> "#10b981"
        }
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
            <meta name="theme-color" content="#0f172a">
            <meta name="apple-mobile-web-app-capable" content="yes">
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
            <title>GymMasters Pro - Digital Access</title>
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                    line-height: 1.5;
                }
                .card {
                    background: #1e293b;
                    border-radius: 20px;
                    padding: 24px;
                    width: 100%;
                    max-width: 420px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
                    border: 1px solid #334155;
                    transition: transform 0.3s ease;
                }
                @media (min-width: 480px) {
                    .card {
                        padding: 32px;
                    }
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: $badgeColor;
                    color: #ffffff;
                    font-weight: 700;
                    padding: 8px 18px;
                    border-radius: 9999px;
                    font-size: 12px;
                    letter-spacing: 0.05em;
                    margin-bottom: 24px;
                    text-transform: uppercase;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    font-size: 24px;
                    margin-bottom: 12px;
                    font-weight: 800;
                    color: #f1f5f9;
                    letter-spacing: -0.025em;
                }
                p {
                    color: #94a3b8;
                    font-size: 14px;
                    margin-bottom: 28px;
                    font-weight: 400;
                }
                .meta {
                    border-top: 1px solid #334155;
                    padding-top: 20px;
                    text-align: left;
                }
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
                    font-size: 13px;
                }
                .meta-row:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .meta-label {
                    color: #64748b;
                    font-weight: 500;
                }
                .meta-value {
                    font-weight: 600;
                    color: #e2e8f0;
                }
                .logo {
                    font-size: 36px;
                    margin-bottom: 16px;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="logo">⚡🏆</div>
                <div>
                    <div class="badge">$status</div>
                </div>
                <h1>$memberName</h1>
                <p>$message</p>
                
                <div class="meta">
                    <div class="meta-row">
                        <div class="meta-label">Member ID</div>
                        <div class="meta-value">$memberId</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Scanned On</div>
                        <div class="meta-value">$timestamp</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Membership Plan</div>
                        <div class="meta-value">$plan</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Gym Status</div>
                        <div class="meta-value" style="color: #10b981;">Active / Open</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """.trimIndent()
    }

    private fun getLandingPageHtml(): String {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
            <meta name="theme-color" content="#0f172a">
            <meta name="apple-mobile-web-app-capable" content="yes">
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
            <title>GymMasters Pro Reception</title>
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                }
                .card {
                    background: #1e293b;
                    border-radius: 20px;
                    padding: 24px;
                    width: 100%;
                    max-width: 420px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
                    border: 1px solid #334155;
                }
                @media (min-width: 480px) {
                    .card {
                        padding: 32px;
                    }
                }
                h1 {
                    font-size: 24px;
                    margin-bottom: 12px;
                    font-weight: 800;
                    color: #f1f5f9;
                    letter-spacing: -0.025em;
                }
                p {
                    color: #94a3b8;
                    font-size: 14px;
                    margin-bottom: 24px;
                }
                input {
                    width: 100%;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 10px;
                    color: #f8fafc;
                    padding: 12px 16px;
                    font-size: 15px;
                    height: 48px;
                    margin-bottom: 16px;
                    text-align: center;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                }
                button {
                    width: 100%;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    height: 48px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s, transform 0.1s;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                button:active {
                    transform: scale(0.98);
                }
                button:hover {
                    background: #4f46e5;
                }
                .logo {
                    font-size: 36px;
                    margin-bottom: 16px;
                }
                .divider {
                    margin: 24px 0;
                    border-top: 1px solid #334155;
                    position: relative;
                }
                .divider span {
                    background: #1e293b;
                    padding: 0 12px;
                    color: #64748b;
                    font-size: 11px;
                    position: absolute;
                    top: -9px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                #reader {
                    width: 100%;
                    margin-top: 16px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 2px solid #10b981;
                }
                #reader video {
                    border-radius: 12px;
                }
            </style>
            <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
        </head>
        <body>
            <div class="card">
                <div class="logo">⚡🏆</div>
                <h1>GymMasters Pro Access</h1>
                <p>Scan your digital pass using your device camera, or enter your ID below manually.</p>
                
                <!-- HTML5 Web Camera QR Scanner -->
                <button id="scanner-btn" onclick="toggleScanner()" style="background: #10B981; margin-bottom: 16px;">
                    📸 START CAMERA SCANNER
                </button>
                <div id="reader" style="display: none;"></div>

                <div class="divider"><span>OR ENTER MANUALLY</span></div>

                <form action="/checkin" method="get">
                    <input type="text" name="memberId" placeholder="ENTER ID" required autocomplete="off">
                    <button type="submit">Log Attendance</button>
                </form>
            </div>

            <script>
                let html5QrcodeScanner = null;

                function toggleScanner() {
                    const btn = document.getElementById('scanner-btn');
                    const readerDiv = document.getElementById('reader');
                    
                    if (html5QrcodeScanner === null) {
                        btn.textContent = "🛑 STOP SCANNER";
                        btn.style.background = "#EF4444";
                        readerDiv.style.display = "block";
                        
                        html5QrcodeScanner = new Html5Qrcode("reader");
                        html5QrcodeScanner.start(
                            { facingMode: "environment" },
                            {
                                fps: 15,
                                qrbox: function(width, height) {
                                    const size = Math.min(width, height) * 0.7;
                                    return { width: size, height: size };
                                }
                            },
                            onScanSuccess,
                            onScanFailure
                        ).catch(err => {
                            alert("Camera access failed: " + err);
                            stopScanning();
                        });
                    } else {
                        stopScanning();
                    }
                }

                function stopScanning() {
                    const btn = document.getElementById('scanner-btn');
                    const readerDiv = document.getElementById('reader');
                    if (html5QrcodeScanner) {
                        html5QrcodeScanner.stop().then(() => {
                            html5QrcodeScanner = null;
                            btn.textContent = "📸 START CAMERA SCANNER";
                            btn.style.background = "#10B981";
                            readerDiv.style.display = "none";
                        }).catch(err => {
                            console.error("Failed to stop scanner", err);
                        });
                    }
                }

                function onScanSuccess(decodedText) {
                    stopScanning();
                    // If the decoded text is already a check-in URL, redirect directly to it
                    if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
                        window.location.href = decodedText;
                    } else {
                        window.location.href = "/checkin?id=" + encodeURIComponent(decodedText);
                    }
                }

                function onScanFailure(error) {
                    // Fail silently during live scan
                }
            </script>
        </body>
        </html>
        """.trimIndent()
    }

    private fun getPublicMemberPageHtml(member: com.example.data.model.Member, gymName: String): String {
        val statusClass = member.status.lowercase()
        val badgeColor = when (statusClass) {
            "active" -> "#10b981"
            "expired" -> "#ef4444"
            else -> "#f59e0b"
        }
        
        // Encode member ID for QR image
        val encodedMemberId = java.net.URLEncoder.encode(member.memberId, "UTF-8")
        val qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=$encodedMemberId"

        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
            <meta name="theme-color" content="#0f172a">
            <meta name="apple-mobile-web-app-capable" content="yes">
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
            <title>$gymName - Digital Member Pass</title>
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                    line-height: 1.5;
                }
                .card {
                    background: #1e293b;
                    border-radius: 20px;
                    padding: 24px;
                    width: 100%;
                    max-width: 420px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
                    border: 1px solid #334155;
                    transition: transform 0.3s ease;
                }
                @media (min-width: 480px) {
                    .card {
                        padding: 32px;
                    }
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: $badgeColor;
                    color: #ffffff;
                    font-weight: 700;
                    padding: 6px 16px;
                    border-radius: 9999px;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                }
                .readonly-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(99, 102, 241, 0.12);
                    color: #818cf8;
                    border: 1px solid rgba(99, 102, 241, 0.25);
                    font-weight: 700;
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                }
                h1 {
                    font-size: 24px;
                    margin-bottom: 4px;
                    font-weight: 800;
                    color: #f1f5f9;
                    letter-spacing: -0.025em;
                }
                .gym-name {
                    color: #38bdf8;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    margin-bottom: 16px;
                }
                .qr-container {
                    background: white;
                    padding: 16px;
                    border-radius: 16px;
                    display: inline-block;
                    margin: 20px 0;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
                }
                .qr-image {
                    display: block;
                    width: 180px;
                    height: 180px;
                }
                @media (min-width: 400px) {
                    .qr-image {
                        width: 200px;
                        height: 200px;
                    }
                }
                .meta {
                    border-top: 1px solid #334155;
                    padding-top: 16px;
                    text-align: left;
                    margin-top: 16px;
                }
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
                    font-size: 13px;
                }
                .meta-row:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .meta-label {
                    color: #64748b;
                    font-weight: 500;
                }
                .meta-value {
                    font-weight: 600;
                    color: #e2e8f0;
                }
                .logo {
                    font-size: 36px;
                    margin-bottom: 8px;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="logo">⚡🏆</div>
                <div>
                    <div class="readonly-badge">🔒 READ-ONLY PASSPORT</div>
                </div>
                <div class="gym-name">$gymName</div>
                <h1>${member.name}</h1>
                <div>
                    <div class="badge">${member.status.uppercase()}</div>
                </div>
                
                <div>
                    <div class="qr-container">
                        <img class="qr-image" src="$qrImageUrl" alt="QR Code" />
                    </div>
                </div>
                
                <div class="meta">
                    <div class="meta-row">
                        <div class="meta-label">Member ID</div>
                        <div class="meta-value">${member.memberId}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Membership Plan</div>
                        <div class="meta-value">${member.membershipPlan}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Expiry Date</div>
                        <div class="meta-value" style="color: ${if (statusClass == "active") "#10b981" else "#ef4444"};">${member.expiryDate}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """.trimIndent()
    }
}
