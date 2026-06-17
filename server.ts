import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { google } from "googleapis";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// AI Gateway Abstraction
class AIGateway {
  static async generate(options: any, providerPreference: "gemini" | "local" = "gemini", maxRetries = 3): Promise<{text: string, provider: string}> {
    const providerName = providerPreference === "local" ? "Local Llama 3 8B (Simulated)" : "Gemini 3.1 Flash Lite";
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await ai.models.generateContent({
              ...options,
              model: "gemini-3.1-flash-lite"
            });
            return { text: response.text || "", provider: providerName };
        } catch (error: any) {
             if (error?.status === "RESOURCE_EXHAUSTED" || error?.status === 429 || error?.message?.includes("429")) {
                if (i === maxRetries - 1) throw error;
                const delay = (i + 1) * 5000 + Math.random() * 1000;
                console.log(`Rate limit, retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    return { text: "", provider: providerName };
  }
}

// Deterministic Rule Engine for Classification
function analyzeEmailDeterministically(emailBody: string) {
  const emailLower = emailBody.toLowerCase();
  
  const intent: string[] = [];
  let subIntent = "";
  let urgency = "Low";
  let suggestedAction = "Acknowledge email";
  let riskScore = 0;
  
  // Context adjustment for staffing terminology
  let isStaffingDomain = false;
  if (
    (emailLower.includes("contract to hire") || emailLower.includes("supplier performance") || emailLower.includes("c2h")) ||
    (emailLower.includes("contract") && (emailLower.includes("candidate") || emailLower.includes("resume")))
  ) {
    isStaffingDomain = true;
  }

  // Rule: Recruitment / Submissions
  if (emailLower.includes("resume") || emailLower.includes("candidate") || emailLower.includes("profile") || emailLower.includes("submission") || emailLower.includes("requirement") || isStaffingDomain) {
    intent.push("Recruitment");
    subIntent = "CANDIDATE_SUBMISSION";
    suggestedAction = "Send candidate profiles";
    if (isStaffingDomain) riskScore = Math.min(riskScore, 40);
  } 
  
  // Rule: Vendor Empanelment / Partnership in Staffing
  if (emailLower.includes("staffing capabilities") || emailLower.includes("bench resources") || emailLower.includes("delivery partner") || emailLower.includes("vendor") || emailLower.includes("empanelment") || (emailLower.includes("partnership") && emailLower.includes("staffing"))) {
    intent.push("Business Development");
    subIntent = "VENDOR_EMPANELMENT";
    suggestedAction = "Request company profile and bench";
    riskScore += 25;
  } else if (emailLower.includes("invest") || emailLower.includes("funding") || emailLower.includes("partnership")) {
    intent.push("Corporate");
    subIntent = "INVESTOR_INQUIRY";
    suggestedAction = "Schedule strategic meeting";
    riskScore += 80;
  }
  
  // Rule: Legal (require strict keywords, "contract" alone is too broad)
  const legalKeywords = ["msa", "nda", "agreement", "contract review", "legal notice", "compliance audit"];
  if (legalKeywords.some(kw => emailLower.includes(kw)) && !isStaffingDomain) {
    intent.push("Legal");
    suggestedAction = "Review document";
    riskScore += 90;
  }
  
  // Urgency logic
  if (emailLower.includes("urgent") || emailLower.includes("asap") || emailLower.includes("escalation")) {
    urgency = "High";
  }

  // Calculate generic confidence
  const confidence = intent.length > 0 ? 95 : 0;

  let persona = "BDM";
  let reason = "Vendor partnership and bench sharing discussion";

  if (riskScore >= 80 && !intent.includes("Recruitment")) {
    persona = "CEO";
    reason = "High risk, legal/compliance matters or contract review.";
  } else if (intent.includes("Investor inquiry")) {
    persona = "Founder";
    reason = "Strategic discussion around investments or partnerships.";
  } else if (subIntent === "CANDIDATE_SUBMISSION") {
    persona = "BDM";
    reason = "Standard staffing requirement and candidate submission.";
  }

  return {
    intent,
    subIntent,
    urgency,
    riskScore,
    suggestedAction,
    personaDecision: { persona, confidence, reason },
    confidence
  };
}

function resolveEntityPipeline(senderEmail: string, emailBody: string, extractedCompanyFromLLM: string | undefined, generatedCompany: string | undefined) {
  // Domain Resolver
  const freeDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
  let domain = "";
  if (senderEmail && senderEmail.includes("@")) {
    domain = senderEmail.split("@")[1].toLowerCase();
  }
  
  let domainScore = 0;
  let domainCompany = "";
  if (domain && !freeDomains.includes(domain)) {
      const dbMappings: Record<string, string> = {
          "nxthireindia.com": "Nxthire",
          "mapoutinc.com": "MapOut Digital Solutions",
          "hirenestworkforce.com": "HireNest Workforce Pvt Ltd",
          "nxthire.com": "Nxthire"
      };
      
      if (dbMappings[domain]) {
          domainCompany = dbMappings[domain];
          domainScore = 98;
      } else {
          // Naive domain extraction if not in mapping
          const naive = domain.split(".")[0];
          domainCompany = naive.charAt(0).toUpperCase() + naive.slice(1);
          domainScore = 80;
      }
  }

  // Signature / Body naive extraction wrapper (simulated for simplicity - LLM generally handles this well but we weight domain higher)
  // Let LLM represent the "Body/Signature Extractor" in our pipeline implementation here.
  const llmCompany = extractedCompanyFromLLM || "Unknown";
  const llmScore = (llmCompany !== "Unknown" && llmCompany.toLowerCase() !== "none") ? 82 : 0; // If LLM found something

  let finalCompany = "Unknown";
  let finalConfidence = 0;
  let source = "unknown";

  if (domainScore > 0 && !freeDomains.includes(domain)) {
      finalCompany = domainCompany;
      finalConfidence = domainScore;
      source = "domain";
  } else if (llmScore > 0) {
      finalCompany = llmCompany;
      finalConfidence = llmScore;
      source = "signature/llm"; // simulating our pipeline fallback
  }

  // Entity validation pass checks if the final resolved company is in the generated draft.
  // It also auto-corrects the generated draft if there's a strong finalCompany.
  return {
    canonicalName: finalCompany,
    confidence: finalConfidence,
    source,
    isGmail: freeDomains.includes(domain)
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/analyze-email", async (req, res) => {
    try {
      const { emailBody, persona, knowledgeBase } = req.body;

      if (!emailBody) {
        return res.status(400).json({ error: "Email body is required" });
      }

      // 1. Analyze and classify
      // Hybrid AI approach: Try deterministic first
      let analysis: any = analyzeEmailDeterministically(emailBody);

      // Fallback to LLM if rules didn't catch intent confidently
      if (analysis.confidence < 80) {
        const analysisPrompt = `
        You are an AI Email Assistant for HireNestOS.
        Analyze the following email and determine:
        1. Intent: Is it a Sales lead, Investor inquiry, Business Development, Corporate, Customer Support, Recruitment, Vendor, Internal team, Legal, or Finance? Provide highest probability single category or max two if complex.
        2. Sub-Intent: If Intent is Recruitment or Business Development, choose from (CLIENT_REQUIREMENT, CANDIDATE_SUBMISSION, INTERVIEW_COORDINATION, VENDOR_ONBOARDING, VENDOR_EMPANELMENT, RATE_NEGOTIATION, OFFER_MANAGEMENT). Otherwise, leave empty.
        3. Urgency: High, Medium, or Low.
        4. Suggested Action: e.g., "Schedule a meeting", "Send pitch deck", "Forward to QA".
        5. Risk Score: 0-100 indicating risk of autonomous reply (high for pricing/legal/investor, low for scheduling/acknowledgements).
        6. Persona Decision: Choose the best persona to reply as ("Founder", "CEO", or "BDM").
           - Founder: Investors, Partnerships, Strategic alliances, Funding, Vision
           - CEO: Escalations, Leadership, Hiring decisions, Legal matters, Enterprise contracts
           - BDM: Vendor onboarding, Client requirements, Sales, Bench resources, Follow-ups, Candidate Submissions
           Note: If Risk Score > 85, strongly consider CEO.
        
        Email:
        """
        ${emailBody}
        """
        `;

        const analysisResponse = await AIGateway.generate({
          contents: analysisPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                intent: { type: Type.ARRAY, items: { type: Type.STRING } },
                subIntent: { type: Type.STRING },
                urgency: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                suggestedAction: { type: Type.STRING },
                riskScore: { type: Type.INTEGER },
                personaDecision: {
                  type: Type.OBJECT,
                  properties: {
                    persona: { type: Type.STRING, enum: ["Founder", "CEO", "BDM"] },
                    confidence: { type: Type.INTEGER },
                    reason: { type: Type.STRING },
                  },
                  required: ["persona", "confidence", "reason"],
                }
              },
              required: ["intent", "subIntent", "urgency", "suggestedAction", "riskScore", "personaDecision"],
            },
          },
        }, "gemini");
        analysis = JSON.parse(analysisResponse.text || "{}");
      }

      const activePersona = persona === "Auto" ? analysis.personaDecision.persona : persona;
      
      // Dynamic Memory Retrieval Filter
      let allowedTypes: string[] = ["signature", "calendar"];
      if (analysis.subIntent === "VENDOR_EMPANELMENT") {
          allowedTypes.push("vendor_policy", "sourcing_policy", "company_profile", "contact");
      } else if ((analysis.intent && analysis.intent.includes("Recruitment")) || analysis.subIntent === "CANDIDATE_SUBMISSION") {
          allowedTypes.push("submission_template", "crm", "policy");
      } else if (activePersona === "Founder") {
          allowedTypes.push("vision", "investor", "partnership", "policy");
      } else if (activePersona === "CEO") {
          allowedTypes.push("policy", "legal", "finance");
      } else {
          allowedTypes.push("pricing", "crm", "vendor", "ats");
      }

      const filteredKnowledgeBase = knowledgeBase.filter((k: any) => allowedTypes.includes(k.type));

      // 2. Generate Draft Document
      let systemInstruction = `You are drafting an email as Gopala Krishna S V.
      Always format the email professionally using HTML formatting (e.g. <p>, <br>) if needed. `;
      
      if (activePersona === "Founder" || analysis.subIntent === "INVESTOR_INQUIRY") {
          systemInstruction += `\nYour designation is Founder & Managing Director of HireNest Workforce Pvt Ltd.
          Always end the email with the HTML signature exactly as provided in the Memanto Memory Context under "Signature_Founder" if present.`;
      } else {
          systemInstruction += `\nYour designation is Managing Director of HireNest Workforce Pvt Ltd.
          Always end the email with the HTML signature exactly as provided in the Memanto Memory Context under "Signature_MD" if present.`;
      }
      
      if (analysis.subIntent === "CANDIDATE_SUBMISSION") {
        systemInstruction += `\nAct as a Senior Key Account Manager and Managing Director of an IT Staffing company.
        Generate responses exactly in staffing vendor submission style.
        Tone: Professional, Executive, Relationship-driven, Concise, Enterprise-focused.
        Avoid: Casual greetings, Startup language, Generic AI phrases, Excessive enthusiasm.
        Mandatory sections:
        1. Requirement acknowledgment
        2. Candidate summary (Names, Experience, Notice Period, Rates if applicable)
        3. Attachments mentioned
        4. Key highlights & Commitment (e.g., briefed on hybrid model, committed to avoid backout)
        5. Request for feedback/interviews
        
        Never generate discovery-call language. Never introduce partnership discussions. Never request introductory meetings.`;
      } else if (analysis.subIntent === "VENDOR_EMPANELMENT") {
        systemInstruction += `\nAct as a Senior Key Account Manager and Managing Director of an IT Staffing company.
        Tone: Professional, Executive, Relationship-driven, Warm, Collaborative, Enterprise-focused.
        Avoid: Casual greetings, Startup language, overly compliance-heavy restrictions, Generic AI phrases (like "I see potential for a meaningful collaboration").
        Guidelines:
        - Use "Dear Firstname Lastname," (preserving the sender's full name, e.g. "Dear Raghu Ram,").
        - Open with something similar to: "Thank you for reaching out and sharing the details about [Company]'s global staffing capabilities."
        - Acknowledge their presence: "We appreciate your interest in collaborating with HireNest Workforce and are impressed by [Company]'s expansive global presence across APAC, Europe, and LATAM, along with your diverse technology expertise."
        - Avoid "demand", use "expect" for a softer enterprise tone.
        - Use "delivery capabilities and available resources" rather than "bench availability".
        - Mention: "At HireNest Workforce Pvt Ltd, we specialize in IT Staffing, Contract Staffing, C2H, and Permanent recruitment. Our core focus areas include SAP, Salesforce, ServiceNow, Data Engineering, Cloud & DevOps, AI/ML, and Full Stack technologies. We primarily collaborate with partners who maintain genuine in-house or payroll-based resources to ensure the delivery reliability that our enterprise clients expect."
        - State: "We would be delighted to explore areas where both organizations can support each other across current and future opportunities. To help us align our efforts, could you please provide the following details:"
        - Request details in a bulleted list (use •): Company profile and service offerings, Vendor onboarding or empanelment process, Commercial terms and payment cycle, NDA/MSA templates if applicable, Client engagement model (Direct Client / Implementation Partner / Prime Vendor), Active hiring requirements, delivery capabilities, and available resources.
        - Add a line inviting immediate collaboration: "If there are any immediate requirements where HireNest can support, please feel free to share them with us."
        - End with: "Looking forward to your response and a fruitful collaboration."
        - Sign off with "Warm Regards," followed by the signature.
        If a template named "VENDOR_EMPANELMENT_TEMPLATE_V1" is provided in the Memanto Memory Context, format your response exactly according to that template.`;
      } else if (activePersona === "Founder") {
        systemInstruction += " \nTone should be visionary but executive. Focus on strategic conversations, partnerships, investors.";
      } else if (activePersona === "CEO") {
        systemInstruction += " \nTone: Professional, executive, decisive. Focus on leadership updates, hiring, customer escalations. Avoid casual startup language.";
      } else if (activePersona === "BDM") {
        systemInstruction += `\nAct as a Senior Key Account Manager and Managing Director of an IT Staffing company.
        Tone: Professional, Executive, Relationship-driven, Concise, Enterprise-focused.
        Avoid: Casual greetings, Startup language, Generic AI phrases, Excessive enthusiasm.
        Focus on lead nurturing, sales follow-ups, negotiations.`;
      }

      const draftPrompt = `
      Write a reply to the following email.
      Use ONLY the following Memanto memory items if relevant. Do not hallucinate company policies.
      Keep it short, natural, and adapt to the persona.

      Memanto Memory Context (Version 2 - Typed):
      ${filteredKnowledgeBase?.map((k: any) => `[ID: ${k.id} | TYPE: ${k.type.toUpperCase()}] ${k.key}: ${k.value}`).join("\\n") || "No specific memory items configured."}
      
      Return a JSON object containing the draft text and an array of memory IDs that were actually used to formulate the draft.

      Incoming Email:
      """
      ${emailBody}
      """
      `;

      const draftResponse = await AIGateway.generate({
        contents: draftPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              draft: { type: Type.STRING },
              usedMemoryIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["draft", "usedMemoryIds"],
          },
          systemInstruction: systemInstruction,
        },
      }, analysis.riskScore < 40 ? "local" : "gemini");

      const draftData = JSON.parse(draftResponse.text || "{}");
      const draftProvider = draftResponse.provider;
      const retrievedMemories = knowledgeBase.filter((k: any) => (draftData.usedMemoryIds || []).includes(k.id));

      const validationPrompt = `
      Compare the generated email draft with the source email.

      Task: Check for hallucinations, missing details, or incorrect persona/tone.
      - Reject if wrong subject or unrelated context (e.g. talking about leadership escalation when it's just a candidate submission).
      - Ensure Candidate names, roles, and details from the source email are perfectly retained.
      - Extract the 'extractedCompany' from the Source Email (e.g. Nxthire).
      - Extract the 'generatedCompany' mentioned in the Generated Draft.
      - 'entityValidationPassed' should be true if 'extractedCompany' is correctly matched or included in the 'generatedCompany', otherwise false.
      
      Source Email:
      """
      ${emailBody}
      """

      Generated Draft:
      """
      ${draftData.draft}
      """

      Memories allowed:
      ${JSON.stringify(retrievedMemories)}

      Output JSON with:
      - groundingScore (0.0-1.0: 1 means perfectly grounded)
      - hallucinationScore (0.0-1.0: 1 means completely hallucinated)
      - grounded (boolean)
      - missingEntities (array of strings)
      - extractedCompany (string)
      - generatedCompany (string)
      - entityValidationPassed (boolean)
      - passed (boolean: true if groundingScore > 0.85 and drafted appropriately)
      `;

      const validationResponse = await AIGateway.generate({
        contents: validationPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              groundingScore: { type: Type.NUMBER },
              hallucinationScore: { type: Type.NUMBER },
              grounded: { type: Type.BOOLEAN },
              missingEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
              extractedCompany: { type: Type.STRING },
              generatedCompany: { type: Type.STRING },
              entityValidationPassed: { type: Type.BOOLEAN },
              passed: { type: Type.BOOLEAN }
            },
            required: ["groundingScore", "hallucinationScore", "grounded", "missingEntities", "passed", "extractedCompany", "generatedCompany", "entityValidationPassed"]
          }
        }
      }, "gemini");
      
      const grounding = JSON.parse(validationResponse.text || "{}");

      let businessQuality = null;

      if (analysis.subIntent === "CANDIDATE_SUBMISSION" || analysis.intent?.includes("Recruitment")) {
        const businessQualityPrompt = `
        Evaluate the business quality of the generated staffing email draft.
        
        Source Email:
        """
        ${emailBody}
        """

        Generated Draft:
        """
        ${draftData.draft}
        """

        Evaluate based on IT Staffing standards:
        - Completeness: Does it acknowledge the requirement, list candidates clearly, mention attachments, and interview coordination?
        - Professionalism: Is the tone appropriate for an enterprise IT staffing client?
        - Staffing Relevance: Does it use staffing terminology correctly? Does it address supplier concerns if applicable?
        - Location Validation: If the client requests a specific location (e.g. Bangalore), extract it and verify if the submitted candidates match. If no location is required, mark passed as true.
        
        Output JSON with:
        - completenessScore (0.0-1.0)
        - professionalismScore (0.0-1.0)
        - staffingRelevanceScore (0.0-1.0)
        - missingSections (array of strings, e.g., missing candidate names, missing attachment mention)
        - passed (boolean: true if all scores > 0.85 and locationValidation.passed is true)
        - locationValidation: object with requiredLocation (string), candidateLocation (string), and passed (boolean)
        `;

        const bqResponse = await AIGateway.generate({
          contents: businessQualityPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                completenessScore: { type: Type.NUMBER },
                professionalismScore: { type: Type.NUMBER },
                staffingRelevanceScore: { type: Type.NUMBER },
                missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
                passed: { type: Type.BOOLEAN },
                locationValidation: {
                  type: Type.OBJECT,
                  properties: {
                    requiredLocation: { type: Type.STRING },
                    candidateLocation: { type: Type.STRING },
                    passed: { type: Type.BOOLEAN }
                  },
                  required: ["requiredLocation", "candidateLocation", "passed"]
                }
              },
              required: ["completenessScore", "professionalismScore", "staffingRelevanceScore", "missingSections", "passed"]
            }
          }
        }, "gemini");

        businessQuality = JSON.parse(bqResponse.text || "{}");
      }

      // 4. Entity Resolution Engine
      const entityResolution = resolveEntityPipeline(senderEmail, emailBody, grounding.extractedCompany, grounding.generatedCompany);
      
      let isAutoCorrected = false;
      let originalGenerated = grounding.generatedCompany;
      
      // Auto-correct draft if we have high confidence on domain resolver
      if (entityResolution.confidence >= 90 || (entityResolution.isGmail && entityResolution.confidence >= 80)) {
         if (grounding.generatedCompany && grounding.generatedCompany !== "Unknown" && grounding.generatedCompany !== entityResolution.canonicalName) {
            // Simple replace in the draft
            draftData.draft = draftData.draft.replace(new RegExp(grounding.generatedCompany, 'g'), entityResolution.canonicalName);
            grounding.entityValidationPassed = true;
            isAutoCorrected = true;
         }
      } else {
         // Rely on LLM generated entity validation
         if (!grounding.entityValidationPassed) {
             grounding.entityValidationPassed = false;
         }
      }
      
      grounding.extractedCompany = entityResolution.canonicalName; // For UI display

      // Calculate Trust Engine Score
      const memoryScore = retrievedMemories.length > 0 ? 100 : 50;
      const deterministicScore = Math.max(50, analysis.confidence || 0);
      const gScore = (grounding.groundingScore || 0) * 100;
      const hScore = (grounding.hallucinationScore || 0) * 100;
      let bScore = 100;
      if (businessQuality) {
        bScore = ((businessQuality.completenessScore + businessQuality.professionalismScore + businessQuality.staffingRelevanceScore) / 3) * 100;
      }
      
      const entityScore = entityResolution.confidence;
      let trustScore = (0.30 * gScore) + (0.25 * bScore) + (0.20 * memoryScore) + (0.15 * entityScore) + (0.10 * deterministicScore);
      
      let canOneClickSend = trustScore >= 95 && analysis.riskScore <= 30 && grounding.entityValidationPassed && hScore < 5;
      
      if (entityResolution.isGmail) {
          canOneClickSend = canOneClickSend && entityResolution.confidence >= 85;
      }
      
      let isAutoSend = false;
      let requiresApproval = !canOneClickSend;
      let action = [analysis.suggestedAction || "Review email"];
      
      switch(analysis.subIntent) {
        case "CANDIDATE_SUBMISSION":
            action = ["validateAttachments", "createSubmission", "attachResume", "draftEmail"];
            requiresApproval = true;
            break;
        case "VENDOR_EMPANELMENT":
            action = ["createVendorRecord", "draftReply", "tagVendor"];
            if (canOneClickSend) requiresApproval = false;
            break;
        case "CLIENT_REQUIREMENT":
            action = ["createATSRequirement", "notifyRecruiters"];
            requiresApproval = true;
            break;
        case "INTERVIEW_COORDINATION":
            action = ["createCalendarInvite", "notifyCandidate"];
            if (canOneClickSend) requiresApproval = false;
            break;
      }

      const confidenceEngine = {
        deterministicScore,
        memoryScore,
        groundingScore: gScore,
        businessScore: bScore,
        trustScore,
        entityScore,
        canOneClickSend,
        isAutoSend,
        provider: draftProvider,
        action,
        requiresApproval,
        entityResolution: {
          canonicalName: entityResolution.canonicalName,
          confidence: entityResolution.confidence,
          source: entityResolution.source,
          isAutoCorrected,
          originalGenerated
        }
      };

      res.json({
        analysis,
        draft: draftData.draft,
        retrievedMemories,
        appliedPersona: activePersona,
        grounding,
        businessQuality,
        confidenceEngine
      });

    } catch (error: any) {
      console.error("Error analyzing email:", error);
      res.status(500).json({ error: error?.message || "Failed to analyze email" });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, cc, subject, htmlBody } = req.body;
      const accessToken = req.headers.authorization?.split(" ")[1];
      
      if (!accessToken) {
        return res.status(401).json({ error: "Missing Gmail access token" });
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: "v1", auth });

      // Construct primitive raw email
      const emailLines = [];
      emailLines.push(`To: ${(to || []).join(",")}`);
      if (cc && cc.length > 0) emailLines.push(`Cc: ${cc.join(",")}`);
      emailLines.push('Content-Type: text/html; charset="UTF-8"');
      emailLines.push('MIME-Version: 1.0');
      emailLines.push(`Subject: ${subject}`);
      emailLines.push("");
      emailLines.push(htmlBody);

      const raw = Buffer.from(emailLines.join("\r\n"))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const result = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: raw
        }
      });

      res.json({ success: true, messageId: result.data.id });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: error?.message || "Failed to send email via Gmail API" });
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
