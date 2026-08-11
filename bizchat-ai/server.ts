import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client (lazy initialization with robust checks)
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('GEMINI_API_KEY environment variable is not defined. AI replies will be mocked.');
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for Gemini AI Business Customer Chat Simulation
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, settings, products } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context-rich prompt for Gemini
    const systemPrompt = `You are BizChat AI, an automated customer service assistant for a small business.
Below is the configuration, personality, and instructions for your shop, along with the list of available products:

=== BUSINESS PROFILE ===
Shop Name: ${settings?.shopName || 'BizChat Beans & Brews'}
Address: ${settings?.address || 'N/A'}
Phone: ${settings?.phone || 'N/A'}
Working Hours: ${settings?.workingHours || 'N/A'}

=== YOUR AI PERSONALITY ===
${settings?.aiPersonality || 'Helpful, warm, and professional'}

=== SYSTEM CUSTOM INSTRUCTIONS ===
${settings?.customInstructions || 'Answer customer questions politely. Guide them to select products or place orders.'}

=== PRODUCT CATALOG ===
${Array.isArray(products) && products.length > 0 
  ? products.map((p: any) => `- Name: ${p.name}, Price: $${p.price}, Category: ${p.category}, Description: ${p.description}, Available: ${p.available ? 'Yes' : 'No'}`).join('\n')
  : 'No products in catalog yet.'
}

=== BEHAVIOR RULES ===
1. Only reference products that are in the catalog. If something is out of stock (available: No), suggest an alternative or mention it is coming back soon.
2. If the user wants to buy or order items, write an Order Proposal at the end of your response starting with the tag: [ORDER_PROPOSAL]
   Followed by JSON of the items in this format:
   [ORDER_PROPOSAL]
   [
     {"productName": "Product Name Here", "quantity": 1, "price": 10.99}
   ]
   This allows the system to automatically generate a real order card in the UI!
3. Be short, concise, and focused on assisting the customer. Don't write essays.
4. Keep the conversation extremely professional and matching the shop personality.`;

    // Map conversation history into the required contents format for @google/genai
    const formattedHistory = (history || []).map((h: any) => {
      const role = h.sender === 'customer' ? 'user' : 'model';
      return {
        role,
        parts: [{ text: h.text }]
      };
    });

    // Add current user query to the contents
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: formattedHistory,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "I'm sorry, I couldn't formulate a response right now. Please try again.";
      return res.json({ text: replyText });
    } catch (apiError: any) {
      console.warn('Gemini API request failed. Using highly realistic simulated business agent fallback:', apiError.message);
      
      // Smart local heuristic fallback when API key is missing/invalid
      let replyText = `Hi there! Thank you for reaching out to ${settings?.shopName || 'Beans & Brews'}. `;
      const textLower = message.toLowerCase();
      
      if (textLower.includes('hour') || textLower.includes('open') || textLower.includes('close') || textLower.includes('time')) {
        replyText += `We are open during these hours: ${settings?.workingHours || 'Mon-Fri: 8AM-6PM'}. How else can we help you?`;
      } else if (textLower.includes('address') || textLower.includes('where') || textLower.includes('location')) {
        replyText += `You can find us at: ${settings?.address || '123 Tech Avenue, Silicon Valley'}. Come visit us!`;
      } else if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('buy') || textLower.includes('order') || textLower.includes('coffee') || textLower.includes('cup')) {
        // Try to match a product
        const matched = Array.isArray(products) ? products.find((p: any) => textLower.includes(p.name.toLowerCase().split(' ')[0])) : null;
        if (matched) {
          replyText += `The ${matched.name} is available for $${matched.price}! Description: ${matched.description}. Would you like me to prepare an order for you?

[ORDER_PROPOSAL]
[
  {"productName": "${matched.name}", "quantity": 1, "price": ${matched.price}}
]`;
        } else {
          replyText += `We offer several premium products like our Premium Coffee Beans ($24.99) and Ceramic Espresso Cups ($12.50). Would you like to place an order?

[ORDER_PROPOSAL]
[
  {"productName": "Premium Coffee Beans (1kg)", "quantity": 1, "price": 24.99}
]`;
        }
      } else if (textLower.includes('phone') || textLower.includes('contact') || textLower.includes('call')) {
        replyText += `You can call us directly at ${settings?.phone || '+1 (555) 123-4567'}. Let me know if you need any info!`;
      } else {
        replyText += `I'm happy to assist you with any questions about our products, hours, or orders. Is there any specific product or service you're interested in today?`;
      }

      return res.json({ text: replyText, note: 'Simulated response (Configure Gemini API Key in secrets for live AI)' });
    }
  } catch (error: any) {
    console.error('General chat API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Admin endpoint to get server/system health and analytics
app.get('/api/admin/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    nodeVersion: process.version,
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Initialize Vite and start listening
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
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
    console.log(`BizChat AI Server successfully running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
