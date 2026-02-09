
import React, { useState } from 'react';
import { Intervention } from '../../types';
import { 
    ShieldAlert, AlertTriangle, TrendingUp, ScatterChart as ScatterIcon, 
    CheckCircle, BarChart3, ArrowRight, Zap, Target
} from 'lucide-react';
import { 
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Cell 
} from 'recharts';

interface InterventionViewProps {
    interventions: Intervention[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs z-50">
                <p className="font-bold text-cyan-400 mb-1">{data.name}</p>
                <p className="text-slate-300">Cost: <span className="font-mono">{data.cost}</span></p>
                <p className="text-emerald-400">Effectiveness: <span className="font-mono">{(data.effectiveness * 100).toFixed(0)}%</span></p>
                <div className="mt-1 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${data.paretoTier === 'OPTIMAL' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                    <span className="text-[9px] uppercase text-slate-500">{data.paretoTier}</span>
                </div>
            </div>
        );
    }
    return null;
};

const InterventionView: React.FC<InterventionViewProps> = ({ interventions }) => {
    const [selectedId, setSelectedId] = useState<string | null>(interventions.length > 0 ? interventions[0].id : null);

    const selectedIntervention = interventions.find(i => i.id === selectedId) || interventions[0];

    const sortedInterventions = [...interventions].sort((a, b) => a.rank - b.rank);

    // Filter for optimal stats
    const optimal = interventions.find(i => i.paretoTier === 'OPTIMAL') || interventions[0];
    const lowestCost = [...interventions].sort((a, b) => a.cost - b.cost)[0];

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden text-slate-200">
            
            {/* HEADER */}
            <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
                <div>
                    <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-cyan-500" />
                        INTERVENTION OPTIMISATION ENGINE
                    </h2>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        PARETO OPTIMISATION • SIDE-EFFECT ANALYSIS • TAB 8
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     {/* Summary Metrics in Header */}
                     <div className="flex items-center gap-2 px-3 py-1 bg-emerald-900/20 border border-emerald-900/50 rounded">
                         <Target className="w-3 h-3 text-emerald-500" />
                         <span className="text-[10px] text-emerald-400 font-bold">OPTIMAL: {optimal?.name.substring(0, 15)}...</span>
                     </div>
                </div>
            </div>

            <div className="flex-grow flex min-h-0">
                
                {/* LEFT COLUMN: RANKED TABLE (Panel 1) */}
                <div className="w-[60%] border-r border-slate-800 flex flex-col bg-slate-950">
                    <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-cyan-500" />
                            RANKED MINIMAL INTERVENTION SETS
                        </h3>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 text-[10px] text-slate-500 uppercase sticky top-0 z-10 font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center">Rank</th>
                                    <th className="px-4 py-3">Intervention Action</th>
                                    <th className="px-4 py-3">Effectiveness</th>
                                    <th className="px-4 py-3">Cost Est.</th>
                                    <th className="px-4 py-3">Confidence</th>
                                    <th className="px-4 py-3 text-right">Tier</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {sortedInterventions.map((item) => (
                                    <tr 
                                        key={item.id} 
                                        onClick={() => setSelectedId(item.id)}
                                        className={`border-b border-slate-800/50 cursor-pointer transition-colors ${
                                            selectedId === item.id ? 'bg-cyan-900/10' : 'hover:bg-slate-900/40'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-center font-mono text-slate-500">#{item.rank}</td>
                                        <td className="px-4 py-3 font-bold text-slate-200">
                                            {item.name}
                                            <div className="text-[9px] text-slate-500 font-normal mt-0.5 truncate max-w-[200px]">{item.description}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{width: `${item.effectiveness * 100}%`}}></div>
                                                </div>
                                                <span className="font-mono text-emerald-400">{(item.effectiveness * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-400">{item.cost}</td>
                                        <td className="px-4 py-3 text-[10px] text-slate-500">
                                            {item.confidenceInterval ? `[${item.confidenceInterval[0].toFixed(2)}, ${item.confidenceInterval[1].toFixed(2)}]` : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                                item.paretoTier === 'OPTIMAL' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' : 
                                                item.paretoTier === 'DOMINATED' ? 'bg-slate-800 text-slate-500' : 'bg-amber-900/30 text-amber-400'
                                            }`}>
                                                {item.paretoTier}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT COLUMN: ANALYTICS (Panel 3, 2, 4) */}
                <div className="w-[40%] flex flex-col bg-slate-950 overflow-y-auto">
                    
                    {/* PANEL 3: PARETO SCATTER PLOT */}
                    <div className="h-64 border-b border-slate-800 p-4 flex flex-col">
                        <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                            <ScatterIcon className="w-3 h-3 text-cyan-500" />
                            COST-EFFECTIVENESS PARETO FRONTIER
                        </h3>
                        <div className="flex-grow min-h-0 bg-slate-900/30 rounded border border-slate-800/50 p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                        type="number" 
                                        dataKey="cost" 
                                        name="Cost" 
                                        unit="" 
                                        stroke="#64748b" 
                                        tick={{fontSize: 9}}
                                        domain={[0, 100]}
                                    >
                                        <Label value="Cost / Effort (0-100)" offset={0} position="insideBottom" style={{fill: '#64748b', fontSize: '9px'}} />
                                    </XAxis>
                                    <YAxis 
                                        type="number" 
                                        dataKey="effectiveness" 
                                        name="Effectiveness" 
                                        stroke="#64748b" 
                                        tick={{fontSize: 9}}
                                        domain={[0, 1]}
                                    >
                                        <Label value="Success Prob" angle={-90} position="insideLeft" style={{fill: '#64748b', fontSize: '9px'}} />
                                    </YAxis>
                                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Interventions" data={interventions}>
                                        {interventions.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.id === selectedId ? '#22d3ee' : entry.paretoTier === 'OPTIMAL' ? '#10b981' : '#64748b'} 
                                                stroke={entry.id === selectedId ? '#fff' : 'none'}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* PANEL 4: INSPECTOR */}
                    <div className="p-4 border-b border-slate-800 flex-grow">
                         <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            INTERVENTION INSPECTOR
                        </h3>
                        {selectedIntervention ? (
                            <div className="space-y-4">
                                <div className="bg-slate-900 border border-slate-800 rounded p-3">
                                    <div className="text-sm font-bold text-slate-100 mb-1">{selectedIntervention.name}</div>
                                    <div className="text-[10px] text-slate-400 leading-relaxed font-mono">
                                        {selectedIntervention.description}
                                    </div>
                                </div>
                                
                                {/* Variables Delta */}
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Affected Variables</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedIntervention.affectedVariables?.map((v, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-800 text-[10px] text-cyan-400 rounded border border-slate-700">
                                                {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* PANEL 2: SIDE EFFECTS (Integrated in Inspector for Layout Efficiency) */}
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Side Effects & Risks</span>
                                    {selectedIntervention.sideEffects?.length > 0 ? (
                                        <ul className="space-y-1">
                                            {selectedIntervention.sideEffects.map((effect, i) => (
                                                <li key={i} className="flex items-start gap-2 text-[10px] text-red-300 bg-red-900/10 p-2 rounded border border-red-900/30">
                                                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                                    {effect}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-[10px] text-slate-500 italic">No significant negative side effects projected.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 italic">Select an intervention to inspect details.</div>
                        )}
                    </div>

                    {/* EXECUTIVE SUMMARY PANEL */}
                    <div className="p-4 bg-slate-900/50">
                        <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                            <BarChart3 className="w-3 h-3 text-emerald-500" />
                            EXECUTIVE ACTION REPORT
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                             <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                 <span className="text-slate-500 block">MOST EFFECTIVE</span>
                                 <span className="font-bold text-slate-200">{optimal?.name}</span>
                                 <span className="block text-emerald-500 font-mono">{(optimal?.effectiveness * 100).toFixed(0)}% Success</span>
                             </div>
                             <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                 <span className="text-slate-500 block">LOWEST COST</span>
                                 <span className="font-bold text-slate-200">{lowestCost?.name}</span>
                                 <span className="block text-cyan-500 font-mono">Cost: {lowestCost?.cost}</span>
                             </div>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 justify-center">
                            <CheckCircle className="w-3 h-3" />
                            <span>Recommendations strictly grounded in video evidence.</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default InterventionView;
