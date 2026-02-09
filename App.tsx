
import React, { useState } from 'react';
import LandingScreen from './components/LandingScreen';
import Navigation from './components/Navigation';
import OverviewView from './components/views/OverviewView';
import EvidenceView from './components/views/EvidenceView';
import PerceptionView from './components/views/PerceptionView';
import MeasurementsView from './components/views/MeasurementsView';
import UncertaintyView from './components/views/UncertaintyView';
import SignalsView from './components/views/SignalsView';
import CounterfactualView from './components/views/CounterfactualView';
import StressView from './components/views/StressView';
import AuditView from './components/views/AuditView';
import CausalView from './components/views/CausalView';
import InterventionView from './components/views/InterventionView';
import { runFullPipeline } from './services/pipeline';

import { 
    AnalysisState, 
    AppView, 
    DashboardTab,
    CounterfactualBranch
} from './types';
import { Network } from 'lucide-react';

const INITIAL_STATE: AnalysisState = {
    view: 'LANDING',
    activeTab: 'OVERVIEW',
    videoId: null,
    timestamp: 0,
    integrity: null,
    graph: { nodes: [], edges: [] },
    interventions: [],
    events: [],
    objects: [],
    signals: [],
    counterfactuals: [],
    stressTests: [],
    
    // Tab 10 Init
    auditLog: [],
    overrides: [],

    isPlaying: false,
    isProcessing: false,
    processingStage: '',
    executiveSummary: '',
    signalsSummary: '',
    perceptionSummary: '',
    measurementsSummary: '',
    uncertaintySummary: '',
    uncertaintyData: { nodes: [], budget: [], blindSpots: [] },
    causalReport: ''
};

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const updateState = (partial: Partial<AnalysisState>) => {
      setState(prev => ({ ...prev, ...partial }));
  };

  const handleFileUpload = (file: File) => {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      updateState({ view: 'DASHBOARD', activeTab: 'OVERVIEW' });
      
      // TRIGGER THE REAL PIPELINE
      runFullPipeline(file, updateState);
  };
  
  const handleUpdateBranch = (updatedBranch: CounterfactualBranch) => {
      const updatedBranches = state.counterfactuals.map(b => 
          b.id === updatedBranch.id ? updatedBranch : b
      );
      updateState({ counterfactuals: updatedBranches });
  };

  const renderContent = () => {
      // If processing, show loading state within the tab (or overlay)
      if (state.isProcessing && state.activeTab === 'OVERVIEW') {
          // We let OverviewView handle the "Empty/Loading" state internally via props
      }

      switch (state.activeTab) {
          case 'OVERVIEW':
              return (
                  <OverviewView 
                    isPlaying={state.isPlaying} 
                    onTogglePlay={() => updateState({ isPlaying: !state.isPlaying })} 
                    timestamp={state.timestamp} 
                    onTimeUpdate={(t) => updateState({ timestamp: t })} 
                    videoSrc={videoUrl}
                    analysisState={state} // Pass full state
                  />
              );
          case 'EVIDENCE':
              return (
                  <EvidenceView 
                    isPlaying={state.isPlaying}
                    onTogglePlay={() => updateState({ isPlaying: !state.isPlaying })}
                    timestamp={state.timestamp}
                    onTimeUpdate={(t) => updateState({ timestamp: t })}
                    report={state.integrity}
                    videoSrc={videoUrl}
                    analysisState={state}
                  />
              );
          case 'PERCEPTION':
              return (
                  <PerceptionView 
                    isPlaying={state.isPlaying}
                    onTogglePlay={() => updateState({ isPlaying: !state.isPlaying })}
                    timestamp={state.timestamp}
                    onTimeUpdate={(t) => updateState({ timestamp: t })}
                    videoSrc={videoUrl}
                    analysisState={state}
                  />
              );
          case 'MEASUREMENTS':
              return (
                  <MeasurementsView 
                    objects={state.objects}
                    timestamp={state.timestamp}
                    measurementsSummary={state.measurementsSummary}
                    duration={state.integrity?.duration || 15}
                  />
              );
          case 'UNCERTAINTY':
              return (
                  <UncertaintyView 
                    isPlaying={state.isPlaying}
                    onTogglePlay={() => updateState({ isPlaying: !state.isPlaying })}
                    timestamp={state.timestamp}
                    onTimeUpdate={(t) => updateState({ timestamp: t })}
                    videoSrc={videoUrl}
                    analysisState={state}
                  />
              );
          case 'SIGNALS':
              return (
                  <SignalsView 
                    objects={state.objects} 
                    currentTime={state.timestamp} 
                    signalsSummary={state.signalsSummary}
                  />
              );
          case 'CAUSAL':
              return <CausalView analysisState={state} />;
          case 'COUNTERFACTUAL':
              return (
                <CounterfactualView 
                    branches={state.counterfactuals} 
                    onUpdateBranch={handleUpdateBranch}
                />
              );
          case 'STRESS':
              return <StressView analysisState={state} />;
          case 'INTERVENTION':
              return <InterventionView interventions={state.interventions} />;
          case 'AUDIT':
              return (
                  <AuditView 
                    integrity={state.integrity} 
                    edges={state.graph.edges} 
                    interventions={state.interventions}
                    analysisState={state} 
                  />
              );
          default:
              return <div className="p-4 text-slate-500">View not implemented</div>;
      }
  };

  if (state.view === 'LANDING') {
      return (
        <LandingScreen 
            onFileSelect={handleFileUpload} 
        />
      );
  }

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col">
      {/* Global Header */}
      <header className="h-12 border-b border-slate-800 flex items-center px-4 bg-slate-900 justify-between shrink-0">
        <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-sm tracking-wider">CAUSAL<span className="text-cyan-500">VISION</span> ANALYST</span>
        </div>
        <div className="flex items-center gap-4">
             {state.isProcessing && (
                 <div className="text-[10px] text-cyan-400 animate-pulse font-mono">
                     STATUS: {state.processingStage.replace('_', ' ')}...
                 </div>
             )}
             <button 
                onClick={() => {
                    setVideoUrl(null);
                    setState(INITIAL_STATE);
                }}
                className="text-xs text-slate-500 hover:text-slate-300"
             >
                 Reset
             </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <Navigation activeTab={state.activeTab} onTabChange={(t) => updateState({ activeTab: t })} />

      {/* Main Content Area */}
      <main className="flex-grow min-h-0 bg-slate-950 overflow-hidden relative">
          {renderContent()}
      </main>
    </div>
  );
};

export default App;
