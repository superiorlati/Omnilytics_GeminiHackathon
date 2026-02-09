
import { TrackedObject, TimelineEvent, UncertaintyNode, ConfidenceBudgetRow, BlindSpot, UncertaintyAnalysis } from '../types';

export const computeUncertaintyMetrics = (objects: TrackedObject[], events: TimelineEvent[]): UncertaintyAnalysis => {
    
    // 1. Node-Level Uncertainty (Propagation)
    const nodes: UncertaintyNode[] = objects.map(obj => {
        // Base uncertainty from detection confidence
        const baseUncertainty = 1 - obj.avgConfidence;
        
        // Velocity uncertainty scales with speed (motion blur risk) and base uncertainty
        const velUncertainty = Math.min(1, baseUncertainty * 1.2 + (obj.maxSpeed > 80 ? 0.2 : 0));
        
        // Acceleration uncertainty is derivative of velocity error (amplified noise)
        const accelUncertainty = Math.min(1, velUncertainty * 1.5);

        // Persistence risk from tracking gaps (simulated here via duration/confidence)
        const persistenceRisk = Math.min(1, baseUncertainty + (obj.motionState === 'erratic' ? 0.3 : 0));

        return {
            objectId: obj.id,
            label: obj.label,
            posUncertainty: baseUncertainty,
            velUncertainty,
            accelUncertainty,
            persistenceRisk
        };
    });

    // 2. Confidence Budget (Erosion Model)
    // Starting with 100% ideal confidence, subtracted by aggregate errors at each stage
    const avgDetectionConf = objects.length > 0 
        ? objects.reduce((acc, o) => acc + o.avgConfidence, 0) / objects.length 
        : 0;
    
    // Stage 1: Detection
    const detectionInput = 1.0;
    const detectionLoss = (1 - avgDetectionConf) * 0.15; // 15% weight to raw detection noise
    const detectionOutput = detectionInput - detectionLoss;

    // Stage 2: Tracking (Identity Switches)
    const trackingLoss = 0.05 + (events.filter(e => e.type === 'occlusion').length * 0.02);
    const trackingOutput = detectionOutput - trackingLoss;

    // Stage 3: Motion Estimation (Flow/Derivative Noise)
    const motionLoss = trackingLoss * 1.5; // Derivatives amplify noise
    const motionOutput = trackingOutput - motionLoss;

    // Stage 4: Dynamics/Physics
    const dynamicsLoss = 0.05; // Model error
    const dynamicsOutput = motionOutput - dynamicsLoss;

    const budget: ConfidenceBudgetRow[] = [
        { stage: 'Raw Detection', inputConf: detectionInput, loss: detectionLoss, outputConf: detectionOutput },
        { stage: 'Multi-Object Tracking', inputConf: detectionOutput, loss: trackingLoss, outputConf: trackingOutput },
        { stage: 'Motion Estimation', inputConf: trackingOutput, loss: motionLoss, outputConf: motionOutput },
        { stage: 'Dynamics Modeling', inputConf: motionOutput, loss: dynamicsLoss, outputConf: dynamicsOutput },
    ];

    // 3. Blind Spot Detection
    const blindSpots: BlindSpot[] = [];
    
    // Analytical Blind Spots (Low confidence tracks)
    const lowConfObjects = objects.filter(o => o.avgConfidence < 0.6);
    if (lowConfObjects.length > 0) {
        blindSpots.push({
            type: 'ANALYTICAL',
            description: `High uncertainty for IDs: ${lowConfObjects.map(o => o.id).join(', ')} due to low detection score.`,
            severity: 'HIGH'
        });
    }

    // Temporal Blind Spots (Occlusion Events)
    const occlusionEvents = events.filter(e => e.type === 'occlusion');
    if (occlusionEvents.length > 0) {
        blindSpots.push({
            type: 'TEMPORAL',
            description: `${occlusionEvents.length} occlusion intervals detected where tracking relies on prediction.`,
            severity: 'MEDIUM'
        });
    }

    // Spatial (Simulated for demo - assuming edges of frame are less reliable)
    blindSpots.push({
        type: 'SPATIAL',
        description: 'Perimeter distortion: Lens geometry reduces accuracy at frame edges > 85%.',
        severity: 'LOW'
    });

    return { nodes, budget, blindSpots };
};
