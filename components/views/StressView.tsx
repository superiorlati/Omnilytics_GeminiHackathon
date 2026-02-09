
import React, { useState } from 'react';
import { AnalysisState, DegradationConfig, StressAnalysisReport } from '../../types';
import { runStressTestSimulation } from '../../services/geminiService';
import { 
    Zap, Sliders, Activity, AlertTriangle, RefreshCw, Layers, EyeOff, Wind, Sun, Image as ImageIcon
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface StressViewProps {
  analysisState: AnalysisState;
}

const StressView: React.FC<StressViewProps> = ({ analysisState }) => {
  const [config, setConfig] = useState<DegradationConfig>({
      resolutionLoss: 0,
      frameDropRate: 0,
      motionBlur: 0,
      occlusion: 0,
      lighting: 0,
      sensorNoise: 0
  });

  const [report, setReport] = useState<StressAnalysisReport | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
      if (!analysisState.graph.nodes.length) return;
      setIsSimulating(true);
      const result = await runStressTestSimulation(
          analysisState.graph, 
          analysisState.objects, 
          config
      );
      setReport(result);
      setIsSimulating(false);
  };

  const updateConfig = (key: keyof DegradationConfig, val: number) => {
      setConfig(prev => ({ ...prev, [key]: val }));
  };

  // UPDATED PRESETS AS REQUESTED
  const presets = [
      { name: 'Low Light Bodycam', cfg: { resolutionLoss: 0.2, frameDropRate: 0.1, motionBlur: 0.4, occlusion: 0.1, lighting: 0.9, sensorNoise: 0.7 } },
      { name: 'Heavy Compression CCTV', cfg: { resolutionLoss: 0.8, frameDropRate: 0.4, motionBlur: 0.2, occlusion: 0, lighting: 0.1, sensorNoise: 0.3 } },
      { name: 'Rainy Night Dashcam', cfg: { resolutionLoss: 0.4, frameDropRate: 0.1, motionBlur: 0.5, occlusion: 0.3, lighting: 0.7, sensorNoise: 0.4 } },
  ];

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden text-slate-200">
        
        {/* HEADER */}
        <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
            <div>
                <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-500" />
                    ROBUSTNESS STRESS TEST
                </h2>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    DEGRADATION SIMULATION • AUDIT LAYER • TAB 9
                </div>
            </div>
            {report && (
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 uppercase">Robustness Score</span>
                        <span className={`text-lg font-bold ${report.robustnessScore > 0.8 ? 'text-emerald-500' : report.robustnessScore > 0.5 ? 'text-amber-500' : 'text-red-500'}`}>
                            {(report.robustnessScore * 100).toFixed(0)}/100
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* GEMINI SUMMARY PANEL (Top) */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 min-h-[80px] shrink-0">
             {report ? (
                 <div className="max-w-4xl mx-auto">
                     <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase flex items-center gap-2">
                         <Activity className="w-3 h-3 text-cyan-500" />
                         Stress Audit Summary
                     </h3>
                     <p className="text-xs text-slate-400 font-serif leading-relaxed">
                         {report.summary}
                     </p>
                 </div>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-500 text-xs italic gap-2">
                     <AlertTriangle className="w-4 h-4" />
                     Configure degradation settings and run simulation to generate audit.
                 </div>
             )}
        </div>

        <div className="flex-grow flex min-h-0">
            
            {/* LEFT: DEGRADATION CONTROLS (Panel 1) */}
            <div className="w-[300px] border-r border-slate-800 bg-slate-950 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Sliders className="w-3 h-3 text-slate-400" />
                        EVIDENCE DEGRADATION
                    </h3>
                    
                    {/* Presets */}
                    <div className="grid grid-cols-1 gap-2 mb-4">
                        {presets.map(p => (
                            <button 
                                key={p.name}
                                onClick={() => setConfig(p.cfg)}
                                className="px-2 py-2 bg-slate-900 border border-slate-700 rounded text-[10px] hover:bg-slate-800 hover:border-slate-500 transition-colors text-left font-bold text-slate-300 flex items-center gap-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                {p.name}
                            </button>
                        ))}
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4">
                        <ControlSlider 
                            label="Resolution Loss" icon={<ImageIcon className="w-3 h-3" />} 
                            value={config.resolutionLoss} onChange={(v) => updateConfig('resolutionLoss', v)} 
                        />
                        <ControlSlider 
                            label="Frame Drop Rate" icon={<Layers className="w-3 h-3" />} 
                            value={config.frameDropRate} onChange={(v) => updateConfig('frameDropRate', v)} 
                        />
                        <ControlSlider 
                            label="Motion Blur" icon={<Wind className="w-3 h-3" />} 
                            value={config.motionBlur} onChange={(v) => updateConfig('motionBlur', v)} 
                        />
                        <ControlSlider 
                            label="Occlusion" icon={<EyeOff className="w-3 h-3" />} 
                            value={config.occlusion} onChange={(v) => updateConfig('occlusion', v)} 
                        />
                        <ControlSlider 
                            label="Lighting Fail" icon={<Sun className="w-3 h-3" />} 
                            value={config.lighting} onChange={(v) => updateConfig('lighting', v)} 
                        />
                        <ControlSlider 
                            label="Sensor Noise" icon={<Activity className="w-3 h-3" />} 
                            value={config.sensorNoise} onChange={(v) => updateConfig('sensorNoise', v)} 
                        />
                    </div>
                </div>

                <div className="p-4 mt-auto">
                    <button 
                        onClick={handleSimulate}
                        disabled={isSimulating}
                        className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded-lg flex items-center justify-center gap-2 transition-all font-bold text-xs disabled:opacity-50"
                    >
                        {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {isSimulating ? 'SIMULATING...' : 'RUN STRESS TEST'}
                    </button>
                </div>
            </div>

            {/* CENTER: SURVIVABILITY PLOTS (Panel 2) */}
            <div className="flex-grow bg-slate-950 p-4 flex flex-col overflow-hidden">
                <div className="h-full bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col">
                     <h3 className="text-xs font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        CONCLUSION STABILITY CURVE
                    </h3>
                    {report?.curveData ? (
                        <div className="flex-grow min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={report.curveData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                        dataKey="degradationLevel" 
                                        type="number" 
                                        domain={[0, 1]} 
                                        stroke="#64748b" 
                                        tick={{fontSize: 10}} 
                                        label={{ value: 'Evidence Degradation (0-100%)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
                                    />
                                    <YAxis 
                                        domain={[0, 1]} 
                                        stroke="#64748b" 
                                        tick={{fontSize: 10}} 
                                        label={{ value: 'Confidence Retention', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
                                    />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} />
                                    <Legend wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                                    <Line type="monotone" dataKey="conclusionConfidence" name="Conclusion Conf." stroke="#10b981" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="objectRetention" name="Object Retention" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="graphIntegrity" name="Causal Integrity" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-slate-600 text-xs italic">
                            No simulation data.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: BRITTLENESS FLAGS (Panel 3) */}
            <div className="w-[300px] border-l border-slate-800 bg-slate-950 flex flex-col overflow-y-auto">
                 <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        BRITTLENESS FLAGS
                    </h3>
                </div>
                <div className="p-4 space-y-3">
                    {report?.flags && report.flags.length > 0 ? (
                        report.flags.map((flag, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 rounded p-3 relative group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                                    flag.severity === 'CRITICAL' ? 'bg-red-500' : flag.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-500'
                                }`}></div>
                                <div className="pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-slate-200">{flag.component}</span>
                                        <span className={`text-[8px] px-1.5 rounded font-bold uppercase ${
                                            flag.severity === 'CRITICAL' ? 'bg-red-900/30 text-red-400' : 
                                            flag.severity === 'MEDIUM' ? 'bg-amber-900/30 text-amber-400' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {flag.type}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 leading-tight mb-2">
                                        {flag.reason}
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500">
                                        Collapsed at {(flag.collapseThreshold * 100).toFixed(0)}% Degradation
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-xs text-slate-500 italic text-center mt-10">
                            {report ? "System robust. No critical flags." : "Awaiting simulation..."}
                        </div>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
};

const ControlSlider: React.FC<{ label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void }> = ({ label, icon, value, onChange }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                {icon} {label}
            </div>
            <span className="text-[9px] font-mono text-cyan-500">{(value * 100).toFixed(0)}%</span>
        </div>
        <input 
            type="range" min="0" max="1" step="0.1" 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
    </div>
);

export default StressView;
