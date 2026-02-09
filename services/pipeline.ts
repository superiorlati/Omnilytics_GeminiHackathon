
import * as Gemini from './geminiService';
import { AnalysisState, VideoIntegrityReport } from '../types';
import { computeUncertaintyMetrics } from '../utils/uncertainty';

// Deterministic hash based on file props to ensure same video = same results
const generateHash = async (file: File) => {
    const msgBuffer = new TextEncoder().encode(file.name + file.size + file.type);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'SHA256-' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16).toUpperCase();
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const runFullPipeline = async (
    file: File, 
    updateState: (partial: Partial<AnalysisState>) => void
) => {
    try {
        updateState({ isProcessing: true, processingStage: 'FILE_INTAKE' });
        
        // 1. Convert/Upload
        const base64Data = await Gemini.uploadFileToGemini(file);
        const mimeType = file.type;
        const fileHash = await generateHash(file);

        // 2. Integrity Check (Local simulation + basic metadata)
        updateState({ processingStage: 'INTEGRITY_CHECK' });
        const integrity: VideoIntegrityReport = {
            hash: fileHash,
            codec: mimeType.split('/')[1] || 'unknown',
            fps: 30, // Assumed for web
            duration: 0, // Would need video element to get real duration, assuming 0 for now until loaded
            droppedFrames: 0,
            vfr: false,
            interpolationScore: 0,
            verdict: 'OK'
        };
        updateState({ integrity });

        // 3. Perception Layer (Gemini Vision)
        updateState({ processingStage: 'PERCEPTION_ANALYSIS' });
        const structure = await Gemini.analyzeVideoStructure(base64Data, mimeType);
        updateState({ 
            objects: structure.objects,
            events: structure.events
        });

        if (structure.events.length === 0 && structure.objects.length === 0) {
            updateState({ 
                isProcessing: false, 
                executiveSummary: "INSUFFICIENT EVIDENCE — NO CLAIM GENERATED. The system could not identify relevant objects or events in the footage." 
            });
            return;
        }

        // 4. Causal Layer
        updateState({ processingStage: 'CAUSAL_MODELING' });
        await sleep(3000); // Throttling
        const graph = await Gemini.generateCausalGraph(structure.events, structure.objects);
        updateState({ graph });
        await sleep(4000); // Throttling to prevent Rate Limit (429)

        // 5. Counterfactual Engine
        updateState({ processingStage: 'COUNTERFACTUAL_SIM' });
        const counterfactuals = await Gemini.generateCounterfactuals(structure.events, graph);
        updateState({ counterfactuals });
        await sleep(4000); // Throttling

        // 6. Stress Testing
        updateState({ processingStage: 'ROBUSTNESS_TEST' });
        const stressTests = await Gemini.generateStressTests(graph);
        updateState({ stressTests });
        await sleep(3000); // Throttling

        // 7. Uncertainty & Observability
        const uncertaintyData = computeUncertaintyMetrics(structure.objects, structure.events);

        // 8. Intervention & Summary Layer
        updateState({ processingStage: 'SYNTHESIS' });
        
        // EXECUTING SEQUENTIALLY TO PREVENT 429 RATE LIMITS
        // PASS COUNTERFACTUALS TO INTERVENTIONS
        const interventions = await Gemini.generateInterventions(graph.nodes, graph.edges, counterfactuals);
        await sleep(3000);

        const summary = await Gemini.generateExecutiveSummary(structure.events, graph);
        await sleep(3000);

        const signalsSummary = await Gemini.generateSignalsSummary(structure.objects);
        await sleep(2000);

        const perceptionSummary = await Gemini.generatePerceptionSummary(structure.objects);
        await sleep(2000);

        const measurementsSummary = await Gemini.generateMeasurementsSummary(structure.objects);
        await sleep(2000);

        const uncertaintySummary = await Gemini.generateUncertaintySummary(uncertaintyData);
        await sleep(2000);

        const causalReport = await Gemini.generateCausalExecutiveReport(graph.nodes, graph.edges);

        updateState({
            interventions,
            executiveSummary: summary,
            signalsSummary: signalsSummary,
            perceptionSummary: perceptionSummary,
            measurementsSummary: measurementsSummary,
            uncertaintySummary: uncertaintySummary,
            uncertaintyData: uncertaintyData,
            causalReport: causalReport,
            isProcessing: false,
            processingStage: 'COMPLETE'
        });

    } catch (error) {
        console.error("Pipeline Error", error);
        updateState({ 
            isProcessing: false, 
            executiveSummary: "ANALYSIS FAILED. Could not process video file." 
        });
    }
};