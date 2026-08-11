import React, { useState, useEffect, useRef } from "react";
import { UserProfile, RunActivity } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { 
  Map, 
  Play, 
  Square, 
  RotateCcw, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  Lock, 
  Check, 
  Share2, 
  Download, 
  Volume2, 
  MapPin, 
  Navigation,
  Globe,
  Compass,
  Award
} from "lucide-react";

interface StravaTrackerProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onNavigateBack: () => void;
}

export default function StravaTracker({
  profile,
  onUpdateProfile,
  onNavigateBack
}: StravaTrackerProps) {
  // Unit toggle state: 'km' or 'mile'
  const [unit, setUnit] = useState<'km' | 'mile'>(() => {
    const saved = localStorage.getItem("fittrack_strava_unit");
    return (saved === 'mile' || saved === 'km') ? saved : 'km';
  });

  // Track run state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0); // in raw selected unit
  const [route, setRoute] = useState<{ x: number; y: number }[]>([]);
  const [runCaption, setRunCaption] = useState<string>("");
  const [activeMapStyle, setActiveMapStyle] = useState<'dark' | 'satellite' | 'terrain'>(() => {
    return profile.isPro ? 'satellite' : 'dark';
  });

  // Cheering milestone messages state
  const [liveMessages, setLiveMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: "AI Coach", text: "FitTrack Live GPS ready. Tap Play to start tracking your running route!", time: "Now" }
  ]);

  // Saved run history
  const [runs, setRuns] = useState<RunActivity[]>(() => {
    const local = localStorage.getItem("fittrack_strava_runs");
    return local ? JSON.parse(local) : [
      {
        id: "prev-run-1",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "07:30 AM",
        distance: 5.2,
        unit: "km" as const,
        duration: 1560, // 26 mins
        pace: "5:00 min/km",
        caption: "Early morning interval run! Felt fantastic 🏃‍♂️⚡",
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        routeCoords: [{ x: 50, y: 50 }, { x: 100, y: 120 }, { x: 200, y: 150 }, { x: 250, y: 80 }]
      },
      {
        id: "prev-run-2",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "06:15 PM",
        distance: 3.1,
        unit: "mile" as const,
        duration: 1620, // 27 mins
        pace: "8:42 min/mile",
        caption: "Sunset jog along the ridge. Sunset views were incredible!",
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        routeCoords: [{ x: 80, y: 90 }, { x: 140, y: 180 }, { x: 190, y: 100 }]
      }
    ];
  });

  // Modal overlays
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [checkoutCard, setCheckoutCard] = useState<string>("");
  const [checkoutName, setCheckoutName] = useState<string>("");

  // Refs for custom map plotting canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<any>(null);

  // Sync unit choice
  useEffect(() => {
    localStorage.setItem("fittrack_strava_unit", unit);
  }, [unit]);

  // Sync saved runs
  useEffect(() => {
    localStorage.setItem("fittrack_strava_runs", JSON.stringify(runs));
  }, [runs]);

  // Simulation Map Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 335;
    canvas.height = 180;

    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Map Background Style
      if (activeMapStyle === 'satellite') {
        // Satellite green-blue-dark hybrid theme
        ctx.fillStyle = "#112211";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Forests / Terrain patches
        ctx.fillStyle = "#0c1a0c";
        ctx.beginPath();
        ctx.arc(60, 50, 40, 0, Math.PI * 2);
        ctx.arc(280, 120, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#1e2e1e";
        ctx.beginPath();
        ctx.arc(170, 90, 50, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeMapStyle === 'terrain') {
        // Topography contour theme
        ctx.fillStyle = "#1b1917";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = "#2e2b28";
        ctx.lineWidth = 1;
        for (let i = 10; i < canvas.width; i += 30) {
          ctx.beginPath();
          ctx.arc(150, 90, i, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Premium High-Contrast Dark Street Grid
        ctx.fillStyle = "#0c0c0e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid Lines
        ctx.strokeStyle = "#16161b";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Render Simulated Streets/Trails
      ctx.strokeStyle = activeMapStyle === 'satellite' ? "#2e3a2e" : "#1e1e24";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, 40);
      ctx.lineTo(canvas.width - 10, 40);
      ctx.moveTo(40, 10);
      ctx.lineTo(40, canvas.height - 10);
      ctx.moveTo(150, 10);
      ctx.lineTo(150, canvas.height - 10);
      ctx.moveTo(10, 140);
      ctx.lineTo(canvas.width - 10, 140);
      ctx.stroke();

      // Draw tracked running path
      if (route.length > 0) {
        ctx.strokeStyle = "#FC5200"; // Signature Strava Orange
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(route[0].x, route[0].y);
        for (let i = 1; i < route.length; i++) {
          ctx.lineTo(route[i].x, route[i].y);
        }
        ctx.stroke();

        // Draw start point icon marker
        ctx.fillStyle = "#10B981"; // Emerald
        ctx.beginPath();
        ctx.arc(route[0].x, route[0].y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw current/end point blinking indicator
        ctx.fillStyle = "#FC5200";
        ctx.beginPath();
        ctx.arc(route[route.length - 1].x, route[route.length - 1].y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Pulse Ring
        const pulse = (Date.now() % 1000) / 1000;
        ctx.strokeStyle = `rgba(252, 82, 0, ${1 - pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(route[route.length - 1].x, route[route.length - 1].y, 6 + pulse * 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    // Keep map updated
    const frame = setInterval(drawMap, 100);
    return () => clearInterval(frame);
  }, [route, activeMapStyle]);

  // Stopwatch ticking logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const nextTime = prev + 1;
          
          // Every 10 seconds of simulated run, add a new coordinate node & increment distance
          if (nextTime % 5 === 0) {
            setRoute(r => {
              const lastNode = r.length > 0 ? r[r.length - 1] : { x: 40 + Math.random() * 40, y: 40 + Math.random() * 40 };
              
              // Move randomly towards a clean street path direction
              const angle = Math.random() * Math.PI * 2;
              const nextX = Math.max(10, Math.min(canvasRef.current?.width || 330, lastNode.x + Math.cos(angle) * 18));
              const nextY = Math.max(10, Math.min(canvasRef.current?.height || 170, lastNode.y + Math.sin(angle) * 12));
              
              const newRoute = [...r, { x: nextX, y: nextY }];
              
              // Accumulate distance (Simulated 0.15 km/miles per node)
              const incrementalDist = parseFloat((0.12 + Math.random() * 0.08).toFixed(2));
              setDistance(d => {
                const updatedDist = parseFloat((d + incrementalDist).toFixed(2));
                
                // Trigger milestone motivators!
                triggerMilestoneCheer(updatedDist);
                
                return updatedDist;
              });

              return newRoute;
            });
          }

          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Milestone AI Encouragement Generator
  const triggerMilestoneCheer = (currentDist: number) => {
    // Round to see if we reached a threshold
    const intDist = Math.floor(currentDist);
    if (currentDist > 0 && (currentDist * 10) % 5 === 0) {
      const motivationalCoachQuotes = [
        `Outstanding! Reached ${currentDist} ${unit}s. Maintain this rhythmic cadence!`,
        `Milestone Alert! ${currentDist} ${unit}s logged. Breathing stays deep & even.`,
        `AI Cheering: Your stride is look extremely balanced. Energy output is optimal!`,
        `Milestone of ${currentDist} ${unit}s ticked off. Pace holds strong!`,
      ];
      const randomQuote = motivationalCoachQuotes[Math.floor(Math.random() * motivationalCoachQuotes.length)];
      
      setLiveMessages(prev => [
        { 
          sender: "FitTrack AI Voice", 
          text: randomQuote, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
        },
        ...prev
      ]);
    }
  };

  // Human pace calculator formatting
  const getPaceString = () => {
    if (distance === 0) return `--:-- min/${unit}`;
    const totalMinutes = elapsedTime / 60;
    const paceVal = totalMinutes / distance;
    const paceMin = Math.floor(paceVal);
    const paceSec = Math.round((paceVal - paceMin) * 60);
    return `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} min/${unit}`;
  };

  const handleStartRun = () => {
    if (route.length === 0) {
      // Set initial spot
      setRoute([{ x: 40 + Math.random() * 40, y: 40 + Math.random() * 40 }]);
    }
    setIsRunning(true);
    setLiveMessages(prev => [
      { sender: "System", text: "GPS tracking initiated. Enjoy your runner's high!", time: "Now" },
      ...prev
    ]);
  };

  const handlePauseRun = () => {
    setIsRunning(false);
    setLiveMessages(prev => [
      { sender: "System", text: "Session paused. Catch your breath!", time: "Now" },
      ...prev
    ]);
  };

  const handleResetRun = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setDistance(0);
    setRoute([]);
    setLiveMessages(prev => [
      { sender: "System", text: "GPS coordinate cache cleared.", time: "Now" },
      ...prev
    ]);
  };

  const handleSaveRun = async () => {
    if (distance === 0) return;

    const newRun: RunActivity = {
      id: "run-" + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      distance,
      unit,
      duration: elapsedTime,
      pace: getPaceString(),
      caption: runCaption.trim() || "Completed an awesome outdoor GPS run! 🏃‍♂️🌟",
      timestamp: Date.now(),
      routeCoords: route
    };

    // Save run activity
    setRuns(prev => [newRun, ...prev]);

    // Save to Firestore if registered user
    if (profile.uid && !profile.uid.startsWith("local_")) {
      try {
        await addDoc(collection(db, `users/${profile.uid}/runActivities`), newRun);
      } catch (err) {
        console.warn("Firestore save error, run persisted locally:", err);
      }
    }

    // Reset parameters
    setIsRunning(false);
    setElapsedTime(0);
    setDistance(0);
    setRoute([]);
    setRunCaption("");
    
    setLiveMessages(prev => [
      { sender: "System", text: `Run saved! Shared successfully to community activity stream.`, time: "Now" },
      ...prev
    ]);
  };

  // Map Click manual coordinate plotting
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isRunning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRoute(prev => {
      const nextRoute = [...prev, { x, y }];
      // Add custom manual plotting increments to distance
      setDistance(d => {
        const incremental = parseFloat((0.2 + Math.random() * 0.1).toFixed(2));
        const finalDist = parseFloat((d + incremental).toFixed(2));
        triggerMilestoneCheer(finalDist);
        return finalDist;
      });
      return nextRoute;
    });
  };

  // Simulation Upgrade processing
  const handleUpgradeToPro = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      const updatedProfile: UserProfile = {
        ...profile,
        isPro: true
      };
      onUpdateProfile(updatedProfile);
      
      // Update local storage too
      localStorage.setItem("fittrack_profile", JSON.stringify(updatedProfile));

      setIsUpgrading(false);
      setShowUpgradeModal(false);
      setActiveMapStyle('satellite'); // automatically unlock premium theme

      setLiveMessages(prev => [
        { sender: "AI Head Coach", text: "Subscription verified! Premium Strava-Pro Suite unlocked: Satellites, GPX export & Elite sound guidance.", time: "Now" },
        ...prev
      ]);
    }, 1500);
  };

  // Convert raw seconds to formatted MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins < 10 && hrs > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-5">
      {/* Title Header with Orange Strava Accent */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[#FC5200] font-black flex items-center gap-1.5 font-display">
            <Compass className="w-3 h-3 animate-spin text-[#FC5200]" /> Strava Interactive GPS Engine
          </span>
          <h2 className="text-lg font-black tracking-tight text-white font-display flex items-center gap-2">
            Outdoor Run Mapper
            {profile.isPro && (
              <span className="text-[9px] font-black px-1.5 py-0.5 bg-gradient-to-r from-[#FC5200] to-amber-500 rounded text-white tracking-widest uppercase shadow-[0_0_8px_rgba(252,82,0,0.4)]">
                Pro Suite
              </span>
            )}
          </h2>
        </div>
        <button 
          onClick={onNavigateBack}
          className="text-[10px] font-extrabold uppercase tracking-widest text-[#c1ff72] hover:underline cursor-pointer"
        >
          Close GPS
        </button>
      </div>

      {/* Main GPS Live Tracking Console */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-[32px] overflow-hidden shadow-xl relative">
        {/* Unit & Map Style Panel Overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 select-none">
          {/* KM / Mile Toggle */}
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full p-0.5 flex gap-0.5">
            <button 
              onClick={() => setUnit('km')}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-wider transition-all cursor-pointer ${
                unit === 'km' ? "bg-[#FC5200] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              KMs
            </button>
            <button 
              onClick={() => setUnit('mile')}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-wider transition-all cursor-pointer ${
                unit === 'mile' ? "bg-[#FC5200] text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Miles
            </button>
          </div>

          {/* Map Layer Selectors */}
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full p-0.5 flex gap-0.5">
            <button 
              onClick={() => setActiveMapStyle('dark')}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full tracking-wider transition-all cursor-pointer ${
                activeMapStyle === 'dark' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Dark
            </button>
            
            {/* Satellite requires Pro lock */}
            <button 
              onClick={() => {
                if (profile.isPro) {
                  setActiveMapStyle('satellite');
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                activeMapStyle === 'satellite' ? "bg-[#FC5200] text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {!profile.isPro && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
              Satellite
            </button>

            {/* Terrain requires Pro lock */}
            <button 
              onClick={() => {
                if (profile.isPro) {
                  setActiveMapStyle('terrain');
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                activeMapStyle === 'terrain' ? "bg-[#FC5200] text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {!profile.isPro && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
              Terrain
            </button>
          </div>
        </div>

        {/* Dynamic Vector Map Canvas */}
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            onClick={handleMapClick}
            className={`w-full bg-[#0c0c0e] block transition-all ${isRunning ? 'cursor-crosshair' : 'cursor-default'}`}
          />
          {isRunning && (
            <div className="absolute bottom-2.5 right-3 bg-red-500/15 border border-red-500/25 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-red-400">GPS Live Recording</span>
            </div>
          )}
          
          {/* Map instructions */}
          {!isRunning && route.length === 0 && (
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center p-4 text-center select-none">
              <p className="text-xs text-zinc-300 font-semibold mb-1 leading-normal max-w-xs">
                To map your run, tap Play, and click on the Grid to plot custom streets!
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                Or enable geolocation inside settings
              </p>
            </div>
          )}
        </div>

        {/* Real-time stats dashboard panel */}
        <div className="bg-zinc-900 border-t border-zinc-850 p-6 grid grid-cols-2 gap-4">
          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850/60 flex flex-col justify-center">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Total Distance</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black text-[#FC5200] font-display leading-none">
                {distance}
              </span>
              <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">
                {unit}s
              </span>
            </div>
          </div>

          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850/60 flex flex-col justify-center">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Active Clock</span>
            <span className="text-3xl font-black text-white font-display leading-none mt-0.5">
              {formatTime(elapsedTime)}
            </span>
          </div>

          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850/60 flex flex-col justify-center">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Simulated Tempo Pace</span>
            <span className="text-sm font-black text-zinc-200 font-mono mt-1">
              {getPaceString()}
            </span>
          </div>

          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850/60 flex flex-col justify-center">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Est. Calorie Burn</span>
            <span className="text-sm font-black text-[#c1ff72] font-display mt-1">
              {Math.round(distance * (unit === 'km' ? 65 : 105))} kcal
            </span>
          </div>
        </div>

        {/* GPS Control bar buttons */}
        <div className="bg-zinc-950 border-t border-zinc-850 px-6 py-4 flex gap-3">
          {!isRunning ? (
            <button
              onClick={handleStartRun}
              className="flex-1 py-3 bg-[#FC5200] hover:bg-[#e44a00] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active-press cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white stroke-none" />
              {route.length > 0 ? "Resume Run" : "Record GPS Route"}
            </button>
          ) : (
            <button
              onClick={handlePauseRun}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active-press cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white stroke-none" />
              Pause Run
            </button>
          )}

          <button
            onClick={handleResetRun}
            disabled={route.length === 0}
            className="px-4 py-3 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl transition-all disabled:opacity-30 active-press cursor-pointer"
            title="Reset Grid"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share / Save Run form section with Custom Message/Caption */}
      {route.length > 0 && !isRunning && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-lg animate-fadeIn">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-display">Share & Post Completed Run</h3>
            <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
              Type a message or caption below to share this run activity with your community and log your fitness path.
            </p>
          </div>

          <div className="space-y-2">
            <input 
              type="text"
              value={runCaption}
              onChange={(e) => setRunCaption(e.target.value)}
              placeholder="e.g. Morning jog in the city park! Felt strong 🏃‍♂️🍃"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] outline-none text-xs rounded-xl px-4 py-3 placeholder:text-zinc-600 text-white font-medium transition-colors"
            />
          </div>

          <button
            onClick={handleSaveRun}
            className="w-full py-3 bg-[#FC5200] hover:bg-[#e44a00] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active-press cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Post to Activity Feed
          </button>
        </div>
      )}

      {/* Grid containing Cheering Milestone Live message log and Strava Pro Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Milestone voice feedback module */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col h-[210px]">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 mb-3">
            <Volume2 className="w-4 h-4 text-[#FC5200]" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-display">Live Audio Milestone Cheers</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
            {liveMessages.map((msg, idx) => (
              <div key={idx} className="bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black uppercase ${
                    msg.sender.includes("AI") ? "text-[#FC5200]" : "text-zinc-400"
                  }`}>
                    {msg.sender}
                  </span>
                  <span className="text-[8px] font-bold text-zinc-600 font-mono">{msg.time}</span>
                </div>
                <p className="text-[10px] text-zinc-300 leading-normal font-medium">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strava Premium Card teaser */}
        {!profile.isPro ? (
          <div className="bg-gradient-to-br from-zinc-900 to-[#FC5200]/10 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between h-[210px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Award className="w-32 h-32 text-white" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#FC5200] text-white rounded">
                  Paid Tier
                </span>
                <span className="text-xs font-black text-zinc-300 font-display">Strava-Pro Access</span>
              </div>
              <h4 className="text-base font-black text-white leading-tight font-display">
                Unlock Elite Map Styles & GPX File Exports
              </h4>
              <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                Sway satellite layouts, retrieve dynamic contour lines, and export GPS path logs directly.
              </p>
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="py-2.5 bg-[#FC5200] hover:bg-[#e44a00] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 active-press cursor-pointer shadow-lg"
            >
              <Sparkles className="w-3 h-3 fill-white stroke-none" />
              Upgrade to Pro for $9.99
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#FC5200]/10 to-emerald-500/5 border border-zinc-800/80 rounded-3xl p-5 flex flex-col justify-between h-[210px] relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-[#FC5200] font-display uppercase tracking-wider">
                  Pro Activated
                </span>
              </div>
              <h4 className="text-base font-black text-white font-display">
                Welcome to the Elite Club, {profile.fullName}!
              </h4>
              <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                Contour terrain lines, premium satellite layers, and detailed developer GPX tools are fully unlocked.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-zinc-950/60 border border-zinc-850 rounded-2xl">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-white">FitTrack Pro Badge</p>
                <p className="text-[9px] text-zinc-500">Premium active membership benefits applied.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Run Activities & Community Post Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-white uppercase tracking-widest font-display flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#FC5200]" /> Strava Activity Feed & Saved Run Log
        </h3>

        {runs.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center">
            <p className="text-xs text-zinc-500 font-medium">No run logs recorded yet. Let's record some outdoor GPS metrics!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <div key={run.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3.5 shadow-xs">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FC5200]/20 flex items-center justify-center text-[#FC5200] font-black text-xs font-display">
                      {profile.fullName.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white font-display flex items-center gap-1.5">
                        {profile.fullName}
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase">
                          {run.date}
                        </span>
                      </h4>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                        Mapped route at {run.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* GPX export button - locked if not Pro */}
                    <button
                      onClick={() => {
                        if (profile.isPro) {
                          alert(`GPX route file exported successfully for Run ID: ${run.id}`);
                        } else {
                          setShowUpgradeModal(true);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 text-[10px] font-black uppercase text-zinc-400 hover:text-white rounded-xl tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      title="GPX Export"
                    >
                      {!profile.isPro && <Lock className="w-2.5 h-2.5 text-zinc-600" />}
                      <Download className="w-3 h-3" />
                      GPX
                    </button>
                  </div>
                </div>

                {/* Custom Caption message shared */}
                <div className="bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-850/50">
                  <p className="text-xs text-zinc-300 font-medium italic leading-relaxed">
                    "{run.caption}"
                  </p>
                </div>

                {/* Performance stats row */}
                <div className="grid grid-cols-3 gap-2 text-center bg-zinc-950/30 p-3 rounded-2xl border border-zinc-850/40">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Distance</span>
                    <p className="text-sm font-black text-[#FC5200] font-display mt-0.5">
                      {run.distance} <span className="text-[9px] font-bold uppercase tracking-wider">{run.unit}s</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Duration</span>
                    <p className="text-sm font-black text-white font-mono mt-0.5">
                      {Math.floor(run.duration / 60)}m {run.duration % 60}s
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Avg Pace</span>
                    <p className="text-[11px] font-black text-zinc-300 font-mono mt-1">
                      {run.pace}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro Version Upgrade Checkout Modal Overlay */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-[36px] max-w-sm w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-[#FC5200]/10 flex items-center justify-center mx-auto mb-2 text-[#FC5200] shadow-[0_0_12px_rgba(252,82,0,0.2)]">
                <Sparkles className="w-6 h-6 fill-[#FC5200] stroke-none" />
              </div>
              <h3 className="text-base font-black tracking-tight text-white font-display">Upgrade to FitTrack Strava-Pro</h3>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#FC5200]">
                $9.99 One-Time Activation
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black mb-1">Premium Benefits Include:</p>
              
              {[
                "Advanced Satellite Hybrid Maps & Contours",
                "Full Offline Core fallback for Chat & Planners",
                "GPX High-Definition Run route files export",
                "AI Coach Live Audio milestone cheering soundboards",
                "Unlimited Diet variations & detailed workout routines"
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs text-zinc-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Simulated Checkout Form */}
            <div className="space-y-3 pt-2 border-t border-zinc-850">
              <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-black block">Simulated Payment Portal</span>
              
              <div className="space-y-2">
                <input 
                  type="text"
                  required
                  placeholder="Cardholder Full Name"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#FC5200] outline-none text-xs rounded-xl px-4 py-2.5 text-white font-medium placeholder:text-zinc-600"
                />
                <input 
                  type="text"
                  required
                  placeholder="Card Number: 4242 •••• •••• 4242"
                  value={checkoutCard}
                  onChange={(e) => setCheckoutCard(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#FC5200] outline-none text-xs rounded-xl px-4 py-2.5 text-white font-medium placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleUpgradeToPro}
                disabled={isUpgrading || !checkoutName || !checkoutCard}
                className="flex-1 py-3 bg-[#FC5200] hover:bg-[#e44a00] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer active-press"
              >
                {isUpgrading ? (
                  <>
                    <RotateCcw className="w-3 h-3 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  "Pay & Unlock"
                )}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active-press"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
