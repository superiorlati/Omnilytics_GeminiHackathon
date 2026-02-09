
import React, { useState, useEffect } from 'react';
import { CounterfactualBranch, TrackedObject } from '../../types';
import VideoPanel from '../VideoPanel';
import { GitMerge, ArrowRight, Activity, GitBranch, PlayCircle, BarChart3, HelpCircle, FileText, CheckCircle, Video, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { generateCounterfactualNarrative, generateVeoSimulation } from '../../services/geminiService';

interface CounterfactualViewProps {
  branches: CounterfactualBranch[];
  onUpdateBranch?: (branch: CounterfactualBranch) => void;
}

const CounterfactualView: React.FC<CounterfactualViewProps> = ({ branches, onUpdateBranch }) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branches.length > 0 ? branches[0].id : null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timestamp, setTimestamp] = useState(0);
  const [narrative, setNarrative] = useState<string>('');
  const [loadingNarrative, setLoadingNarrative] = useState(false);
  
  // Veo Generation State
  const [veoPrompt, setVeoPrompt] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  useEffect(() => {
    if (selectedBranch) {
        // Load narrative
        setLoadingNarrative(true);
        generateCounterfactualNarrative(selectedBranch).then(text => {
            setNarrative(text);
            setLoadingNarrative(false);
            // Pre-fill prompt with reasonable default if empty
            if (!veoPrompt) {
                setVeoPrompt(`CCTV traffic footage, realistic, 4k. Scenario: ${selectedBranch.name}. Outcome: ${selectedBranch.outcome}.`);
            }
        });
        
        // Update prompt when branch changes
        setVeoPrompt(`CCTV traffic footage, realistic, 4k. Scenario: ${selectedBranch.name}. Outcome: ${selectedBranch.outcome}.`);
    }
  }, [selectedBranchId]);

  const handleGenerateVideo = async () => {
      if (!selectedBranch) return;

      // START: Veo Key Selection Logic
      try {
          // @ts-ignore - aistudio injected by environment
          if (typeof window !== 'undefined' && window.aistudio) {
              // @ts-ignore
              const hasKey = await window.aistudio.hasSelectedApiKey();
              if (!hasKey) {
                  // @ts-ignore
                  await window.aistudio.openSelectKey();
                  // Race condition mitigation: Proceed immediately assuming success as per instructions
              }
          }
      } catch (e) {
          console.warn("Key selection check failed", e);
      }
      // END: Veo Key Selection Logic

      setIsGeneratingVideo(true);
      
      try {
          const url = await generateVeoSimulation(veoPrompt);
          if (url && onUpdateBranch) {
              onUpdateBranch({
                  ...selectedBranch,
                  veoVideoUrl: url
              });
          }
      } catch (e: any) {
          console.error("Video Generation Error:", e);
          if (e.message === "PERMISSION_DENIED") {
              // Force open key selector because the current key is invalid/unpaid
              // @ts-ignore
              if (window.aistudio) {
                  // @ts-ignore
                  await window.aistudio.openSelectKey();
                  alert("The selected API Key does not have permission to generate videos. Please select a valid key from a paid project.");
              }
          }
      }
      
      setIsGeneratingVideo(false);
  };

  // Mock Probability Density for Panel 5
  const probabilityData = [
      { time: 0, p: 0.1 }, { time: 10, p: 0.2 }, { time: 20, p: 0.6 },
      { time: 30, p: 0.9 }, { time: 40, p: 0.95 }, { time: 50, p: 0.98 },
      { time: 60, p: 0.99 }, { time: 70, p: 0.99 }, { time: 80, p: 0.99 },
      { time: 90, p: 0.99 }, { time: 100, p: 1.0 }
  ];

  // Procedural Ghost Objects for Panel 3 (Fallback viz)
  const getGhostObjects = (): TrackedObject[] => {
      if (!selectedBranch) return [];
      if (timestamp < selectedBranch.divergencePoint) return [];
      
      const timeDelta = timestamp - selectedBranch.divergencePoint;
      
      return [{
          id: 999,
          label: 'SIMULATION',
          firstSeen: selectedBranch.divergencePoint,
          lastSeen: selectedBranch.divergencePoint + 5,
          maxSpeed: 0,
          avgConfidence: 0.5,
          motionState: 'moving',
          direction: 'Forward',
          speedProfile: []
      }];
  };

  if (branches.length === 0) {
      return (
          <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2">
              <GitMerge className="w-8 h-8 opacity-50" />
              <p>No counterfactual branches generated.</p>
          </div>
      );
  }

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
          <div>
              <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-amber-500" />
                  COUNTERFACTUAL SIMULATION ENGINE
              </h2>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  CAUSAL INTERVENTION • DO-CALCULUS • VEO GENERATION
              </div>
          </div>
          <div className="flex gap-2">
              {branches.map(b => (
                  <button
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`px-3 py-1 rounded border text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${
                          selectedBranchId === b.id 
                          ? 'bg-amber-900/40 border-amber-500 text-amber-400' 
                          : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                      }`}
                  >
                      {selectedBranchId === b.id && <Activity className="w-3 h-3 animate-pulse" />}
                      {b.name}
                  </button>
              ))}
          </div>
      </div>

      <div className="flex-grow flex min-h-0">
          
          {/* LEFT COLUMN (60%) - VIDEO */}
          <div className="w-[60%] border-r border-slate-800 flex flex-col">
              
              {/* PANEL 3: VIDEO REPLAYER (Simulation or Veo) */}
              <div className="flex-grow relative bg-black flex flex-col justify-center">
                  
                  {selectedBranch?.veoVideoUrl ? (
                      // SHOW VEO VIDEO IF GENERATED
                      <div className="relative w-full h-full">
                          <div className="absolute top-4 left-4 z-10 bg-purple-900/80 backdrop-blur border border-purple-600/50 px-3 py-1.5 rounded flex items-center gap-2">
                              <Video className="w-3 h-3 text-purple-300" />
                              <span className="text-[10px] font-bold text-purple-100 tracking-wider">VEO 3 GENERATIVE RE-ENACTMENT</span>
                          </div>
                          <video 
                              src={selectedBranch.veoVideoUrl} 
                              controls 
                              autoPlay 
                              loop 
                              className="w-full h-full object-contain"
                          />
                      </div>
                  ) : (
                      // SHOW GHOST OVERLAY FALLBACK
                      <div className="relative w-full h-full">
                          <div className="absolute top-4 left-4 z-10 bg-amber-900/80 backdrop-blur border border-amber-600/50 px-3 py-1.5 rounded flex items-center gap-2">
                              <PlayCircle className="w-3 h-3 text-amber-400" />
                              <span className="text-[10px] font-bold text-amber-100 tracking-wider">WIREFRAME SIMULATION</span>
                          </div>
                          <VideoPanel 
                              isPlaying={isPlaying}
                              onTogglePlay={() => setIsPlaying(!isPlaying)}
                              timestamp={timestamp}
                              onTimeUpdate={setTimestamp}
                              ghostObjects={getGhostObjects()} 
                              showTracks={true}
                          />
                      </div>
                  )}

              </div>

              {/* PANEL 1: DIVERGENCE SPINE TIMELINE */}
              <div className="h-48 bg-slate-900 border-t border-slate-800 p-4 relative overflow-hidden shrink-0">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <GitMerge className="w-3 h-3 text-amber-500" />
                          DIVERGENCE SPINE
                      </h3>
                      <div className="text-[10px] font-mono text-slate-500">
                          Split at t = <span className="text-amber-400 font-bold">{selectedBranch?.divergencePoint}s</span>
                      </div>
                  </div>

                  <div className="relative h-12 flex items-center">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-700"></div>
                      <div 
                          className="absolute h-0.5 bg-amber-500 top-1/2 left-1/2 origin-left transform -rotate-6 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                          style={{ width: '50%' }}
                      ></div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 border-2 border-amber-500 rounded-full z-10 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="absolute left-4 top-0 text-[9px] font-bold text-slate-500 uppercase">Observed Reality</div>
                      <div className="absolute right-4 bottom-[-20px] text-[9px] font-bold text-amber-500 uppercase">Counterfactual Path</div>
                  </div>
              </div>

          </div>

          {/* RIGHT COLUMN (40%) - CONTROLS & ANALYSIS */}
          <div className="w-[40%] bg-slate-950 flex flex-col overflow-y-auto">
              
              {/* VEO GENERATION CONTROLS */}
              <div className="border-b border-slate-800 p-4 bg-slate-900/30">
                  <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                      <Video className="w-3 h-3 text-purple-400" />
                      VEO 3 VIDEO GENERATION
                  </h3>
                  
                  {!selectedBranch?.veoVideoUrl ? (
                      <div className="space-y-3">
                          <textarea 
                              className="w-full h-20 bg-slate-950 border border-slate-700 rounded p-2 text-[10px] text-slate-300 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                              placeholder="Describe the counterfactual scene..."
                              value={veoPrompt}
                              onChange={(e) => setVeoPrompt(e.target.value)}
                          />
                          <button 
                              onClick={handleGenerateVideo}
                              disabled={isGeneratingVideo}
                              className="w-full py-2 bg-purple-900/50 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                              {isGeneratingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
                              {isGeneratingVideo ? "Generating with Veo (Wait...)" : "Generate Realistic Video"}
                          </button>
                      </div>
                  ) : (
                      <div className="flex flex-col gap-2">
                           <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                               <CheckCircle className="w-3 h-3" />
                               Video Generated Successfully
                           </div>
                           <button 
                              onClick={() => onUpdateBranch && onUpdateBranch({...selectedBranch, veoVideoUrl: undefined})}
                              className="text-[10px] text-slate-500 hover:text-slate-300 underline text-left"
                           >
                               Clear & Regenerate
                           </button>
                      </div>
                  )}
              </div>

              {/* PANEL 2: VARIABLE DELTAS */}
              <div className="h-1/3 border-b border-slate-800 p-4">
                  <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <BarChart3 className="w-3 h-3 text-cyan-500" />
                      INTERVENTION DELTAS
                  </h3>
                  <div className="space-y-3">
                      {selectedBranch?.variableDelta.map((delta, i) => (
                          <div key={i} className="bg-slate-900 border border-slate-800 p-2 rounded">
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                  <span>{delta.name}</span>
                                  <span className="font-mono text-cyan-400 font-bold">{delta.delta}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden">
                                  <div className="h-full bg-cyan-600 w-2/3"></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* PANEL 5: CONFIDENCE ENVELOPES */}
              <div className="h-1/3 border-b border-slate-800 p-4 flex flex-col">
                  <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <HelpCircle className="w-3 h-3 text-emerald-500" />
                      SUCCESS PROBABILITY DENSITY
                  </h3>
                  <div className="flex-grow min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={probabilityData}>
                              <defs>
                                  <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="time" hide />
                              <YAxis hide domain={[0, 1]} />
                              <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} />
                              <Area type="monotone" dataKey="p" stroke="#10b981" fillOpacity={1} fill="url(#colorProb)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* PANEL 4: GEMINI EXPLANATION */}
              <div className="flex-grow p-4 flex flex-col">
                  <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                      <FileText className="w-3 h-3 text-slate-400" />
                      GENERATIVE CAUSAL NARRATIVE
                  </h3>
                  <div className="bg-slate-900 border border-slate-800 rounded p-3 flex-grow overflow-y-auto min-h-[100px]">
                      {loadingNarrative ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
                              <Activity className="w-3 h-3" /> Synthesizing forensic narrative...
                          </div>
                      ) : (
                          <div className="text-[10px] text-slate-300 font-serif leading-relaxed whitespace-pre-wrap">
                              {narrative || "Analysis pending..."}
                          </div>
                      )}
                  </div>
              </div>

          </div>

      </div>
    </div>
  );
};

export default CounterfactualView;