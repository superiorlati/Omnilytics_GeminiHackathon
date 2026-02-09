import { VideoIntegrityReport, CausalNode, CausalEdge, Intervention, SignalDataPoint, TrackedObject, StressTestResult, CounterfactualBranch, TimelineEvent } from '../types';

// INITIAL EMPTY STATES
// The system must utilize real uploaded video data only.

export const EMPTY_INTEGRITY_REPORT: VideoIntegrityReport = {
  hash: '',
  codec: '',
  fps: 0,
  duration: 0,
  droppedFrames: 0,
  vfr: false,
  interpolationScore: 0,
  verdict: 'OK',
};

export const EMPTY_NODES: CausalNode[] = [];
export const EMPTY_EDGES: CausalEdge[] = [];
export const EMPTY_INTERVENTIONS: Intervention[] = [];
export const EMPTY_TIMELINE_EVENTS: TimelineEvent[] = [];
export const EMPTY_SPEED_SIGNAL: SignalDataPoint[] = [];
export const EMPTY_OBJECTS: TrackedObject[] = [];
export const EMPTY_STRESS_TESTS: StressTestResult[] = [];
export const EMPTY_COUNTERFACTUALS: CounterfactualBranch[] = [];
