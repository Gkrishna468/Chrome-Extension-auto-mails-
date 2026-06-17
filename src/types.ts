export type Persona = "Founder" | "CEO" | "BDM" | "Auto";

export type MemoryType = 'policy' | 'pricing' | 'vendor' | 'client' | 'template' | 'calendar' | 'legal' | 'crm' | 'ats' | 'signature' | 'vision' | 'finance' | 'investor' | 'partnership' | 'submission_template';

export interface TypedMemoryItem {
  id: string;
  type: MemoryType | string;
  priority: number;
  key: string;
  value: string;
  active: boolean;
  format?: 'html' | 'text';
}

export interface PersonaDecision {
  persona: "Founder" | "CEO" | "BDM";
  confidence: number;
  reason: string;
}

export interface AnalysisResult {
  intent: string[];
  subIntent?: string;
  urgency: "High" | "Medium" | "Low";
  suggestedAction: string;
  riskScore: number;
  personaDecision: PersonaDecision;
}

export interface GroundingResult {
  groundingScore: number;
  hallucinationScore: number;
  grounded: boolean;
  missingEntities: string[];
  extractedCompany?: string;
  generatedCompany?: string;
  entityValidationPassed?: boolean;
  passed: boolean;
}

export interface LocationValidation {
  requiredLocation: string;
  candidateLocation: string;
  passed: boolean;
}

export interface BusinessQualityResult {
  completenessScore: number;
  professionalismScore: number;
  staffingRelevanceScore: number;
  missingSections: string[];
  passed: boolean;
  locationValidation?: LocationValidation;
}

export interface ConfidenceEngineResult {
  deterministicScore: number;
  memoryScore: number;
  groundingScore: number;
  businessScore: number;
  trustScore: number;
  entityScore: number;
  canOneClickSend: boolean;
  isAutoSend: boolean;
  provider: string;
  action: string[];
  requiresApproval?: boolean;
  entityResolution?: {
    canonicalName: string;
    confidence: number;
    source: string;
    isAutoCorrected: boolean;
    originalGenerated?: string;
  };
}

export interface ApiResponse {
  analysis: AnalysisResult;
  draft: string;
  retrievedMemories: TypedMemoryItem[];
  appliedPersona?: string;
  grounding?: GroundingResult;
  businessQuality?: BusinessQualityResult;
  confidenceEngine?: ConfidenceEngineResult;
  error?: string;
}
