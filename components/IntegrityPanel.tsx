import React, { useState, useEffect } from 'react';
import { VideoIntegrityReport } from '../types';
import { ShieldCheck, AlertTriangle, XCircle, FileSearch } from 'lucide-react';
import { generateIntegritySummary } from '../services/geminiService';

interface IntegrityPanelProps {
  report: VideoIntegrityReport | null;
}

const IntegrityPanel: React.FC<IntegrityPanelProps> = ({ report }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (report && !summary) {
        setLoading(true);
        generateIntegritySummary(report).then(res => {
            setSummary(res);
            setLoading(false);
        });
    }
  }, [report]);

  if (!report) return <div className="p-4 text-slate-500 text-xs">No video loaded.</div>;

  const getIcon = () => {
    switch (report.verdict) {
      case 'OK': return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case 'WARN': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'CRITICAL': return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="h-full bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            VIDEO INTEGRITY
            {getIcon()}
        </h3>
        <span className="text-[10px] font-mono text-slate-500">{report.hash.substring(0, 8)}...</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-3">
          <div className="bg-slate-950 p-1 rounded">
              <span className="block text-slate-600">FPS</span>
              <span className="text-slate-200">{report.fps}</span>
          </div>
          <div className="bg-slate-950 p-1 rounded">
              <span className="block text-slate-600">Duration</span>
              <span className="text-slate-200">{report.duration}s</span>
          </div>
          <div className="bg-slate-950 p-1 rounded">
              <span className="block text-slate-600">Drops</span>
              <span className={report.droppedFrames > 0 ? "text-amber-500" : "text-slate-200"}>{report.droppedFrames}</span>
          </div>
          <div className="bg-slate-950 p-1 rounded">
              <span className="block text-slate-600">Interp</span>
              <span className="text-slate-200">{(report.interpolationScore * 100).toFixed(1)}%</span>
          </div>
      </div>

      <div className="flex-grow bg-slate-950 rounded p-2 overflow-y-auto">
          <div className="flex items-start gap-2 mb-1">
              <FileSearch className="w-3 h-3 text-cyan-600 mt-1" />
              <span className="text-[10px] font-bold text-slate-400">AUTO-REPORT</span>
          </div>
          {loading ? (
              <p className="text-[10px] text-slate-600 animate-pulse">Generating natural language report...</p>
          ) : (
              <p className="text-[10px] text-slate-300 leading-relaxed">{summary}</p>
          )}
      </div>
    </div>
  );
};

export default IntegrityPanel;
