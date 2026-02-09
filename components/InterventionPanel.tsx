import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { Intervention } from '../types';

interface InterventionPanelProps {
  interventions: Intervention[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 p-2 rounded shadow-lg text-xs">
        <p className="font-bold text-cyan-400">{data.name}</p>
        <p className="text-slate-300">Cost: ${data.cost}k</p>
        <p className="text-emerald-400">Effectiveness: {Math.round(data.effectiveness * 100)}%</p>
        <p className="text-slate-400 italic mt-1">{data.description}</p>
      </div>
    );
  }
  return null;
};

const InterventionPanel: React.FC<InterventionPanelProps> = ({ interventions }) => {
  return (
    <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-lg p-2 flex flex-col">
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="text-xs font-semibold text-slate-400">INTERVENTION PARETO FRONTIER</h3>
        <span className="text-[10px] text-slate-500">Cost vs. Effectiveness</span>
      </div>
      
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
                type="number" 
                dataKey="cost" 
                name="Cost" 
                unit="k" 
                stroke="#94a3b8" 
                tick={{fontSize: 10}}
            >
                <Label value="Est. Cost / Disruption" offset={0} position="insideBottom" style={{fill: '#64748b', fontSize: '10px'}} />
            </XAxis>
            <YAxis 
                type="number" 
                dataKey="effectiveness" 
                name="Effectiveness" 
                stroke="#94a3b8" 
                tick={{fontSize: 10}}
                domain={[0, 1]}
            >
                <Label value="Risk Reduction" angle={-90} position="insideLeft" style={{fill: '#64748b', fontSize: '10px'}} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Interventions" data={interventions} fill="#0ea5e9" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="h-1/3 overflow-y-auto mt-2 border-t border-slate-800 pt-2">
          <ul className="space-y-1">
              {[...interventions].sort((a,b) => b.effectiveness - a.effectiveness).map(inv => (
                  <li key={inv.id} className="flex justify-between items-center text-[10px] px-2 py-1 hover:bg-slate-800 rounded cursor-pointer group">
                      <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2 group-hover:animate-pulse"></span>
                          <span className="text-slate-200 font-medium">{inv.name}</span>
                      </div>
                      <div className="flex space-x-3 text-slate-400">
                         <span>Robust: {Math.round(inv.robustness * 100)}%</span>
                         <span className="text-emerald-500">{Math.round(inv.effectiveness * 100)}% Eff</span>
                      </div>
                  </li>
              ))}
          </ul>
      </div>
    </div>
  );
};

export default InterventionPanel;