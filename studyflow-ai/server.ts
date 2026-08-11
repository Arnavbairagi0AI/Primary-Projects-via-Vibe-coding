/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Gemini endpoints will fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || 'DUMMY_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ---------------------------------------------------------
// FIREBASE BACKEND SETUP & SUBSCRIPTION MIDDLEWARE
// ---------------------------------------------------------
import { initializeApp as initFirebase } from 'firebase/app';
import { getFirestore as getFirebaseDb, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import fs from 'fs';

// Read firebase-applet-config.json safely
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseApp;
let db: any = null;

if (fs.existsSync(configPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    firebaseApp = initFirebase(firebaseConfig);
    db = getFirebaseDb(firebaseApp);
    console.log("Firebase initialized on backend successfully.");
  } catch (err) {
    console.error("Failed to initialize Firebase on server:", err);
  }
} else {
  console.warn("WARNING: firebase-applet-config.json not found on server.");
}

async function checkAiAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Check if UID was provided in request headers
  const uid = req.headers['x-user-uid'] as string;
  if (!uid) {
    return res.status(401).json({ error: 'Unauthorized: Missing User UID header (x-user-uid).' });
  }

  // If no database is available, allow (fail-safe for development without DB config)
  if (!db) {
    return next();
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User profile not found in database.' });
    }

    const profile = userSnap.data();
    
    // Support either subscriptionPlan or currentPlan (keep them in sync)
    const plan = profile.subscriptionPlan || profile.currentPlan || 'free';
    const status = profile.subscriptionStatus || 'inactive';

    // Exclusion for Owner test email just in case, but keep rinkibairagi restricted to free
    const isExcluded = profile.email?.toLowerCase() === 'rinkibairagi1989@gmail.com' || profile.email?.toLowerCase() === 'reikinbaragi1989@gmail.com';

    // Check if subscription has expired
    if (plan !== 'free' && profile.subscriptionEnd && !isExcluded) {
      const expiry = new Date(profile.subscriptionEnd);
      if (expiry < new Date()) {
        return res.status(403).json({ error: 'Your subscription has expired. Please renew to access premium features.', code: 'SUBSCRIPTION_EXPIRED' });
      }
    }

    const endpoint = req.path;

    if (endpoint === '/api/chat') {
      if (plan === 'free' || isExcluded) {
        const chatsToday = profile.aiChatsToday || 0;
        if (chatsToday >= 20) {
          return res.status(429).json({ 
            error: "You've reached today's Free limit (20 AI chats/day). Upgrade to Pro or Premium for unlimited chat!", 
            code: 'LIMIT_EXCEEDED',
            limit: 20 
          });
        }
        await updateDoc(userRef, { aiChatsToday: increment(1) });
      }
    } else if (endpoint === '/api/generate-notes') {
      if (plan === 'free' || isExcluded) {
        return res.status(403).json({ error: "AI Notes Generator is available in Pro (30/month) and Premium (Unlimited). Please upgrade.", code: 'PREMIUM_ONLY' });
      } else if (plan === 'pro') {
        const notesThisMonth = profile.notesGeneratedThisMonth || 0;
        if (notesThisMonth >= 30) {
          return res.status(429).json({ 
            error: "You've reached your Pro monthly limit of 30 Notes. Upgrade to Premium for unlimited notes!", 
            code: 'LIMIT_EXCEEDED',
            limit: 30 
          });
        }
        await updateDoc(userRef, { notesGeneratedThisMonth: increment(1) });
      } else if (plan === 'premium') {
        await updateDoc(userRef, { notesGeneratedThisMonth: increment(1) });
      }
    } else if (endpoint === '/api/generate-summary') {
      if (plan === 'free' || isExcluded) {
        return res.status(403).json({ error: "PDF Summarizer is available in Pro (30/month) and Premium (Unlimited). Please upgrade.", code: 'PREMIUM_ONLY' });
      } else if (plan === 'pro') {
        const summariesThisMonth = profile.pdfSummariesGeneratedThisMonth || 0;
        if (summariesThisMonth >= 30) {
          return res.status(429).json({ 
            error: "You've reached your Pro monthly limit of 30 PDF Summaries. Upgrade to Premium for unlimited summaries!", 
            code: 'LIMIT_EXCEEDED',
            limit: 30 
          });
        }
        await updateDoc(userRef, { pdfSummariesGeneratedThisMonth: increment(1) });
      } else if (plan === 'premium') {
        await updateDoc(userRef, { pdfSummariesGeneratedThisMonth: increment(1) });
      }
    } else if (endpoint === '/api/generate-flashcards') {
      if (plan === 'free' || isExcluded) {
        return res.status(403).json({ error: "Flashcard Generator is available in Pro (30/month) and Premium (Unlimited). Please upgrade.", code: 'PREMIUM_ONLY' });
      } else if (plan === 'pro') {
        const cardsThisMonth = profile.flashcardsGeneratedThisMonth || 0;
        if (cardsThisMonth >= 30) {
          return res.status(429).json({ 
            error: "You've reached your Pro monthly limit of 30 Flashcard Sets. Upgrade to Premium for unlimited sets!", 
            code: 'LIMIT_EXCEEDED',
            limit: 30 
          });
        }
        await updateDoc(userRef, { flashcardsGeneratedThisMonth: increment(1) });
      } else if (plan === 'premium') {
        await updateDoc(userRef, { flashcardsGeneratedThisMonth: increment(1) });
      }
    } else if (endpoint === '/api/generate-quiz') {
      if (plan === 'free' || isExcluded) {
        return res.status(403).json({ error: "Quiz Generator is available in Pro (20/month) and Premium (Unlimited). Please upgrade.", code: 'PREMIUM_ONLY' });
      } else if (plan === 'pro') {
        const quizThisMonth = profile.quizGeneratedThisMonth || 0;
        if (quizThisMonth >= 20) {
          return res.status(429).json({ 
            error: "You've reached your Pro monthly limit of 20 Quizzes. Upgrade to Premium for unlimited quizzes!", 
            code: 'LIMIT_EXCEEDED',
            limit: 20 
          });
        }
        await updateDoc(userRef, { quizGeneratedThisMonth: increment(1) });
      } else if (plan === 'premium') {
        await updateDoc(userRef, { quizGeneratedThisMonth: increment(1) });
      }
    } else if (endpoint === '/api/generate-timetable') {
      if (plan === 'free' || isExcluded) {
        const plansThisMonth = profile.aiStudyPlansThisMonth || 0;
        if (plansThisMonth >= 5) {
          return res.status(429).json({ 
            error: "You've reached your Free limit (5 Study Plans/month). Upgrade to Pro or Premium for unlimited plans!", 
            code: 'LIMIT_EXCEEDED',
            limit: 5 
          });
        }
        await updateDoc(userRef, { aiStudyPlansThisMonth: increment(1) });
      }
    } else if (endpoint === '/api/generate-podcast') {
      if (plan === 'free' || isExcluded) {
        return res.status(403).json({ error: "Voice Chat & Podcast generator are premium features available in Pro and Premium. Please upgrade.", code: 'PREMIUM_ONLY' });
      }
    }

    next();
  } catch (err: any) {
    console.error('AI access validation error:', err);
    next();
  }
}

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Chat Tutor
app.post('/api/chat', checkAiAccess, async (req, res) => {
  try {
    const { messages, userMessage, systemPrompt, model } = req.body;
    const ai = getGeminiClient();

    // Map message history to format required by GoogleGenAI SDK
    // System instructions are passed separately in the config
    const contents = [
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: model || 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt || "You are an expert friendly AI Study Assistant and Tutor. Explain concepts simply, answer doubts, and provide examples. Support both English and Hindi language responses based on user preference.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during AI chat generation.' });
  }
});

// AI Notes Generator
app.post('/api/generate-notes', checkAiAccess, async (req, res) => {
  try {
    const { title, content, detailLevel, language, easyLanguage } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate highly organized revision notes based on the following title and raw text.
Title: "${title}"
Raw Text: "${content}"

Requirements:
1. Detail Level: ${detailLevel} (short / detailed)
2. Language: ${language} (English / Hindi / Both)
3. Easy Language Simplification: ${easyLanguage ? 'Yes, explain to a beginner' : 'No, keep it standard academic tone'}

Please extract and structure:
- A clear concise summary of the topic.
- Structured detailed notes.
- A bulleted list of 5-10 key points.
- Any important formulas found (if none, return empty array).
- Important definitions (term and explanation).
- A markdown-style mind map outline (indentation representing hierarchy).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            detailedNotes: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            formulas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING }
                },
                required: ['term', 'definition']
              }
            },
            mindMapOutline: { type: Type.STRING }
          },
          required: ['title', 'summary', 'detailedNotes', 'keyPoints', 'formulas', 'definitions', 'mindMapOutline']
        }
      }
    });

    if (!response.text) {
      throw new Error('No content returned from AI');
    }

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error('Notes generation error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during notes generation.' });
  }
});

// PDF / Document Summarizer
app.post('/api/generate-summary', checkAiAccess, async (req, res) => {
  try {
    const { fileName, fileContent } = req.body;
    const ai = getGeminiClient();

    const prompt = `Review the following extracted text from a PDF document named "${fileName}".
Generate a structured learning packet including chapter summaries, key points, formulas, definitions, and concise revision notes.

Extracted Text:
"${fileContent}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Detailed high-level overview/summary of the text" },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Bullet points highlighting critical insights"
            },
            formulas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Equations or mathematical/scientific formulas"
            },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING }
                },
                required: ['term', 'definition']
              },
              description: "Key vocabulary, jargon, and definitions"
            },
            revisionNotes: { type: Type.STRING, description: "Formatted markdown revision notes for quick exam-day prep" }
          },
          required: ['summary', 'keyPoints', 'formulas', 'definitions', 'revisionNotes']
        }
      }
    });

    if (!response.text) {
      throw new Error('No content returned from AI');
    }

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error('PDF Summary error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during PDF summary generation.' });
  }
});

// Flashcards Generator
app.post('/api/generate-flashcards', checkAiAccess, async (req, res) => {
  try {
    const { title, content } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate a set of 5 to 10 high-quality flashcards for revision based on the topic "${title}" and content/context: "${content}".
Each flashcard must have a concise questions/concepts on the front side, and a brief correct answer/explanation on the back side.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: "Question, term, or concept to be quizzed" },
                  back: { type: Type.STRING, description: "Short answer, explanation, or definition" }
                },
                required: ['front', 'back']
              }
            }
          },
          required: ['title', 'cards']
        }
      }
    });

    if (!response.text) {
      throw new Error('No content returned from AI');
    }

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during flashcards generation.' });
  }
});

// Quiz Generator
app.post('/api/generate-quiz', checkAiAccess, async (req, res) => {
  try {
    const { title, content, quizType, questionCount } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate a quiz with exactly ${questionCount || 5} questions based on the topic "${title}" and text content: "${content}".
The quiz should include questions of type: ${quizType || 'mix'} (can be multiple_choice, true_false, or short_answer).

Each question must include:
- question string
- type ('multiple_choice' | 'true_false' | 'short_answer')
- options: array of 4 strings (only for multiple_choice, or exactly ["True", "False"] for true_false)
- correctAnswer: string
- explanation: string explaining why this is the correct answer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['id', 'type', 'question', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['title', 'questions']
        }
      }
    });

    if (!response.text) {
      throw new Error('No content returned from AI');
    }

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during quiz generation.' });
  }
});

// Exam Timetable Planner
app.post('/api/generate-timetable', checkAiAccess, async (req, res) => {
  try {
    const { examName, examDate, studyHours, topics } = req.body;
    const ai = getGeminiClient();

    const prompt = `Act as an expert academic counselor. Generate a structured daily/weekly study timetable leading up to an exam called "${examName}" scheduled on ${examDate}.
The student wants to devote ${studyHours} hours daily.
Topics to cover: "${topics}"

Create:
1. A weekly timetable mapping days of the week to study topics.
2. A list of 4-8 concrete daily tasks or goals to jumpstart preparation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timetable: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "Name of day, e.g., Monday" },
                  topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['day', 'topics']
              }
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                },
                required: ['id', 'text', 'completed']
              }
            }
          },
          required: ['timetable', 'tasks']
        }
      }
    });

    if (!response.text) {
      throw new Error('No content returned from AI');
    }

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error('Timetable generation error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during timetable generation.' });
  }
});


// AI Audio Overview (NotebookLM Podcast Generator)
app.post('/api/generate-podcast', checkAiAccess, async (req, res) => {
  try {
    const { sourceContents } = req.body;
    if (!sourceContents || sourceContents.trim() === '') {
      return res.status(400).json({ error: 'Please select or add study sources first.' });
    }

    const ai = getGeminiClient();

    // 1. Generate the script using gemini-3.5-flash
    const scriptPrompt = `You are a professional audio producer for StudyFlow AI.
Analyze the following study material and generate a highly engaging, friendly, and educational dialogue between two hosts: Liam and Olivia.
They should talk about the material in a lively, natural, conversational way (not reading academic text, but explaining it with fun analogies, enthusiasm, and friendly banter, just like in NotebookLM).
Keep the script compact but meaningful—exactly 4 turns for Liam and 4 turns for Olivia (total 8 turns).

Study Material:
"${sourceContents.substring(0, 10000)}"

Please output the dialogue as JSON in the following schema:
{
  "title": "StudyFlow Radio: Learning Brief",
  "turns": [
    { "speaker": "Liam", "text": "Greeting and introduction to the topic." },
    { "speaker": "Olivia", "text": "Olivia joins in and adds a cool insight or analogy." }
  ]
}
Make sure they are named exactly "Liam" and "Olivia". Do not use markdown inside text, keep it raw speech text.`;

    const scriptResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: scriptPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            turns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ['speaker', 'text']
              }
            }
          },
          required: ['title', 'turns']
        }
      }
    });

    if (!scriptResponse.text) {
      throw new Error('No script content returned from AI');
    }

    const parsedScript = JSON.parse(scriptResponse.text.trim());

    // 2. Generate Multi-speaker speech for the script using gemini-3.1-flash-tts-preview
    const ttsText = parsedScript.turns.map((t: any) => `${t.speaker}: ${t.text}`).join('\n\n');

    const ttsPrompt = `TTS the following conversation between Liam and Olivia:
${ttsText}`;

    const ttsResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Liam',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' } // Male Voice
                }
              },
              {
                speaker: 'Olivia',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Puck' } // Female Voice
                }
              }
            ]
          }
        }
      }
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

    res.json({
      title: parsedScript.title,
      turns: parsedScript.turns,
      audio: base64Audio
    });

  } catch (error: any) {
    console.error('Podcast generation error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during podcast generation.' });
  }
});


// ---------------------------------------------------------
// VITE OR STATIC STATIC SERVING
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build static files.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyFlow AI Server is running on port ${PORT}`);
  });
}

startServer();
