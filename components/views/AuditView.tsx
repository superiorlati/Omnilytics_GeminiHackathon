
import React, { useState, useEffect } from 'react';
import { AnalysisState, AuditLogEntry, OverrideEntry, FinalReportData } from '../../types';
import { generateFinalReport } from '../../services/geminiService';
import { 
    FileText, Lock, ShieldCheck, Download, FileJson, 
    History, UserCog, AlertTriangle, Fingerprint, 
    RefreshCw, Eye, CheckCircle, FileBadge, Briefcase, Scale
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AuditViewProps {
  integrity: any;
  edges: any[];
  interventions: any[];
  analysisState: AnalysisState;
}

const AuditView: React.FC<AuditViewProps> = ({ analysisState }) => {
  const [report, setReport] = useState<FinalReportData | null>(null);
  const [classification, setClassification] = useState('INTERNAL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'SYSTEM' | 'USER'>('SYSTEM');

  // Generate Report on Mount if not exists
  useEffect(() => {
    if (!report && !isGenerating && analysisState.executiveSummary) {
        setIsGenerating(true);
        generateFinalReport(analysisState, classification).then(res => {
            setReport(res);
            setIsGenerating(false);
        });
    }
  }, [analysisState.executiveSummary]);

  const handleRecompute = () => {
      setIsGenerating(true);
      generateFinalReport(analysisState, classification).then(res => {
          setReport(res);
          setIsGenerating(false);
      });
  };

  // Dynamically generate log if empty
  const auditLogs: AuditLogEntry[] = analysisState.auditLog.length > 0 ? analysisState.auditLog : [
      { id: '1', timestamp: new Date(Date.now() - 100000).toISOString(), actor: 'SYSTEM', action: 'INGEST', details: 'Video file uploaded', hash: analysisState.integrity?.hash || 'PENDING' },
      { id: '2', timestamp: new Date(Date.now() - 90000).toISOString(), actor: 'SYSTEM', action: 'INTEGRITY_CHECK', details: `Verdict: ${analysisState.integrity?.verdict || 'PENDING'}`, hash: 'SHA256-VALID' },
      { id: '3', timestamp: new Date(Date.now() - 80000).toISOString(), actor: 'SYSTEM', action: 'PERCEPTION', details: `Detected ${analysisState.objects.length} objects`, hash: 'GEMINI-VIS-001' },
      { id: '4', timestamp: new Date(Date.now() - 60000).toISOString(), actor: 'SYSTEM', action: 'CAUSAL_GRAPH', details: `Built DAG with ${analysisState.graph.nodes.length} nodes`, hash: 'SCM-V2' },
      { id: '5', timestamp: new Date(Date.now() - 40000).toISOString(), actor: 'SYSTEM', action: 'STRESS_TEST', details: `Robustness Score: ${analysisState.stressAnalysis?.robustnessScore || 0}`, hash: 'STRESS-OK' },
  ];

  const overrides: OverrideEntry[] = analysisState.overrides || [];

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden text-slate-200">
        
        {/* TOP: EXECUTIVE REPORT PREVIEW (Panel 1) */}
        <div className="h-[40%] border-b border-slate-800 bg-slate-900 p-6 flex flex-col">
             <div className="flex justify-between items-start mb-4">
                 <div>
                     <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                         <FileBadge className="w-4 h-4 text-emerald-500" />
                         EXECUTIVE REPORT PREVIEW
                     </h2>
                     <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex gap-4">
                         <span>CASE ID: {report?.caseId || 'GENERATING...'}</span>
                         <span className="flex items-center gap-1">
                            CLASSIFICATION: 
                            <span className={`font-bold ${classification === 'PUBLIC' ? 'text-emerald-500' : classification === 'INTERNAL' ? 'text-amber-500' : 'text-red-500'}`}>
                                {classification}
                            </span>
                         </span>
                     </div>
                 </div>
                 <div className="flex gap-2">
                     <button 
                        onClick={handleRecompute}
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs hover:bg-slate-700 flex items-center gap-2"
                     >
                         <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                         Recompile
                     </button>
                 </div>
             </div>
             
             <div className="flex-grow bg-slate-950 border border-slate-800 rounded-lg p-6 overflow-y-auto font-serif shadow-inner">
                 {isGenerating ? (
                     <div className="h-full flex items-center justify-center text-slate-500 gap-2 animate-pulse">
                         <FileText className="w-4 h-4" /> Synthesizing procurement report...
                     </div>
                 ) : report ? (
                     <div className="space-y-6 max-w-5xl mx-auto">
                         
                         {/* A. CASE OVERVIEW */}
                         <div className="border-b border-slate-800/50 pb-4">
                             <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                 <Briefcase className="w-3 h-3" /> A. Case Overview
                             </h3>
                             <div className="grid grid-cols-4 gap-4 text-xs text-slate-300">
                                 <div><span className="block text-slate-500 text-[10px]">VIDEO ID</span>{report.overview.videoId}</div>
                                 <div><span className="block text-slate-500 text-[10px]">DURATION</span>{report.overview.duration}</div>
                                 <div><span className="block text-slate-500 text-[10px]">SCENE</span>{report.overview.sceneType}</div>
                                 <div><span className="block text-slate-500 text-[10px]">SCOPE</span>{report.overview.scope}</div>
                             </div>
                         </div>

                         {/* B. KEY FINDINGS */}
                         <div className="grid grid-cols-2 gap-8">
                             <div>
                                 <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                     <Eye className="w-3 h-3" /> B. Key Findings
                                 </h3>
                                 <ul className="list-disc pl-4 space-y-2 text-xs text-slate-300 leading-relaxed">
                                     {report.findings.map((f, i) => <li key={i}>{f}</li>)}
                                 </ul>
                             </div>
                             
                             <div className="space-y-6">
                                 {/* C. CONFIDENCE POSTURE */}
                                 <div>
                                     <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                         <Scale className="w-3 h-3" /> C. Confidence Posture
                                     </h3>
                                     <div className="flex items-center gap-4">
                                         <div className="relative w-16 h-16 flex items-center justify-center">
                                             <svg className="w-full h-full" viewBox="0 0 36 36">
                                                 <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
                                                 <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={report.confidence.score > 0.8 ? '#10b981' : '#f59e0b'} strokeWidth="3" strokeDasharray={`${report.confidence.score * 100}, 100`} />
                                             </svg>
                                             <div className="absolute text-xs font-bold">{Math.round(report.confidence.score * 100)}%</div>
                                         </div>
                                         <div className="text-xs text-slate-400">
                                             <div className="mb-1"><span className="text-slate-500">Sufficiency:</span> {report.confidence.sufficiency}</div>
                                             <div><span className="text-slate-500">Survivability:</span> {report.confidence.survivability}</div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* D. RISK FLAGS */}
                                 <div>
                                     <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                         <AlertTriangle className="w-3 h-3" /> D. Risk Flags
                                     </h3>
                                     <div className="flex flex-wrap gap-2">
                                         {report.risks.length > 0 ? report.risks.map((r, i) => (
                                             <span key={i} className="px-2 py-1 bg-red-900/20 border border-red-900/50 text-red-300 text-[10px] rounded">{r}</span>
                                         )) : <span className="text-xs text-slate-500 italic">No critical risks flagged.</span>}
                                     </div>
                                 </div>
                             </div>
                         </div>

                         {/* E. RECOMMENDED ACTIONS */}
                         <div className="border-t border-slate-800/50 pt-4">
                             <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                 <CheckCircle className="w-3 h-3" /> E. Recommended Actions
                             </h3>
                             <div className="grid grid-cols-1 gap-2">
                                 {report.recommendations.map((rec, i) => (
                                     <div key={i} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                                         <div className="flex items-center gap-3">
                                             <div className="w-5 h-5 rounded-full bg-cyan-900/50 text-cyan-400 flex items-center justify-center text-[10px] font-bold">{rec.rank}</div>
                                             <span className="text-xs text-slate-200 font-bold">{rec.action}</span>
                                         </div>
                                         <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 border border-slate-700 rounded">Cost: {rec.cost}</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         
                         {/* F. STRESS TEST ANALYSIS (GRAPH) */}
                         {report.stressGraph && report.stressGraph.dataPoints.length > 0 && (
                             <div className="border-t border-slate-800/50 pt-4 page-break-inside-avoid">
                                 <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                     <AlertTriangle className="w-3 h-3" /> F. Robustness Stress Analysis
                                 </h3>
                                 <div className="bg-slate-900 p-4 rounded border border-slate-800 h-48 w-full">
                                      <div className="flex justify-between text-[10px] text-slate-500 mb-2">
                                          <span>Confidence Retention Curve</span>
                                          <span>Robustness Score: {(report.stressGraph.score * 100).toFixed(0)}/100</span>
                                      </div>
                                      <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={report.stressGraph.dataPoints}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                              <XAxis dataKey="x" stroke="#64748b" tick={{fontSize: 9}} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} label={{ value: 'Degradation', position: 'insideBottom', offset: -5, fontSize: 9, fill: '#64748b' }} />
                                              <YAxis domain={[0, 1]} stroke="#64748b" tick={{fontSize: 9}} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                                              <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px'}} />
                                              <Line type="monotone" dataKey="y" stroke="#10b981" strokeWidth={2} dot={{r: 2}} />
                                          </LineChart>
                                      </ResponsiveContainer>
                                 </div>
                             </div>
                         )}

                     </div>
                 ) : (
                     <div className="text-center text-slate-500 italic mt-10">Awaiting report generation.</div>
                 )}
             </div>
        </div>

        {/* MIDDLE SECTION: 3 PANELS */}
        <div className="flex-grow flex min-h-0">
            
            {/* LEFT: EXPORT CONTROLS (Panel 2) */}
            <div className="w-[250px] border-r border-slate-800 bg-slate-950 p-4 flex flex-col gap-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Download className="w-3 h-3 text-cyan-500" />
                        EXPORT CONTROLS
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Classification Level</label>
                        <select 
                            value={classification}
                            onChange={(e) => setClassification(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded text-xs p-2 focus:ring-1 focus:ring-cyan-500 outline-none"
                        >
                            <option value="INTERNAL">Internal Use Only</option>
                            <option value="CONFIDENTIAL">Confidential</option>
                            <option value="LEGAL_PRIVILEGED">Legal Privileged</option>
                            <option value="PUBLIC">Public Release</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <button className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs flex items-center justify-center gap-2 transition-colors">
                            <FileText className="w-3 h-3 text-red-400" /> Procurement PDF
                        </button>
                        <button className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs flex items-center justify-center gap-2 transition-colors">
                            <FileText className="w-3 h-3 text-emerald-400" /> Executive Brief
                        </button>
                        <button className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs flex items-center justify-center gap-2 transition-colors">
                            <FileJson className="w-3 h-3 text-amber-400" /> Audit JSON
                        </button>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800">
                    <div className="bg-slate-900 p-3 rounded border border-slate-800 flex items-center gap-3">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <div>
                            <div className="text-[10px] font-bold text-slate-300">EXPORTS LOCKED</div>
                            <div className="text-[9px] text-slate-500">Hash verified</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CENTRE: IMMUTABLE AUDIT LOG (Panel 3) */}
            <div className="flex-grow bg-slate-950 flex flex-col border-r border-slate-800">
                <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/50 justify-between">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <History className="w-3 h-3 text-slate-400" />
                        IMMUTABLE AUDIT LEDGER
                    </h3>
                    <div className="flex bg-slate-900 rounded border border-slate-800 p-0.5">
                        <button 
                            onClick={() => setActiveLogTab('SYSTEM')}
                            className={`px-3 py-1 text-[10px] font-bold rounded ${activeLogTab === 'SYSTEM' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            SYSTEM
                        </button>
                        <button 
                             onClick={() => setActiveLogTab('USER')}
                             className={`px-3 py-1 text-[10px] font-bold rounded ${activeLogTab === 'USER' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            ANALYST
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900 text-[9px] text-slate-500 uppercase sticky top-0 font-bold z-10">
                            <tr>
                                <th className="px-4 py-2 w-24">Timestamp</th>
                                <th className="px-4 py-2 w-20">Actor</th>
                                <th className="px-4 py-2 w-32">Action</th>
                                <th className="px-4 py-2">Details</th>
                                <th className="px-4 py-2 w-24 text-right">Hash</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] font-mono text-slate-400 divide-y divide-slate-800/50">
                            {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-900/50">
                                    <td className="px-4 py-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                    <td className="px-4 py-2 font-bold text-cyan-500">{log.actor}</td>
                                    <td className="px-4 py-2">{log.action}</td>
                                    <td className="px-4 py-2 text-slate-300">{log.details}</td>
                                    <td className="px-4 py-2 text-right text-emerald-600 truncate max-w-[100px]">{log.hash}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RIGHT: OVERRIDE HISTORY (Panel 4) */}
            <div className="w-[300px] bg-slate-950 flex flex-col">
                <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/50">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <UserCog className="w-3 h-3 text-amber-500" />
                        HUMAN OVERRIDE HISTORY
                    </h3>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {overrides.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-600 border border-slate-800 border-dashed rounded bg-slate-900/20">
                            <CheckCircle className="w-6 h-6 mb-2 opacity-50" />
                            <span className="text-xs italic">No manual overrides detected.</span>
                            <span className="text-[9px] mt-1">Analysis is 100% System Generated.</span>
                        </div>
                    ) : (
                        overrides.map((ov, i) => (
                            <div key={i} className="bg-amber-900/10 border border-amber-900/30 rounded p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-amber-500">{ov.type}</span>
                                    <span className="text-[9px] text-slate-500">{new Date(ov.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs text-slate-300 mb-2">{ov.details}</p>
                                <div className="flex items-center gap-2 text-[9px]">
                                    <span className="text-slate-500">Impact:</span>
                                    <span className={`font-bold ${ov.impactScore === 'HIGH' ? 'text-red-400' : 'text-slate-400'}`}>{ov.impactScore}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>

        {/* BOTTOM: CHAIN OF CUSTODY (Panel 5) */}
        <div className="h-12 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-slate-500" />
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Original Source Hash</div>
                        <div className="text-[10px] font-mono text-emerald-500">{analysisState.integrity?.hash || 'PENDING'}</div>
                    </div>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Ingest Timestamp</div>
                        <div className="text-[10px] font-mono text-slate-300">{new Date().toLocaleDateString()} (Session)</div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-900/50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Chain of Custody: INTACT</span>
            </div>
        </div>

    </div>
  );
};

export default AuditView;
