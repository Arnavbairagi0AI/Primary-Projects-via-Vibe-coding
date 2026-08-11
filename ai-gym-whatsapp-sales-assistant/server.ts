import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit
} from "firebase/firestore";

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyDsnaKTgjbdejv66kie2I4SkC_BsYIyLvQ",
  authDomain: "acoustic-gist-zjkjx.firebaseapp.com",
  projectId: "acoustic-gist-zjkjx",
  storageBucket: "acoustic-gist-zjkjx.firebasestorage.app",
  messagingSenderId: "696072134698",
  appId: "1:696072134698:web:fcfd09dcb791914f896353"
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, "ai-studio-06a208ef-e970-4ac9-8976-839a373fa170");

// Gemini client lazy initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Write helper log function
async function logIntegration(type: string, status: "success" | "error" | "info", title: string, details: string) {
  try {
    const logsRef = collection(db, "logs");
    await addDoc(logsRef, {
      type,
      status,
      title,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error writing integration log:", err);
  }
}

// Calculate lead score based on filled fields
function calculateLeadScore(lead: any): number {
  let score = 0;
  if (lead.name) score += 10;
  if (lead.age) score += 10;
  if (lead.gender) score += 10;
  if (lead.city) score += 10;
  if (lead.occupation) score += 10;
  if (lead.goal) score += 10;
  if (lead.experienceLevel) score += 10;
  if (lead.preferredTime) score += 10;
  if (lead.medicalConditions) score += 10;
  if (lead.membershipInterest) score += 10;
  
  if (lead.trialStatus === "booked" || lead.trialStatus === "visited") {
    score += 20; // Bonus for trial booked
  }
  return Math.min(score, 100);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // GET Integrations Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const logsRef = collection(db, "logs");
      const q = query(logsRef, orderBy("timestamp", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json(logs);
    } catch (error) {
      console.error("Error getting logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // POST Reset DB with seed data
  app.post("/api/reset-data", async (req, res) => {
    try {
      await logIntegration("system", "info", "Database Initialized", "Gym CRM backend booted and waiting for WhatsApp webhooks.");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset data" });
    }
  });

  // POST Chat interaction
  app.post("/api/chat", async (req, res) => {
    const { leadId, message } = req.body;
    if (!leadId || !message) {
      return res.status(400).json({ error: "Missing leadId or message" });
    }

    try {
      const leadDocRef = doc(db, "leads", leadId);
      const leadSnap = await getDoc(leadDocRef);
      let leadData: any = {};
      const nowIso = new Date().toISOString();

      if (leadSnap.exists()) {
        leadData = leadSnap.data();
      } else {
        leadData = {
          id: leadId,
          name: "",
          phone: leadId,
          age: "",
          gender: "",
          city: "",
          occupation: "",
          goal: "",
          experienceLevel: "",
          preferredTime: "",
          medicalConditions: "",
          membershipInterest: "",
          trialStatus: "none",
          leadScore: 10,
          notes: "New enquiry via WhatsApp.",
          status: "active",
          createdAt: nowIso,
          lastInteractionAt: nowIso
        };
        await setDoc(leadDocRef, leadData);
        await logIntegration("whatsapp", "success", "New Lead Registered", `New conversation started with phone: ${leadId}`);
        await logIntegration("sheets", "success", "Google Sheets Sync", `Added new lead draft for ${leadId} to sheet.`);
      }

      const messagesCollRef = collection(db, "leads", leadId, "messages");
      await addDoc(messagesCollRef, {
        sender: "customer",
        text: message,
        timestamp: nowIso
      });

      const q = query(messagesCollRef, orderBy("timestamp", "asc"), limit(30));
      const historySnap = await getDocs(q);
      const historyList = historySnap.docs.map(d => d.data());

      const systemInstruction = `You are FitBot, the energetic, motivating AI WhatsApp Sales Assistant for "Apex Elite Fitness" (a premium fitness gym).
Your job is to convert WhatsApp enquiries into free trial bookings and memberships.

RULES:
1. Be extremely energetic, positive, motivating, and professional.
2. Keep replies short (strictly under 80 words).
3. Ask only ONE question at a time. Never dump multiple questions.
4. Never pressure the customer. Make them feel welcome.
5. End most replies with a natural, engaging question to keep the conversation flowing.
6. Recommend suitable memberships once they express interest.
7. If they ask about something not in your knowledge base, or explicitly ask for a human, set shouldHumanTakeover to true.

KNOWLEDGE BASE:
- Gym Name: Apex Elite Fitness
- Trainers: Certified elite coaches (5+ years exp) specializing in Strength training, Fat Loss, Rehab, and Performance.
- Equipment: Top-of-the-line Hammer Strength machines, Life Fitness, and 4 Eleiko Olympic weightlifting platforms.
- Timings: Open 24/7! Staffed hours: 6 AM to 10 PM daily.
- Parking: Free, secure multi-level basement parking for all members.
- Diet Plans: Fully customized meal/nutrition plans drafted by our certified in-house sports nutritionists.
- Personal Training: Premium 1-on-1 packages, custom workouts, and weekly body composition scans.
- Supplements: In-house premium shake bar (smoothies, protein drinks) and nutrition store (whey, pre-workouts, vitamins).

PRICING CATALOGUE:
- Monthly Membership: $79/mo (Unlimited gym access, cardio, strength areas)
- Quarterly Membership: $199 (Save 15% - includes locker access & group classes)
- Half-Yearly Membership: $349 (Save 25% - includes 3 complimentary PT coaching sessions)
- Annual Membership: $599/yr (Best Value! Save 35% - includes unlimited PT consultations & access to private spa)
- Personal Training Add-on: $299/mo (1-on-1 premium coaching, private progress app, daily diet coach)
- Group Classes: $99/mo (Unlimited access to Yoga, HIIT, Zumba, Pilates, and Spinning)

APPOINTMENT SLOTS FOR TRIAL:
- Available slots: "07:00 AM - 09:00 AM", "10:00 AM - 12:00 PM", "04:00 PM - 06:00 PM", "07:00 PM - 09:00 PM"

COLLECTION TASK:
You must collect the following details incrementally, ONE question at a time:
- Name
- Age
- Gender
- City
- Occupation
- Fitness Goal (options: Weight Loss, Muscle Gain, Fat Loss, Strength Training, General Fitness, Bodybuilding, Cardio, Athletic Performance)
- Experience Level (Beginner, Intermediate, Advanced)
- Preferred Workout Time (Morning, Afternoon, Evening, Night)
- Medical conditions or injuries
- Membership interest (Monthly, Quarterly, Half-Yearly, Annual, Personal Training, Group Classes)

Once you have collected the essential info (especially Name and Goals), always offer a FREE trial session: "Would you like to book a FREE one-day trial session?"
If they agree, ask for their preferred Date (YYYY-MM-DD format) and show the available slots.
Once they choose a slot, book it and set trialStatus to "booked".

CURRENT LEAD STATE (What we already know about this person):
${JSON.stringify(leadData, null, 2)}

Analyze the user's latest message and the history. Overwrite and extract any newly provided data fields. Generate a warm, under-80-word reply, asking the next single missing item or guiding them to the trial slot selection. Output JSON.`;

      const ai = getGeminiClient();
      const chatPrompt = `History:\n${historyList.map(m => `${m.sender}: ${m.text}`).join("\n")}\n\nLatest Customer Message: ${message}`;

      const modelResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: chatPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reply: { type: "STRING", description: "The response message to send back to the customer on WhatsApp" },
              extractedData: {
                type: "OBJECT",
                description: "Extracted demographics or parameters from user statement",
                properties: {
                  name: { type: "STRING" },
                  age: { type: "STRING" },
                  gender: { type: "STRING" },
                  city: { type: "STRING" },
                  occupation: { type: "STRING" },
                  goal: { type: "STRING" },
                  experienceLevel: { type: "STRING" },
                  preferredTime: { type: "STRING" },
                  medicalConditions: { type: "STRING" },
                  membershipInterest: { type: "STRING" },
                  trialDate: { type: "STRING" },
                  trialSlot: { type: "STRING" },
                  trialStatus: { type: "STRING" }
                }
              },
              shouldHumanTakeover: { type: "BOOLEAN", description: "True if user requests a human, gets angry, or asks something unknown by the KB" }
            },
            required: ["reply", "extractedData", "shouldHumanTakeover"]
          }
        }
      });

      const parsedJson = JSON.parse(modelResponse.text || "{}");
      const replyText = parsedJson.reply || "A gym representative will assist you shortly!";
      const ext = parsedJson.extractedData || {};
      const takeover = !!parsedJson.shouldHumanTakeover;

      const updatedLead: any = { ...leadData };
      
      if (ext.name && ext.name !== "unknown") updatedLead.name = ext.name;
      if (ext.age && ext.age !== "unknown") updatedLead.age = ext.age;
      if (ext.gender && ext.gender !== "unknown") updatedLead.gender = ext.gender;
      if (ext.city && ext.city !== "unknown") updatedLead.city = ext.city;
      if (ext.occupation && ext.occupation !== "unknown") updatedLead.occupation = ext.occupation;
      if (ext.goal && ext.goal !== "unknown") updatedLead.goal = ext.goal;
      if (ext.experienceLevel && ext.experienceLevel !== "unknown") updatedLead.experienceLevel = ext.experienceLevel;
      if (ext.preferredTime && ext.preferredTime !== "unknown") updatedLead.preferredTime = ext.preferredTime;
      if (ext.medicalConditions && ext.medicalConditions !== "unknown") updatedLead.medicalConditions = ext.medicalConditions;
      if (ext.membershipInterest && ext.membershipInterest !== "unknown") updatedLead.membershipInterest = ext.membershipInterest;
      
      if (ext.trialStatus) {
        updatedLead.trialStatus = ext.trialStatus;
      } else if (replyText.toLowerCase().includes("free trial") || replyText.toLowerCase().includes("trial session")) {
        updatedLead.trialStatus = "offered";
      }

      if (ext.trialDate && ext.trialSlot) {
        updatedLead.trialStatus = "booked";
        
        const bookingId = `book_${Date.now()}`;
        await setDoc(doc(db, "bookings", bookingId), {
          id: bookingId,
          leadId: leadId,
          customerName: updatedLead.name || leadId,
          customerPhone: updatedLead.phone,
          date: ext.trialDate,
          timeSlot: ext.trialSlot,
          status: "scheduled",
          createdAt: nowIso
        });

        await logIntegration("calendar", "success", "Google Calendar Booking Created", `Scheduled trial session for ${updatedLead.name || leadId} on ${ext.trialDate} at ${ext.trialSlot}`);
        await logIntegration("email", "success", "Trial Booking Email Sent", `Notification sent to gym owner for ${updatedLead.name || leadId}'s booking.`);
      }

      if (takeover) {
        updatedLead.status = "human_takeover";
        await logIntegration("email", "error", "Human Takeover Triggered", `Gym owner notified of a support request or unhandled query for: ${updatedLead.name || leadId}.`);
      }

      updatedLead.leadScore = calculateLeadScore(updatedLead);
      updatedLead.lastInteractionAt = nowIso;

      await setDoc(leadDocRef, updatedLead);

      await addDoc(messagesCollRef, {
        sender: "bot",
        text: replyText,
        timestamp: new Date().toISOString()
      });

      await logIntegration("whatsapp", "success", "WhatsApp Message Outbound", `FitBot replied: "${replyText.substring(0, 40)}..."`);
      await logIntegration("sheets", "success", "Google Sheets Synced", `Updated lead ${updatedLead.name || leadId} spreadsheet row successfully.`);

      res.json({
        reply: replyText,
        lead: updatedLead
      });

    } catch (err: any) {
      console.error("Chat API error:", err);
      res.status(500).json({ error: err.message || "Something went wrong in the AI processing engine." });
    }
  });

  // POST Manual status / automation simulator triggers
  app.post("/api/simulate-trigger", async (req, res) => {
    const { leadId, triggerType } = req.body;
    if (!leadId || !triggerType) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    try {
      const leadDocRef = doc(db, "leads", leadId);
      const leadSnap = await getDoc(leadDocRef);
      if (!leadSnap.exists()) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const leadData = leadSnap.data();
      const nowIso = new Date().toISOString();
      const messagesCollRef = collection(db, "leads", leadId, "messages");

      let messageText = "";
      let updateFields: any = { lastInteractionAt: nowIso };

      if (triggerType === "inactivity_24h") {
        messageText = "Hi! We noticed you were interested in joining our gym. We'd love to help you achieve your fitness goals. Would you like to book your free trial?";
        updateFields.status = "inactive";
        await logIntegration("whatsapp", "success", "Inactivity Follow-up", `Automated 24h follow-up message dispatched to ${leadData.name || leadId}`);
      } else if (triggerType === "no_show_reminder") {
        messageText = `Hi ${leadData.name || "there"}! We missed you at your scheduled trial session today. We'd love to help you reschedule your session. Let us know what date and time works for you!`;
        updateFields.trialStatus = "no-show";
        await logIntegration("whatsapp", "success", "No-Show Follow-up Sent", `Trial no-show reminder dispatched to ${leadData.name || leadId}`);
      } else if (triggerType === "visited_followup") {
        messageText = `Hey ${leadData.name || "there"}! We loved having you for your trial session today! Ready to achieve your fitness goals? We recommend our Quarterly or Annual membership to get the best benefits. Shall we set up your membership?`;
        updateFields.trialStatus = "visited";
        await logIntegration("whatsapp", "success", "Trial Feedback Requested", `Feedback & conversion follow-up message dispatched to ${leadData.name || leadId}`);
      } else if (triggerType === "membership_purchased") {
        messageText = `Welcome to the family, ${leadData.name || "there"}! Your premium membership has been activated. Let's crush those fitness goals together!`;
        updateFields.status = "converted";
        updateFields.trialStatus = "visited";
        updateFields.membershipInterest = leadData.membershipInterest || "Monthly";
        await logIntegration("whatsapp", "success", "Membership Confirmed", `${leadData.name || leadId} registered as an official member!`);
        await logIntegration("sheets", "success", "Google Sheets Row Closed", `Synced membership status to Sheets for ${leadData.name || leadId}.`);
      }

      if (messageText) {
        await addDoc(messagesCollRef, {
          sender: "bot",
          text: messageText,
          timestamp: nowIso
        });
        await updateDoc(leadDocRef, updateFields);
      }

      res.json({ success: true, updatedLead: { ...leadData, ...updateFields } });
    } catch (error: any) {
      console.error("Simulation trigger error:", error);
      res.status(500).json({ error: error.message || "Failed to trigger event" });
    }
  });

  // Vite & Static file configurations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitBot Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
