
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { TrackedObject } from '../../types';
import { Activity, Move, Clock, User, Car, AlertCircle, ArrowUpRight } from 'lucide-react';

interface SignalsViewProps {
  objects: TrackedObject[];
  currentTime: number;
  signalsSummary?: string;
  speedData?: any[]; // Keep for compatibility if needed, though mostly replaced by object derived data
}

const SignalsView: React.FC<SignalsViewProps> = ({ objects, currentTime, signalsSummary }) => {
  
  // Prepare Graph Data
  const speedDistributionData = objects.map(obj => ({
      name: obj.label + ' #' + obj.id,
      speed: obj.maxSpeed,
      color: obj.maxSpeed > 50 ? '#ef4444' : '#0ea5e9' // Red if > 50km/h
  }));

  const loiteringData = objects.map(obj => ({
      name: obj.label + ' #' + obj.id,
      duration: parseFloat((obj.lastSeen - obj.firstSeen).toFixed(1)),
      color: (obj.lastSeen - obj.firstSeen) > 5 ? '#f59e0b' : '#10b981' // Amber if > 5s duration
  }));

  const getIcon = (label: string) => {
      if (label.toLowerCase().includes('car') || label.toLowerCase().includes('vehicle')) return <Car className="w-4 h-4 text-cyan-400" />;
      if (label.toLowerCase().includes('pedestrian') || label.toLowerCase().includes('person')) return <User className="w-4 h-4 text-emerald-400" />;
      return <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="h-full p-6 flex flex-col gap-6 bg-slate-950 overflow-y-auto">
        
        {/* HEADER */}
        <div className="shrink-0 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-500" />
                SIGNALS & METRICS
            </h2>
            <p className="text-xs text-slate-500 mt-1">Quantified behavioural and environmental analytics derived from uploaded footage.</p>
        </div>

        {/* SUMMARY SECTION */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-start gap-4 shadow-lg">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <AlertCircle className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Kinematic Analysis Summary</h3>
                <p className="text-sm text-slate-400 italic leading-relaxed">
                    {signalsSummary || "Awaiting signal processing..."}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-grow">
            
            {/* PANEL 1: DETECTION SIGNALS FEED */}
            <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-[500px] lg:h-auto">
                <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        LIVE DETECTION SIGNALS
                    </h3>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                    {objects.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center mt-10">No active signals in feed.</div>
                    ) : (
                        objects.map(obj => (
                            <div key={obj.id} className={`p-3 rounded border border-slate-800 bg-slate-950 hover:border-cyan-500/50 transition-colors group ${
                                currentTime >= obj.firstSeen && currentTime <= obj.lastSeen ? 'border-cyan-500/30 ring-1 ring-cyan-500/20' : 'opacity-70'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {getIcon(obj.label)}
                                        <span className="text-xs font-bold text-slate-200">{obj.label} <span className="font-mono text-slate-500">#{obj.id}</span></span>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500">
                                        {currentTime >= obj.firstSeen && currentTime <= obj.lastSeen ? (
                                            <span className="text-emerald-500 font-bold animate-pulse">● LIVE</span>
                                        ) : (
                                            <span>OFFLINE</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-slate-400">
                                    <div>
                                        <span className="block text-slate-600 uppercase text-[9px]">Timestamp</span>
                                        <span className="font-mono">{obj.firstSeen.toFixed(1)}s → {obj.lastSeen.toFixed(1)}s</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-600 uppercase text-[9px]">Confidence</span>
                                        <span className="text-cyan-500 font-bold">{(obj.avgConfidence * 100).toFixed(1)}%</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-600 uppercase text-[9px]">Motion State</span>
                                        <div className="flex items-center gap-1">
                                            {obj.motionState === 'moving' && <Move className="w-3 h-3 text-emerald-500" />}
                                            <span className="capitalize text-slate-300">{obj.motionState || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-slate-600 uppercase text-[9px]">Vector</span>
                                        <div className="flex items-center gap-1">
                                            <ArrowUpRight className="w-3 h-3 text-slate-500" />
                                            <span className="text-slate-300">{obj.direction || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PANEL 2: BEHAVIOURAL METRICS GRAPHS */}
            <div className="flex flex-col gap-6">
                
                {/* Graph 1: Speed */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col h-64">
                    <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Move className="w-3 h-3 text-cyan-500" />
                        MAX VELOCITY DISTRIBUTION (km/h)
                    </h3>
                    <div className="flex-grow min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={speedDistributionData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" tick={{fontSize: 9}} />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{fontSize: 9}} width={80} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} 
                                    cursor={{fill: '#1e293b'}}
                                />
                                <Bar dataKey="speed" barSize={12} radius={[0, 4, 4, 0]}>
                                    {speedDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Graph 2: Loitering */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col h-64">
                    <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-amber-500" />
                        PRESENCE DURATION (Seconds)
                    </h3>
                    <div className="flex-grow min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={loiteringData} margin={{ top: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 9}} interval={0} />
                                <YAxis stroke="#94a3b8" tick={{fontSize: 9}} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} 
                                    cursor={{fill: '#1e293b'}}
                                />
                                <Bar dataKey="duration" barSize={30} radius={[4, 4, 0, 0]}>
                                    {loiteringData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default SignalsView;
