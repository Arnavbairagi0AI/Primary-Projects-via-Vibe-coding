import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Play, Pause, Volume2, Info, Headphones, Music4 } from 'lucide-react';
import { UserProfile } from '../types';

interface PremiumSoundscapePlayerProps {
  userProfile: UserProfile;
  onUpgradePrompt?: () => void;
}

type SoundType = 'off' | 'binaural' | 'rain' | 'ocean' | 'zen';

export default function PremiumSoundscapePlayer({
  userProfile,
  onUpgradePrompt
}: PremiumSoundscapePlayerProps) {
  const isPremium = userProfile.currentPlan === 'premium';
  const [activeSound, setActiveSound] = useState<SoundType>('off');
  const [volume, setVolume] = useState<number>(0.5);

  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Node references for cleanup
  const sourcesRef = useRef<{ [key: string]: any }>({});
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Audio Context on demand
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioCtxRef.current.destination);
        gainNodeRef.current = gainNode;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Adjust volume dynamically
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(e => console.warn(e));
      }
    };
  }, []);

  const stopAllSounds = () => {
    // Stop and disconnect all active audio nodes
    Object.keys(sourcesRef.current).forEach((key) => {
      try {
        sourcesRef.current[key].stop();
      } catch (e) {}
      try {
        sourcesRef.current[key].disconnect();
      } catch (e) {}
    });
    sourcesRef.current = {};
  };

  const playBinaural = (ctx: AudioContext, destination: AudioNode) => {
    // Deep focus Binaural beats (Left: 100Hz, Right: 104Hz -> 4Hz Gamma wave)
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    
    oscLeft.type = 'sine';
    oscLeft.frequency.value = 100;

    oscRight.type = 'sine';
    oscRight.frequency.value = 104;

    const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (pannerLeft && pannerRight) {
      pannerLeft.pan.value = -1;
      pannerRight.pan.value = 1;

      oscLeft.connect(pannerLeft);
      pannerLeft.connect(destination);

      oscRight.connect(pannerRight);
      pannerRight.connect(destination);
    } else {
      oscLeft.connect(destination);
      oscRight.connect(destination);
    }

    oscLeft.start();
    oscRight.start();

    sourcesRef.current['oscLeft'] = oscLeft;
    sourcesRef.current['oscRight'] = oscRight;
  };

  const playRain = (ctx: AudioContext, destination: AudioNode) => {
    // Rain noise using generated white noise + filter
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate rain (lowering highs, bandpass for pitter patter)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    whiteNoise.connect(filter);
    filter.connect(destination);
    whiteNoise.start();

    sourcesRef.current['rain'] = whiteNoise;
  };

  const playOcean = (ctx: AudioContext, destination: AudioNode) => {
    // Ocean waves using filtered noise modulated by a very slow LFO
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 1.5;

    // LFO to modulate wave intensity
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15; // Slow wave cycles (every ~6-7 seconds)
    
    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.5;

    // Connect LFO to modulate filter frequency or gain
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(destination);

    lfo.start();
    source.start();

    sourcesRef.current['oceanSource'] = source;
    sourcesRef.current['oceanLfo'] = lfo;
  };

  const playZen = (ctx: AudioContext, destination: AudioNode) => {
    // Gentle relaxing zen hum with two warm harmonizing low oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    osc1.type = 'triangle';
    osc1.frequency.value = 110; // A2 hum

    osc2.type = 'sine';
    osc2.frequency.value = 165; // E3 fifth harmonic

    osc3.type = 'sine';
    osc3.frequency.value = 220; // A3 octave

    // Filter to keep it super warm and cozy
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 350;

    // LFO to gently swirl the sound
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.25;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    
    const swirler = ctx.createGain();
    swirler.gain.value = 0.6;

    lfo.connect(lfoGain);
    lfoGain.connect(swirler.gain);

    osc1.connect(lowpass);
    osc2.connect(lowpass);
    osc3.connect(lowpass);

    lowpass.connect(swirler);
    swirler.connect(destination);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    sourcesRef.current['zen1'] = osc1;
    sourcesRef.current['zen2'] = osc2;
    sourcesRef.current['zen3'] = osc3;
    sourcesRef.current['zenLfo'] = lfo;
  };

  const handleSelectSound = (sound: SoundType) => {
    if (!isPremium) {
      if (onUpgradePrompt) {
        onUpgradePrompt();
      }
      return;
    }

    try {
      initAudio();
      stopAllSounds();

      if (sound === 'off') {
        setActiveSound('off');
        return;
      }

      const ctx = audioCtxRef.current;
      const dest = gainNodeRef.current;

      if (ctx && dest) {
        if (sound === 'binaural') playBinaural(ctx, dest);
        else if (sound === 'rain') playRain(ctx, dest);
        else if (sound === 'ocean') playOcean(ctx, dest);
        else if (sound === 'zen') playZen(ctx, dest);

        setActiveSound(sound);
      }
    } catch (err) {
      console.error("Error generating web soundscape:", err);
    }
  };

  return (
    <div className="study-card bg-white p-5 space-y-4 border border-black/5 relative overflow-hidden">
      {/* Premium accent ring */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#D4A373]/10 to-[#5A5A40]/10 rounded-full blur-xl -z-10"></div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#5A5A40]/10 text-[#5A5A40]">
            <Music4 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-stone-800 uppercase tracking-wider">Focus Soundscape</span>
              {!isPremium && (
                <span className="text-[8px] bg-[#D4A373]/20 text-[#8b5e3c] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest scale-90">Premium</span>
              )}
            </div>
            <p className="text-[9px] text-stone-400 font-medium">Synthesized real-time focus soundscapes</p>
          </div>
        </div>

        {activeSound !== 'off' && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-3.5 bg-[#5A5A40] rounded-full animate-[pulse_0.8s_infinite]"></span>
            <span className="w-1.5 h-5 bg-[#D4A373] rounded-full animate-[pulse_0.6s_infinite] delay-100"></span>
            <span className="w-1.5 h-2 bg-[#5A5A40] rounded-full animate-[pulse_1s_infinite] delay-200"></span>
          </div>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'binaural', label: '🎧 4Hz Binaural', desc: 'Deep focus waves' },
          { id: 'rain', label: '🌧 Cozy Rain', desc: 'Soothes cognitive noise' },
          { id: 'ocean', label: '🌊 Ocean Tide', desc: 'Calming regular surge' },
          { id: 'zen', label: '🧘 Ambient Zen', desc: 'Temple hum drone' }
        ].map((sound) => {
          const isActive = activeSound === sound.id;
          return (
            <button
              key={sound.id}
              onClick={() => handleSelectSound(sound.id as SoundType)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#5A5A40] text-white border-transparent shadow-sm' 
                  : 'bg-[#FDFBF7] hover:bg-[#F5F5F0] border-black/5 text-stone-600'
              }`}
            >
              <p className="text-[11px] font-black">{sound.label}</p>
              <p className={`text-[8.5px] mt-0.5 font-medium ${isActive ? 'text-stone-200' : 'text-stone-400'}`}>{sound.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Volume slider and Mute button */}
      {isPremium && activeSound !== 'off' && (
        <div className="pt-3 border-t border-stone-100 flex items-center gap-3 animate-fadeIn">
          <button 
            onClick={() => handleSelectSound('off')}
            className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 text-[10px] font-black uppercase tracking-wider"
          >
            ⏹ Stop Audio
          </button>
          <div className="flex-grow flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
            />
          </div>
        </div>
      )}

      {/* Non-premium Call to Action */}
      {!isPremium && (
        <div className="p-2.5 bg-[#D4A373]/5 border border-[#D4A373]/15 rounded-xl text-left">
          <p className="text-[9px] text-[#8b5e3c] leading-relaxed font-bold">
            💡 Sound synthesis is a premium feature. Elevate to Premium to play uninterrupted ambient focus tracks!
          </p>
        </div>
      )}
    </div>
  );
}
