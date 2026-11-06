import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Volume2, VolumeX, ShieldCheck, Cpu, Zap, RefreshCw } from 'lucide-react';

interface AppSplashAnimationProps {
  onComplete?: () => void;
  durationMs?: number;
}

// Global helper to trigger the splash animation whenever a user enters the app
export const triggerAppSplash = (mode: 'launch' | 'welcome-back' = 'launch') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ilms:trigger-splash', { detail: { mode } }));
  }
};

// High-tech synthesized Web Audio engine (Previous Sound Engine preserved)
class LabSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public hasPlayedIntro: boolean = false;

  public getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  playPopIn() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      this.hasPlayedIntro = true;

      // Sub-bass resonant impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.38);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Sci-fi high-energy power up whoosh
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.type = 'triangle';
      sweep.frequency.setValueAtTime(280, now + 0.04);
      sweep.frequency.exponentialRampToValueAtTime(840, now + 0.32);
      sweepGain.gain.setValueAtTime(0.12, now + 0.04);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      sweep.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweep.start(now + 0.04);
      sweep.stop(now + 0.35);
    } catch {
      // Audio autoplay restrictions silently caught
    }
  }

  playTick(frequency = 660) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  playSuccessChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Futuristic major triad arpeggio (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.12, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.6);
      });
    } catch {}
  }

  // Combined one-shot signature: Pop-in whoosh followed seamlessly by success chime
  playOneShot() {
    this.playPopIn();
    setTimeout(() => {
      this.playSuccessChime();
    }, 360);
  }
}

const soundEngine = new LabSoundEngine();

// Ambient laboratory micro-bubbles
interface BubbleParticle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

const INITIAL_BUBBLES: BubbleParticle[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: Math.random() * 92 + 4,
  size: Math.random() * 12 + 6,
  duration: Math.random() * 2.5 + 2,
  delay: Math.random() * 1.5,
}));

// Thresholds for detecting returning user:
// 45 seconds of tab hiding or 3 minutes of inactive time
const AWAY_THRESHOLD_MS = 45 * 1000;

export const AppSplashAnimation: React.FC<AppSplashAnimationProps> = ({
  onComplete,
  durationMs = 2750,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [splashMode, setSplashMode] = useState<'launch' | 'welcome-back'>('launch');
  const [progress, setProgress] = useState(16);
  const [statusText, setStatusText] = useState('Initializing Laboratory Operating System...');
  const [activeStage, setActiveStage] = useState(0);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastActiveRef = useRef<number>(Date.now());

  // Clear running timers
  const clearAllTimers = useCallback(() => {
    activeTimersRef.current.forEach((t) => clearTimeout(t));
    activeTimersRef.current = [];
  }, []);

  // Execution timeline for the opening animation
  const runAnimationSequence = useCallback(
    (mode: 'launch' | 'welcome-back' = 'launch') => {
      clearAllTimers();
      setSplashMode(mode);
      setIsVisible(true);
      setIsFadingOut(false);
      setProgress(18);
      setActiveStage(0);

      const isWelcomeBack = mode === 'welcome-back';
      setStatusText(
        isWelcomeBack
          ? 'Welcome Back • Resuming Laboratory Session...'
          : 'Initializing Laboratory Operating System...'
      );

      // Play the previous sound in one unified shot
      soundEngine.playOneShot();

      // Stage 1: Visual Ledger check (520ms)
      const t1 = setTimeout(() => {
        setProgress(48);
        setActiveStage(1);
        setStatusText(
          isWelcomeBack
            ? 'Restoring Encrypted Active State & Ledger...'
            : 'Mounting Universal Inventory & Equipment Ledger...'
        );
      }, 520);

      // Stage 2: Visual Security check (1100ms)
      const t2 = setTimeout(() => {
        setProgress(82);
        setActiveStage(2);
        setStatusText(
          isWelcomeBack
            ? 'Revalidating Multi-Laboratory Security Passports...'
            : 'Synchronizing Multi-Laboratory Security Passports...'
        );
      }, 1100);

      // Stage 3: Visual Ready state (1750ms)
      const t3 = setTimeout(() => {
        setProgress(100);
        setActiveStage(3);
        setStatusText(
          isWelcomeBack
            ? 'ILMS Lab OS Session Restored • Ready'
            : 'ILMS Lab OS Online • Ready'
        );
      }, 1750);

      // Stage 4: Silky-smooth staged dissolve (starts 750ms before unmount)
      const tFade = setTimeout(() => {
        setIsFadingOut(true);
      }, durationMs - 750);

      // Stage 5: Unmount cleanly AFTER the 750ms CSS transition finishes
      const tEnd = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, durationMs + 20);

      activeTimersRef.current = [t1, t2, t3, tFade, tEnd];
    },
    [clearAllTimers, durationMs, onComplete]
  );

  // Monitor user activity and detect "returning to the app"
  useEffect(() => {
    // Initial check on page load: check how long since last recorded session
    const lastStored = localStorage.getItem('ilms_last_active_time');
    const now = Date.now();
    lastActiveRef.current = now;
    localStorage.setItem('ilms_last_active_time', now.toString());

    if (lastStored) {
      const diff = now - Number(lastStored);
      if (diff > AWAY_THRESHOLD_MS) {
        runAnimationSequence('welcome-back');
      } else {
        runAnimationSequence('launch');
      }
    } else {
      runAnimationSequence('launch');
    }

    // Update last-active timestamp when user interacts
    const markActive = () => {
      const current = Date.now();
      if (current - lastActiveRef.current > 10000) {
        lastActiveRef.current = current;
        localStorage.setItem('ilms_last_active_time', current.toString());
      }
    };

    window.addEventListener('mousemove', markActive, { passive: true });
    window.addEventListener('keydown', markActive, { passive: true });
    window.addEventListener('touchstart', markActive, { passive: true });

    // Track when user leaves the tab vs returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeHidden = Date.now();
        localStorage.setItem('ilms_tab_left_time', timeHidden.toString());
        localStorage.setItem('ilms_last_active_time', timeHidden.toString());
      } else if (document.visibilityState === 'visible') {
        const nowReturn = Date.now();
        const leftTime = Number(localStorage.getItem('ilms_tab_left_time') || lastActiveRef.current);
        const timeAway = nowReturn - leftTime;

        if (timeAway >= AWAY_THRESHOLD_MS) {
          localStorage.setItem('ilms_last_active_time', nowReturn.toString());
          runAnimationSequence('welcome-back');
        }
      }
    };

    const handleWindowFocus = () => {
      const nowFocus = Date.now();
      const last = Number(localStorage.getItem('ilms_last_active_time') || lastActiveRef.current);
      if (nowFocus - last >= AWAY_THRESHOLD_MS) {
        localStorage.setItem('ilms_last_active_time', nowFocus.toString());
        runAnimationSequence('welcome-back');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // Browser audio unlock on ANY early user interaction
    const unlockAudio = () => {
      soundEngine.getContext();
      if (!soundEngine.hasPlayedIntro) {
        soundEngine.playOneShot();
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // Custom programmatic trigger
    const handleExternalTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: 'launch' | 'welcome-back' }>;
      const mode = customEvent.detail?.mode || 'launch';
      runAnimationSequence(mode);
    };

    window.addEventListener('ilms:trigger-splash', handleExternalTrigger);

    return () => {
      clearAllTimers();
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('touchstart', markActive);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('ilms:trigger-splash', handleExternalTrigger);
    };
  }, [runAnimationSequence, clearAllTimers]);

  // Dynamic 3D interactive tilt following pointer
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -(y * 18),
      y: x * 18,
    });
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    soundEngine.enabled = !next;
    if (!next) {
      soundEngine.playOneShot();
    }
  };

  // Buttery-smooth exit on skip (650ms fluid ease-out)
  const handleSkip = () => {
    clearAllTimers();
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 650);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleSkip}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFadingOut
          ? 'opacity-0 backdrop-blur-none pointer-events-none'
          : 'opacity-100 backdrop-blur-md'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 38%, #20133a 0%, #0d071a 55%, #05030b 100%)',
        willChange: 'opacity, backdrop-filter',
      }}
    >
      {/* Sound Mute / Unmute Floating Toggle */}
      <div
        className={`absolute top-5 right-5 z-20 transition-opacity duration-500 ease-out ${
          isFadingOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={handleToggleSound}
          aria-label={isSoundMuted ? 'Unmute intro sounds' : 'Mute intro sounds'}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-purple-200 hover:text-white backdrop-blur-md transition-all shadow-lg hover:scale-110 active:scale-95 flex items-center space-x-1.5"
        >
          {isSoundMuted ? (
            <VolumeX className="w-4 h-4 text-purple-400" />
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="hidden sm:inline text-[10px] font-mono font-bold tracking-wider uppercase text-purple-200">
                Audio
              </span>
            </>
          )}
        </button>
      </div>

      {/* Cybernetic Ambient Grid & Radar Sweep */}
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ease-out ${
          isFadingOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Animated Glow Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-gradient-to-tr from-purple-600/35 via-[#8961D8]/25 to-cyan-400/25 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[#BCA0F5]/20 rounded-full blur-[80px] animate-spin"
          style={{ animationDuration: '16s' }}
        />

        {/* High-Tech Grid Mesh */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(188, 160, 245, 0.45) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Laboratory Flask Bubble Emitters */}
        {INITIAL_BUBBLES.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full pointer-events-none bg-gradient-to-t from-purple-400/40 via-cyan-300/30 to-white/60 border border-white/40 backdrop-blur-xs"
            style={{
              left: `${b.left}%`,
              bottom: '-20px',
              width: `${b.size}px`,
              height: `${b.size}px`,
              animation: `ilms-bubble-rise ${b.duration}s infinite linear`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}

        {/* Explosive Shockwave Pulse Ring on Entrance */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-purple-400/60 pointer-events-none ilms-shockwave-ring" />
      </div>

      {/* Centerpiece Container with 3D Perspective & Fluid Staged Dissolve */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isFadingOut
            ? 'opacity-0 scale-105 -translate-y-3 filter blur-[6px]'
            : 'opacity-100 scale-100 translate-y-0 filter blur-0'
        }`}
        style={{
          perspective: '1000px',
          willChange: 'transform, opacity, filter',
        }}
      >
        {/* Animated App Logo Wrapper with INSTANT Burst & Float */}
        <div
          className="relative group mb-6 ilms-pop-in-box"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Outer Pulsing Neon Aura */}
          <div className="absolute -inset-5 rounded-[44px] bg-gradient-to-r from-purple-500 via-[#8961D8] to-cyan-400 opacity-60 blur-2xl animate-pulse" />

          {/* Luminous Orbital Particle Ring (Clockwise) */}
          <div
            className="absolute -inset-7 rounded-full border-2 border-dashed border-purple-400/40 border-t-cyan-300 border-r-pink-400 pointer-events-none animate-spin"
            style={{ animationDuration: '4.5s', animationTimingFunction: 'linear' }}
          >
            <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_14px_#38bdf8] absolute top-1 left-1/2 -translate-x-1/2" />
          </div>

          {/* Secondary Reverse Orbital Ring (Counter-Clockwise) */}
          <div
            className="absolute -inset-10 rounded-full border border-purple-300/25 border-b-cyan-400/50 pointer-events-none animate-spin"
            style={{ animationDuration: '8.5s', animationDirection: 'reverse' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_12px_#f472b6] absolute bottom-1 right-1/4" />
          </div>

          {/* Main App Logo Card with 3D Float, Shimmer & Laser Scan */}
          <div
            className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-[38px] bg-gradient-to-br from-white/95 via-purple-50/90 to-purple-100/80 p-2.5 shadow-[0_25px_60px_rgba(137,97,216,0.45)] border-2 border-white/80 backdrop-blur-md overflow-hidden transform transition-all duration-300 hover:scale-105"
            style={{
              animation: 'ilms-float 3s ease-in-out infinite',
            }}
          >
            {/* Logo Image — Preloaded for Immediate Display */}
            <img
              src="/app-logo-v2.png"
              alt="ILMS App Logo"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-contain drop-shadow-lg rounded-[30px]"
            />

            {/* Diagonal Light Shimmer Sweep */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full pointer-events-none"
              style={{
                animation: 'ilms-shimmer 2.2s infinite ease-in-out',
              }}
            />

            {/* High-Tech Cyan Scanline Laser */}
            <div
              className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] pointer-events-none"
              style={{
                animation: 'ilms-laser-scan 2.6s infinite ease-in-out',
              }}
            />
          </div>

          {/* Sparkle Twinkles */}
          <Sparkles className="w-7 h-7 text-yellow-300 absolute -top-4 -right-4 animate-bounce shadow-sm drop-shadow-[0_0_12px_rgba(253,224,71,0.95)]" />
          <Sparkles className="w-5 h-5 text-cyan-300 absolute -bottom-3 -left-3 animate-pulse drop-shadow-[0_0_10px_rgba(56,189,248,0.85)]" />
        </div>

        {/* Brand Title with Glowing Gradient */}
        <div className="space-y-1 mb-5">
          <div className="flex items-center justify-center space-x-2">
            <span className="font-heading font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 tracking-wider drop-shadow-md">
              ILMS
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/50 text-[10px] font-mono font-extrabold uppercase tracking-widest text-cyan-200 shadow-[0_0_10px_rgba(137,97,216,0.3)]">
              {splashMode === 'welcome-back' ? 'Welcome Back' : 'Lab OS'}
            </span>
          </div>
          <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.25em] text-purple-300/80 font-bold">
            {splashMode === 'welcome-back'
              ? 'Multi-Lab Session Reconnected'
              : 'Inventory & Lab Management System'}
          </p>
        </div>

        {/* Dynamic Telemetry Status Badges & Progress Bar with Graceful Sub-Fade */}
        <div
          className={`w-full flex flex-col items-center transition-all duration-500 ease-out ${
            isFadingOut ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Dynamic Telemetry Status Badges */}
          <div className="flex items-center justify-center gap-1.5 mb-4 text-[10px] font-mono">
            <span
              className={`px-2 py-0.5 rounded-md border flex items-center space-x-1 transition-all ${
                activeStage >= 1
                  ? 'bg-purple-900/60 border-purple-400/50 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900/40 border-slate-700/50 text-slate-500'
              }`}
            >
              {splashMode === 'welcome-back' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}
              <span>{splashMode === 'welcome-back' ? 'SESSION: RESTORED' : 'LEDGER: OK'}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border flex items-center space-x-1 transition-all ${
                activeStage >= 2
                  ? 'bg-cyan-900/60 border-cyan-400/50 text-cyan-200 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                  : 'bg-slate-900/40 border-slate-700/50 text-slate-500'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>PASSPORT: SECURE</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border flex items-center space-x-1 transition-all ${
                activeStage >= 3
                  ? 'bg-emerald-900/60 border-emerald-400/50 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900/40 border-slate-700/50 text-slate-500'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>ONLINE</span>
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-64 sm:w-72 space-y-2">
            {/* Progress Bar Track */}
            <div className="h-2 w-full bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-purple-500/40 backdrop-blur-sm shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#18BDF5] via-[#BCA0F5] to-[#8961D8] rounded-full transition-all duration-300 ease-out shadow-[0_0_14px_#8961D8]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status Label with Pulsing Lab Activity Dot */}
            <div className="flex items-center justify-between text-[11px] text-purple-200/90 font-medium">
              <span className="truncate pr-2 font-mono text-[10px] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span>{statusText}</span>
              </span>
              <span className="font-mono font-bold text-cyan-300 text-[10px] shrink-0">
                {progress}%
              </span>
            </div>
          </div>

          {/* Skip Prompt */}
          <p className="mt-7 text-[11px] text-purple-400/60 hover:text-purple-200 transition-colors font-medium flex items-center justify-center space-x-1">
            <span>Click anywhere to resume</span>
            <span className="text-cyan-300">→</span>
          </p>
        </div>
      </div>

      {/* Embedded Animation Styles */}
      <style>{`
        /* Instant Burst Pop-In with zero initial delay */
        .ilms-pop-in-box {
          animation: ilms-instant-pop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes ilms-instant-pop {
          0% {
            transform: scale(0.8) translateY(12px);
            opacity: 0.95;
            filter: blur(4px);
          }
          65% {
            transform: scale(1.08) translateY(-4px);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: scale(1) translateY(0px);
            opacity: 1;
            filter: blur(0px);
          }
        }

        /* Shockwave expanding ring */
        .ilms-shockwave-ring {
          animation: ilms-shockwave-anim 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }

        @keyframes ilms-shockwave-anim {
          0% {
            width: 40px;
            height: 40px;
            opacity: 1;
            box-shadow: 0 0 35px #8961D8;
          }
          100% {
            width: 580px;
            height: 580px;
            opacity: 0;
            box-shadow: 0 0 70px #38bdf8;
          }
        }

        /* 3D Float Breathing Animation */
        @keyframes ilms-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-9px) rotate(1deg);
          }
        }

        /* Diagonal Light Shimmer Sweep */
        @keyframes ilms-shimmer {
          0% {
            transform: translateX(-160%) skewX(-20deg);
          }
          50%, 100% {
            transform: translateX(160%) skewX(-20deg);
          }
        }

        /* Laser Scanline Sweep */
        @keyframes ilms-laser-scan {
          0% {
            top: 0%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        /* Floating Laboratory Bubbles */
        @keyframes ilms-bubble-rise {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          80% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-110vh) scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
