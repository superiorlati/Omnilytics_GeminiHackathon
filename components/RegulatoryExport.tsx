import React, { useState } from 'react';
import { generateExecutiveReport } from '../services/geminiService';
import { VideoIntegrityReport, CausalEdge, Intervention } from '../types';
import { FileText, Download, Lock } from 'lucide-react';

interface RegulatoryExportProps {
    integrity: VideoIntegrityReport;
    edges: CausalEdge[];
    interventions: Intervention[];
}

const RegulatoryExport: React.FC<RegulatoryExportProps> = ({ integrity, edges, interventions }) => {
    const [reportText, setReportText] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const text = await generateExecutiveReport(integrity, edges, interventions);
        setReportText(text);
        setIsGenerating(false);
    };

    return (
        <div className="h-full bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold text-slate-300">REGULATORY EXPORT</h3>
                <Lock className="w-3 h-3 text-emerald-600" />
            </div>

            {!reportText ? (
                <div className="flex-grow flex flex-col items-center justify-center space-y-3">
                    <p className="text-[10px] text-slate-500 text-center max-w-[150px]">
                        Generate evidence-bounded executive summary and audit package.
                    </p>
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-4 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? "Compiling..." : <><FileText className="w-3 h-3" /> Generate Report</>}
                    </button>
                </div>
            ) : (
                <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex-grow overflow-y-auto bg-slate-100 text-slate-900 p-3 rounded text-[10px] font-serif leading-relaxed mb-2 whitespace-pre-wrap shadow-inner">
                        {reportText}
                    </div>
                    <button className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs py-1 rounded flex items-center justify-center gap-2">
                        <Download className="w-3 h-3" /> Download Signed PDF
                    </button>
                </div>
            )}
        </div>
    );
};

export default RegulatoryExport;
