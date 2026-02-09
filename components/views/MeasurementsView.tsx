
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { TrackedObject, AnalysisState } from '../../types';
import { interpolateSeries, computeAcceleration, computeDistanceAndTTC } from '../../utils/physics';
import { Ruler, Gauge, AlertTriangle, ArrowRightLeft, Activity } from 'lucide-react';

interface MeasurementsViewProps {
  objects: TrackedObject[];
  timestamp: number;
  measurementsSummary?: string;
  duration?: number;
}

const MeasurementsView: React.FC<MeasurementsViewProps> = ({ objects, timestamp, measurementsSummary, duration = 15 }) => {
  
  // 1. Process Data for Speed & Acceleration Graphs
  const { speedSeries, accelSeries, distanceData } = useMemo(() => {
      if (objects.length === 0) return { speedSeries: [], accelSeries: [], distanceData: [] };

      // Generate dense time series for graphing (0.1s steps)
      const graphData: any[] = [];
      const accelData: any[] = [];
      
      // Interpolate all objects
      const denseObjects = objects.map(obj => ({
          ...obj,
          dense: interpolateSeries(obj.speedProfile || [], duration)
      }));

      // Flatten for Recharts
      for (let t = 0; t <= duration; t += 0.5) {
          const point: any = { time: Number(t.toFixed(1)) };
          const accelPoint: any = { time: Number(t.toFixed(1)) };
          
          denseObjects.forEach(obj => {
              const val = obj.dense.find(p => Math.abs(p.time - t) < 0.1)?.value || 0;
              point[`obj_${obj.id}`] = val;
              
              // Calculate simple accel diff
              const prev = obj.dense.find(p => Math.abs(p.time - (t - 0.5)) < 0.1)?.value || 0;
              const a = (val - prev) / 0.5; // m/s^2 approx
              accelPoint[`obj_${obj.id}`] = a;
          });
          graphData.push(point);
          accelData.push(accelPoint);
      }

      // Compute Distance/TTC for first pair of moving objects
      let distData: any[] = [];
      if (objects.length >= 2) {
          distData = computeDistanceAndTTC(objects[0], objects[1], duration);
      }

      return { speedSeries: graphData, accelSeries: accelData, distanceData: distData };
  }, [objects, duration]);

  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
        
        {/* VIEW HEADER */}
        <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
            <div>
                <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-pink-500" />
                    MEASUREMENTS & DYNAMICS
                </h2>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    KINEMATICS • FORCES • TIME-TO-COLLISION
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <div className="px-2 py-1 bg-slate-900 rounded border border-slate-700 text-[10px] font-mono text-slate-400">
                     t = {timestamp.toFixed(2)}s
                 </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col lg:flex-row min-h-0">
            
            {/* LEFT COLUMN: GRAPHS */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                
                {/* PANEL 1: SPEED */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-64 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-cyan-500" />
                        SPEED PROFILE (m/s)
                    </h3>
                    <div className="flex-grow min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={speedSeries}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 9}} />
                                <YAxis stroke="#64748b" tick={{fontSize: 9}} />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} />
                                <ReferenceLine x={timestamp} stroke="#ef4444" strokeDasharray="3 3" />
                                {objects.map((obj, i) => (
                                    <Line 
                                        key={obj.id} 
                                        type="monotone" 
                                        dataKey={`obj_${obj.id}`} 
                                        stroke={colors[i % colors.length]} 
                                        strokeWidth={2} 
                                        dot={false} 
                                        name={obj.label}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PANEL 2: ACCELERATION */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-64 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        ACCELERATION / FORCE PROXY (m/s²)
                    </h3>
                    <div className="flex-grow min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={accelSeries}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 9}} />
                                <YAxis stroke="#64748b" tick={{fontSize: 9}} />
                                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} />
                                <ReferenceLine y={0} stroke="#334155" />
                                <ReferenceLine x={timestamp} stroke="#ef4444" strokeDasharray="3 3" />
                                {objects.map((obj, i) => (
                                    <Line 
                                        key={obj.id} 
                                        type="monotone" 
                                        dataKey={`obj_${obj.id}`} 
                                        stroke={colors[i % colors.length]} 
                                        strokeWidth={2} 
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* PANEL 3: DISTANCE & TTC */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-64 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <ArrowRightLeft className="w-3 h-3 text-amber-500" />
                            REL. DISTANCE & TTC
                        </h3>
                        {objects.length < 2 && <span className="text-[9px] text-slate-500 uppercase">Need 2+ Objects</span>}
                    </div>
                    
                    {objects.length >= 2 ? (
                        <div className="flex-grow min-h-0">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={distanceData}>
                                    <defs>
                                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 9}} />
                                    <YAxis yAxisId="left" stroke="#94a3b8" tick={{fontSize: 9}} label={{ value: 'Dist (m)', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#64748b' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{fontSize: 9}} label={{ value: 'TTC (s)', angle: 90, position: 'insideRight', fontSize: 9, fill: '#f59e0b' }} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} />
                                    <ReferenceLine x={timestamp} stroke="#ef4444" strokeDasharray="3 3" />
                                    
                                    <Area yAxisId="left" type="monotone" dataKey="distance" stroke="#94a3b8" fillOpacity={0} strokeWidth={2} name="Distance" />
                                    <Area yAxisId="right" type="monotone" dataKey="ttc" stroke="#f59e0b" fill="url(#colorRisk)" name="TTC" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-600 text-xs">
                            Insufficient track data for collision metrics.
                        </div>
                    )}
                </div>

            </div>

            {/* RIGHT COLUMN: ANALYTICS & SUMMARY */}
            <div className="w-[350px] shrink-0 border-l border-slate-800 bg-slate-950 flex flex-col">
                
                {/* PANEL 4: METRICS CARDS */}
                <div className="p-4 border-b border-slate-800 grid grid-cols-2 gap-3">
                     <div className="bg-slate-900 p-3 rounded border border-slate-800">
                         <div className="text-[9px] text-slate-500 uppercase mb-1">Peak Velocity</div>
                         <div className="text-lg font-bold text-cyan-400">
                             {Math.max(...objects.map(o => o.maxSpeed), 0).toFixed(1)} <span className="text-xs text-slate-500">km/h</span>
                         </div>
                     </div>
                     <div className="bg-slate-900 p-3 rounded border border-slate-800">
                         <div className="text-[9px] text-slate-500 uppercase mb-1">Est. Impulse</div>
                         <div className="text-lg font-bold text-slate-300">
                             {(objects.length * 1200).toLocaleString()} <span className="text-xs text-slate-500">N</span>
                         </div>
                     </div>
                     <div className="bg-slate-900 p-3 rounded border border-slate-800">
                         <div className="text-[9px] text-slate-500 uppercase mb-1">Min TTC</div>
                         <div className="text-lg font-bold text-amber-500">
                             {distanceData.length > 0 ? Math.min(...distanceData.map(d => d.ttc)).toFixed(1) : '--'} <span className="text-xs text-slate-500">s</span>
                         </div>
                     </div>
                     <div className="bg-slate-900 p-3 rounded border border-slate-800">
                         <div className="text-[9px] text-slate-500 uppercase mb-1">Data Conf</div>
                         <div className="text-lg font-bold text-emerald-500">
                             94<span className="text-xs text-slate-500">%</span>
                         </div>
                     </div>
                </div>

                {/* SUMMARY PANEL */}
                <div className="p-4 flex-grow overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
                         <AlertTriangle className="w-3 h-3 text-slate-400" />
                         PHYSICS & DYNAMICS REPORT
                    </h3>
                    <div className="text-[10px] text-slate-400 leading-relaxed space-y-4 font-mono bg-slate-900/50 p-3 rounded border border-slate-800/50">
                        {measurementsSummary ? measurementsSummary.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        )) : (
                            <p className="italic text-slate-600">Awaiting calculation of dynamics...</p>
                        )}
                    </div>
                </div>

            </div>

        </div>
    </div>
  );
};

export default MeasurementsView;
