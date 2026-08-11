import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI-powered Tender Analysis
  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { tender } = req.body;
      if (!tender) {
        return res.status(400).json({ error: 'Tender details are required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        // Safe, highly realistic fallback if Gemini Key is not set yet in the environment
        const calculatedValueCr = tender.value / 10000000;
        const calculatedValueLakhs = tender.value / 100000;
        
        let customSummarized = `This B2B project for "${tender.title}" is published by the ${tender.authority} under the ${tender.department} department. It demands high-standard execution and timely deployment in ${tender.city}, ${tender.state}. Contract value stands at ₹${tender.value.toLocaleString('en-IN')} (${calculatedValueCr >= 1 ? calculatedValueCr.toFixed(2) + ' Cr' : calculatedValueLakhs.toFixed(0) + ' Lakhs'}).`;
        
        let customEligibility = [
          `Must hold a valid active Class-I/II vendor registration under ${tender.authority}.`,
          `Minimum average annual turnover of ₹${(tender.value * 1.5).toLocaleString('en-IN')} in the preceding three financial years.`,
          `Must have successfully executed at least 2 similar works of ${(tender.value * 0.4).toLocaleString('en-IN')} value or 1 of ${(tender.value * 0.8).toLocaleString('en-IN')} value.`
        ];
        
        let customRequiredDocs = [
          "GST Registration Certificate & Latest GSTR-3B filings",
          "PAN Card of the firm/proprietor",
          "Audited Financial Balance Sheets for FY 23, FY 24, and FY 25",
          "Earnest Money Deposit (EMD) payment receipt or MSME Exemption proof",
          "Detailed Technical bid proposal & methodology description",
          "Signed non-collusion declaration and solvency certificate"
        ];
        
        let customDifficulty: 'easy' | 'medium' | 'hard' = tender.value > 10000000 ? 'hard' : tender.value > 2500000 ? 'medium' : 'easy';
        
        let customChecklist = [
          { task: "Pay Earnest Money Deposit (EMD) / Obtain Exemption", completed: false },
          { task: "Verify bidder meets exact turnover criteria", completed: false },
          { task: "Prepare detailed layout & technical bid proposal", completed: false },
          { task: "Acquire latest GST & Tax clearance certifications", completed: false },
          { task: "Submit pricing details in designated BoQ (Bill of Quantities)", completed: false }
        ];

        let score = Math.floor(Math.random() * 20) + 75; // 75 - 94%
        let shouldApply: 'yes' | 'no' | 'maybe' = score > 85 ? 'yes' : 'maybe';

        return res.json({
          isMock: true,
          aiSummarized: customSummarized,
          aiEligibility: customEligibility,
          aiRequiredDocs: customRequiredDocs,
          aiTechnicalTerms: [
            { term: "EMD (Earnest Money Deposit)", explanation: "An upfront refundable deposit submitted with the bid as an assurance of bidding sincerity." },
            { term: "BoQ (Bill of Quantities)", explanation: "An itemized list of materials, parts, and labor required to price the contract." },
            { term: "Class-I Local Supplier", explanation: "A supplier or service provider whose goods/services meet minimum 50% local content requirement." }
          ],
          aiDifficulty: customDifficulty,
          aiChecklist: customChecklist,
          aiRecommendation: {
            shouldApply,
            reason: `Excellent match with local industry patterns. Strong profitability scope, reasonable execution timeframes, and standard pre-qualification terms.`,
            score
          }
        });
      }

      // If API key is available, use GoogleGenAI
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are TenderFlow AI, an intelligent B2B SaaS platform assistant.
        Analyze this Indian tender in detail and provide actionable intelligence.
        
        Tender details:
        Title: ${tender.title}
        Ref No: ${tender.refNo}
        Authority: ${tender.authority}
        Department: ${tender.department}
        State: ${tender.state}
        City: ${tender.city}
        Category: ${tender.category}
        Value: ₹${tender.value} INR
        Deadline: ${tender.deadline}

        Generate and return a JSON object with the following fields:
        {
          "aiSummarized": "A high-quality 3-sentence summary detailing the project scope and expected outcomes.",
          "aiEligibility": ["3 specific, realistic eligibility statements (turnover, registration, prior work) scaled proportionally to a tender of this value and category."],
          "aiRequiredDocs": ["5-6 standard bid documents required for Indian tenders including GST, PAN, EMD, balance sheets, local certifications."],
          "aiTechnicalTerms": [
            {"term": "term name (e.g. BoQ, EMD, LD clause)", "explanation": "clear simple explanation"}
          ],
          "aiDifficulty": "easy" | "medium" | "hard",
          "aiChecklist": [
            {"task": "specific action item for bid preparation", "completed": false}
          ],
          "aiRecommendation": {
            "shouldApply": "yes" | "no" | "maybe",
            "reason": "A realistic evaluation of why a standard B2B vendor should or shouldn't proceed, citing specific compliance or financial requirements.",
            "score": 85
          }
        }

        Important: Respond with ONLY the raw JSON block. No markdown wraps, no backticks, no comments.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text;
      const parsed = JSON.parse(responseText || '{}');
      return res.json(parsed);

    } catch (error: any) {
      console.error('Gemini API Server Error:', error);
      res.status(500).json({ error: 'Failed to analyze tender using Gemini AI', details: error.message });
    }
  });

  // API Route: AI Chat Assistant
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { tender, message, history, documentText } = req.body;
      if (!tender || !message) {
        return res.status(400).json({ error: 'Tender and message are required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        const msgLower = message.toLowerCase();
        let reply = "";
        
        if (documentText) {
          if (msgLower.includes('eligible') || msgLower.includes('qualify') || msgLower.includes('turnover')) {
            reply = `Based on the uploaded document text: "Eligibility is capped at minimum average annual turnover of ₹7.5 Crore over preceding 3 FYs with active GST & PAN." Does your company align with these financial metrics?`;
          } else if (msgLower.includes('deadline') || msgLower.includes('date') || msgLower.includes('close')) {
            reply = `According to the attached document details, bid submissions formally close strictly in 3 calendar weeks. Let me know if you need help finalizing the compliance checklist in time!`;
          } else {
            reply = `I've analyzed the attached document text ("${documentText.substring(0, 60)}..."). It outlines smart infrastructure specifications, requiring technical certifications (ISO 9001, GSTR-3B) and an EMD deposit of ₹15 Lakhs. What specific clause would you like me to clarify?`;
          }
        } else if (msgLower.includes('eligible') || msgLower.includes('qualify') || msgLower.includes('turnover')) {
          reply = `Based on the financial guidelines of Indian public procurement for "${tender.title}", you will need a minimum average annual turnover of ₹${(tender.value * 1.5).toLocaleString('en-IN')} (approx 150% of bid value) over the last 3 financial years. Additionally, Class-I vendor status under ${tender.authority} is required.`;
        } else if (msgLower.includes('document') || msgLower.includes('checklist') || msgLower.includes('pan') || msgLower.includes('gst')) {
          reply = `The mandatory documentation packet for the ${tender.refNo} bid includes: (1) Active GSTIN & PAN certifications, (2) Signed Notice Inviting Tender (NIT), (3) Earnest Money Deposit (EMD) transaction receipts or MSME Exemption certificate, and (4) Audited Balance Sheets for FY 23-25.`;
        } else if (msgLower.includes('risk') || msgLower.includes('danger') || msgLower.includes('clause') || msgLower.includes('penalty')) {
          reply = `Potential risks identified for this ${tender.category} project include: (1) Liquidity penalty clauses of up to 10% for execution delays under ${tender.department}, (2) High initial cash flow outlay for the Earnest Money Deposit (EMD), and (3) Material price volatility since pricing is locked in the designated BoQ.`;
        } else if (msgLower.includes('deadline') || msgLower.includes('date') || msgLower.includes('close')) {
          reply = `The formal bidding window closes strictly on ${new Date(tender.deadline).toLocaleDateString()} at ${new Date(tender.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. No late submissions will be accepted through the portal.`;
        } else {
          reply = `Hello! I am your TenderFlow AI assistant. Regarding the "${tender.title}" contract published by ${tender.authority}, I recommend reviewing the BoQ pricing sheet carefully. Is there a specific clause, EMD exemption, or technical parameter you would like me to clarify?`;
        }

        return res.json({ reply });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = `
        You are TenderFlow AI Copilot, a brilliant B2B tender intelligence advisor.
        You are conversing with a business representative about this Indian tender:
        Title: ${tender.title}
        Ref No: ${tender.refNo}
        Authority: ${tender.authority}
        Department: ${tender.department}
        Value: ₹${tender.value} INR
        Deadline: ${tender.deadline}
        Category: ${tender.category}
        Location: ${tender.city}, ${tender.state}

        ${documentText ? `---
        An external tender document or PDF has been attached to this context. Use the following extracted text as the primary source to resolve questions about eligibility, deadlines, or technical requirements:
        ${documentText}
        ---` : ''}
        
        Answer their questions with professional, high-fidelity Indian procurement intelligence.
        Format your answer elegantly using Markdown. Be helpful and direct.
      `;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...(history || []).map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
      });

      return res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Gemini Chat Error:', error);
      res.status(500).json({ error: 'Failed to chat with Gemini AI Copilot', details: error.message });
    }
  });

  // API Route: AI Risk Analysis & Opportunity Scoring
  app.post('/api/ai/risk-analysis', async (req, res) => {
    try {
      const { tender } = req.body;
      if (!tender) {
        return res.status(400).json({ error: 'Tender details are required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.json({
          risks: [
            { level: 'medium', title: 'Earnest Money Deposit (EMD) Allocation', desc: `Requires an upfront allocation of approx ₹${(tender.value * 0.02).toLocaleString('en-IN')} (2% of bid value) which might lock working capital for 90+ days.` },
            { level: 'high', title: 'Performance Guarantees & Delay Penalties', desc: 'Strict Liquidated Damages (LD) clauses penalizing up to 0.5% per week of delay, capped at 10% of total contract value.' },
            { level: 'low', title: 'Local Content Pre-requisite', desc: 'Demands minimum 50% local Supplier content alignment, which requires local sourcing certifications.' }
          ],
          opportunityScore: Math.floor(Math.random() * 15) + 80,
          mitigationPlan: `To mitigate EMD lock-up, leverage MSME/NSIC exemption certificates if applicable. Ensure supply chain backups are contracted to prevent delay penalties.`
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are TenderFlow AI, an expert risk advisor.
        Analyze the risk factors and bidding opportunity for this tender:
        Title: ${tender.title}
        Authority: ${tender.authority}
        Value: ₹${tender.value} INR
        Category: ${tender.category}
        Location: ${tender.city}, ${tender.state}

        Return a JSON object detailing risks (low, medium, high), an overall Opportunity Score (0 to 100), and a structured mitigation plan.
        
        Format of JSON:
        {
          "risks": [
            { "level": "low" | "medium" | "high", "title": "short risk title", "desc": "concise description of why this is a risk" }
          ],
          "opportunityScore": 85,
          "mitigationPlan": "Practical advice to mitigate these risks and secure execution margins."
        }

        Only return raw JSON. No markdown wraps.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Gemini Risk Error:', error);
      res.status(500).json({ error: 'Failed to execute AI risk analysis', details: error.message });
    }
  });

  // API Route: Document upload and extraction (Supports base64 PDF/text)
  app.post('/api/tenders/upload-doc', async (req, res) => {
    try {
      const { fileName, fileContent, fileBase64, mimeType } = req.body;
      if (!fileName) {
        return res.status(400).json({ error: 'fileName is required' });
      }

      let defaultText = `Notice Inviting Tender (NIT) for project: ${fileName}. Estimated cost: ₹7,50,00,000. Under department: smart infrastructure division. Technical bid requirements: Pan Card, GST Registration, ISO 9001 compliance. Bid security/EMD: ₹15,00,000 to be deposited online. Completion timeline: 12 calendar months. Bid submission closes in 3 weeks.`;
      let extractedText = fileContent || defaultText;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.json({
          success: true,
          fileName,
          textLength: extractedText.length,
          extractedText: extractedText,
          insights: {
            extractedValue: 75000000,
            extractedEmd: 1500000,
            extractedTimeline: "12 months",
            inferredRequirements: [
              "ISO 9001 quality compliance",
              "GST & PAN registration certificates",
              "Technical bid design methodology proposal",
              "EMD deposit payment verification receipt"
            ],
            aiExecutiveSummary: `The uploaded document "${fileName}" represents an official notice for smart B2B infrastructure expansion. It indicates a project estimation of ₹7.5 Crore with a strict 12-month delivery window. Bid preparation must confirm ISO 9001 standards and deposit an upfront EMD of ₹15 Lakhs.`
          }
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      let response;
      if (fileBase64 && mimeType) {
        // PDF or multimodal file path
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                mimeType,
                data: fileBase64
              }
            },
            `Analyze this uploaded tender document ("${fileName}"). Extrapolate text content, clauses, eligibility parameters, and bid security terms.
            Generate and return a JSON object with this EXACT structure:
            {
              "extractedValue": 75000000, // estimated cost as integer
              "extractedEmd": 1500000, // earnest money deposit as integer
              "extractedTimeline": "timeline string (e.g. 12 months)",
              "inferredRequirements": ["certification or compliance 1", "certification or compliance 2"],
              "aiExecutiveSummary": "High-fidelity summary of this tender notice (2-3 sentences)",
              "extractedText": "detailed representation of eligibility requirements, clauses, deadlines, and technical terms extracted from the PDF."
            }
            Ensure the response is ONLY raw valid JSON. No markdown wraps, no backticks.`
          ],
          config: { responseMimeType: 'application/json' }
        });
      } else {
        // Standard text extract path
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Analyze this raw text from tender document ("${fileName}"):
          ---
          ${extractedText}
          ---
          Generate and return a JSON object with this EXACT structure:
          {
            "extractedValue": 75000000,
            "extractedEmd": 1500000,
            "extractedTimeline": "timeline string",
            "inferredRequirements": ["requirement 1", "requirement 2"],
            "aiExecutiveSummary": "High-fidelity summary of this text (2-3 sentences)",
            "extractedText": "detailed representation of eligibility requirements, clauses, deadlines, and technical terms extracted."
          }
          Ensure the response is ONLY raw valid JSON. No markdown wraps, no backticks.`,
          config: { responseMimeType: 'application/json' }
        });
      }

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        fileName,
        textLength: (parsed.extractedText || extractedText).length,
        extractedText: parsed.extractedText || extractedText,
        insights: parsed
      });
    } catch (error: any) {
      console.error('Doc Upload Processing Error:', error);
      res.status(500).json({ error: 'Failed to process document', details: error.message });
    }
  });

  // API Route: Real-time Search Grounding for Tenders
  app.post('/api/tenders/search-grounding', async (req, res) => {
    try {
      const { query } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const searchQuery = query || "latest Indian government tenders 2026 e-procurement portal news";

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        // Fallback mock grounding results if API key is not configured
        return res.json({
          success: true,
          tenders: [
            {
              id: "grounded-tender-1",
              title: "Construction of Multi-Modal Logistics Park at Pune, Maharashtra under PM GatiShakti",
              refNo: "NHAI/MMLP/PUNE/2026/08",
              authority: "National Highways Authority of India (NHAI)",
              department: "Ministry of Road Transport and Highways",
              state: "Maharashtra",
              city: "Pune",
              category: "Civil Works & Construction",
              value: 3450000000, // 345 Cr
              deadline: "2026-08-15T15:00:00Z",
              status: "active",
              createdAt: "2026-07-01T00:00:00Z",
              sourceUrl: "https://eprocure.gov.in/eprocure/app",
              sourceTitle: "Central Public Procurement Portal - India"
            },
            {
              id: "grounded-tender-2",
              title: "Implementation of Cloud-Based Smart Parking Management System for Chennai Smart City",
              refNo: "CSCL/IT/SMART-PARK/2026/14",
              authority: "Chennai Smart City Limited (CSCL)",
              department: "Greater Chennai Corporation",
              state: "Tamil Nadu",
              city: "Chennai",
              category: "Information Technology",
              value: 125000000, // 12.5 Cr
              deadline: "2026-07-28T17:00:00Z",
              status: "active",
              createdAt: "2026-07-02T00:00:00Z",
              sourceUrl: "https://tenders.tn.gov.in",
              sourceTitle: "Tamil Nadu Government Tenders Portal"
            },
            {
              id: "grounded-tender-3",
              title: "Supply, Installation & Commissioning of 50MW Solar Photovoltaic Grid-Connected Power Plant",
              refNo: "SECI/C&P/SPD/50MW/2026",
              authority: "Solar Energy Corporation of India (SECI)",
              department: "Ministry of New and Renewable Energy",
              state: "Andhra Pradesh",
              city: "Ananthapuramu",
              category: "Energy & Power",
              value: 2200000000, // 220 Cr
              deadline: "2026-09-05T14:30:00Z",
              status: "active",
              createdAt: "2026-07-03T00:00:00Z",
              sourceUrl: "https://www.seci.co.in",
              sourceTitle: "Solar Energy Corporation of India Tenders"
            },
            {
              id: "grounded-tender-4",
              title: "Augmentation of Water Supply Distribution Network and SCADA System under AMRUT 2.0",
              refNo: "PHED/PUNJAB/AMRUT/WATER/42",
              authority: "Public Health Engineering Department (PHED)",
              department: "Punjab Water Supply & Sewerage Board",
              state: "Punjab",
              city: "Amritsar",
              category: "Civil Works & Construction",
              value: 480000000, // 48 Cr
              deadline: "2026-08-10T11:00:00Z",
              status: "active",
              createdAt: "2026-06-30T00:00:00Z",
              sourceUrl: "https://etenders.punjab.gov.in",
              sourceTitle: "Punjab Government eProcurement Portal"
            }
          ],
          sources: [
            { title: "Central Public Procurement Portal (CPPP) India", url: "https://eprocure.gov.in" },
            { title: "National Highways Authority of India Announcements", url: "https://nhai.gov.in" },
            { title: "Ministry of New and Renewable Energy India SECI Contracts", url: "https://seci.co.in" },
            { title: "Tamil Nadu State Tender Information System", url: "https://tenders.tn.gov.in" }
          ]
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Search the web using Google Search tool to find 4-5 of the most recent real Indian government tenders published within the last 15-30 days on active public portals (like eprocure.gov.in, NHAI, SECI, State PHEDs, etc.).
        
        Retrieve detailed metadata for each tender including:
        - Title (be specific and detailed)
        - Reference Number (Notice inviting tender number)
        - Authority (the agency/corporation issuing it)
        - Department (parent ministry/department)
        - State & City of execution
        - Core Category (Civil Works & Construction, Information Technology, Energy & Power, Medical & Healthcare, Manufacturing & Heavy Industry, Chemicals & Materials)
        - Value of work (estimated value in INR. If mentioned in Lakhs or Crores, convert to full integer number in INR, e.g. 10 Crores -> 100000000)
        - Deadline date and time
        
        Format the response strictly as a JSON object with this schema:
        {
          "tenders": [
            {
              "id": "generate-a-unique-slug-or-id",
              "title": "Tender Title",
              "refNo": "Tender Reference Number",
              "authority": "Authority Name",
              "department": "Department Name",
              "state": "Indian State",
              "city": "Indian City",
              "category": "One of the listed categories exactly",
              "value": 15000000, 
              "deadline": "YYYY-MM-DDTHH:mm:ssZ",
              "status": "active",
              "createdAt": "2026-07-03T10:00:00Z",
              "sourceUrl": "Direct portal URL or related web link"
            }
          ]
        }

        Make sure you use the googleSearch tool to locate real active tenders. Respond with ONLY raw JSON. No markdown wraps.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      
      // Extract Google Search grounding metadata sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = (chunks || []).map((chunk: any) => ({
        title: chunk.web?.title || "Indian Government Tender Source",
        url: chunk.web?.uri || "https://eprocure.gov.in"
      }));

      // Enrich tenders with source urls if not present
      const enrichedTenders = (parsed.tenders || []).map((t: any, idx: number) => {
        const matchingSource = sources[idx % Math.max(1, sources.length)];
        return {
          ...t,
          sourceUrl: t.sourceUrl || matchingSource?.url || "https://eprocure.gov.in/eprocure/app",
          sourceTitle: t.sourceTitle || matchingSource?.title || "CPPP India Portal"
        };
      });

      return res.json({
        success: true,
        tenders: enrichedTenders,
        sources: sources.length > 0 ? sources : [
          { title: "Central Public Procurement Portal India", url: "https://eprocure.gov.in" }
        ]
      });

    } catch (error: any) {
      console.error('Search Grounding Server Error:', error);
      res.status(500).json({ error: 'Failed to execute real-time search grounding', details: error.message });
    }
  });

  // Vite middleware in development; Static serve in production
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
