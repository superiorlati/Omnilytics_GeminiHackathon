
export interface VideoIntegrityReport {
  hash: string;
  codec: string;
  fps: number;
  duration: number;
  droppedFrames: number;
  vfr: boolean;
  interpolationScore: number;
  verdict: 'OK' | 'WARN' | 'CRITICAL';
  notes?: string;
}

export type CausalNodeType = 'observable' | 'derived' | 'latent';
export type CausalNodeCategory = 'physical' | 'behavioural' | 'environmental';

export interface CausalNode {
  id: string;
  label: string;
  type: CausalNodeType;
  category: CausalNodeCategory;
  observability: number; // 0-1
  description?: string;
  x?: number;
  y?: number;
}

export interface CausalEdge {
  source: string;
  target: string;
  confidence: number; // 0-1
  evidenceRefs: number[]; // Frame indices
  type: 'causal' | 'correlative';
}

export interface CausalGraphStats {
  dagValidity: number; // 0-1
  edgeStability: number; // 0-1
  observabilityCoverage: number; // 0-1
  latentRatio: number; // 0-1
}

export interface Intervention {
  id: string;
  name: string;
  cost: number; // 1-100 scale (Economic/Effort)
  effectiveness: number; // 0-1 reduction in risk
  timing: string;
  description: string;
  robustness: number;
  // New for Tab 8
  rank: number;
  sideEffects: string[];
  affectedVariables: string[];
  confidenceInterval: [number, number];
  paretoTier: 'OPTIMAL' | 'SUBOPTIMAL' | 'DOMINATED';
}

export interface SignalDataPoint {
  time: number;
  value: number;
  confidence: number;
}

export interface TrackedObject {
  id: number;
  label: string;
  firstSeen: number;
  lastSeen: number;
  maxSpeed: number;
  avgConfidence: number;
  motionState: 'stationary' | 'moving' | 'erratic';
  direction: string;
  speedProfile?: number[][]; // [time, value]
  trajectory?: number[][]; 
  // Perceptual Signals
  flowVector?: { x: number, y: number }; // Normalized vector
  occlusionScore?: number; // 0-1
}

export interface StressTestResult {
  id: string;
  name: string;
  description: string;
  survivalRate: number; // 0-1
  degradationFactor: string;
}

export interface CounterfactualBranch {
  id: string;
  name: string;
  divergencePoint: number; // seconds
  outcome: string;
  probability: number;
  variableDelta: { name: string; delta: string }[];
  veoVideoUrl?: string; // Generated video URL
}

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: number;
  type: 'detection' | 'occlusion' | 'braking' | 'impact' | 'other';
  confidence: 'high' | 'medium' | 'low';
  frame: number;
}

// --- NEW UNCERTAINTY TYPES ---

export interface UncertaintyNode {
  objectId: number;
  label: string;
  posUncertainty: number; // 0-1 (1 is high uncertainty)
  velUncertainty: number;
  accelUncertainty: number;
  persistenceRisk: number;
}

export interface ConfidenceBudgetRow {
  stage: string;
  inputConf: number;
  loss: number;
  outputConf: number;
}

export interface BlindSpot {
  type: 'SPATIAL' | 'TEMPORAL' | 'ANALYTICAL';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  interval?: [number, number]; // seconds
}

export interface UncertaintyAnalysis {
  nodes: UncertaintyNode[];
  budget: ConfidenceBudgetRow[];
  blindSpots: BlindSpot[];
}

// --- TAB 9: STRESS TEST TYPES ---

export interface DegradationConfig {
    resolutionLoss: number; // 0-1
    frameDropRate: number; // 0-1
    motionBlur: number; // 0-1
    occlusion: number; // 0-1
    lighting: number; // 0-1
    sensorNoise: number; // 0-1
}

export interface BrittlenessFlag {
    type: 'DETECTION' | 'CAUSAL' | 'INTERVENTION' | 'COUNTERFACTUAL';
    severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
    component: string;
    collapseThreshold: number; // The degradation level (0-1) where it failed
    reason: string;
}

export interface SurvivabilityMetric {
    degradationLevel: number; // X-Axis
    conclusionConfidence: number; // Y-Axis
    objectRetention: number; // Y-Axis
    graphIntegrity: number; // Y-Axis
}

export interface StressAnalysisReport {
    summary: string; // Gemini generated narrative
    flags: BrittlenessFlag[];
    curveData: SurvivabilityMetric[];
    robustnessScore: number; // 0-1
}

// --- TAB 10: AUDIT & REPORTS ---

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    actor: 'SYSTEM' | 'USER';
    action: string;
    details: string;
    hash: string; // Cryptographic hash of the output/state
}

export interface OverrideEntry {
    id: string;
    timestamp: string;
    user: string;
    type: string;
    details: string;
    impactScore: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
}

export interface ChainOfCustody {
    originalHash: string;
    ingestTimestamp: string;
    accessLog: { user: string; time: string; action: string }[];
    tamperStatus: 'INTACT' | 'ANOMALY' | 'BREACH';
}

export interface FinalReportData {
    caseId: string;
    generatedAt: string;
    classification: string;
    
    // Section A: Case Overview
    overview: {
        videoId: string;
        duration: string;
        sceneType: string;
        scope: string;
    };
    
    // Section B: Key Findings
    findings: string[];
    
    // Section C: Confidence
    confidence: {
        score: number; // 0-1
        sufficiency: string;
        survivability: string;
    };
    
    // Section D: Risks
    risks: string[];
    
    // Section E: Actions
    recommendations: {
        action: string;
        rank: number;
        cost: string;
    }[];

    // Section F: Stress Test Graph Data (For Report Rendering)
    stressGraph?: {
        score: number;
        dataPoints: { x: number; y: number }[]; // x=Degradation, y=Retention
    };
}

export type AppView = 'LANDING' | 'DASHBOARD';
export type DashboardTab = 'OVERVIEW' | 'EVIDENCE' | 'PERCEPTION' | 'MEASUREMENTS' | 'UNCERTAINTY' | 'SIGNALS' | 'CAUSAL' | 'COUNTERFACTUAL' | 'STRESS' | 'INTERVENTION' | 'AUDIT';

export interface AnalysisState {
  view: AppView;
  activeTab: DashboardTab;
  videoId: string | null;
  timestamp: number;
  integrity: VideoIntegrityReport | null;
  graph: { nodes: CausalNode[]; edges: CausalEdge[] };
  interventions: Intervention[];
  events: TimelineEvent[];
  objects: TrackedObject[];
  signals: SignalDataPoint[];
  counterfactuals: CounterfactualBranch[];
  stressTests: StressTestResult[];
  
  // Tab 9 Interactive State
  stressAnalysis?: StressAnalysisReport;

  // Tab 10 Interactive State
  auditLog: AuditLogEntry[];
  overrides: OverrideEntry[];
  chainOfCustody?: ChainOfCustody;
  finalReport?: FinalReportData;

  isPlaying: boolean;
  isProcessing: boolean;
  processingStage?: string;
  executiveSummary?: string;
  signalsSummary?: string;
  perceptionSummary?: string;
  measurementsSummary?: string;
  uncertaintySummary?: string;
  uncertaintyData?: UncertaintyAnalysis;
  counterfactualReport?: string;
  causalReport?: string; 
  graphStats?: CausalGraphStats;
}
