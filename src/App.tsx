import { useState } from "react";
import { Mail, Sparkles, Settings2, UserCog, Database, Send, ChevronRight, Inbox, Clock, Target, Tag, ArrowRight, BrainCircuit, ShieldAlert, CheckCircle2, Activity, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Persona, TypedMemoryItem, AnalysisResult, ApiResponse, GroundingResult, BusinessQualityResult, ConfidenceEngineResult } from "./types";
import { cn } from "./lib/utils";

export default function App() {
  const [emailBody, setEmailBody] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [persona, setPersona] = useState<Persona>("Auto");
  const [knowledgeBase, setKnowledgeBase] = useState<TypedMemoryItem[]>([
    { id: "1", type: "crm", priority: 10, key: "Company", value: "HireNest Workforce Pvt Ltd", active: true },
    { id: "2", type: "policy", priority: 9, key: "Business", value: "IT Staffing, Recruitment, Vendor Network", active: true },
    { id: "3", type: "policy", priority: 10, key: "Sourcing Policy", value: "Only payroll bench accepted.", active: true },
    { id: "4", type: "pricing", priority: 8, key: "Payment Terms", value: "Payment terms: 45 days.", active: true },
    { id: "5", type: "signature", priority: 10, key: "Signature_MD", value: "<table><tr><td><img src='logo.png' width='90'/></td><td><b>Gopala Krishna S V</b><br/>Managing Director<br/>HireNest Workforce Pvt Ltd<br/>📞 +91 9392894748<br/>✉ gopal@hirenestworkforce.com<br/>🌐 www.hirenestworkforce.com<br/>📍 Hyderabad, Telangana, India</td></tr></table>", active: true, format: "html" },
    { id: "5b", type: "signature", priority: 10, key: "Signature_Founder", value: "<table><tr><td><img src='logo.png' width='90'/></td><td><b>Gopala Krishna S V</b><br/>Founder & Managing Director<br/>HireNest Workforce Pvt Ltd<br/>📞 +91 9392894748<br/>✉ gopal@hirenestworkforce.com<br/>🌐 www.hirenestworkforce.com<br/>📍 Hyderabad, Telangana, India</td></tr></table>", active: true, format: "html" },
    { id: "6", type: "calendar", priority: 5, key: "Calendly", value: "calendly.com/gopal", active: true },
    { id: "7", type: "pricing", priority: 9, key: "Pricing", value: "Contract staffing margins: 20-25%", active: true },
    { id: "8", type: "vision", priority: 10, key: "Vision", value: "Building an AI-native Staffing Operating System.", active: true },
    { id: "9", type: "submission_template", priority: 10, key: "Submission Template", value: "Hi [Client], please find attached the technically evaluated profiles. Submitted Candidates: [List]. Kindly let us know if you would like to schedule interviews. Note: All submitted candidates have been briefed on the hybrid work model and interview process. We have emphasized commitment to avoid any backout post selection.", active: true },
    { id: "10", type: "company_profile", priority: 10, key: "Company Profile", value: "We primarily collaborate with partners having genuine in-house or payroll-based resources and focus on building long-term relationships.", active: true },
    { id: "11", type: "vendor_policy", priority: 9, key: "Vendor Policy", value: "Request company profile, service offerings, and any available bench resources or hiring capabilities relevant to IT staffing.", active: true },
    { id: "12", type: "contact", priority: 10, key: "Contact: Nxthire", value: "Vendor | Global Staffing Partner | Tier: Gold (High Response Rate, Excellent Submission Quality, High Placement Success)", active: true },
    { id: "13", type: "vendor_template", priority: 10, key: "VENDOR_EMPANELMENT_TEMPLATE_V1", value: "Dear [Name],\n\nThank you for reaching out and sharing the details about [Company]'s global staffing capabilities.\n\nWe appreciate your interest in collaborating with HireNest Workforce and are impressed by [Company]'s expansive global presence across APAC, Europe, and LATAM, along with your diverse technology expertise.\n\nAt HireNest Workforce Pvt Ltd, we specialize in IT Staffing, Contract Staffing, C2H, and Permanent recruitment. Our core focus areas include SAP, Salesforce, ServiceNow, Data Engineering, Cloud & DevOps, AI/ML, and Full Stack technologies. We primarily collaborate with partners who maintain genuine in-house or payroll-based resources to ensure the delivery reliability that our enterprise clients expect.\n\nWe would be delighted to explore areas where both organizations can support each other across current and future opportunities. To help us align our efforts, could you please provide the following details:\n\n• Company profile and service offerings\n• Vendor onboarding or empanelment process\n• Commercial terms and payment cycle\n• NDA/MSA templates, if applicable\n• Client engagement model (Direct Client / Implementation Partner / Prime Vendor)\n• Active hiring requirements, delivery capabilities, and available resources\n\nIf there are any immediate requirements where HireNest can support, please feel free to share them with us.\n\nLooking forward to your response and a fruitful collaboration.\n\nWarm Regards,", active: true, format: "html" }
  ]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [draft, setDraft] = useState("");
  const [retrievedMemories, setRetrievedMemories] = useState<TypedMemoryItem[]>([]);
  const [appliedPersona, setAppliedPersona] = useState<string>("");
  const [grounding, setGrounding] = useState<GroundingResult | null>(null);
  const [businessQuality, setBusinessQuality] = useState<BusinessQualityResult | null>(null);
  const [confidenceEngine, setConfidenceEngine] = useState<ConfidenceEngineResult | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const handleAnalyze = async () => {
    if (!emailBody.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setDraft("");
    setRetrievedMemories([]);
    setAppliedPersona("");
    setGrounding(null);
    setBusinessQuality(null);
    setConfidenceEngine(null);

    try {
      const response = await fetch(`${API_BASE}/api/analyze-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailBody, senderEmail, persona, knowledgeBase })
      });
      
      const data: ApiResponse = await response.json();
      if (data.error) throw new Error(data.error);
      
      setAnalysis(data.analysis);
      setDraft(data.draft);
      setRetrievedMemories(data.retrievedMemories || []);
      setAppliedPersona(data.appliedPersona || "");
      setGrounding(data.grounding || null);
      setBusinessQuality(data.businessQuality || null);
      setConfidenceEngine(data.confidenceEngine || null);
    } catch (e) {
      console.error(e);
      setDraft("Failed to generate draft. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // mock token if real auth isn't integrated yet
        // headers: { "Content-Type": "application/json", "Authorization": "Bearer mock-token" },
        body: JSON.stringify({
          to: ["raghu@nxthire.com"], // Hardcoded for demo purposes
          subject: "Re: Partnership Inquiry",
          htmlBody: draft
        })
      });

      if (response.ok) {
        setSendSuccess(true);
      } else {
        const errorData = await response.json();
        console.error("Failed to send email:", errorData);
        alert(`Failed to send: ${errorData.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] text-slate-900 font-sans">
      {/* Sidebar - Config */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">HireNestOS</h1>
        </div>

        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              <UserCog className="w-4 h-4" />
              Response Persona
            </div>
            <div className="space-y-2">
              {(["Auto", "Founder", "CEO", "BDM"] as Persona[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group",
                    persona === p 
                      ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" 
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="font-medium">{p} Mode</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    persona === p ? "text-slate-900" : "text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                  )} />
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed px-1">
              {persona === "Auto" && "AI automatically routes the email to the best persona based on intent and risk score."}
              {persona === "Founder" && "Focuses on vision, partnerships, investors, and strategic conversations."}
              {persona === "CEO" && "Focuses on leadership communication, updates, hiring, and escalations."}
              {persona === "BDM" && "Focuses on lead nurturing, sales, partnerships, and negotiations."}
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              <BrainCircuit className="w-4 h-4 text-emerald-600" />
              Memanto Memory Layer
            </div>
            <div className="space-y-3">
              {knowledgeBase.map((item) => (
                <div key={item.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-slate-700">{item.key}</div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{item.type}</span>
                  </div>
                  <div className="text-slate-500 text-xs">{item.value}</div>
                </div>
              ))}
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 mt-2">
                <Settings2 className="w-4 h-4" /> Manage Memories
              </button>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
        <div className="w-full max-w-4xl space-y-8 mt-4">
          
          <header className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight mb-3">Memanto-Powered Inbox Agent</h2>
            <p className="text-slate-500">Paste an incoming email below. The AI will recall relevant memories and draft perfectly contextual replies.</p>
          </header>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-shadow focus-within:shadow-md focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" /> Incoming Email
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">From:</span>
                <input 
                  type="email" 
                  value={senderEmail} 
                  onChange={(e) => setSenderEmail(e.target.value)} 
                  placeholder="sender@domain.com (Optional)"
                  className="bg-white text-slate-700 text-xs px-2 py-1 outline-none border border-slate-200 rounded-md w-64 focus:border-slate-400"
                />
              </div>
            </div>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="e.g. We have 20 freelancers on our payroll bench available. Let me know if you need profiles."
              className="w-full h-48 p-5 outline-none resize-none bg-transparent"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!emailBody.trim() || isAnalyzing}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze & Draft
                </>
              )}
            </button>
          </div>

          {/* Results Area */}
          <AnimatePresence>
            {(analysis || draft || isAnalyzing) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-6"
              >
                {/* Meta Panel */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
                      <Tag className="w-4 h-4" /> Intent
                    </div>
                    {isAnalyzing ? (
                      <div className="h-6 w-24 bg-slate-100 animate-pulse rounded" />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {analysis?.intent?.map(i => (
                          <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm rounded-md font-medium">
                            {i}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
                      <Clock className="w-4 h-4" /> Urgency
                    </div>
                     {isAnalyzing ? (
                      <div className="h-6 w-20 bg-slate-100 animate-pulse rounded" />
                    ) : (
                      <span className={cn(
                        "font-semibold text-lg",
                        analysis?.urgency === "High" ? "text-rose-600" :
                        analysis?.urgency === "Medium" ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {analysis?.urgency}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                     <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
                      <Target className="w-4 h-4" /> Action
                    </div>
                    {isAnalyzing ? (
                      <div className="h-6 w-24 bg-slate-100 animate-pulse rounded" />
                    ) : (
                      <div className="font-medium text-slate-900 line-clamp-1" title={analysis?.suggestedAction}>
                        {analysis?.suggestedAction}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                     <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3 whitespace-nowrap">
                      <ShieldAlert className="w-4 h-4" /> Risk Score
                    </div>
                    {isAnalyzing ? (
                      <div className="h-6 w-16 bg-slate-100 animate-pulse rounded" />
                    ) : (
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          (analysis?.riskScore || 0) < 40 ? "bg-emerald-500" : (analysis?.riskScore || 0) < 70 ? "bg-amber-500" : "bg-rose-500"
                        )} />
                        {analysis?.riskScore} / 100
                      </div>
                    )}
                  </div>
                </div>

                {/* Persona Router Agent Action */}
                {!isAnalyzing && analysis?.personaDecision && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <div className="flex items-center gap-2 text-indigo-800 text-sm font-medium">
                      <BrainCircuit className="w-4 h-4" /> Persona Router Agent
                    </div>
                    <div className="text-sm text-indigo-900 leading-relaxed font-medium">
                      <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded mr-2">Routed to: {analysis.personaDecision.persona}</span>
                      {analysis.personaDecision.reason}
                    </div>
                  </motion.div>
                )}

                {/* Retrieved Context Pipeline */}
                {!isAnalyzing && retrievedMemories.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                     <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> {retrievedMemories.length} Memories Retrieved
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {retrievedMemories.map((m) => (
                          <span key={m.id} className="text-xs font-mono font-medium px-2 py-1 bg-white text-emerald-700 border border-emerald-200 rounded shadow-sm">
                            {m.type}:{m.key}
                          </span>
                       ))}
                     </div>
                  </motion.div>
                )}

                {/* Grounding Validation Engine */}
                {!isAnalyzing && grounding && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden", grounding.passed ? "bg-blue-50 border-blue-100" : "bg-rose-50 border-rose-100")}>
                    <div className={cn("absolute top-0 left-0 w-1 h-full", grounding.passed ? "bg-blue-500" : "bg-rose-500")} />
                    <div className={cn("flex items-center justify-between text-sm font-medium", grounding.passed ? "text-blue-800" : "text-rose-800")}>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" /> 
                        Draft Validation Agent
                      </div>
                      {grounding.passed ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                           <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs">
                           <AlertCircle className="w-3 h-3" /> Hallucination Detected
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <div>
                         <div className={cn("text-xs mb-1", grounding.passed ? "text-blue-600/70" : "text-rose-600/70")}>Grounding Score</div>
                         <div className={cn("font-mono text-lg", grounding.passed ? "text-blue-700" : "text-rose-700")}>
                           {(grounding.groundingScore * 100).toFixed(0)}%
                         </div>
                      </div>
                      <div>
                         <div className={cn("text-xs mb-1", grounding.passed ? "text-blue-600/70" : "text-rose-600/70")}>Hallucination Score</div>
                         <div className={cn("font-mono text-lg", grounding.passed ? "text-blue-700" : "text-rose-700")}>
                           {(grounding.hallucinationScore * 100).toFixed(0)}%
                         </div>
                      </div>
                    </div>
                    {!grounding.passed && grounding.missingEntities.length > 0 && (
                      <div className="mt-2 text-xs text-rose-700">
                        <span className="font-semibold">Missing Entities:</span> {grounding.missingEntities.join(", ")}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Business Quality Validation Engine */}
                {!isAnalyzing && businessQuality && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden", businessQuality.passed ? "bg-purple-50 border-purple-100" : "bg-orange-50 border-orange-100")}>
                    <div className={cn("absolute top-0 left-0 w-1 h-full", businessQuality.passed ? "bg-purple-500" : "bg-orange-500")} />
                    <div className={cn("flex items-center justify-between text-sm font-medium", businessQuality.passed ? "text-purple-800" : "text-orange-800")}>
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" /> 
                        Business Quality Validator
                      </div>
                      {businessQuality.passed ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                           <CheckCircle2 className="w-3 h-3" /> Ready to Send
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs">
                           <AlertCircle className="w-3 h-3" /> Needs Revision
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-1">
                      <div>
                         <div className={cn("text-xs mb-1", businessQuality.passed ? "text-purple-600/70" : "text-orange-600/70")}>Completeness</div>
                         <div className={cn("font-mono text-lg", businessQuality.passed ? "text-purple-700" : "text-orange-700")}>
                           {(businessQuality.completenessScore * 100).toFixed(0)}%
                         </div>
                      </div>
                      <div>
                         <div className={cn("text-xs mb-1", businessQuality.passed ? "text-purple-600/70" : "text-orange-600/70")}>Professionalism</div>
                         <div className={cn("font-mono text-lg", businessQuality.passed ? "text-purple-700" : "text-orange-700")}>
                           {(businessQuality.professionalismScore * 100).toFixed(0)}%
                         </div>
                      </div>
                      <div>
                         <div className={cn("text-xs mb-1", businessQuality.passed ? "text-purple-600/70" : "text-orange-600/70")}>Relevance</div>
                         <div className={cn("font-mono text-lg", businessQuality.passed ? "text-purple-700" : "text-orange-700")}>
                           {(businessQuality.staffingRelevanceScore * 100).toFixed(0)}%
                         </div>
                      </div>
                    </div>
                    {businessQuality.locationValidation && !businessQuality.locationValidation.passed && (
                      <div className="mt-2 text-xs text-orange-700 bg-orange-100/50 p-2 rounded border border-orange-200">
                        <span className="font-semibold block mb-1">⚠️ Location Constraint Failed</span>
                        Required: <span className="font-mono">{businessQuality.locationValidation.requiredLocation}</span> | 
                        Found: <span className="font-mono">{businessQuality.locationValidation.candidateLocation}</span>
                      </div>
                    )}
                    {!businessQuality.passed && businessQuality.missingSections.length > 0 && (
                      <div className="mt-2 text-xs text-orange-700">
                        <span className="font-semibold">Missing/Weak Sections:</span> {businessQuality.missingSections.join(", ")}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Confidence Engine & AI Gateway Action */}
                {!isAnalyzing && confidenceEngine && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden", confidenceEngine.canOneClickSend ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100")}>
                    <div className={cn("absolute top-0 left-0 w-1 h-full", confidenceEngine.canOneClickSend ? "bg-emerald-500" : "bg-amber-500")} />
                    <div className={cn("flex items-center justify-between text-sm font-medium", confidenceEngine.canOneClickSend ? "text-emerald-800" : "text-amber-800")}>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" /> 
                        Trust & Approval Engine
                      </div>
                      <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs", confidenceEngine.canOneClickSend ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {confidenceEngine.canOneClickSend ? <><CheckCircle2 className="w-3 h-3" /> Auto-Send Eligible</> : <><AlertCircle className="w-3 h-3" /> Requires Manual Review</>}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-3 mt-1">
                      <div>
                         <div className={cn("text-xs mb-1", confidenceEngine.canOneClickSend ? "text-emerald-600/70" : "text-amber-600/70")}>Deterministic</div>
                         <div className={cn("font-mono font-medium", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>
                           {confidenceEngine.deterministicScore.toFixed(0)}%
                         </div>
                      </div>
                      <div>
                         <div className={cn("text-xs mb-1", confidenceEngine.canOneClickSend ? "text-emerald-600/70" : "text-amber-600/70")}>Memory</div>
                         <div className={cn("font-mono font-medium", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>
                           {confidenceEngine.memoryScore.toFixed(0)}%
                         </div>
                      </div>
                      <div>
                         <div className={cn("text-xs mb-1", confidenceEngine.canOneClickSend ? "text-emerald-600/70" : "text-amber-600/70")}>Grounding</div>
                         <div className={cn("font-mono font-medium", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>
                           {confidenceEngine.groundingScore.toFixed(0)}%
                         </div>
                      </div>
                      <div>
                         <div className={cn("text-xs mb-1", confidenceEngine.canOneClickSend ? "text-emerald-600/70" : "text-amber-600/70")}>Entity Val.</div>
                         <div className={cn("font-mono font-medium", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>
                           {confidenceEngine.entityScore.toFixed(0)}%
                         </div>
                      </div>
                      <div>
                         <div className={cn("text-xs mb-1 font-bold", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>Trust Score</div>
                         <div className={cn("font-mono text-xl", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>
                           {confidenceEngine.trustScore.toFixed(0)}%
                         </div>
                      </div>
                    </div>

                    {grounding && !grounding.entityValidationPassed && !confidenceEngine.entityResolution?.isAutoCorrected && (
                      <div className="mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex flex-col gap-1">
                        <div className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Entity Validation Failed</div>
                        <div className="text-xs">
                           <strong>Detected Company:</strong> {grounding.extractedCompany || "Unknown"} <br/>
                           <strong>Generated Company:</strong> {grounding.generatedCompany || "Unknown"}
                        </div>
                      </div>
                    )}

                    {confidenceEngine.entityResolution?.isAutoCorrected && (
                      <div className="mt-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-sm flex flex-col gap-1">
                        <div className="font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Company auto-corrected:</div>
                        <div className="text-xs font-mono">
                           {confidenceEngine.entityResolution.originalGenerated} &rarr; {confidenceEngine.entityResolution.canonicalName}
                        </div>
                        <div className="text-xs mt-1">
                           Source: Email {confidenceEngine.entityResolution.source} ({confidenceEngine.entityResolution.confidence}% confidence)
                        </div>
                      </div>
                    )}
                    
                    <div className={cn("mt-2 pt-3 border-t flex flex-col gap-2", confidenceEngine.canOneClickSend ? "border-emerald-200/60" : "border-amber-200/60")}>
                      <div className="flex items-center justify-between text-xs font-mono">
                         <span className="font-semibold text-slate-500">System Action:</span>
                         <span className="text-slate-700 bg-white px-2 py-0.5 rounded border">
                           {confidenceEngine.action.map((act, i) => <span key={i} className="bg-slate-100 rounded px-1 py-0.5 mx-0.5 border border-slate-200">{act}</span>)}
                         </span>
                      </div>
                    </div>
                   </motion.div>
                )}

                {/* Draft Output */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                     <div className="flex items-center gap-2 font-medium text-slate-900">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        AI Draft Response
                     </div>
                     <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded">
                        {appliedPersona || persona} Mode
                     </span>
                   </div>
                   <div className="p-6">
                     {isAnalyzing ? (
                        <div className="space-y-3">
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-5/6" />
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-1/2" />
                        </div>
                     ) : (
                       <div className="bg-white border border-slate-200 rounded-lg p-4 min-h-[12rem] whitespace-pre-wrap font-sans text-slate-800" dangerouslySetInnerHTML={{ __html: draft }} />
                     )}
                   </div>
                   {!isAnalyzing && draft && confidenceEngine && (
                     <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex justify-between items-center">
                        <div className="flex flex-col">
                           <p className="text-sm text-slate-500 flex items-center gap-1"><Settings2 className="w-4 h-4"/> Tone learned from 120 past emails</p>
                           {!confidenceEngine.canOneClickSend && (
                              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3"/> 
                                {grounding && !grounding.entityValidationPassed ? "Company name mismatch detected. Manual review required." : "Action requires manual review based on Trust Score or Risk Score."}
                              </p>
                           )}
                        </div>
                        <button 
                           disabled={!confidenceEngine.canOneClickSend || isSending || sendSuccess}
                           onClick={handleSend}
                           className={cn("px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all", confidenceEngine.canOneClickSend && !isSending && !sendSuccess ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed")}
                        >
                          {isSending ? "Sending..." : sendSuccess ? "Sent!" : "One-Click Send"} <ArrowRight className="w-4 h-4" />
                        </button>
                     </div>
                   )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
