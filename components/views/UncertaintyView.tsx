
import React from 'react';
import VideoPanel from '../VideoPanel';
import { AnalysisState, UncertaintyNode } from '../../types';
import { AlertOctagon, EyeOff, ShieldAlert, BarChart3, HelpCircle } from 'lucide-react';

interface UncertaintyViewProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  timestamp: number;
  onTimeUpdate: (t: number) => void;
  videoSrc: string | null;
  analysisState: AnalysisState;
}

const UncertaintyBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    // Value 0 = Certain, 1 = Uncertain
    const pct = value * 100;
    const color = value < 0.3 ? 'bg-emerald-500' : value < 0.6 ? 'bg-amber-500' : 'bg-red-500';
    
    return (
        <div className="mb-2">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>{label}</span>
                <span>{(value * 100).toFixed(1)}% Error</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
};

const UncertaintyView: React.FC<UncertaintyViewProps> = ({ 
    isPlaying, onTogglePlay, timestamp, onTimeUpdate, videoSrc, analysisState 
}) => {
  const { uncertaintyData, uncertaintySummary } = analysisState;

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
        
        {/* VIEW HEADER */}
        <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
            <div>
                <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-amber-500" />
                    UNCERTAINTY & OBSERVABILITY
                </h2>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    CONFIDENCE LOSS • BLIND SPOTS • ERROR PROPAGATION
                </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/10 border border-amber-900/30 rounded text-amber-500 text-[10px] font-bold">
                 <ShieldAlert className="w-3 h-3" />
                 OBSERVABILITY AUDIT ACTIVE
            </div>
        </div>

        <div className="flex-grow flex flex-col lg:flex-row min-h-0">
            
            {/* LEFT COLUMN: VISUALS & NODES */}
            <div className="flex-grow flex flex-col border-r border-slate-800 relative">
                
                {/* PANEL 2: OCCLUSION LOSS MAP */}
                <div className="h-[55%] relative bg-black border-b border-slate-800">
                    <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-red-400 font-bold border border-red-900/50">
                        CONFIDENCE LOSS HEATMAP
                    </div>
                    <VideoPanel 
                        isPlaying={isPlaying} 
                        onTogglePlay={onTogglePlay} 
                        timestamp={timestamp} 
                        onTimeUpdate={onTimeUpdate}
                        videoSrc={videoSrc}
                        // Force heatmap overlay
                        showHeatmap={true} 
                        trackedObjects={analysisState.objects}
                        events={analysisState.events}
                    />
                </div>

                {/* PANEL 1: NODE-LEVEL UNCERTAINTY */}
                <div className="flex-grow bg-slate-900 p-4 overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-slate-500" />
                        NODE UNCERTAINTY METRICS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uncertaintyData?.nodes.map(node => (
                            <div key={node.objectId} className="bg-slate-950 border border-slate-800 rounded p-3 hover:border-slate-600 transition-colors">
                                <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                                    <span className="text-xs font-bold text-slate-200">{node.label} #{node.objectId}</span>
                                    <span className="text-[9px] text-slate-500 font-mono">ID Persistence: {(1 - node.persistenceRisk).toFixed(2)}</span>
                                </div>
                                <UncertaintyBar label="Position Error" value={node.posUncertainty} />
                                <UncertaintyBar label="Velocity Noise" value={node.velUncertainty} />
                                <UncertaintyBar label="Dynamics Var" value={node.accelUncertainty} />
                            </div>
                        ))}
                        {(!uncertaintyData?.nodes || uncertaintyData.nodes.length === 0) && (
                            <div className="text-xs text-slate-500 italic">No tracked nodes available for uncertainty analysis.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: BUDGET & SUMMARY */}
            <div className="w-[400px] shrink-0 bg-slate-950 flex flex-col overflow-y-auto">
                
                {/* PANEL 3: CONFIDENCE BUDGET */}
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <HelpCircle className="w-3 h-3 text-cyan-500" />
                        CONFIDENCE BUDGET BREAKDOWN
                    </h3>
                    <div className="space-y-1">
                        <div className="grid grid-cols-4 text-[9px] text-slate-500 font-bold uppercase mb-2 px-2">
                            <div className="col-span-2">Pipeline Stage</div>
                            <div className="text-right">Loss</div>
                            <div className="text-right">Net Conf</div>
                        </div>
                        {uncertaintyData?.budget.map((row, i) => (
                            <div key={i} className="grid grid-cols-4 items-center bg-slate-900 rounded p-2 border border-slate-800 text-[10px]">
                                <div className="col-span-2 font-bold text-slate-300">{row.stage}</div>
                                <div className="text-right text-red-400 font-mono">-{row.loss.toFixed(3)}</div>
                                <div className="text-right font-mono font-bold text-emerald-400">{(row.outputConf * 100).toFixed(1)}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PANEL 4: BLIND SPOTS & SUMMARY */}
                <div className="p-4 flex-grow flex flex-col gap-4">
                    
                    <div>
                        <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            BLIND SPOTS & GAPS
                        </h3>
                        <div className="space-y-2">
                            {uncertaintyData?.blindSpots.length === 0 ? (
                                <div className="text-xs text-slate-500 italic p-2 border border-slate-800 rounded">No critical blind spots detected.</div>
                            ) : (
                                uncertaintyData?.blindSpots.map((spot, i) => (
                                    <div key={i} className={`p-3 rounded border text-xs flex gap-3 ${
                                        spot.severity === 'HIGH' ? 'bg-red-900/10 border-red-900/50 text-red-300' :
                                        spot.severity === 'MEDIUM' ? 'bg-amber-900/10 border-amber-900/50 text-amber-300' :
                                        'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}>
                                        <div className={`mt-0.5 w-1.5 h-1.5 shrink-0 rounded-full ${
                                            spot.severity === 'HIGH' ? 'bg-red-500' : spot.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-500'
                                        }`}></div>
                                        <div>
                                            <div className="font-bold mb-1 opacity-80">{spot.type} BLIND SPOT</div>
                                            <div className="leading-tight opacity-90">{spot.description}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded p-4 flex-grow">
                        <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">AI Observability Audit</h3>
                        <div className="text-[10px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
                            {uncertaintySummary || "Audit pending..."}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    </div>
  );
};

export default UncertaintyView;
