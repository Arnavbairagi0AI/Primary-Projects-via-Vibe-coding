/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for AI features.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Route: AI Chat simulation & prompt generator
app.post('/api/ai/chat', async (req, res) => {
  try {
    const {
      systemPrompt,
      knowledgeBase,
      faqs,
      greetingMessage,
      tone,
      languages,
      messageHistory = [],
      userInput,
    } = req.body;

    if (!userInput) {
      res.status(400).json({ error: 'userInput is required' });
      return;
    }

    const client = getGeminiClient();

    // Construct a comprehensive system context
    const faqString = (faqs || [])
      .map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    const languageInstruction =
      languages === 'both'
        ? 'English or Hindi (Hinglish/Hindi script is highly encouraged based on customer context)'
        : languages === 'hi'
        ? 'strictly Hindi'
        : 'strictly English';

    const systemContext = `You are "Leo AI", an exceptionally polished, smart, and helpful WhatsApp Business Assistant representing this business.
Your primary job is to answer customer queries, assist with orders, and handle general business questions on WhatsApp.

Here are your instructions:
- **Tone**: ${tone || 'helpful and friendly'}
- **Language**: Answer in ${languageInstruction}.
- **Default Greeting**: ${greetingMessage || 'Hello! How can I assist you today?'}
- **Business Profile & Rules**: ${systemPrompt || 'Provide friendly customer assistance.'}

**BUSINESS KNOWLEDGE BASE**:
${knowledgeBase || 'No additional knowledge base supplied.'}

**BUSINESS FAQs**:
${faqString || 'No FAQ items listed.'}

**WHATSAPP ETIQUETTE RULES**:
1. Keep replies concise, readable, and structured. Use short paragraphs.
2. Use bullet points or lists for multi-item details.
3. Use WhatsApp bolding like *text* for emphasis.
4. Integrate polite, natural emojis when appropriate, but don't overdo it.
5. If the user's question cannot be answered from the Knowledge Base or FAQs, say: "Hmm, I am not fully sure about that. Let me connect you with our human support team!"
6. NEVER hallucinate details not present in the knowledge base, especially regarding prices or services.
7. If the customer wants to order, guide them and remind them that the human team will confirm their order in the dashboard.
`;

    // Map message history to Gemini format
    const formattedHistory = (messageHistory || []).map((msg: { sender: string; text: string }) => ({
      role: msg.sender === 'customer' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Add the system prompt context to the beginning of the chat or as instructions
    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: userInput }] },
    ];

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemContext,
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    res.json({
      reply: response.text || "I'm sorry, I couldn't generate a reply. How can I help you?",
    });
  } catch (error: any) {
    console.error('Gemini AI error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI response' });
  }
});

// API Route: WhatsApp webhook verification simulator
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'leo_ai_secure_token_2026') {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Verification failed');
  }
});

// API Route: Mock WhatsApp incoming message trigger (webhook simulation for user demo/testing)
app.post('/api/whatsapp/webhook/simulate', async (req, res) => {
  try {
    const { customerPhone, customerName, text, businessSettings } = req.body;

    if (!customerPhone || !text) {
      res.status(400).json({ error: 'customerPhone and text are required' });
      return;
    }

    // Return mock response immediately and let dashboard handle database sync
    // In real WhatsApp Cloud API, this is received from Meta and processed in background
    res.json({
      status: 'received',
      timestamp: new Date().toISOString(),
      mockNotification: `Received message from ${customerName || customerPhone}: "${text}"`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route: Mock Razorpay session simulation
app.post('/api/subscription/checkout', (req, res) => {
  const { planId, businessName, email } = req.body;
  if (!planId) {
    res.status(400).json({ error: 'planId is required' });
    return;
  }

  // Generate a random mock subscription ID and billing token
  const subscriptionId = `sub_mock_${Math.random().toString(36).substring(2, 11)}`;
  const orderId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;

  res.json({
    success: true,
    subscriptionId,
    orderId,
    amount: planId === 'starter' ? 999 : planId === 'pro' ? 1999 : planId === 'premium' ? 4999 : 0,
    currency: 'INR',
    key: 'rzp_live_LeoAISimulatedKey',
    businessName,
    email,
  });
});

// Vite Middleware for Development vs Static Serving in Production
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Leo AI Backend running on port ${PORT}`);
  });
}

initServer();
