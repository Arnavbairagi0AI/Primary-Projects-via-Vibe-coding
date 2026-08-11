import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for reply generation
  app.post("/api/generate-replies", async (req, res) => {
    try {
      const { 
        reviewText, 
        language, 
        replyTone, 
        businessName = "My Local Business", 
        businessType = "Local Business", 
        locality = "India" 
      } = req.body;
      
      if (!reviewText) {
        return res.status(400).json({ error: "Review text is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured in environment" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      
      const prompt = `
You are a master local business marketing expert in India.
Business Name: "${businessName}"
Business Category: "${businessType}"
Business Location/Locality: "${locality}"

Customer review to reply to: "${reviewText}"
Language specified: ${language}
Tone specified: ${replyTone}

Generate exactly 3 alternative, highly polite, localized response replies.
Make sure you include relevant Indian local context (e.g. referencing warm Indian hospitality, greeting terms if appropriate like Namaste, Vanakkam, or standard polite greetings), value the customer, reference the business category and location if helpful, and integrate highly searched generic business keywords seamlessly for SEO optimization.

CRITICAL LANGUAGE RULE:
If "Language specified" is "Auto-detect (Match Review Language)" or if you are asked to auto-detect, you must look closely at the language, script, style, and vocabulary of the customer review. 
- If they wrote in Hindi (Devanagari), reply in Devanagari Hindi.
- If they wrote in Hinglish (Hindi written using English alphabet), reply in Roman Hinglish.
- If they wrote in Tamil, reply in Tamil.
- If they wrote in English, reply in English.
- If they wrote in any other language (e.g. Bengali, Kannada, Telugu, Marathi, Malayalam, Gujarati, Punjabi, etc.) or any dialect, you MUST reply in that EXACT same language, script, and style. 
Give the SAME type of language that was sent in the review text, nothing more. Do not translate it to English or another language; stay completely faithful to the language of the input review.

CRITICAL TONE RULE:
If "Tone specified" is "Auto-detect (Match Review Tone)" or if auto-detecting tone is requested, you must automatically analyze the sentiment, emotion, and feedback in the review:
- If the review expresses disappointment, complaints, or problems (negative/critical feedback), you MUST use an **Apologetic & Empathetic** tone. Express deep regret, explain gracefully, and offer to resolve the issue.
- If the review is highly praising, happy, or positive (positive feedback), you MUST use a **Warm, Friendly, and Appreciative** tone. Show enthusiasm and invite them back.
- If the review is objective, neutral, or descriptive, you MUST use a **Polite, Professional, and Helpful** tone.

Language-specific guidelines (when targeted or auto-detected):
- For Hinglish: write Hindi words in the Roman (English) script (e.g., "Aapka bahut-bahut dhanyawad, hume khushi hui ki aapko humari service pasand aayi.").
- For Tamil: write in Tamil script (or mix with English terms where natural for business replies).
- For Hindi: write in Hindi Devanagari script.
- For English: use Indian English standard polite and warm business style.

Return your response strictly as a JSON object containing an array of replies. No markdown wrappers except standard JSON structure.
The JSON format must be exactly:
{
  "replies": [
    {
      "text": "Reply text 1",
      "seoKeywords": ["keyword1", "keyword2"],
      "explanation": "Brief tip on why this works well in Indian local context"
    },
    ...
  ]
}
`;

      let response;
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting Gemini content generation with model: ${modelName}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          console.log(`Success with model: ${modelName}`);
          break; // Success! Stop trying other models
        } catch (genErr: any) {
          lastError = genErr;
          console.warn(`Model ${modelName} failed or is overloaded:`, genErr);
          // Continue to next model immediately
        }
      }

      if (!response) {
        throw lastError || new Error("All models failed to generate content.");
      }

      let jsonText = response?.text || "{}";
      // Sanitize standard code block formatting if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.substring(7);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      jsonText = jsonText.trim();

      const parsed = JSON.parse(jsonText);
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate replies" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
