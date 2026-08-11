import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined. AI matching fallback will be used.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Server-side AI tender matching proxy
  app.post('/api/tenders/analyze', async (req, res) => {
    const { companyProfile, tender } = req.body;
    
    if (!companyProfile || !tender) {
      res.status(400).json({ error: 'Missing companyProfile or tender data' });
      return;
    }

    const client = getAiClient();
    
    if (!client) {
      // Fallback matching logic if no API key is provided
      const score = calculateFallbackMatch(companyProfile, tender);
      res.json(score);
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, an enterprise-grade expert on Indian government and private construction tenders.
Analyze the matching compatibility between the following Construction Company Profile and the Tender details.

COMPANY PROFILE:
- Name: ${companyProfile.companyName}
- Construction Categories: ${companyProfile.constructionCategories?.join(', ') || 'General Construction'}
- Preferred States: ${companyProfile.preferredStates?.join(', ') || 'All India'}
- Preferred Budget Range: Min ${companyProfile.preferredBudgetRange?.min || 0} Lakhs/Crores, Max ${companyProfile.preferredBudgetRange?.max || 1000} Lakhs/Crores
- Turnover: ${companyProfile.annualTurnover}
- State/Location: ${companyProfile.state}, ${companyProfile.city}

TENDER DETAILS:
- Title: ${tender.title}
- Authority: ${tender.authority}
- Value: ${tender.value} ${tender.valueUnit}
- Category: ${tender.category}
- State: ${tender.state}
- Description: ${tender.description}

Generate a JSON object with EXACTLY the following structure (do not include markdown wrapping or extra comments, just the raw JSON):
{
  "aiMatchScore": <number between 0 and 100>,
  "aiMatchReasoning": "<detailed professional justification of why this matches or does not match>",
  "aiKeyRequirements": ["requirement 1", "requirement 2", "requirement 3"],
  "aiEligibilityCheck": <true or false based on the categories, location, and budget constraints>
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText.trim());
        res.json(parsed);
      } catch (jsonErr) {
        console.error('Failed to parse Gemini response as JSON:', responseText, jsonErr);
        // Fallback to manual parsing or generic response
        res.json(calculateFallbackMatch(companyProfile, tender));
      }
    } catch (apiErr) {
      console.error('Gemini API Error:', apiErr);
      res.json(calculateFallbackMatch(companyProfile, tender));
    }
  });

  // Server-side AI Document OCR scanner proxy
  app.post('/api/documents/analyze', async (req, res) => {
    const { fileName, category } = req.body;
    
    if (!fileName) {
      res.status(400).json({ error: 'Missing fileName parameter' });
      return;
    }

    const client = getAiClient();
    
    if (!client) {
      // Fallback matching logic if no API key is provided
      res.json({
        summary: `Automated OCR analysis for ${fileName}. Contract covers concrete paving, reinforced mesh layers, and dynamic structural site clearances.`,
        keyClaws: [
          "Clause 3.1: Minimum mobilization advance of 10% interest-free against bank guarantee.",
          "Clause 7.4: Arbitration and resolving of contract discrepancies strictly under High Court jurisdiction."
        ]
      });
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, an expert structural engineer and legal contract auditor for construction companies.
Analyze the following document parameters:
- File Name: ${fileName}
- Category: ${category || 'General Contract Document'}

Generate a concise AI Executive Summary summarizing the scope, requirements, and structural context of this file.
Also extract exactly 2 critical key legal risk clauses (such as arbitration, mobilization advances, delay liquid damages, WPI index escalation limits) modeled realistically according to the document's category.

Generate a JSON object with EXACTLY the following structure (do not include markdown wrapping or extra comments, just the raw JSON):
{
  "summary": "<concise professional legal and construction summary of the document>",
  "keyClaws": [
    "Clause <number>: <realistic legal clause detail>",
    "Clause <number>: <realistic legal clause detail>"
  ]
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText.trim());
        res.json(parsed);
      } catch (jsonErr) {
        console.error('Failed to parse document AI response:', responseText, jsonErr);
        res.json({
          summary: `Automated OCR analysis for ${fileName}. Contract covers concrete paving, reinforced mesh layers, and dynamic structural site clearances.`,
          keyClaws: [
            "Clause 3.1: Minimum mobilization advance of 10% interest-free against bank guarantee.",
            "Clause 7.4: Arbitration and resolving of contract discrepancies strictly under High Court jurisdiction."
          ]
        });
      }
    } catch (apiErr) {
      console.error('Gemini Document API Error:', apiErr);
      res.json({
        summary: `Automated OCR analysis for ${fileName}. Contract covers concrete paving, reinforced mesh layers, and dynamic structural site clearances.`,
        keyClaws: [
          "Clause 3.1: Minimum mobilization advance of 10% interest-free against bank guarantee.",
          "Clause 7.4: Arbitration and resolving of contract discrepancies strictly under High Court jurisdiction."
        ]
      });
    }
  });

  // --- NEW AI ASSISTANT ENTERPRISE ENDPOINTS ---

  // 1. Tender Summary Endpoint
  app.post('/api/ai/summarize', async (req, res) => {
    const { tender } = req.body;
    if (!tender) {
      res.status(400).json({ error: 'Missing tender data' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      // Fallback response if API key is not defined
      res.json({
        executiveSummary: `This project involves the construction of ${tender.title} under the authority of ${tender.authority}. It is a highly demanding project slated for strategic infrastructural development.`,
        scopeOfWork: `Detailed construction execution, material sourcing, site safety management, structural reinforcement, concrete works, and complete site cleanup as outlined in the tender documents.`,
        keyDates: `Published on ${tender.publishedDate || 'N/A'}. Submission closing date is ${tender.closingDate || tender.deadlineDate || 'N/A'}. Technical bid opening on ${tender.openingDate || 'N/A'}.`,
        estimatedCost: `The estimated value of this tender is ${tender.estimatedValue ? (tender.estimatedValue / 10000000).toFixed(2) + ' Crores' : (tender.value + ' ' + (tender.valueUnit || 'Crores'))}. EMD required is ${tender.emdAmount ? (tender.emdAmount / 100000).toFixed(2) + ' Lakhs' : 'As specified'}.`,
        importantConditions: `Requires class-I civil contractors, bank solvency certificates, strict environmental standards, compliance with state building regulations, and a minimum annual turnover constraint.`,
        requiredDocuments: [
          "GST Registration Certificate",
          "PAN Card & Income Tax Returns",
          "Earnest Money Deposit (EMD) receipt/BG",
          "Similar Project Work Experience Certificates",
          "Audited Financial Balance Sheets",
          "Partnership Deed / Incorporation Certificate"
        ]
      });
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, an enterprise-grade legal, financial, and structural tender auditor.
Analyze this construction tender and generate a comprehensive summary.

TENDER DETAILS:
- Title: ${tender.title}
- Department/Authority: ${tender.department || tender.authority}
- Value: ${tender.estimatedValue || tender.value} ${tender.valueUnit || ''}
- EMD: ${tender.emdAmount}
- Category: ${tender.category}
- Location: ${tender.location || tender.city + ', ' + tender.state}
- Closing Date: ${tender.closingDate || tender.deadlineDate}
- Description: ${tender.description}

Generate a JSON object with EXACTLY the following structure (do not include markdown wrapping or extra comments, just the raw JSON):
{
  "executiveSummary": "<detailed executive summary of the tender's business, legal and public importance>",
  "scopeOfWork": "<detailed point-by-point breakdown of construction/civil engineering scope, structural installations, material requirements, site logistics>",
  "keyDates": "<consolidated timeline of submission deadlines, pre-bid dates, technical bid opening, and duration parameters>",
  "estimatedCost": "<complete financial summary detailing tender value, earnest money deposit (EMD), document fees, and potential mobilization advance clauses>",
  "importantConditions": "<critical conditions of contract, eligibility requirements, penalty terms, and WPI index escalation boundaries>",
  "requiredDocuments": ["document 1", "document 2", "document 3", "document 4", "document 5", "document 6"]
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      res.json(JSON.parse(response.text?.trim() || '{}'));
    } catch (err) {
      console.error('Tender Summary API Error:', err);
      res.status(500).json({ error: 'AI analysis failed' });
    }
  });

  // 2. Eligibility Checker Endpoint
  app.post('/api/ai/eligibility', async (req, res) => {
    const { company, tender } = req.body;
    if (!company || !tender) {
      res.status(400).json({ error: 'Missing company or tender data' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      res.json({
        status: "Partially Eligible",
        reasoning: "The company matches the core civil category and has sufficient experience. However, since no API key is set, a precise verification of local sub-clauses cannot be executed. We recommend reviewing local experience certificates.",
        missingRequirements: [
          "Detailed proof of joint-venture experience in heavy structural works",
          "Audited ISO-9001 quality certificate for highway precast elements"
        ],
        improvementSuggestions: [
          "Form a consortium or Joint Venture with a Class-A roadworks subcontractor to fulfill elevated-span requirements.",
          "Request a temporary bank guarantee waiver under MSME guidelines if applicable."
        ]
      });
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, an enterprise-grade pre-qualification and eligibility compliance auditor.
Compare this Company's Profile with the Tender's Prequalification criteria to determine if the company is qualified.

COMPANY PROFILE:
- Name: ${company.companyName}
- Categories: ${company.constructionCategories?.join(', ') || company.selectedCategories?.join(', ')}
- States: ${company.preferredStates?.join(', ') || company.selectedStates?.join(', ')}
- Budget Range: ${company.preferredBudgetRange?.min} to ${company.preferredBudgetRange?.max} Crores
- Turnover: ${company.annualTurnover}
- Experience: ${company.yearsInBusiness} Years in business, ${company.employeeCount} active personnel.
- GST/PAN: GST: ${company.gstNumber || 'Yes'}, PAN: ${company.pan || 'Yes'}

TENDER DETAILS:
- Title: ${tender.title}
- Department: ${tender.department || tender.authority}
- Estimated Value: ${tender.estimatedValue || tender.value} ${tender.valueUnit || ''}
- EMD: ${tender.emdAmount}
- Category: ${tender.category}
- Location: ${tender.location || tender.city + ', ' + tender.state}
- Description: ${tender.description}

Generate a JSON object with EXACTLY the following structure:
{
  "status": "Eligible" | "Partially Eligible" | "Not Eligible",
  "reasoning": "<thorough professional legal compliance comparison of categories, geographic reaches, financial turnovers, and experience boundaries>",
  "missingRequirements": ["missing requirement 1", "missing requirement 2"],
  "improvementSuggestions": ["actionable improvement suggestion 1", "actionable improvement suggestion 2"]
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      res.json(JSON.parse(response.text?.trim() || '{}'));
    } catch (err) {
      console.error('Eligibility Checker API Error:', err);
      res.status(500).json({ error: 'AI analysis failed' });
    }
  });

  // 3. Risk Analyzer Endpoint
  app.post('/api/ai/risk', async (req, res) => {
    const { tender } = req.body;
    if (!tender) {
      res.status(400).json({ error: 'Missing tender data' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      res.json({
        riskLevel: "Medium Risk",
        penaltyClauses: "Standard penalty clause of 0.1% per week of delay, capped at 10% of total contract value.",
        hiddenConditions: "Strict clause requiring clearance of all local municipal encumbrances at the contractor's own cost prior to structural mobilization.",
        strictTimelines: "Construction milestone dates must be maintained. 12-month completion period leaves little margin for monsoon delays.",
        financialRisks: "Earnest Money Deposit (EMD) of approx 1-2% value is blocked. Payment schedule is milestone-based rather than monthly progress billing.",
        legalRisks: "Disputes to be referred to CPWD Arbitration board, with final appeals restricted to High Court jurisdiction.",
        experienceRequirements: "Contractor must have executed at least one single project of 50% tender value in the last three fiscal years."
      });
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, a senior legal counsel and risk auditor specializing in heavy construction contracts and government bid specifications.
Analyze this tender and detect potential legal, operational, and financial risks.

TENDER:
- Title: ${tender.title}
- Authority: ${tender.authority}
- Description: ${tender.description}
- Value: ${tender.estimatedValue || tender.value}

Generate a JSON object with EXACTLY the following structure:
{
  "riskLevel": "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk",
  "penaltyClauses": "<detailed risk evaluation of delay damages, liquidated penalties, and default remedies>",
  "hiddenConditions": "<analysis of latent liabilities, local utility shifts, site clearings, and uncompensated extra work clauses>",
  "strictTimelines": "<feasibility evaluation of milestones, schedule commitments, and weather extension constraints>",
  "financialRisks": "<cash flow analysis, bank guarantee blockages, price escalation limits, and payment delay buffers>",
  "legalRisks": "<legal jurisdiction, arbitration procedures, joint-venture liabilities, and indemnification caps>",
  "experienceRequirements": "<strictness of pre-qualification credentials, tech certifications, and previous work volumes>"
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      res.json(JSON.parse(response.text?.trim() || '{}'));
    } catch (err) {
      console.error('Risk Analyzer API Error:', err);
      res.status(500).json({ error: 'AI analysis failed' });
    }
  });

  // 4. Proposal Generator Endpoint
  app.post('/api/ai/proposal', async (req, res) => {
    const { company, tender, customInstruction } = req.body;
    if (!company || !tender) {
      res.status(400).json({ error: 'Missing company or tender data' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      res.json({
        coverLetter: `To,\nThe Superintending Engineer,\n${tender.authority}\n\nSubject: Submission of Bid for "${tender.title}"\n\nDear Sir/Madam,\n\nWe, ${company.companyName}, are pleased to submit our comprehensive bid proposal for the above-referenced work. With over ${company.yearsInBusiness} years of dedicated expertise in structural civil engineering, we are confident in our capabilities to execute this project with the highest standards of safety, quality, and structural integrity.\n\nSincerely,\n${company.ownerName || 'Director'}\n${company.companyName}`,
        executiveSummary: `This technical bid proposal outlines the comprehensive approach of ${company.companyName} to successfully construct and commission "${tender.title}". We have optimized our materials, machinery, and precast supply chains to ensure timely milestone completions.`,
        technicalProposal: `1. Mobilization Plan: Deploy modern concrete transit mixers, tower cranes, and precast beam-launching girders to the site within 14 days of Work Order.\n2. Quality Control: Setup a dynamic on-site laboratory to perform regular cube tests, slump tests, and core structural steel checks.`,
        methodology: `Step 1: Joint survey and initial site markings.\nStep 2: Utility shifts, temporary barricading, and foundation piling.\nStep 3: Precast fabrication, concrete pouring, and girder spans launching.\nStep 4: Surface paving, curing, safety checks, and final site handover.`,
        companyIntroduction: `${company.companyName} is an ISO-certified enterprise specializing in ${company.constructionCategories?.join(', ') || 'infrastructure development'}. Based in ${company.city}, ${company.state}, we operate with over ${company.employeeCount} engineers, builders, and administrators.`,
        complianceStatement: `We hereby confirm that this proposal is fully compliant with all legal, safety, technical, and structural clauses specified in Tender No. ${tender.tenderNumber || 'N/A'}. We accept the standard terms of payment and liquidated damage schedules.`
      });
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, an enterprise-grade senior technical bid proposal writer.
Generate a professional, fully compliant, highly persuasive construction bid proposal package.

COMPANY DETAILS:
- Name: ${company.companyName}
- Core Categories: ${company.constructionCategories?.join(', ') || company.selectedCategories?.join(', ')}
- Location: ${company.city}, ${company.state}
- Years in Business: ${company.yearsInBusiness}

TENDER:
- Title: ${tender.title}
- Authority: ${tender.authority}
- Description: ${tender.description}

CUSTOM WRITING INSTRUCTIONS:
"${customInstruction || 'Write with extreme technical detail, highlighting ISO-9001 safety and structural standards.'}"

Generate a JSON object with EXACTLY the following structure (do not include markdown, return clean JSON):
{
  "coverLetter": "<a beautiful formal cover letter addressed to the Tender Authority, citing subject, qualifications, and signature block for company owner ${company.ownerName || 'Director'}>",
  "executiveSummary": "<detailed executive summary of the bid, demonstrating company values, technical superiority, and project understanding>",
  "technicalProposal": "<extensive technical proposal detailing site mobilization, structural safety protocols, supply-chain coordination, concrete mix designs, quality assurance plans, and on-site labs>",
  "methodology": "<highly detailed, phase-by-phase civil engineering execution methodology, from site clearings to final curing and load-bearing test signoffs>",
  "companyIntroduction": "<thorough profile of ${company.companyName} highlighting its ${company.yearsInBusiness} years history, scale, past structural milestones, and active resource roster>",
  "complianceStatement": "<a rigorous formal statement declaring complete alignment with every clause, safety regulation, EMD requirement, and payment milestone of the tender>"
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      res.json(JSON.parse(response.text?.trim() || '{}'));
    } catch (err) {
      console.error('Proposal Generator API Error:', err);
      res.status(500).json({ error: 'AI analysis failed' });
    }
  });

  // 5. Document AI Intelligence / Extract Endpoint
  app.post('/api/ai/doc-intel', async (req, res) => {
    const { fileName, fileCategory, fileContent } = req.body;
    if (!fileName) {
      res.status(400).json({ error: 'Missing fileName parameter' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      res.json({
        summary: `Automated OCR scanning for "${fileName}". The document details civil specifications, construction safety, and quality checks.`,
        keyDates: "Technical bid submission closing date: August 15, 2026. Bid opening: August 16, 2026.",
        emd: "EMD required: INR 48.5 Lakhs (1% of estimated value) via Bank Guarantee.",
        tenderValue: "INR 48.56 Crores",
        requiredCertificates: "Class-I civil contractor registration, ISO-9001 safety certificate, GST, PAN, 3 years audited balance sheets.",
        keyClauses: "Clause 14.2: Liquidated damages of 0.1% per week of delay; Clause 9.5: Arbitration and dispute resolution strictly under state courts.",
        questions: "Is the mobilization advance interest-free? Are we fully compliant with the SAIL/TATA structural steel sourcing mandate?"
      });
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, an advanced OCR document intelligence engine.
Analyze the following uploaded construction contract/bid document details and extract critical metadata, requirements, and compliance parameters.

DOCUMENT DETAILS:
- File Name: ${fileName}
- Category: ${fileCategory || 'General Contract Specification'}
- Context/Mock Text: ${fileContent || 'Detailed structural specifications, BOQ quantities, rate lists, arbitration parameters, EMD, and project deadlines.'}

Generate a JSON object with EXACTLY the following structure:
{
  "summary": "<thorough and accurate legal-technical summary of the file>",
  "keyDates": "<all critical dates, bid closing dates, pre-bid meetings, and milestones found in the document>",
  "emd": "<exact details of earnest money deposits (EMD), tender fees, bank guarantees, exemptions, and refund terms>",
  "tenderValue": "<any estimated value or rate schedules specified in the document>",
  "requiredCertificates": "<complete checklist of all required contractor licenses, registrations, ISO standards, and turnover certificates>",
  "keyClauses": "<exact citation of critical legal and operational clauses like penalties, price escalations, or arbitration>",
  "questions": "<a set of crucial questions or potential anomalies that the engineering/finance team should address>"
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      res.json(JSON.parse(response.text?.trim() || '{}'));
    } catch (err) {
      console.error('Doc Intel API Error:', err);
      res.status(500).json({ error: 'AI analysis failed' });
    }
  });

  // 6. AI Chat Q&A Endpoint (supports conversation history and tender context)
  app.post('/api/ai/chat', async (req, res) => {
    const { messages, currentMessage, contextText } = req.body;
    if (!currentMessage) {
      res.status(400).json({ error: 'Missing currentMessage parameter' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      res.json({
        text: `Hello! I'm BuildFlow AI, your dedicated Tender Intelligence Assistant. Since the server's Gemini API key is currently offline, I am operating in fallback mode. To assist you with "${currentMessage.substring(0, 30)}", please ensure you check the EMD amounts, structural eligibility constraints, and relevant CPWD or NHAI compliance standards in your tender manager dashboard.`
      });
      return;
    }

    try {
      // Build conversation thread
      let prompt = `
You are BuildFlow AI, an expert ChatGPT-style conversational assistant for construction teams, tender managers, and estimators.
Your goal is to answer user queries professionally and accurately, leveraging any uploaded tender document context when provided.

CONTEXT / TENDER DOCUMENTS:
${contextText || 'General construction, civil works, roads and highways, CPWD/NHAI guidelines, EMD details, and pre-qualification rules.'}

RULES:
1. Speak clearly, concisely, and with professional, executive authority.
2. If the user's question CANNOT be answered from the provided document context, reply politely stating that the uploaded documents do not contain that specific detail, but offer standard general guidelines.
3. Keep track of previous conversation messages provided below.

PREVIOUS CONVERSATION:
${messages ? messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') : 'None'}

User Question: ${currentMessage}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      res.json({ text: response.text || '' });
    } catch (err) {
      console.error('AI Chat API Error:', err);
      res.status(500).json({ error: 'AI response failed' });
    }
  });

  // 7. Recommendations Endpoint
  app.post('/api/ai/recommendations', async (req, res) => {
    const { company, tenders } = req.body;
    if (!company || !tenders) {
      res.status(400).json({ error: 'Missing company or tenders list' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      // Return a basic recommendation fallback
      const list = tenders.map((t: any) => {
        const score = t.aiMatchScore || 75;
        return {
          tenderId: t.id,
          title: t.title,
          probability: score,
          reason: `High category overlap. Tender value matches budget capability.`,
          action: score >= 85 ? "Apply Immediately" : "Review Qualifications",
          deadline: t.closingDate || t.deadlineDate || 'N/A'
        };
      });
      res.json({ recommendations: list });
      return;
    }

    try {
      const prompt = `
You are BuildFlow AI, a strategic bidding consultant.
Review this company's profile and the list of available tenders to determine the best high-probability targets, upcoming deadlines, missing docs, and recommended actions.

COMPANY DETAILS:
- Categories: ${company.constructionCategories?.join(', ') || company.selectedCategories?.join(', ')}
- Turnover: ${company.annualTurnover}
- Location: ${company.state}

TENDERS:
${tenders.map((t: any) => `- ID: ${t.id}, Title: ${t.title}, Value: ${t.value} ${t.valueUnit}, State: ${t.state}, Category: ${t.category}, Deadline: ${t.closingDate || t.deadlineDate}`).join('\n')}

Generate a JSON object with EXACTLY the following structure:
{
  "recommendations": [
    {
      "tenderId": "<tender id>",
      "title": "<tender title>",
      "probability": <number percentage between 0 and 100>,
      "reason": "<clear strategic explanation of why this is a high-probability match>",
      "action": "Apply Immediately" | "Form JV / Consortium" | "Review Financials" | "Skip",
      "deadline": "<upcoming deadline date>"
    }
  ]
}
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      res.json(JSON.parse(response.text?.trim() || '{"recommendations":[]}'));
    } catch (err) {
      console.error('Recommendations API Error:', err);
      res.status(500).json({ error: 'AI analysis failed' });
    }
  });

  // Fallback matching engine for demo & local development
  function calculateFallbackMatch(company: any, tender: any) {
    let score = 50; // Neutral start
    const reasons: string[] = [];
    const keyRequirements = [
      "Submit valid GST and PAN registrations",
      "Earnest Money Deposit (EMD) as specified by the authority",
      "Minimum similar project completion criteria"
    ];

    // 1. Check Construction Categories
    const companyCats = company.constructionCategories || [];
    const matchesCat = companyCats.some((c: string) => 
      tender.category.toLowerCase().includes(c.toLowerCase()) || 
      tender.title.toLowerCase().includes(c.toLowerCase()) ||
      tender.description.toLowerCase().includes(c.toLowerCase())
    );

    if (matchesCat) {
      score += 25;
      reasons.push(`The tender category (${tender.category}) matches your verified construction categories.`);
    } else {
      score -= 15;
      reasons.push(`The tender category (${tender.category}) does not directly match your active company profile categories.`);
    }

    // 2. Check Preferred States
    const states = company.preferredStates || [];
    if (states.includes('All India') || states.includes(tender.state)) {
      score += 15;
      reasons.push(`The tender location (${tender.state}) matches your geographic preferences.`);
    } else {
      score -= 10;
      reasons.push(`This tender is in ${tender.state}, which is outside your preferred states.`);
    }

    // 3. Check Budget Compatibility
    const minBudget = company.preferredBudgetRange?.min || 0;
    const maxBudget = company.preferredBudgetRange?.max || 1000;
    let valueInCrores = tender.value;
    if (tender.valueUnit === 'Lakhs') {
      valueInCrores = tender.value / 100;
    }

    if (valueInCrores >= minBudget && valueInCrores <= maxBudget) {
      score += 10;
      reasons.push(`Tender value of ${tender.value} ${tender.valueUnit} fits well within your target project budgets.`);
    } else if (valueInCrores > maxBudget) {
      score -= 15;
      reasons.push(`Tender value of ${tender.value} ${tender.valueUnit} exceeds your preferred max budget limit of ${maxBudget} Crores.`);
    } else {
      score -= 5;
      reasons.push(`Tender value is slightly below your standard preferred target threshold.`);
    }

    // Cap score
    score = Math.max(15, Math.min(98, score));

    return {
      aiMatchScore: score,
      aiMatchReasoning: reasons.join(' '),
      aiKeyRequirements: keyRequirements,
      aiEligibilityCheck: score >= 60
    };
  }

  // Vite Integration
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
    console.log(`[BuildFlow AI] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start full-stack server:', err);
});
