import React, { useRef } from 'react';
import { Upload, FileVideo, ShieldCheck, Database, CloudLightning, HardDrive } from 'lucide-react';

interface LandingScreenProps {
  onFileSelect: (file: File) => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onFileSelect(e.target.files[0]);
      }
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col text-slate-200 font-sans selection:bg-cyan-500/30">
      
      <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-md">
           <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/20">
                    <CloudLightning className="w-5 h-5 text-white" />
               </div>
               <div>
                   <h1 className="text-sm font-bold tracking-wide text-slate-100">CAUSAL INSIGHT</h1>
                   <p className="text-[10px] text-slate-500 font-mono">FORENSIC SUITE v3.1</p>
               </div>
           </div>
      </header>

      <div className="flex-grow p-8 flex items-center justify-center min-h-0">
          <div className="max-w-2xl w-full flex flex-col gap-8">
              
              <div 
                className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-slate-900 transition-all p-12 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                  <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden"
                      onChange={handleFileChange}
                      accept="video/*"
                  />
                  
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-700 group-hover:border-cyan-500">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200">Upload Evidence</h3>
                  <p className="text-sm text-slate-500 mt-2 text-center max-w-xs">
                      Select raw video footage to begin forensic analysis.
                      <br/> <span className="text-xs text-amber-500 mt-2 block">NO DEMO MODE. REAL DATA ONLY.</span>
                  </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-center">
                      <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-300">Secure Ingest</h4>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-center">
                      <Database className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-300">Causal Engine</h4>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-center">
                      <HardDrive className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-300">Audit Freeze</h4>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default LandingScreen;