
import React, { useRef, useEffect } from 'react';
import { Play, Pause, AlertTriangle } from 'lucide-react';
import { TrackedObject, TimelineEvent } from '../types';

interface VideoPanelProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  timestamp: number;
  onTimeUpdate: (t: number) => void;
  videoSrc?: string | null;
  showTracks?: boolean;
  showMotion?: boolean;
  showOcclusion?: boolean;
  showUncertainty?: boolean;
  showFlow?: boolean; // New: Optical Flow Arrows
  showHeatmap?: boolean; // New: Occlusion/Confidence Heatmap
  // Real Data Props
  trackedObjects?: TrackedObject[];
  ghostObjects?: TrackedObject[]; // New: Counterfactual Ghost Tracks
  events?: TimelineEvent[];
}

const VideoPanel: React.FC<VideoPanelProps> = ({ 
  isPlaying, 
  onTogglePlay, 
  timestamp, 
  onTimeUpdate, 
  videoSrc,
  showTracks = true,
  showMotion = false,
  showOcclusion = false,
  showUncertainty = false,
  showFlow = false,
  showHeatmap = false,
  trackedObjects = [],
  ghostObjects = [],
  events = []
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    
    const activeObjects = trackedObjects.filter(obj => timestamp >= obj.firstSeen && timestamp <= obj.lastSeen);
    const activeGhostObjects = ghostObjects.filter(obj => timestamp >= obj.firstSeen && timestamp <= obj.lastSeen);

    // 1. Draw Occlusion Heatmap (Perception Layer)
    if (showHeatmap) {
        activeObjects.forEach((obj, idx) => {
             // Simulate position based on time for demo purposes (since we lack full per-frame coords from this API config)
             const pseudoX = (width * 0.2) + ((obj.id * 50 + timestamp * 30) % (width * 0.6));
             const pseudoY = height * 0.6;
             
             // Low confidence = High occlusion probability = Red Heatmap
             if (obj.avgConfidence < 0.8 || showOcclusion) {
                 const gradient = ctx.createRadialGradient(pseudoX + 40, pseudoY + 25, 0, pseudoX + 40, pseudoY + 25, 60);
                 gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); // Red center
                 gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');   // Transparent edge
                 ctx.fillStyle = gradient;
                 ctx.beginPath();
                 ctx.arc(pseudoX + 40, pseudoY + 25, 60, 0, 2 * Math.PI);
                 ctx.fill();
             }
        });
    }

    // 2. Draw Active Semantic Events (Occlusion Zones - Tab 1/2 feature)
    if (showOcclusion) {
        const activeOcclusions = events.filter(e => e.type === 'occlusion' && Math.abs(e.timestamp - timestamp) < 2.0); 
        
        activeOcclusions.forEach(occ => {
             ctx.fillStyle = `rgba(239, 68, 68, 0.2)`; 
             ctx.strokeStyle = '#ef4444';
             ctx.setLineDash([10, 5]);
             ctx.lineWidth = 2;
             ctx.strokeRect(width * 0.7, height * 0.2, 100, 100); 
             ctx.fillText(`⚠ ${occ.label.toUpperCase()}`, width * 0.7, height * 0.2 - 10);
             ctx.setLineDash([]);
        });
    }

    // 3. Draw Tracked Objects & Optical Flow
    if (showTracks) {
        activeObjects.forEach((obj, idx) => {
             const pseudoX = (width * 0.2) + ((obj.id * 50 + timestamp * 30) % (width * 0.6));
             const pseudoY = height * 0.6;

             // Bounding Box
             ctx.strokeStyle = obj.avgConfidence > 0.8 ? '#10b981' : '#f59e0b'; // Green or Amber based on confidence
             ctx.lineWidth = 2;
             ctx.setLineDash([]);
             ctx.strokeRect(pseudoX, pseudoY, 80, 50);
             
             // Label Header
             ctx.fillStyle = obj.avgConfidence > 0.8 ? '#10b981' : '#f59e0b';
             ctx.fillRect(pseudoX, pseudoY - 15, 80, 15);
             ctx.fillStyle = '#000';
             ctx.font = 'bold 10px sans-serif';
             ctx.fillText(`ID:${obj.id} ${(obj.avgConfidence * 100).toFixed(0)}%`, pseudoX + 2, pseudoY - 4);

             // Motion / Optical Flow Vectors
             if (showMotion || showFlow) {
                 ctx.beginPath();
                 ctx.moveTo(pseudoX + 40, pseudoY + 25);
                 
                 // Calculate vector endpoint based on speed/direction (Simulated for viz)
                 const speedScale = Math.min(obj.maxSpeed, 100) / 2; // pixel scale
                 const angle = obj.direction?.includes('Left') ? Math.PI : 0; // Simplified direction map
                 
                 const endX = pseudoX + 40 + Math.cos(angle) * speedScale + 20; // +20 bias for forward movement visuals
                 const endY = pseudoY + 25 + Math.sin(angle) * speedScale;

                 ctx.lineTo(endX, endY);
                 ctx.strokeStyle = showFlow ? '#06b6d4' : '#f59e0b'; // Cyan for flow, Amber for general motion
                 ctx.lineWidth = 2;
                 ctx.stroke();

                 // Arrowhead
                 const headLen = 5;
                 const dx = endX - (pseudoX + 40);
                 const dy = endY - (pseudoY + 25);
                 const angleRad = Math.atan2(dy, dx);
                 ctx.lineTo(endX - headLen * Math.cos(angleRad - Math.PI / 6), endY - headLen * Math.sin(angleRad - Math.PI / 6));
                 ctx.moveTo(endX, endY);
                 ctx.lineTo(endX - headLen * Math.cos(angleRad + Math.PI / 6), endY - headLen * Math.sin(angleRad + Math.PI / 6));
                 ctx.stroke();
             }
        });
    }

    // 4. Draw Ghost Objects (Counterfactuals)
    if (activeGhostObjects.length > 0) {
        activeGhostObjects.forEach((obj) => {
             // Ghost objects are simulated with slight offset or different behavior
             // For visualization, we'll assume the parent component handles the physics 'offset' 
             // and passes valid pseudo-coordinates implicitly via the object logic or we simulate it here.
             
             // Ghost Position (Simulate divergence: e.g. braking earlier means it's 'behind' the real car in a forward moving frame)
             const pseudoX = (width * 0.2) + ((obj.id * 50 + timestamp * 30) % (width * 0.6)) - 40; // Offset back
             const pseudoY = height * 0.6;

             ctx.strokeStyle = '#06b6d4'; // Cyan
             ctx.lineWidth = 2;
             ctx.setLineDash([5, 3]); // Dashed line for "Ghost"
             ctx.strokeRect(pseudoX, pseudoY, 80, 50);

             // Label
             ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
             ctx.fillRect(pseudoX, pseudoY - 15, 80, 15);
             ctx.fillStyle = '#fff';
             ctx.font = 'bold 10px sans-serif';
             ctx.fillText(`SIMULATED`, pseudoX + 2, pseudoY - 4);
             
             ctx.setLineDash([]);
        });
    }

  }, [timestamp, showTracks, showMotion, showOcclusion, showFlow, showHeatmap, trackedObjects, events, ghostObjects]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden relative group">
      <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            src={videoSrc}
            onTimeUpdate={handleTimeUpdate}
            loop
            muted
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
             <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
             <p className="text-xs">No Signal</p>
          </div>
        )}
        <canvas ref={canvasRef} width={800} height={450} className="absolute inset-0 w-full h-full pointer-events-none" />
        <button
          onClick={onTogglePlay}
          className="z-30 p-5 bg-black/50 rounded-full hover:bg-cyan-600/90 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10"
        >
          {isPlaying ? <Pause className="w-10 h-10 text-white fill-current" /> : <Play className="w-10 h-10 text-white fill-current ml-1" />}
        </button>
      </div>
      <div className="h-1 bg-slate-800 w-full relative group/bar">
         <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `0%` }}></div>
      </div>
    </div>
  );
};

export default VideoPanel;
