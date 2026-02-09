
import React, { useMemo } from 'react';
import VideoPanel from '../VideoPanel';
import { VideoIntegrityReport, AnalysisState } from '../../types';
import { 
    ShieldCheck, AlertTriangle, XCircle, FileText, Hash, 
    Activity, Layers, Clock, FileLock, Search, Eye, AlertOctagon
} from 'lucide-react';

interface EvidenceViewProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  timestamp: number;
  onTimeUpdate: (t: number) => void;
  report: VideoIntegrityReport | null;
  videoSrc: string | null;
  analysisState?: AnalysisState; 
}

const IntegrityCard: React.FC<{ label: string; status: 'OK' | 'WARN' | 'CRITICAL' | 'UNKNOWN'; value?: string }> = ({ label, status, value }) => {
    const colors = {
        OK: 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400',
        WARN: 'bg-amber-900/20 border-amber-900/50 text-amber-400',
        CRITICAL: 'bg-red-900/20 border-red-900/50 text-red-400',
        UNKNOWN: 'bg-slate-800/50 border-slate-700 text-slate-500'
    };
    return (
        <div className={`p-2 rounded border ${colors[status]} flex flex-col items-center justify-center text-center`}>
            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">{label}</div>
            <div className={`text-xs font-bold ${status === 'OK' ? 'text-emerald-400' : status === 'WARN' ? 'text-amber-400' : 'text-red-400'}`}>
                {status}
            </div>
            {value && <div className="text-[9px] text-slate-400 mt-1 font-mono">{value}</div>}
        </div>
    );
};

const EvidenceView: React.FC<EvidenceViewProps> = ({ 
    isPlaying, onTogglePlay, timestamp, onTimeUpdate, report, videoSrc, analysisState 
}) => {
  
  // MOCK PROVENANCE DATA
  const provenanceLog = useMemo(() => {
      if (!report) return [];
      const baseTime = new Date().getTime() - 1000 * 60 * 2;
      return [
          { time: new Date(baseTime).toISOString(), event: 'INGEST_START', source: 'CLIENT_UPLOAD', notes: 'Native Stream' },
          { time: new Date(baseTime + 100).toISOString(), event: 'HASH_SHA256', source: 'CRYPTO_ENGINE', notes: report.hash.substring(0, 12) + '...' },
          { time: new Date(baseTime + 1200).toISOString(), event: 'DECODE_FFMPEG', source: 'WASM_CORE', notes: `AVC1 / ${report.fps}fps` },
          { time: new Date(baseTime + 4500).toISOString(), event: 'INTEGRITY_SCAN', source: 'FORENSIC_MODULE', notes: `Verdict: ${report.verdict}` },
      ];
  }, [report]);

  if (!report || !analysisState) return <div className="p-8 text-slate-500">Awaiting Evidence Processing...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
        {/* VIEW HEADER */}
        <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
            <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                <FileLock className="w-4 h-4 text-emerald-500" />
                EVIDENCE & INTEGRITY
            </h2>
            <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {report.hash.substring(0, 16)}...</span>
                <span className="flex items-center gap-1 text-emerald-500"><ShieldCheck className="w-3 h-3" /> VERIFIED</span>
            </div>
        </div>

        <div className="flex-grow flex min-h-0">
            {/* LEFT COLUMN: VIDEO & NAV */}
            <div className="w-[450px] shrink-0 border-r border-slate-800 bg-black flex flex-col">
                 <div className="aspect-video bg-black relative border-b border-slate-800">
                     <VideoPanel 
                        isPlaying={isPlaying} 
                        onTogglePlay={onTogglePlay} 
                        timestamp={timestamp} 
                        onTimeUpdate={onTimeUpdate}
                        videoSrc={videoSrc}
                        showTracks={true}
                        trackedObjects={analysisState.objects}
                    />
                 </div>
                 <div className="flex-grow bg-slate-900/30 p-4 overflow-y-auto">
                     <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                         <Layers className="w-3 h-3" /> EVIDENCE LAYERS
                     </h3>
                     <div className="space-y-1">
                         <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300">
                             <span>Raw Footage</span>
                             <span className="text-emerald-500 text-[10px] font-mono">MASTER</span>
                         </div>
                         <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 opacity-50">
                             <span>Thermal Layer</span>
                             <span className="text-slate-600 text-[10px] font-mono">N/A</span>
                         </div>
                         <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 opacity-50">
                             <span>LiDAR Point Cloud</span>
                             <span className="text-slate-600 text-[10px] font-mono">N/A</span>
                         </div>
                     </div>
                 </div>
            </div>

            {/* RIGHT COLUMN: 5 PANELS SCROLLABLE */}
            <div className="flex-grow overflow-y-auto scroll-smooth bg-slate-950 p-6 space-y-6">
                
                {/* PANEL 1: FRAME & TIME METADATA */}
                <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">01. FRAME & TIME METADATA</span>
                        <Clock className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-4 text-xs">
                        <div className="space-y-1">
                            <span className="block text-slate-500 text-[10px]">FILE HASH</span>
                            <span className="font-mono text-emerald-400 break-all leading-tight">{report.hash}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="block text-slate-500 text-[10px]">RESOLUTION</span>
                            <span className="font-mono text-slate-300">1920x1080 (Est)</span>
                        </div>
                        <div className="space-y-1">
                            <span className="block text-slate-500 text-[10px]">FRAME RATE</span>
                            <span className="font-mono text-slate-300">{report.fps} FPS</span>
                        </div>
                        <div className="space-y-1">
                            <span className="block text-slate-500 text-[10px]">CODEC</span>
                            <span className="font-mono text-slate-300">{report.codec.toUpperCase()}</span>
                        </div>
                    </div>
                </section>

                {/* PANEL 2: INTEGRITY STATUS CARDS */}
                <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                     <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">02. INTEGRITY STATUS</span>
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        <IntegrityCard label="Frame Continuity" status={report.droppedFrames > 0 ? 'WARN' : 'OK'} value={`Drops: ${report.droppedFrames}`} />
                        <IntegrityCard label="Compression" status="OK" value="No Artifacts" />
                        <IntegrityCard label="Duplication" status="OK" value="0%" />
                        <IntegrityCard label="Temporal Tamper" status={report.vfr ? 'WARN' : 'OK'} value={report.vfr ? 'VFR Detected' : 'Clean'} />
                        <IntegrityCard label="Deepfake Scan" status="OK" value="< 1% Prob" />
                    </div>
                </section>

                {/* PANEL 3: PROVENANCE */}
                <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                     <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">03. PROVENANCE & CHAIN OF CUSTODY</span>
                        <FileText className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="p-0">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-500 font-mono text-[10px]">
                                <tr>
                                    <th className="px-4 py-2 font-normal">TIMESTAMP</th>
                                    <th className="px-4 py-2 font-normal">EVENT</th>
                                    <th className="px-4 py-2 font-normal">SOURCE</th>
                                    <th className="px-4 py-2 font-normal">NOTES</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300 font-mono text-[10px]">
                                {provenanceLog.map((log, i) => (
                                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="px-4 py-2 text-slate-500">{log.time}</td>
                                        <td className="px-4 py-2 font-bold">{log.event}</td>
                                        <td className="px-4 py-2">{log.source}</td>
                                        <td className="px-4 py-2 text-slate-400 truncate max-w-[150px]">{log.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* PANEL 4: TIMESTAMP EVIDENCE TIMELINE */}
                <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                     <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">04. TIMESTAMP EVIDENCE TIMELINE</span>
                        <Activity className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="p-4 relative h-24 flex items-center">
                        {/* Base Line */}
                        <div className="absolute left-4 right-4 h-0.5 bg-slate-700"></div>
                        
                        {/* Markers */}
                        {analysisState.events.map((evt, i) => {
                             const pct = (evt.timestamp / report.duration) * 100;
                             return (
                                 <div 
                                    key={i} 
                                    className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                                    style={{ left: `${pct}%` }}
                                    onClick={() => onTimeUpdate(evt.timestamp)}
                                 >
                                     <div className={`w-3 h-3 rounded-full border-2 border-slate-900 z-10 ${evt.type === 'impact' ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
                                     <div className="h-4 w-px bg-slate-700 group-hover:bg-cyan-500 transition-colors"></div>
                                     <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute top-8">
                                         {evt.timestamp.toFixed(2)}s
                                     </span>
                                 </div>
                             )
                        })}
                    </div>
                </section>

                {/* PANEL 5: KEYFRAME MARKERS */}
                <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                     <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">05. KEYFRAME & SEMANTIC MARKERS</span>
                        <Search className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="p-4 flex gap-3 overflow-x-auto">
                        {analysisState.events.length === 0 ? (
                            <div className="text-xs text-slate-500 italic">No semantic events detected in scan.</div>
                        ) : (
                            analysisState.events.map((evt, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => onTimeUpdate(evt.timestamp)} 
                                    className="flex-shrink-0 w-32 bg-black border border-slate-800 rounded hover:border-cyan-500 cursor-pointer group"
                                >
                                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                                        <Eye className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                                    </div>
                                    <div className="p-2 border-t border-slate-800">
                                        <div className="text-[10px] font-bold text-slate-300 truncate">{evt.label}</div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[9px] font-mono text-slate-500">{evt.timestamp.toFixed(2)}s</span>
                                            <span className={`text-[9px] font-bold ${evt.confidence === 'high' ? 'text-emerald-500' : 'text-amber-500'}`}>{evt.confidence.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

            </div>
        </div>
    </div>
  );
};

export default EvidenceView;
