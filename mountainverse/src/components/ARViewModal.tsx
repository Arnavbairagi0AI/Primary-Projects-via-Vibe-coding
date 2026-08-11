import React, { useEffect, useRef, useState } from 'react';
import { Mountain } from '../types';
import { Camera, X, Compass, Eye, ShieldCheck, RefreshCw, Download, Zap, Layers, AlertCircle } from 'lucide-react';

interface ARViewModalProps {
  mountain: Mountain | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ARViewModal: React.FC<ARViewModalProps> = ({ mountain, isOpen, onClose }) => {
  if (!isOpen || !mountain) return null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hudMode, setHudMode] = useState<'contour' | 'thermal' | 'nightvision'>('contour');
  const [bearing, setBearing] = useState<number>(284);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Initialize camera feed
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);
          }
        } else {
          setCameraError('Camera API not supported in this browser environment. Using high-fidelity simulated AR view.');
        }
      } catch (err: any) {
        console.warn('Camera access error or permission denied:', err);
        setCameraError('Camera access required for live feed. Rendering simulated interactive AR camera viewport.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Animated AR Overlay Loop on Canvas
  useEffect(() => {
    let animationFrameId: number;
    let angle = 0;

    const renderAROverlay = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      angle += 0.02;

      // Color scheme based on HUD mode
      let strokeColor = 'rgba(56, 189, 248, 0.8)'; // Cyan
      let glowColor = '#38bdf8';
      let textColor = '#7dd3fc';

      if (hudMode === 'thermal') {
        strokeColor = 'rgba(251, 146, 60, 0.8)'; // Orange/Thermal
        glowColor = '#fb923c';
        textColor = '#fdba74';
      } else if (hudMode === 'nightvision') {
        strokeColor = 'rgba(52, 211, 153, 0.8)'; // Emerald
        glowColor = '#34d399';
        textColor = '#6ee7b7';
      }

      // Draw 3D Topographic Contour Lines representing the mountain peak in camera space
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = strokeColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = glowColor;

      const centerX = width / 2;
      const centerY = height / 2 + 20;

      // Render concentric topographic contour loops
      for (let i = 1; i <= 8; i++) {
        ctx.beginPath();
        const baseRadiusX = (width * 0.38) * (1 - i * 0.1);
        const baseRadiusY = (height * 0.28) * (1 - i * 0.1);
        const offset = Math.sin(angle + i) * 6;

        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          // Add terrain noise modulation to simulate mountain peak ridges
          const ridgeNoise = Math.sin(a * 5 + i) * 12 + Math.cos(a * 3) * 8;
          const x = centerX + Math.cos(a) * (baseRadiusX + ridgeNoise) + offset;
          const y = centerY - (i * 18) + Math.sin(a) * (baseRadiusY + ridgeNoise / 2);
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Render Peak Apex Crosshair
      const summitX = centerX + Math.sin(angle * 0.5) * 8;
      const summitY = centerY - 145;

      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(summitX, summitY, 16, 0, Math.PI * 2);
      ctx.moveTo(summitX - 24, summitY);
      ctx.lineTo(summitX + 24, summitY);
      ctx.moveTo(summitX, summitY - 24);
      ctx.lineTo(summitX, summitY + 24);
      ctx.stroke();
      ctx.restore();

      // Summit Label Box in AR Space
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.fillRect(summitX + 22, summitY - 28, 170, 52);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(summitX + 22, summitY - 28, 170, 52);

      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`SUMMIT: ${mountain.name}`, summitX + 30, summitY - 10);
      ctx.font = '11px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`ELEV: ${mountain.elevationMeters.toLocaleString()}m | ISO`, summitX + 30, summitY + 10);

      // Render Floating Waypoint Pins
      mountain.hotspots.slice(0, 3).forEach((spot, idx) => {
        const px = centerX + (idx - 1) * 130 + Math.cos(angle + idx) * 10;
        const py = centerY - 40 + idx * 30;

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = glowColor;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(px + 12, py - 12, 110, 24);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${spot.name} (${spot.altitudeMeters}m)`, px + 18, py + 2);
      });

      // Render Pitch / Roll Attitude Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, height / 2);
      ctx.lineTo(120, height / 2);
      ctx.moveTo(width - 120, height / 2);
      ctx.lineTo(width - 40, height / 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(renderAROverlay);
    };

    renderAROverlay();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, hudMode, mountain]);

  // Take Snapshot
  const handleTakeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create export canvas combining video frame or simulated background + AR overlay
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (cameraActive && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Draw dark alpine camera frame
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw AR overlay on top
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* AR Header Bar */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Augmented Reality Viewport
              </div>
              <h3 className="text-sm font-black text-white">{mountain.name} 3D Topographic Overlay</h3>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            {[
              { id: 'contour', label: 'Cyan Wireframe' },
              { id: 'thermal', label: 'Thermal Heatmap' },
              { id: 'nightvision', label: 'Night Vision' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setHudMode(m.id as any)}
                className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                  hudMode === m.id
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport Canvas Container */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
          
          {/* Live Camera Video element */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Fallback Background if Camera access unavailable */}
          {!cameraActive && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 text-sky-400 animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-xs text-sky-300 font-mono max-w-md mb-2">
                [LIVE SIMULATED AR CAMERA HUD ACTIVE]
              </p>
              {cameraError && (
                <p className="text-[11px] text-slate-400 max-w-md">
                  {cameraError}
                </p>
              )}
            </div>
          )}

          {/* AR Overlay Canvas Layer */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          />

          {/* Live HUD Telemetry Overlays */}
          <div className="absolute top-4 left-4 z-20 space-y-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-sky-300 space-y-0.5">
              <div>LAT: {mountain.latitude.toFixed(4)}° N</div>
              <div>LNG: {mountain.longitude.toFixed(4)}° E</div>
              <div>AZIMUTH: {bearing}° NW</div>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-20 space-y-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-amber-300 space-y-0.5 text-right">
              <div>ALTITUDE: {mountain.elevationMeters.toLocaleString()}M</div>
              <div>O2 PRESSURE: {(mountain.elevationMeters > 7000 ? 33 : 60)}%</div>
              <div>WIND: {mountain.climate.predominantWindKmH} KM/H</div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 shadow-2xl">
            <button
              onClick={handleTakeSnapshot}
              className="px-5 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/30"
            >
              <Camera className="w-4 h-4" /> Take AR Snapshot
            </button>
            <button
              onClick={() => setBearing((prev) => (prev + 15) % 360)}
              className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Adjust Bearing
            </button>
          </div>
        </div>

        {/* Snapshot Modal Preview Layer */}
        {capturedImage && (
          <div className="absolute inset-0 z-30 bg-slate-950/95 p-6 flex flex-col items-center justify-center space-y-4 animate-fade-in">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> AR Telemetry Photo Captured
            </h4>
            <div className="max-w-2xl max-h-[60vh] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
              <img src={capturedImage} alt="AR Snapshot" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-3">
              <a
                href={capturedImage}
                download={`${mountain.id}-ar-telemetry.png`}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Photo
              </a>
              <button
                onClick={() => setCapturedImage(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
