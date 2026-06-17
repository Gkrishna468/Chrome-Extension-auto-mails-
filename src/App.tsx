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

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://ais-dev-oy2em3rartdjgcemjc5sz7-375081910602.asia-east1.run.app";

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
      
      if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      if (data.error) throw new Error(data.error);
      
      setAnalysis(data.analysis);
      setDraft(data.draft);
      setRetrievedMemories(data.retrievedMemories || []);
      setAppliedPersona(data.appliedPersona || "");
      setGrounding(data.grounding || null);
      setBusinessQuality(data.businessQuality || null);
      setConfidenceEngine(data.confidenceEngine || null);
    } catch (e: any) {
      console.error(e);
      setDraft(`Failed to generate draft. Error: ${e.message || 'Unknown error'}`);
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
    <div className="flex flex-col h-screen bg-[#FDFCFB] text-slate-900 font-sans w-full max-w-[420px] mx-auto md:max-w-none shadow-xl border-x border-slate-200 md:border-none md:shadow-none bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4 flex items-center justify-between z-10 sticky top-0 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">HireNestOS AI</h1>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"><Settings2 className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
        
        {/* Core Actions */}
        <section className="flex flex-col gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-shadow focus-within:shadow-md focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-300">
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5" /> Email
              </div>
              <input 
                  type="email" 
                  value={senderEmail} 
                  onChange={(e) => setSenderEmail(e.target.value)} 
                  placeholder="From: sender@domain.com"
                  className="bg-transparent text-slate-700 text-xs px-1 py-0.5 outline-none placeholder:text-slate-400 w-36 text-right"
              />
            </div>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Paste email content here..."
              className="w-full h-32 p-3 outline-none resize-none bg-transparent text-sm leading-relaxed"
            />
          </div>
          
          <div className="flex justify-between items-center gap-2">
             <div className="flex-1 flex flex-col relative">
                <select 
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as Persona)}
                  className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium px-3 py-2.5 rounded-lg pr-8 focus:outline-none focus:ring-1 focus:ring-slate-300"
                >
                  <option value="Auto">Auto-Persona</option>
                  <option value="Founder">Founder Mode</option>
                  <option value="CEO">CEO Mode</option>
                  <option value="BDM">BDM Mode</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <UserCog className="w-3.5 h-3.5" />
                </div>
             </div>
             <button
              onClick={handleAnalyze}
              disabled={!emailBody.trim() || isAnalyzing}
              className="flex-shrink-0 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
             >
              {isAnalyzing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <Sparkles className="w-4 h-4" />}
              Analyze
            </button>
          </div>
        </section>

        {/* Results Area */}
        <AnimatePresence>
          {(analysis || draft || isAnalyzing) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              
              {/* Meta Panel (Compact Grid) */}
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> Intent</div>
                    {isAnalyzing ? <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" /> : (
                       <div className="text-xs font-medium text-blue-700 truncate">{analysis?.intent?.[0] || "-"}</div>
                    )}
                 </div>
                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Target className="w-3 h-3"/> Action</div>
                    {isAnalyzing ? <div className="h-4 w-20 bg-slate-200 animate-pulse rounded" /> : (
                       <div className="text-xs font-medium text-slate-800 truncate" title={analysis?.suggestedAction}>{analysis?.suggestedAction || "-"}</div>
                    )}
                 </div>
                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Risk</div>
                    {isAnalyzing ? <div className="h-4 w-12 bg-slate-200 animate-pulse rounded" /> : (
                       <div className={cn("text-xs font-bold", (analysis?.riskScore || 0) < 40 ? "text-emerald-600" : (analysis?.riskScore || 0) < 70 ? "text-amber-600" : "text-rose-600")}>
                          {analysis?.riskScore || 0} / 100
                       </div>
                    )}
                 </div>
                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><UserCog className="w-3 h-3"/> Persona</div>
                    {isAnalyzing ? <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" /> : (
                       <div className="text-xs font-medium text-indigo-700">{appliedPersona || persona}</div>
                    )}
                 </div>
              </div>

               {/* Confidence Engine & System */}
                {!isAnalyzing && confidenceEngine && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("border rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden", confidenceEngine.canOneClickSend ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100")}>
                      <div className={cn("absolute top-0 left-0 w-1 h-full", confidenceEngine.canOneClickSend ? "bg-emerald-500" : "bg-amber-500")} />
                      
                      <div className="flex items-center justify-between">
                         <div className={cn("text-xs font-bold flex items-center gap-1.5", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>
                            {confidenceEngine.canOneClickSend ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            Trust Engine Score
                         </div>
                         <div className={cn("text-sm font-mono font-bold", confidenceEngine.canOneClickSend ? "text-emerald-700" : "text-amber-700")}>
                            {confidenceEngine.trustScore.toFixed(0)}%
                         </div>
                      </div>

                      {grounding && !grounding.entityValidationPassed && !confidenceEngine.entityResolution?.isAutoCorrected && (
                        <div className="bg-red-50/80 border border-red-200 text-red-700 rounded p-2 text-xs">
                           <strong>Warning:</strong> Missing or mismatched company entity! Needs review.
                        </div>
                      )}

                      {confidenceEngine.entityResolution?.isAutoCorrected && (
                        <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded p-2 text-[10px] flex gap-1">
                           <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5"/>
                           <div>
                              <strong>Auto-corrected Entity:</strong><br/>
                              <span className="font-mono">{confidenceEngine.entityResolution.originalGenerated} &rarr; {confidenceEngine.entityResolution.canonicalName}</span>
                           </div>
                        </div>
                      )}
                      
                      {!confidenceEngine.canOneClickSend && businessQuality && !businessQuality.passed && (
                         <div className="bg-orange-50/80 border border-orange-200 text-orange-800 rounded p-2 text-[10px] mt-1 space-y-1">
                            <span className="font-semibold block">Quality Check Failed</span>
                            <div>Completeness: {(businessQuality.completenessScore*100).toFixed(0)}%</div>
                            <div>Relevance: {(businessQuality.staffingRelevanceScore*100).toFixed(0)}%</div>
                         </div>
                      )}

                   </motion.div>
                )}

              {/* Draft Output */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                 <div className="bg-slate-50 border-b border-slate-200 px-3 py-2.5 flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      AI Draft
                   </div>
                 </div>
                 <div className="p-3">
                   {isAnalyzing ? (
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-slate-100 animate-pulse rounded w-full" />
                        <div className="h-3 bg-slate-100 animate-pulse rounded w-5/6" />
                        <div className="h-3 bg-slate-100 animate-pulse rounded w-1/2" />
                      </div>
                   ) : (
                     <div className="bg-white rounded text-xs min-h-[10rem] whitespace-pre-wrap font-sans text-slate-700 leading-relaxed max-h-64 overflow-y-auto pr-1" dangerouslySetInnerHTML={{ __html: draft }} />
                   )}
                 </div>
                 
                 {!isAnalyzing && draft && confidenceEngine && (
                   <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                          <button 
                              onClick={() => alert("This would insert the draft into the Gmail compose window!")}
                              className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-colors"
                           >
                            Insert into Reply
                         </button>
                         <button 
                             disabled={!confidenceEngine.canOneClickSend || isSending || sendSuccess}
                             onClick={handleSend}
                             className={cn("text-xs font-semibold px-3 py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all", confidenceEngine.canOneClickSend && !isSending && !sendSuccess ? "bg-slate-900 hover:bg-slate-800 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed")}
                          >
                            {isSending ? "Sending..." : sendSuccess ? "Sent!" : "One-Click Send"} <Send className="w-3 h-3" />
                         </button>
                      </div>
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memento Memory Compact View */}
        <section className="mt-2 pb-4">
            <details className="group [&_summary::-webkit-details-marker]:hidden">
               <summary className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                     <Database className="w-3.5 h-3.5" />
                     Memanto Memory Layer
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 transition group-open:rotate-90" />
               </summary>
               <div className="mt-2 space-y-2 max-h-48 overflow-y-auto px-1">
                   {knowledgeBase.map((item) => (
                      <div key={item.id} className="bg-white p-2 rounded border border-slate-100 text-[10px] shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                           <div className="font-semibold text-slate-700 truncate">{item.key}</div>
                           <span className="font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1 rounded">{item.type}</span>
                        </div>
                        <div className="text-slate-500 truncate">{item.value}</div>
                      </div>
                    ))}
               </div>
            </details>
        </section>

      </div>
    </div>
  );
}
