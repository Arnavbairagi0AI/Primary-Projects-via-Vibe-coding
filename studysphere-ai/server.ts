import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to instantiate Gemini client
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API endpoint for AI Tutor Chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, contextSubject, image } = req.body;

      if (!message && !image) {
        return res.status(400).json({ error: 'Message or image is required.' });
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Intelligent mock fallback if GEMINI_API_KEY is not set
        let fallbackText = `I am your StudySphere AI Tutor! I'm analyzing your question about "${message || 'this image'}". `;
        if (message && message.toLowerCase().includes('krebs')) {
          fallbackText = `Absolutely! Think of the Krebs cycle like a factory line where energy is extracted from fuel. Here is a step-by-step breakdown:
1. Acetyl-CoA joins with Oxaloacetate to form Citrate.
2. Citrate is oxidized through a series of steps to produce NADH, FADH2, and ATP (energy).
3. Oxaloacetate is regenerated to restart the cycle.`;
        } else if (message && message.toLowerCase().includes('photosynthesis')) {
          fallbackText = `Photosynthesis is the process plants use to convert sunlight, carbon dioxide, and water into oxygen and energy-rich sugars (glucose).
- Light-Dependent Reactions: Take place in the thylakoid membranes, converting light into ATP and NADPH while releasing O2.
- Light-Independent (Calvin) Cycle: Takes place in the stroma, using ATP and NADPH to fix CO2 into glucose.`;
        } else if ((message && message.toLowerCase().includes('calculus')) || message?.toLowerCase().includes('math')) {
          fallbackText = `Let's tackle this math problem together! Derivatives measure the rate of change (slope of the tangent line), while Integrals measure accumulation (area under the curve). What equation would you like to solve?`;
        } else {
          fallbackText += `Great study question! As your personal tutor, I recommend breaking this down into key concepts, creating quick recall flashcards, and testing your understanding with a short 3-question quiz. Let me know which subtopic you'd like to explore next!`;
        }

        return res.json({
          text: fallbackText,
          diagramUrl: message && message.toLowerCase().includes('krebs') ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2-MAYZOkJNB8_bLw9pNhl7a1DY1t_9_zRhFwZ1zM7vz76aln-ZuxwlOa2xY0S2lthIXQueU_5fNMelh6ZO7u08iFvr0z-UwPMnU7LufufX64vZDSQwfiCJpsMpsN_dW5bIcqScBdaE8kGaO7pdIjU2tvvU_VqGTMocVncN1p_QlUqz-Ja7b9ylqDoOP1Y3nnEES5uDrM2aFt5VTOxofsLR9gyswRNDRWriRL_adrp2UsBTIFB-z_w' : undefined
        });
      }

      const systemInstruction = `You are StudySphere AI, an empathetic, highly knowledgeable, and encouraging personal AI study tutor for high school and college students.
Your goal is to break down complex academic subjects (Physics, Biology, Chemistry, Mathematics, History, Literature) into clear, intuitive step-by-step explanations using analogies, active recall questions, and structured bullet points.
Keep tone warm, inspiring, and clear.
If the student asks to visualize or explain something complex like the Krebs Cycle, Quantum Mechanics, or Photosynthesis, give a lucid breakdown and offer interactive follow-up practice questions.`;

      const contents: any[] = [];

      // Append formatted history if available
      if (history && Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          });
        }
      }

      // Prepare current prompt parts
      const currentParts: any[] = [];

      if (image) {
        // base64 image data
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = image.match(/data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
        currentParts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      }

      if (message) {
        currentParts.push({ text: message });
      }

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || 'I have analyzed your request. How else can I support your study session?';

      res.json({ text });
    } catch (error: any) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({ error: error.message || 'Failed to generate response.' });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudySphere AI server running on http://localhost:${PORT}`);
  });
}

startServer();
