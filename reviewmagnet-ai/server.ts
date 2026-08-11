import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup JSON parser
  app.use(express.json());

  // API endpoint for AI Reply Generation (Proxied Server-side for API Key security)
  app.post("/api/generate-reply", async (req, res) => {
    try {
      const { reviewerName, rating, reviewText, businessName, businessType } = req.body;

      if (!reviewerName) {
        return res.status(400).json({ error: "reviewerName is required" });
      }

      const bizName = businessName || "our business";
      const bizType = businessType || "service provider";
      const ratingValue = Number(rating) || 5;

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
        try {
          // Lazy initialization of Gemini AI
          const ai = new GoogleGenAI({ apiKey });

          const prompt = `You are an expert customer relations assistant for a business named "${bizName}" (${bizType}). 
Generate a professional, warm, and appropriate response to this customer review.

Review Details:
- Reviewer: ${reviewerName}
- Rating: ${ratingValue} out of 5 stars
- Review: "${reviewText || 'No review text left, just a rating.'}"

Guidelines for reply:
- Address the customer directly by name in a friendly greeting.
- For high ratings (4-5 stars), express heartfelt appreciation and reiterate what they loved.
- For moderate ratings (3 stars), thank them for the feedback and express eagerness to improve.
- For low ratings (1-2 stars), be deeply empathetic, professional, never defensive, and provide a polite invite to contact support to resolve any issues.
- Keep the response short, conversational, and under 100 words.
- Do NOT include any placeholders, bracketed instructions, or markdown-like formatting in the reply. It must be ready to publish.`;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          if (aiResponse && aiResponse.text) {
            return res.json({ reply: aiResponse.text.trim() });
          }
        } catch (aiError: any) {
          console.error("Gemini API call failed, falling back to local generator:", aiError);
          // Fall through to local simulation
        }
      }

      // Local high-quality generative simulator (robust fallback)
      let generatedReply = "";
      const greeting = `Dear ${reviewerName},`;

      if (ratingValue >= 5) {
        const positivePhrases = [
          `Thank you so much for the amazing 5-star review! We are absolutely thrilled to hear about your excellent experience at ${bizName}. Your support means the world to our team, and we look forward to welcoming you back soon!`,
          `We sincerely appreciate your kind words! Hearing that you had a wonderful experience at ${bizName} motivates us to keep delivering the highest quality. Thank you for choosing us, and we hope to see you again soon!`,
          `Wow, thank you! We're so glad you had such a great experience with us. Your recommendation is highly appreciated, and our team at ${bizName} is always here to serve you!`
        ];
        generatedReply = `${greeting}\n\n${positivePhrases[Math.floor(Math.random() * positivePhrases.length)]}`;
      } else if (ratingValue === 4) {
        generatedReply = `${greeting}\n\nThank you for the wonderful 4-star review! We are so glad you had a positive experience at ${bizName}. We always aim for perfection, so if there is any specific feedback you have on how we can earn that 5th star next time, please feel free to let us know. Have a fantastic day!`;
      } else if (ratingValue === 3) {
        generatedReply = `${greeting}\n\nThank you for taking the time to share your feedback with us. We appreciate your honesty and constructive input regarding your experience at ${bizName}. We are committed to continuous improvement, and we would love to learn more about how we can serve you better in the future. Please reach out to our team directly.`;
      } else {
        // 1 or 2 stars
        generatedReply = `${greeting}\n\nThank you for sharing your feedback, though we are deeply sorry to hear that your experience did not meet your expectations. At ${bizName}, we hold ourselves to a high standard, and it is clear we fell short in this instance. We would love the opportunity to make this right. Please contact us directly at your earliest convenience so we can address your concerns.`;
      }

      return res.json({ reply: generatedReply });

    } catch (err: any) {
      console.error("API error:", err);
      return res.status(500).json({ error: "Failed to generate reply" });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReviewMagnet AI Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
