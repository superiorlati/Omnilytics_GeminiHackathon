
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { VideoIntegrityReport, Intervention, CausalEdge, SignalDataPoint, TrackedObject, TimelineEvent, CausalNode, CounterfactualBranch, StressTestResult, UncertaintyAnalysis, DegradationConfig, StressAnalysisReport, BrittlenessFlag, SurvivabilityMetric, AnalysisState, FinalReportData } from '../types';

// Remove static API key to ensure dynamic updates (e.g. from Veo key selector) are picked up
// const apiKey = process.env.API_KEY || ''; 

const getAiClient = () => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// --- RETRY UTILITY ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(operation: () => Promise<T>, retries = 8, backoff = 5000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        // Deep inspection for rate limit errors (429 or RESOURCE_EXHAUSTED)
        // Checks various nesting levels commonly found in Google API errors
        const isRateLimit = 
            error?.status === 429 || 
            error?.code === 429 ||
            error?.message?.includes('429') || 
            error?.message?.includes('quota') ||
            error?.message?.includes('RESOURCE_EXHAUSTED') ||
            error?.error?.code === 429 ||
            error?.error?.status === 'RESOURCE_EXHAUSTED';
                            
        if (isRateLimit && retries > 0) {
            const jitter = Math.random() * 2000; // Increased jitter
            const waitTime = backoff + jitter;
            console.warn(`Gemini Rate Limit Hit. Retrying in ${Math.round(waitTime)}ms... (Attempts left: ${retries})`);
            await sleep(waitTime);
            return withRetry(operation, retries - 1, backoff * 1.5); // 1.5x backoff
        }
        
        console.error("Non-retriable or exhausted API error:", error);
        throw error;
    }
}

// --- FILE UPLOAD MANAGEMENT ---

export const uploadFileToGemini = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// --- ANALYSIS FUNCTIONS ---

export const analyzeVideoStructure = async (base64Data: string, mimeType: string): Promise<{objects: TrackedObject[], events: TimelineEvent[]}> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key Missing");

    const dataPart = base64Data.split(',')[1]; // Remove header

    const prompt = `
    Analyze this video frame by frame for a forensic traffic report.
    
    1. Identify key moving objects. For each, estimate:
       - ID (persistent)
       - Label (Car, Pedestrian, Cyclist)
       - Timestamps (firstSeen, lastSeen)
       - Max Speed (km/h)
       - Motion State (stationary, moving, erratic)
       - Direction (e.g., "North", "Turning Left", "Approaching")
       - A sparse speed profile (3-4 points: [time, speed]) capturing the start, peak, and end of their motion.
    
    2. Identify semantic events (Braking, Occlusion, Impact).
    
    Output strictly valid JSON:
    {
        "objects": [
            { 
              "id": number, "label": string, "firstSeen": number, "lastSeen": number, 
              "maxSpeed": number, "avgConfidence": number (0-1),
              "motionState": "stationary"|"moving"|"erratic",
              "direction": string,
              "speedProfile": [[number, number]] 
            }
        ],
        "events": [
            { "id": string, "label": string, "timestamp": number, "type": "detection"|"occlusion"|"braking"|"impact", "confidence": "high"|"medium"|"low" }
        ]
    }
    If no objects/events found, return empty arrays. Do not hallucinate.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: dataPart } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                temperature: 0 // Enforce determinism
            }
        }));
        
        const text = response.text || "{}";
        const json = JSON.parse(text);
        
        const events = (json.events || []).map((e: any) => ({
            ...e,
            frame: Math.floor(e.timestamp * 30)
        }));

        return { objects: json.objects || [], events };

    } catch (e) {
        console.error("Analysis Failed", e);
        return { objects: [], events: [] };
    }
};

export const generateSignalsSummary = async (objects: TrackedObject[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "No signal data available.";

    if (objects.length === 0) return "No behavioural anomalies detected.";

    const prompt = `
    Write a factual kinematic summary based ONLY on these tracked objects:
    ${JSON.stringify(objects)}
    
    Rules:
    1. Rank by statistical deviation (e.g. highest speed, longest duration).
    2. Mention specific IDs and values.
    3. No intro/outro fluff. 2-3 sentences max.
    
    Example: "Vehicle #2 exceeded average lane speed by 40%, reaching 85km/h at t=4.2s. Pedestrian #5 loitered in the crosswalk for 12s, creating a braking hazard."
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0 }
        }));
        return response.text || "No summary generated.";
    } catch (e) {
        return "Summary generation failed.";
    }
};

export const generatePerceptionSummary = async (objects: TrackedObject[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Perception analysis unavailable.";

    if (objects.length === 0) return "No objects detected. Signal analysis cannot be performed.";

    const prompt = `
    Analyze the PERCEPTUAL QUALITY and TRACKING FIDELITY of these detected objects:
    ${JSON.stringify(objects)}
    
    Do NOT describe behavior. Describe the quality of the computer vision signal.
    
    Rules:
    1. Assess tracking stability (lifespan vs confidence).
    2. Identify potential occlusion zones (short lifespan or erratic motion).
    3. Comment on signal-to-noise ratio based on confidence scores.
    
    Example: "Motion signals remain stable across 92% of frames, with temporary occlusion affecting Object #004 (confidence drop to 0.45) for 3.2 seconds near the central field of view."
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0 }
        }));
        return response.text || "Perception summary unavailable.";
    } catch (e) {
        return "Perception summary generation failed.";
    }
};

export const generateMeasurementsSummary = async (objects: TrackedObject[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Physics analysis unavailable.";

    if (objects.length === 0) return "No data for dynamics analysis.";

    const prompt = `
    Generate a PHYSICS & DYNAMICS FORENSIC SUMMARY based on these tracked objects:
    ${JSON.stringify(objects)}

    Structure the response into 4 concise sections:
    1. MOTION OVERVIEW: Who moved fastest, directionality, speed buildup.
    2. DYNAMICS & FORCES: Acceleration spikes, potential impulse events (if collision detected).
    3. RISK INDICATORS: Time-to-collision (TTC) risks, unsafe proximity.
    4. PHYSICS INTERPRETATION: What the numbers imply physically (e.g., "Deceleration of -8m/s² indicates hard braking").

    Ground ALL claims in the provided data. Do not hallucinate external context.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 },
                temperature: 0
            }
        }));
        return response.text || "Physics summary unavailable.";
    } catch (e) {
        return "Physics summary generation failed.";
    }
};

export const generateUncertaintySummary = async (analysis: UncertaintyAnalysis): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Uncertainty audit unavailable.";

    const prompt = `
    Generate an OBSERVABILITY & UNCERTAINTY AUDIT based on this analysis:
    ${JSON.stringify(analysis)}

    Structure:
    1. OVERALL OBSERVABILITY SCORE: (e.g., "High", "Moderate", "Degraded")
    2. MAJOR UNCERTAINTY DRIVERS: (e.g., Occlusion, Motion Blur, Low Detection Confidence)
    3. BLIND SPOT DISCLOSURE: Explicitly state what the system missed or cannot confirm.
    4. INTERPRETATION RISK ADVISORY: Where should the user be cautious?

    Be extremely objective. Reveal the system's limitations.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 },
                temperature: 0
            }
        }));
        return response.text || "Uncertainty summary unavailable.";
    } catch (e) {
        return "Uncertainty summary generation failed.";
    }
};

export const generateCausalGraph = async (events: TimelineEvent[], objects: TrackedObject[]): Promise<{nodes: CausalNode[], edges: CausalEdge[]}> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key Missing");

    const context = JSON.stringify({ events, objects });
    const prompt = `
    Construct a rigorous Structural Causal Model (SCM) graph for the incident described in this data: ${context}.
    
    RULES:
    1. NODES:
       - 'observable': Directly seen/measured (e.g., 'VehicleSpeed', 'WetRoad', 'Impact', 'BrakeLight').
       - 'derived': Calculated from data (e.g., 'DecelerationRate', 'TimeToCollision', 'LaneDeviation').
       - 'latent': Inferred/Unseen causes (e.g., 'DriverAttention', 'MechanicalFailure', 'VisibilityLimit').
    2. CATEGORIES: 'physical' (physics/motion), 'behavioural' (decisions), 'environmental' (conditions).
    3. EDGES: 
       - Must represent CAUSALITY, not just correlation.
       - 'confidence': 0.1 to 1.0 based on evidence strength.
    
    Output JSON:
    {
        "nodes": [{ 
            "id": string, 
            "label": string, 
            "type": "observable"|"derived"|"latent", 
            "category": "physical"|"behavioural"|"environmental",
            "observability": number (0-1),
            "description": string 
        }],
        "edges": [{ "source": string, "target": string, "confidence": number, "type": "causal"|"correlative" }]
    }
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0
            }
        }));
        const json = JSON.parse(response.text || "{}");
        return { 
            nodes: json.nodes || [], 
            edges: (json.edges || []).map((e: any) => ({...e, evidenceRefs: []})) 
        };
    } catch (e) {
        return { nodes: [], edges: [] };
    }
};

export const generateCausalExecutiveReport = async (nodes: CausalNode[], edges: CausalEdge[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Causal report unavailable.";

    const prompt = `
    Generate a CAUSAL EXECUTIVE REPORT based on this Structural Causal Model (SCM):
    Nodes: ${JSON.stringify(nodes)}
    Edges: ${JSON.stringify(edges)}

    Structure the report strictly as follows:
    1. PRIMARY CAUSAL CHAIN: Describe the dominant pathway from root cause to outcome.
    2. STRONGEST CAUSAL DRIVERS: List factors with high centrality or impact.
    3. LATENT DEPENDENCIES: Explain any inferred mechanisms (e.g. 'Reaction Time') that mediated the event.
    4. STRUCTURAL AMBIGUITIES: Where is the causal link weak or uncertain?

    Tone: Forensic, objective, scientific.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0 }
        }));
        return response.text || "Causal report generation failed.";
    } catch (e) {
        return "Causal report generation failed.";
    }
};

export const generateInterventions = async (nodes: CausalNode[], edges: CausalEdge[], counterfactuals: CounterfactualBranch[]): Promise<Intervention[]> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key Missing");

    const prompt = `
    Based on this Causal Graph and generated Counterfactuals, suggest optimal SAFETY INTERVENTIONS.
    
    CONTEXT:
    Graph: ${JSON.stringify({nodes, edges})}
    Counterfactuals: ${JSON.stringify(counterfactuals)}

    RULES:
    1. VIDEO-ONLY GROUNDING: Recommend ONLY actions that affect variables visible or inferred in the video (e.g. "Increase Following Distance", "Reduce Speed"). 
       DO NOT hallucinate infrastructure (e.g. "Install Traffic Light", "Add Speed Bump") unless the infrastructure is already present in the data.
    2. RANKING: Rank interventions by effectiveness (risk reduction) vs cost (effort/disruption).
    3. SIDE EFFECTS: Identify potential negative side effects (e.g. "Sudden braking increases rear-end collision risk").
    4. PARETO TIER: Label as 'OPTIMAL' (best trade-off), 'SUBOPTIMAL', or 'DOMINATED'.

    Output JSON array:
    [{
      "id": string (unique),
      "rank": number (1 is best),
      "name": string (Action),
      "description": string (Why this works),
      "cost": number (1-100, 100 is high cost),
      "effectiveness": number (0-1),
      "timing": string (e.g., "Pre-event", "Reaction-phase"),
      "robustness": number (0-1),
      "sideEffects": string[],
      "affectedVariables": string[],
      "confidenceInterval": [number, number] (e.g. [0.7, 0.9]),
      "paretoTier": "OPTIMAL"|"SUBOPTIMAL"|"DOMINATED"
    }]
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0
            }
        }));
        const json = JSON.parse(response.text || "[]");
        return Array.isArray(json) ? json : [];
    } catch (e) {
        return [];
    }
};

export const generateCounterfactuals = async (events: TimelineEvent[], graph: any): Promise<CounterfactualBranch[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    const prompt = `
    Generate 3 distinct Counterfactual Scenarios based on the Causal Graph and Event Timeline provided.
    
    CONTEXT:
    Graph: ${JSON.stringify(graph)}
    Events: ${JSON.stringify(events)}
    
    RULES:
    1. Apply "do-calculus" interventions: Change one variable (e.g., "Reaction Time", "Braking Force") and propagate the effect.
    2. Divergence Point: Identify the precise timestamp (in seconds) where the counterfactual reality splits from the observed reality.
    3. Minimal Intervention: Prefer the smallest change necessary to flip the outcome (e.g., "Avoid Collision").
    4. NO Hallucination: Do not invent new objects or environmental factors (e.g. "A bird flew in"). Stick to observed variables.
    
    Output JSON array:
    [{
      "id": string (unique),
      "name": string (e.g., "Early Braking Scenario"),
      "divergencePoint": number (timestamp in seconds),
      "outcome": string (e.g., "Near Miss (Clearance > 1m)"),
      "probability": number (0-1 estimate of success),
      "variableDelta": [
          { "name": string (variable name), "delta": string (e.g., "-0.5s", "+20%") }
      ]
    }]
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0
            }
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const generateCounterfactualNarrative = async (branch: CounterfactualBranch): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Narrative unavailable.";
    
    const prompt = `
    Write a forensic counterfactual narrative for this simulation scenario:
    ${JSON.stringify(branch)}
    
    Structure:
    1. OUTCOME SHIFT: What changed? (e.g., "Collision avoided")
    2. DIVERGENCE MECHANISM: How did the causal chain break?
    3. FEASIBILITY CHECK: Is this change physically realistic for a human driver/system?
    
    Keep it concise, technical, and objective.
    `;
    
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0 }
        }));
        return response.text || "";
    } catch (e) {
        return "Analysis failed.";
    }
};

export const generateStressTests = async (graph: any): Promise<StressTestResult[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    const prompt = `
    Perform a robustness stress test on this causal model: ${JSON.stringify(graph)}.
    Simulate data degradation (noise, missing frames, sensor failure) and estimate if the causal conclusion holds.
    
    Output JSON array:
    [{
      "id": string,
      "name": string,
      "description": string,
      "survivalRate": number (0-1),
      "degradationFactor": string
    }]
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0
            }
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const runStressTestSimulation = async (
    graph: any, 
    objects: TrackedObject[], 
    config: DegradationConfig
): Promise<StressAnalysisReport> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key Missing");

    const prompt = `
    STRESS TEST SIMULATION ENGINE
    
    INPUT CONTEXT:
    1. Causal Graph: ${JSON.stringify(graph)}
    2. Tracked Objects (Sample): ${JSON.stringify(objects.slice(0, 3))}
    3. Applied Degradation Config: ${JSON.stringify(config)}

    TASK:
    Mathematically simulate the effect of this degradation on the evidence utility.
    - Resolution Loss affects object detection confidence for small objects.
    - Frame Drops affect velocity/acceleration derivatives.
    - Motion Blur affects fast moving objects.
    - Occlusion breaks tracking persistence.

    OUTPUT JSON:
    {
      "summary": "A 3-sentence executive summary of how the conclusions hold up under this specific stress.",
      "robustnessScore": number (0-1),
      "flags": [
          { "type": "DETECTION"|"CAUSAL"|"INTERVENTION", "severity": "LOW"|"MEDIUM"|"CRITICAL", "component": "string (name)", "collapseThreshold": number (0-1), "reason": "string" }
      ],
      "curveData": [
          { "degradationLevel": 0.1, "conclusionConfidence": 0.95, "objectRetention": 0.98, "graphIntegrity": 0.99 },
          { "degradationLevel": 0.5, "conclusionConfidence": 0.X, "objectRetention": 0.X, "graphIntegrity": 0.X },
          { "degradationLevel": 0.9, "conclusionConfidence": 0.X, "objectRetention": 0.X, "graphIntegrity": 0.X }
      ] (Generate 5-6 points for the curve)
    }
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0
            }
        }));
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error(e);
        return {
            summary: "Simulation failed due to API error.",
            robustnessScore: 0,
            flags: [],
            curveData: []
        };
    }
};

export const generateExecutiveSummary = async (events: TimelineEvent[], graph: any): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Analysis unavailable.";

    const prompt = `
    Write a forensic executive summary (4-5 sentences) based strictly on these events: ${JSON.stringify(events)} and this causal structure: ${JSON.stringify(graph)}.
    Do not hallucinate. Cite timestamps in brackets [t=X.XXs]. 
    If data is empty, state "Insufficient evidence to generate summary."
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0 }
        }));
        return response.text || "No summary generated.";
    } catch (e) {
        return "Summary generation failed.";
    }
};

export const explainCausalEdge = async (edge: CausalEdge): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "AI service unavailable.";

    const prompt = `
    Explain the causal relationship between "${edge.source}" and "${edge.target}".
    Confidence: ${edge.confidence}.
    Type: ${edge.type}.
    Provide a 1-sentence explanation of why this link exists in a traffic incident context.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0 }
        }));
        return response.text || "No explanation available.";
    } catch (e) {
        return "Explanation failed.";
    }
};

export const generateIntegritySummary = async (report: VideoIntegrityReport): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Integrity analysis unavailable.";

    const prompt = `
    Summarize this video integrity report for a forensic analyst:
    ${JSON.stringify(report)}
    
    Mention if the verdict is OK, WARN, or CRITICAL and why. Keep it professional and concise (2-3 sentences).
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 },
                temperature: 0
            }
        }));
        return response.text || "Summary unavailable.";
    } catch (e) {
        return "Summary generation failed.";
    }
};

export const generateExecutiveReport = async (integrity: VideoIntegrityReport, edges: CausalEdge[], interventions: Intervention[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Report generation unavailable.";

    const prompt = `
    Generate a formal "Regulatory Audit Report" for a traffic incident analysis.
    
    Integrity Status: ${integrity.verdict} (Score: ${integrity.interpolationScore})
    Causal Factors Identified: ${edges.map(e => `${e.source}->${e.target}`).join(', ')}
    Proposed Interventions: ${interventions.map(i => i.name).join(', ')}
    
    Format as a structured text document with sections:
    1. FORENSIC INTEGRITY STATEMENT
    2. CAUSAL ANALYSIS SUMMARY
    3. REMEDIATION RECOMMENDATIONS
    4. AUDIT CERTIFICATION
    
    Tone: Legal/Technical.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0
            }
        }));
        return response.text || "Report unavailable.";
    } catch (e) {
        return "Report generation failed.";
    }
};

export const generateFinalReport = async (state: AnalysisState, classification: string): Promise<FinalReportData> => {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key Missing");

    const prompt = `
    Generate a PROCUREMENT-GRADE EXECUTIVE REPORT for this forensic video analysis.
    
    CONTEXT:
    - Classification: ${classification}
    - Executive Summary (Existing): ${state.executiveSummary}
    - Causal Drivers: ${state.graph.edges.slice(0, 5).map(e => `${e.source}->${e.target}`).join(', ')}
    - Interventions (Top 3): ${state.interventions.slice(0, 3).map(i => i.name).join(', ')}
    - Stress Test Score: ${state.stressAnalysis?.robustnessScore || 0}
    - Stress Test Graph Data: ${JSON.stringify(state.stressAnalysis?.curveData || [])}
    - Integrity: ${state.integrity?.verdict}
    - Video Duration: ${state.integrity?.duration || 0}s
    
    TASK:
    Synthesize a structured report for decision makers.
    Ensure "stressGraph" is populated with the curve data provided in context.
    
    JSON OUTPUT STRUCTURE:
    {
      "caseId": "Auto-generated UUID",
      "generatedAt": "ISO Timestamp",
      "classification": "${classification}",
      "overview": {
          "videoId": "SHA-256 Hash or Filename",
          "duration": "XX seconds",
          "sceneType": "e.g., Urban Intersection",
          "scope": "e.g., Traffic Incident Analysis"
      },
      "findings": [
          "Ranked bullet point 1",
          "Ranked bullet point 2"
      ],
      "confidence": {
          "score": 0.XX,
          "sufficiency": "e.g., High Quality Evidence",
          "survivability": "e.g., Robust to 40% degradation"
      },
      "risks": [
          "Risk flag 1 (e.g. occlusion)",
          "Risk flag 2"
      ],
      "recommendations": [
          { "action": "Action 1", "rank": 1, "cost": "Low/Med/High" },
          { "action": "Action 2", "rank": 2, "cost": "Low/Med/High" }
      ],
      "stressGraph": {
          "score": 0.XX,
          "dataPoints": [ { "x": 0.1, "y": 0.95 }, ... ] (Map 'degradationLevel' to x, 'conclusionConfidence' to y)
      }
    }
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0
            }
        }));
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error(e);
        return {
            caseId: "ERR-GENERATION",
            generatedAt: new Date().toISOString(),
            classification: "INTERNAL",
            overview: { videoId: "N/A", duration: "0s", sceneType: "Unknown", scope: "N/A" },
            findings: ["Report generation failed."],
            confidence: { score: 0, sufficiency: "N/A", survivability: "N/A" },
            risks: [],
            recommendations: []
        };
    }
};

export const analyzeSignalAnomaly = async (signals: SignalDataPoint[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Analysis unavailable.";

    // Sample data to save tokens if too large
    const sample = signals.filter((_, i) => i % 5 === 0);

    const prompt = `
    Analyze this time-series signal data (Time vs Value) for anomalies:
    ${JSON.stringify(sample)}
    
    Identify any sudden spikes, drops, or irregularities that indicate a safety-critical event (e.g., hard braking, impact).
    Return a 1-sentence insight.
    `;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0 }
        }));
        return response.text || "No anomalies detected.";
    } catch (e) {
        return "Anomaly analysis failed.";
    }
};

// --- NEW VEO VIDEO GENERATION ---

export const generateVeoSimulation = async (prompt: string): Promise<string | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    
    const currentKey = process.env.API_KEY || '';

    try {
        // According to instructions: 
        // 1. ai.models.generateVideos returns an Operation
        // 2. Poll using ai.operations.getVideosOperation
        // 3. Construct URL
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: '16:9'
            }
        });

        // Polling Loop
        while (!operation.done) {
            await sleep(5000); // 5 second polling interval
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) return null;

        // Fetch using API Key and convert to Blob URL for display
        const res = await fetch(`${downloadLink}&key=${currentKey}`);
        
        if (!res.ok) throw new Error(`Video download failed: ${res.statusText}`);

        const blob = await res.blob();
        return URL.createObjectURL(blob);

    } catch (e: any) {
        console.error("Veo generation failed", e);
        // Throw specific permission error so UI can prompt for key
        if (e.status === 403 || e.message?.includes('403') || e.message?.includes('PERMISSION_DENIED')) {
            throw new Error("PERMISSION_DENIED");
        }
        return null;
    }
}