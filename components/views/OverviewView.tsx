
import React, { useState } from 'react';
import VideoPanel from '../VideoPanel';
import CausalGraphPanel from '../CausalGraphPanel';
import { AnalysisState } from '../../types';
import { Activity, Box, HelpCircle, CheckCircle, ArrowRight, PlayCircle, Loader2, AlertCircle, FileSearch, Brain, Network, GitMerge, ShieldAlert, FileText, Check } from 'lucide-react';

interface OverviewViewProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  timestamp: number;
  onTimeUpdate: (t: number) => void;
  videoSrc: string | null;
  analysisState: AnalysisState;
}

const OverviewView: React.FC<OverviewViewProps> = ({ isPlaying, onTogglePlay, timestamp, onTimeUpdate, videoSrc, analysisState }) => {
  const [overlays, setOverlays] = useState({
      tracks: true,
      motion: false,
      occlusion: true,
      uncertainty: false
  });

  const toggleOverlay = (key: keyof typeof overlays) => {
      setOverlays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const seekTo = (t: number) => {
      onTimeUpdate(t);
  };

  // PROCESSING PIPELINE VISUALIZATION
  if (analysisState.isProcessing) {
      const steps = [
          { id: 'FILE_INTAKE', label: 'File Intake & Hash', icon: FileSearch },
          { id: 'INTEGRITY_CHECK', label: 'Integrity Verification', icon: ShieldAlert },
          { id: 'PERCEPTION_ANALYSIS', label: 'Perception (Vision Model)', icon: Brain },
          { id: 'CAUSAL_MODELING', label: 'Causal Graph Construction', icon: Network },
          { id: 'COUNTERFACTUAL_SIM', label: 'Counterfactual Simulation', icon: GitMerge },
          { id: 'ROBUSTNESS_TEST', label: 'Robustness Stress Testing', icon: Activity },
          { id: 'SYNTHESIS', label: 'Executive Report Synthesis', icon: FileText },
      ];

      const currentIndex = steps.findIndex(s => s.id === analysisState.processingStage);

      return (
          <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono overflow-y-auto p-4">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl shrink-0 my-auto">
                  <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                      <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                      <h2 className="text-xl font-bold text-slate-200 tracking-wider">PIPELINE EXECUTION</h2>
                  </div>
                  
                  <div className="space-y-4 relative">
                      {/* Vertical line connector */}
                      <div className="absolute left-3.5 top-2 bottom-4 w-0.5 bg-slate-800 z-0"></div>

                      {steps.map((step, idx) => {
                          const isCompleted = idx < currentIndex;
                          const isCurrent = idx === currentIndex;
                          
                          return (
                              <div key={step.id} className={`relative z-10 flex items-center gap-4 transition-all duration-300 ${isCurrent ? 'scale-105' : 'opacity-60'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                      isCompleted ? 'bg-emerald-900/50 border-emerald-500 text-emerald-500' : 
                                      isCurrent ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400 animate-pulse' : 
                                      'bg-slate-950 border-slate-700 text-slate-700'
                                  }`}>
                                      {isCompleted ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                                  </div>
                                  <div>
                                      <div className={`text-sm font-bold ${isCurrent ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-slate-600'}`}>
                                          {step.label}
                                      </div>
                                      {isCurrent && <div className="text-[10px] text-cyan-600 animate-pulse">Processing...</div>}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  // EMPTY STATE (Post-processing but no data found)
  if (!analysisState.isProcessing && analysisState.events.length === 0 && analysisState.objects.length === 0 && analysisState.executiveSummary) {
       return (
          <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 overflow-y-auto">
              <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
              <h2 className="text-xl font-bold text-slate-300">INSUFFICIENT EVIDENCE</h2>
              <p className="max-w-md text-center mt-2 text-slate-500">{analysisState.executiveSummary}</p>
          </div>
       );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-950 p-6 scroll-smooth pb-32">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[65%_35%] gap-8">
        
        {/* LEFT COLUMN: Video & Timeline */}
        <div className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-500" />
                        Live Reconstruction
                    </h2>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                    <div className="h-[500px] w-full relative">
                        <VideoPanel 
                            isPlaying={isPlaying} 
                            onTogglePlay={onTogglePlay} 
                            timestamp={timestamp} 
                            onTimeUpdate={onTimeUpdate}
                            videoSrc={videoSrc}
                            showTracks={overlays.tracks}
                            showMotion={overlays.motion}
                            showOcclusion={overlays.occlusion}
                            showUncertainty={overlays.uncertainty}
                            // Pass real data
                            trackedObjects={analysisState.objects}
                            events={analysisState.events}
                        />
                    </div>
                    
                    <div className="bg-slate-950 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                             <div className="text-sm font-mono text-cyan-400 font-bold bg-slate-900 px-3 py-1.5 rounded border border-slate-800 shadow-inner">
                                 {timestamp.toFixed(2)}s
                             </div>
                         </div>
                         <div className="flex flex-wrap justify-center gap-3">
                             <OverlayButton active={overlays.tracks} onClick={() => toggleOverlay('tracks')} icon={<CheckCircle className="w-4 h-4" />} label="Tracks" />
                             <OverlayButton active={overlays.occlusion} onClick={() => toggleOverlay('occlusion')} icon={<Box className="w-4 h-4" />} label="Occlusion" color="text-red-400" />
                         </div>
                    </div>
                </div>
            </div>

            {/* Semantic Timeline */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg relative overflow-hidden">
                <h3 className="text-base font-bold text-slate-200 mb-6">Semantic Timeline</h3>
                <div className="relative w-full h-24 flex items-center mt-2 px-4 select-none">
                    <div className="absolute left-0 right-0 h-1.5 bg-slate-800 rounded-full"></div>
                    <div className="absolute left-0 h-1.5 bg-gradient-to-r from-cyan-900 to-cyan-500 rounded-full" style={{ width: `${(timestamp / (analysisState.integrity?.duration || 15)) * 100}%` }}></div>

                    {analysisState.events.map((event, idx) => {
                        const duration = analysisState.integrity?.duration || 15;
                        const pct = Math.min((event.timestamp / duration) * 100, 100);
                        return (
                            <div 
                                key={idx}
                                className="absolute top-1/2 -translate-y-1/2 group cursor-pointer z-20"
                                style={{ left: `${pct}%` }}
                                onClick={() => seekTo(event.timestamp)}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 shadow-lg ${event.type === 'impact' ? 'bg-red-500 border-red-300' : 'bg-emerald-500 border-emerald-300'} hover:scale-150 transition-transform`}></div>
                                <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center">
                                    <span className="text-xs font-bold text-slate-300 bg-slate-900/90 px-2 py-1 rounded backdrop-blur-sm border border-slate-800 shadow-xl mb-1 flex items-center gap-1">
                                        <PlayCircle className="w-3 h-3 text-cyan-500" />
                                        {event.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
            
            <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-slate-300 flex flex-col">
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-500" />
                        Causal Chain
                    </h3>
                </div>
                <div className="h-[350px] w-full bg-slate-50 relative">
                     {analysisState.graph.nodes.length > 0 ? (
                        <CausalGraphPanel nodes={analysisState.graph.nodes} edges={analysisState.graph.edges} />
                     ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">NO CAUSAL LINKS DETECTED</div>
                     )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wide">Executive Summary</h3>
                <div className="text-sm text-slate-700 leading-7 whitespace-pre-wrap">
                    {analysisState.executiveSummary || "Analysis pending..."}
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-800 mb-5">Suggested Interventions</h3>
                <div className="flex flex-col gap-4">
                    {analysisState.interventions.length > 0 ? analysisState.interventions.map((inv, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-slate-900">{inv.name}</h4>
                            <p className="text-xs text-slate-600 mt-1">{inv.description}</p>
                        </div>
                    )) : (
                        <div className="text-xs text-slate-500 italic">No interventions required based on current evidence.</div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const OverlayButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color?: string }> = ({ active, onClick, icon, label, color }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${active ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
        <span className={active ? (color || 'text-cyan-600') : 'text-slate-500'}>{icon}</span>
        {label}
    </button>
);

export default OverviewView;
