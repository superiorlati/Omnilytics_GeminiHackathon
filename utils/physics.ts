
import { TrackedObject } from '../types';

// Utility to interpolate sparse data into dense time series
export const interpolateSeries = (sparse: number[][], duration: number, step = 0.1) => {
    if (!sparse || sparse.length < 2) return [];
    
    // Sort by time
    const sorted = [...sparse].sort((a, b) => a[0] - b[0]);
    const dense: { time: number; value: number }[] = [];
    
    let currentIdx = 0;
    for (let t = 0; t <= duration; t += step) {
        // Find surrounding points
        while (currentIdx < sorted.length - 1 && sorted[currentIdx + 1][0] < t) {
            currentIdx++;
        }
        
        const p1 = sorted[currentIdx];
        const p2 = sorted[currentIdx + 1];
        
        if (p1 && p2) {
            const range = p2[0] - p1[0];
            const ratio = (t - p1[0]) / range;
            const value = p1[1] + (p2[1] - p1[1]) * ratio;
            dense.push({ time: Number(t.toFixed(1)), value: Math.max(0, value) });
        } else if (p1) {
            // Extrapolate flat if tracking lost
            dense.push({ time: Number(t.toFixed(1)), value: p1[1] });
        } else {
             dense.push({ time: Number(t.toFixed(1)), value: 0 });
        }
    }
    return dense;
};

// Compute Acceleration (1st derivative of speed)
export const computeAcceleration = (speedSeries: { time: number; value: number }[]) => {
    return speedSeries.map((point, i) => {
        if (i === 0) return { time: point.time, value: 0 };
        const prev = speedSeries[i - 1];
        const dt = point.time - prev.time;
        const dv = point.value - prev.value;
        const accel = dt > 0 ? dv / dt : 0;
        return { time: point.time, value: accel }; // m/s^2
    });
};

// Compute Kinetic Energy Proxy (0.5 * m * v^2) - Mass assumed relative unit
export const computeEnergy = (speedSeries: { time: number; value: number }[]) => {
    return speedSeries.map(point => ({
        time: point.time,
        value: 0.5 * Math.pow(point.value, 2) // Unit Mass
    }));
};

// Compute Distance Between Two Objects
// Note: Since we only have 1D speed profiles from the sparse AI response in this demo,
// we simulate relative distance closing for the demo. In a real system, this uses (x,y) centroids.
export const computeDistanceAndTTC = (obj1: TrackedObject, obj2: TrackedObject, duration: number) => {
    // Mock simulation of trajectory convergence for demo purposes based on "Approaching" labels
    const isConverging = obj1.direction?.includes(obj2.direction) || true; 
    const dense1 = interpolateSeries(obj1.speedProfile || [], duration);
    const dense2 = interpolateSeries(obj2.speedProfile || [], duration);
    
    const results = [];
    let distance = 50; // Start 50m apart (simulation)

    for (let i = 0; i < Math.min(dense1.length, dense2.length); i++) {
        const v1 = dense1[i].value;
        const v2 = dense2[i].value;
        const closingSpeed = Math.abs(v1 - v2); // Simplified closing speed
        
        distance -= (closingSpeed * 0.1); // 0.1s step
        if (distance < 0) distance = 0;

        const ttc = closingSpeed > 1 ? distance / closingSpeed : 10; // Cap TTC
        
        results.push({
            time: dense1[i].time,
            distance: distance,
            ttc: ttc,
            risk: ttc < 2.5 && distance < 20 // Risk flag
        });
    }
    return results;
};
