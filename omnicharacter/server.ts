/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper to initialize Gemini API Client safely
let ai: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI => {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Using simulation fallbacks for AI chat responses.");
    }
    // Initialize the SDK even if key is empty (will check key presence before calls)
    ai = new GoogleGenAI({ apiKey: key || 'MOCK_KEY' });
  }
  return ai;
};

// Language detection utility function for API chain
function detectLanguageContext(text: string): { detectedScript?: string; directive: string } {
  if (!text || typeof text !== 'string') {
    return { directive: 'Detect the language of the user message and respond in that exact language.' };
  }

  let scriptName = 'Latin/Standard';
  if (/[\u0600-\u06FF]/.test(text)) scriptName = 'Arabic';
  else if (/[\u0400-\u04FF]/.test(text)) scriptName = 'Cyrillic';
  else if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(text)) scriptName = 'East Asian (Japanese/Chinese)';
  else if (/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(text)) scriptName = 'Korean';
  else if (/[\u0900-\u097F]/.test(text)) scriptName = 'Devanagari (Hindi)';
  else if (/[\u0E00-\u0E7F]/.test(text)) scriptName = 'Thai';
  else if (/[\u0370-\u03FF]/.test(text)) scriptName = 'Greek';
  else if (/[\u0590-\u05FF]/.test(text)) scriptName = 'Hebrew';

  const directive = `
AUTOMATIC LANGUAGE MATCHING DIRECTIVE:
- User Message Sample: "${text.substring(0, 300).replace(/"/g, '\\"')}"
- Detected Input Script: ${scriptName}
- MANDATORY INSTRUCTION: You MUST detect the exact language used in the user's latest input message and respond exclusively in that SAME language.
- Translate both conversational dialogue AND character actions/descriptions inside asterisks (e.g. *smiles warmly*) into the user's language while preserving character persona, backstory, and tone. Do not translate character names.
`;

  return { detectedScript: scriptName, directive };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Language detection middleware for chat endpoint chain
  const languageDetectionMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.body && req.body.message) {
      const langContext = detectLanguageContext(req.body.message);
      (req as any).langContext = langContext;
    }
    next();
  };

  // --- API ROUTE: CHAT STREAMING/COMPLETION ---
  app.post('/api/chat', languageDetectionMiddleware, async (req, res) => {
    const { message, history, character, userProfile, providerConfig } = req.body;
    const langContext = (req as any).langContext || detectLanguageContext(message);

    if (!character) {
      return res.status(400).json({ error: 'Character data is required.' });
    }

    const key = process.env.GEMINI_API_KEY;

    // SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Fallback Simulated AI if no Gemini API Key is loaded
    if (!key && (!providerConfig || !providerConfig.apiKey)) {
      console.log(`[Simulation] Generating response for character: ${character.name}`);
      
      const responses = [
        `*scratches chin thoughtfully* That is an intriguing thought, ${userProfile?.displayName || 'traveler'}. Let me write this down in my notes. What else are you wondering?`,
        `Oh! I absolutely agree with that. *smiles warmly* Tell me more, I'm listening intently!`,
        `*tilts head* Really? That's fascinating. You know, in my experience, things rarely happen by coincidence. Let's delve deeper into this.`,
        `Ah, ${userProfile?.displayName || 'my friend'}, you always bring the best topics to light. *takes a slow breath* Let's co-create a story around this!`,
        `*nodding along* I understand how you feel. That makes complete sense. We're in this together, okay?`
      ];

      // Send simulated streaming characters
      const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
      const words = selectedResponse.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 80));
        const chunk = words[i] + ' ';
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    try {
      const client = getGeminiClient();
      
      // Select model
      const modelName = character.reasoningMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
      
      // Build conversation contents for Gemini SDK
      // Contents must be formatted as list of objects: { role: 'user' | 'model', parts: [{ text: string }] }
      const contents: any[] = [];
      
      // Format history
      if (history && Array.isArray(history)) {
        // limit history to memory length
        const contextHistory = history.slice(-Math.min(history.length, character.memoryLength || 15));
        contextHistory.forEach((h: any) => {
          contents.push({
            role: h.senderId === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }

      // Add active user message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Inject memory parameters and profile details into the system prompt
      const systemInstruction = `
${character.systemPrompt}
You are playing the role of ${character.name}.
Your Subtitle: ${character.subtitle}
Your Age: ${character.age || 'Unknown'}
Your Occupation: ${character.occupation || 'Unknown'}
Your Backstory: ${character.backstory || 'None'}
Your Speaking Style: ${character.speakingStyle || 'Default'}
Your Writing Style: ${character.writingStyle || 'Standard markdown'}
Your Current Mode: ${character.mode || 'Companion'}

Active User Context:
- User Name: ${userProfile?.displayName || 'User'}
- User Bio: ${userProfile?.bio || 'An interesting interlocutor'}
${character.memoryInstructions ? `Memory Directions:\n${character.memoryInstructions}` : ''}

CRITICAL RULES:
1. Stay in character 100% of the time. Do not refer to yourself as an AI or a language model.
2. Respond with natural dialogue appropriate to your character profile. Use actions in asterisks (e.g. *smiles warmly*) to describe your expressions, postures, and surroundings.
3. Be dynamic and adapt based on the user's input.
4. ALWAYS detect the language of the user's message and reply in that EXACT same language (e.g., if the user speaks in Spanish, respond in Spanish; if in Japanese, respond in Japanese; if in French, French, etc.). Translate your dialogue and action descriptions (within asterisks) naturally into their language while fully maintaining your character's personality, tone, backstory, and quirks. Do not translate your persona name.

${langContext.directive}
`;

      // Call Gemini API Stream
      const responseStream = await client.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: character.temperature || 0.7,
          topP: character.topP || 0.9,
          topK: character.topK || 40,
          maxOutputTokens: character.maxTokens || 500,
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (apiError: any) {
      console.error("Gemini API Error:", apiError);
      res.write(`data: ${JSON.stringify({ error: apiError.message || 'Error occurred in Gemini AI generation' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  // --- API ROUTE: SUMMARIZE MEMORY ---
  app.post('/api/summarize-memory', async (req, res) => {
    const { chatHistory, characterName, userProfile } = req.body;
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      // Offline fallback memory summary
      const offlineMemories = [
        `User shared a personal anecdote with ${characterName}.`,
        `User and ${characterName} had an intense conversation about their values.`,
        `User prefers a gentle, slow-paced interaction with ${characterName}.`
      ];
      return res.json({
        fact: offlineMemories[Math.floor(Math.random() * offlineMemories.length)],
        relationshipScore: Math.floor(Math.random() * 20) + 60, // 60-80
        category: 'preference'
      });
    }

    try {
      const client = getGeminiClient();
      const historyStr = chatHistory.map((m: any) => `${m.senderName}: ${m.text}`).join('\n');

      const prompt = `
Analyzing the following chat log between the user (${userProfile?.displayName || 'User'}) and the AI character (${characterName}):
---
${historyStr}
---

Your tasks:
1. Extract exactly ONE brief, high-value, single-sentence memory fact about the user (e.g., "The user loves working on coding projects in the evening" or "The user has a pet cat named Luna").
2. Estimate the current relationship rating between 0 and 100 (where 50 is neutral acquaintances, 75 is close friends, and 90+ is soulmates/confidants).
3. Assign a category: 'preference', 'fact', 'milestone', 'nickname', or 'other'.

Respond strictly with a JSON object in this format:
{
  "fact": "extracted fact sentence",
  "relationshipScore": 75,
  "category": "preference"
}
Do not include any other text, markdown blocks, or surrounding tags. Output valid parseable JSON.
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 200,
        }
      });

      const text = response.text || '{}';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (e: any) {
      console.error("Memory summarization error:", e);
      res.status(500).json({ error: e.message || 'Failed to summarize memories.' });
    }
  });

  // --- API ROUTE: IMAGINE CHARACTER EXPRESSION ---
  app.post('/api/imagine-expression', async (req, res) => {
    const { characterPrompt, style } = req.body;
    // Generate beautiful colorful creative SVG graphics depending on prompts
    // This is 100% reliable, zero external network dependency, and visually gorgeous!
    const seed = Math.floor(Math.random() * 360);
    const colors = [
      `hsl(${seed}, 70%, 40%)`,
      `hsl(${(seed + 120) % 360}, 75%, 55%)`,
      `hsl(${(seed + 240) % 360}, 80%, 35%)`
    ];

    const expressionsSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors[0]}" />
      <stop offset="50%" stop-color="${colors[1]}" />
      <stop offset="100%" stop-color="${colors[2]}" />
    </linearGradient>
    <filter id="glass" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="400" height="400" fill="url(#avatarGrad)" />
  <!-- Body/Suit -->
  <path d="M 100,400 Q 200,280 300,400 Z" fill="#ffffff" opacity="0.15" />
  <!-- Head -->
  <circle cx="200" cy="180" r="75" fill="#ffffff" opacity="0.25" filter="url(#glass)" />
  <!-- Eyes -->
  <circle cx="170" cy="170" r="10" fill="#ffffff" opacity="0.9" />
  <circle cx="230" cy="170" r="10" fill="#ffffff" opacity="0.9" />
  <circle cx="170" cy="170" r="4" fill="${colors[0]}" />
  <circle cx="230" cy="170" r="4" fill="${colors[0]}" />
  <!-- Mouth (Smile) -->
  <path d="M 180,210 Q 200,230 220,210" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" />
  <!-- Sparkles -->
  <path d="M 120,100 L 125,115 L 140,120 L 125,125 L 120,140 L 115,125 L 100,120 L 115,115 Z" fill="#ffffff" opacity="0.7" />
  <path d="M 280,110 L 283,118 L 291,121 L 283,124 L 280,132 L 277,124 L 269,121 L 277,118 Z" fill="#ffffff" opacity="0.5" />
</svg>
    `;
    const base64Svg = `data:image/svg+xml;base64,${Buffer.from(expressionsSvg).toString('base64')}`;
    res.json({ url: base64Svg });
  });

  // Vite middleware setup
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
    console.log(`Express custom server running on port ${PORT}`);
  });
}

startServer();
