
import React, { useState } from 'react';
import VideoPanel from '../VideoPanel';
import { AnalysisState } from '../../types';
import { 
    Eye, Activity, Layers, Scan, Zap, Crosshair, 
    Wind, Maximize, AlertCircle, Radio
} from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';

interface PerceptionViewProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  timestamp: number;
  onTimeUpdate: (t: number) => void;
  videoSrc: string | null;
  analysisState: AnalysisState;
}

const PerceptionView: React.FC<PerceptionViewProps> = ({ 
    isPlaying, onTogglePlay, timestamp, onTimeUpdate, videoSrc, analysisState 
}) => {
  const [layers, setLayers] = useState({
      flow: true,
      heatmap: false,
      boxes: true
  });

  const toggleLayer = (key: keyof typeof layers) => {
      setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const confidenceData = analysisState.objects.map(obj => ({
      name: `ID ${obj.id}`,
      uv: obj.avgConfidence * 100,
      fill: obj.avgConfidence > 0.8 ? '#10b981' : '#f59e0b'
  }));

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
        
        {/* VIEW HEADER */}
        <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
            <div>
                <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                    <Scan className="w-4 h-4 text-purple-500" />
                    PERCEPTION & SIGNALS
                </h2>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    OPTICAL FLOW • TRACKING FIDELITY • OCCLUSION MAPS
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-purple-400">VISION ENGINE ACTIVE</span>
                </div>
            </div>
        </div>

        <div className="flex-grow flex min-h-0">
            
            {/* LEFT: VIDEO STAGE (Panel 1) & FLOW CONTROLS (Panel 3) */}
            <div className="flex-grow flex flex-col border-r border-slate-800 bg-black relative">
                 <div className="flex-grow relative">
                     <VideoPanel 
                        isPlaying={isPlaying} 
                        onTogglePlay={onTogglePlay} 
                        timestamp={timestamp} 
                        onTimeUpdate={onTimeUpdate}
                        videoSrc={videoSrc}
                        // Perception Overlays
                        showTracks={layers.boxes}
                        showFlow={layers.flow}
                        showHeatmap={layers.heatmap}
                        trackedObjects={analysisState.objects}
                        events={analysisState.events}
                    />
                 </div>
                 
                 {/* PANEL 3: OPTICAL FLOW & VISUALIZATION CONTROLS */}
                 <div className="h-48 bg-slate-900/50 border-t border-slate-800 p-4 grid grid-cols-2 gap-8">
                      <div>
                          <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                              <Layers className="w-3 h-3" />
                              SIGNAL LAYERS
                          </h3>
                          <div className="flex gap-3">
                              <button 
                                onClick={() => toggleLayer('flow')}
                                className={`flex flex-col items-center justify-center w-20 h-20 rounded border transition-all ${layers.flow ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                              >
                                  <Wind className="w-6 h-6 mb-2" />
                                  <span className="text-[9px] font-bold">OPTICAL FLOW</span>
                              </button>
                              <button 
                                onClick={() => toggleLayer('heatmap')}
                                className={`flex flex-col items-center justify-center w-20 h-20 rounded border transition-all ${layers.heatmap ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                              >
                                  <AlertCircle className="w-6 h-6 mb-2" />
                                  <span className="text-[9px] font-bold">OCCLUSION</span>
                              </button>
                              <button 
                                onClick={() => toggleLayer('boxes')}
                                className={`flex flex-col items-center justify-center w-20 h-20 rounded border transition-all ${layers.boxes ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                              >
                                  <Crosshair className="w-6 h-6 mb-2" />
                                  <span className="text-[9px] font-bold">BOUNDING BOX</span>
                              </button>
                          </div>
                      </div>
                      
                      <div>
                          <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                              <Activity className="w-3 h-3" />
                              PERCEPTION SUMMARY (GEMINI VALIDATED)
                          </h3>
                          <div className="bg-slate-950 border border-slate-800 rounded p-3 text-[10px] text-slate-300 font-mono leading-relaxed h-20 overflow-y-auto">
                              {analysisState.perceptionSummary || "Awaiting vision processing..."}
                          </div>
                      </div>
                 </div>
            </div>

            {/* RIGHT: ANALYTICS (Panel 2, 4, 5) */}
            <div className="w-[350px] shrink-0 bg-slate-950 border-l border-slate-800 flex flex-col overflow-y-auto">
                
                {/* PANEL 2: OBJECT ID LIST & LIFESPAN */}
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                        <Eye className="w-3 h-3 text-cyan-500" />
                        TRACKING LIFESPAN
                    </h3>
                    <div className="space-y-3">
                        {analysisState.objects.map(obj => {
                            const totalDuration = (analysisState.integrity?.duration || 20);
                            const startPct = (obj.firstSeen / totalDuration) * 100;
                            const widthPct = ((obj.lastSeen - obj.firstSeen) / totalDuration) * 100;
                            const isActive = timestamp >= obj.firstSeen && timestamp <= obj.lastSeen;

                            return (
                                <div key={obj.id} className="group cursor-pointer" onClick={() => onTimeUpdate(obj.firstSeen)}>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className={`text-[10px] font-bold ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                                            {obj.label} #{obj.id}
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-600">
                                            {(obj.lastSeen - obj.firstSeen).toFixed(1)}s
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-900 rounded-full relative overflow-hidden">
                                        <div 
                                            className={`absolute top-0 bottom-0 rounded-full ${obj.avgConfidence > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'} ${isActive ? 'shadow-[0_0_8px_currentColor]' : 'opacity-50'}`}
                                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {analysisState.objects.length === 0 && (
                            <div className="text-xs text-slate-500 italic">No tracked objects found.</div>
                        )}
                    </div>
                </div>

                {/* PANEL 5: MOTION CONFIDENCE INDICATORS */}
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                        <Radio className="w-3 h-3 text-emerald-500" />
                        TRACKING STABILITY SIGNAL
                    </h3>
                    <div className="h-40 relative">
                        {confidenceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius="10%" 
                                    outerRadius="80%" 
                                    barSize={10} 
                                    data={confidenceData}
                                >
                                    <RadialBar
                                        background
                                        dataKey="uv"
                                    />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px', color: '#fff'}} 
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-slate-600">NO DATA</div>
                        )}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <div className="text-xl font-bold text-slate-200">
                                {analysisState.objects.length > 0 
                                    ? Math.round(analysisState.objects.reduce((acc, curr) => acc + curr.avgConfidence, 0) / analysisState.objects.length * 100)
                                    : 0}%
                            </div>
                            <div className="text-[8px] text-slate-500 uppercase">Mean Conf</div>
                        </div>
                    </div>
                </div>

                {/* PANEL 4: OCCLUSION PROBABILITY MAP (List View Proxy) */}
                <div className="p-4 flex-grow">
                    <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-red-500" />
                        OCCLUSION RISK ZONES
                    </h3>
                    <div className="space-y-2">
                        {analysisState.objects.filter(o => o.avgConfidence < 0.8).length === 0 ? (
                             <div className="bg-emerald-900/10 border border-emerald-900/30 rounded p-3 text-xs text-emerald-500 flex items-center gap-2">
                                 <Zap className="w-3 h-3" />
                                 No critical occlusion zones detected.
                             </div>
                        ) : (
                            analysisState.objects.filter(o => o.avgConfidence < 0.8).map(obj => (
                                <div key={obj.id} className="bg-red-900/10 border border-red-900/30 rounded p-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                        <span className="text-xs font-bold text-red-400">{obj.label} #{obj.id}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-red-300">
                                        Conf: {(obj.avgConfidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default PerceptionView;
