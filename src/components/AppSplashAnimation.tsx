import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface AppSplashAnimationProps {
  onComplete?: () => void;
  durationMs?: number;
}

export const AppSplashAnimation: React.FC<AppSplashAnimationProps> = ({
  onComplete,
  durationMs = 2300
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState('Initializing Laboratory Operating System...');

  useEffect(() => {
    // Check if splash was already shown in this browser session
    const hasSeen = sessionStorage.getItem('ilms_splash_seen_session');
    if (hasSeen === 'true') {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    // Step-by-step loading progression
    const timer1 = setTimeout(() => {
      setProgress(42);
      setStatusText('Mounting Universal Inventory & Equipment Ledger...');
    }, 550);

    const timer2 = setTimeout(() => {
      setProgress(78);
      setStatusText('Synchronizing Multi-Laboratory Security Passports...');
    }, 1200);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('ILMS Lab OS Online • Ready');
    }, 1850);

    const timerFade = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 450);

    const timerEnd = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('ilms_splash_seen_session', 'true');
      onComplete?.();
    }, durationMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerFade);
      clearTimeout(timerEnd);
    };
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('ilms_splash_seen_session', 'true');
      onComplete?.();
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none transition-all duration-500 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1e1333 0%, #0c0817 60%, #06040d 100%)'
      }}
    >
      {/* Background Animated Ambient Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-purple-600/30 via-[#8961D8]/20 to-cyan-400/20 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-[#BCA0F5]/25 rounded-full blur-[70px] animate-spin" style={{ animationDuration: '14s' }} />
        
        {/* Decorative Grid Mesh */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(188, 160, 245, 0.4) 1px, transparent 0)`,
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      {/* Centerpiece Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md">
        
        {/* Animated App Logo Wrapper */}
        <div className="relative group mb-6">
          {/* Outer Pulsing Aura */}
          <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-r from-purple-500 via-[#8961D8] to-pink-500 opacity-40 blur-xl animate-pulse" />

          {/* Luminous Orbital Particle Ring */}
          <div 
            className="absolute -inset-6 rounded-full border border-purple-400/30 border-t-purple-300 border-r-pink-400 pointer-events-none animate-spin"
            style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}
          />

          {/* Secondary Reverse Orbital Ring with Glow Dot */}
          <div 
            className="absolute -inset-9 rounded-full border border-dashed border-cyan-400/20 pointer-events-none animate-spin"
            style={{ animationDuration: '8s', animationDirection: 'reverse' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#38bdf8] absolute top-1 left-1/2" />
          </div>

          {/* Main App Logo Card with 3D Float and Shimmer */}
          <div 
            className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-[36px] bg-gradient-to-br from-white/95 via-purple-50/90 to-purple-100/80 p-2.5 shadow-[0_20px_50px_rgba(137,97,216,0.35)] border border-white/60 backdrop-blur-md overflow-hidden transform transition-transform duration-700 hover:scale-105"
            style={{
              animation: 'ilms-float 3s ease-in-out infinite'
            }}
          >
            {/* Logo Image */}
            <img
              src="/logo.png"
              alt="ILMS App Logo"
              className="w-full h-full object-contain drop-shadow-md rounded-[28px]"
            />

            {/* Diagonal Light Shimmer Sweep */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full pointer-events-none"
              style={{
                animation: 'ilms-shimmer 2.5s infinite ease-in-out'
              }}
            />
          </div>

          {/* Sparkle Twinkles */}
          <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-3 -right-3 animate-bounce shadow-sm drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
          <Sparkles className="w-4 h-4 text-purple-300 absolute -bottom-2 -left-2 animate-pulse" />
        </div>

        {/* Brand Title with Glowing Gradient */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="font-heading font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 tracking-wider drop-shadow-md">
              ILMS
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/40 text-[10px] font-mono font-extrabold uppercase tracking-widest text-purple-200">
              Lab OS
            </span>
          </div>
          <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.25em] text-purple-300/80 font-bold">
            Inventory & Lab Management System
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-64 sm:w-72 space-y-2">
          {/* Progress Bar Track */}
          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-purple-500/30 backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-[#18BDF5] via-[#BCA0F5] to-[#8961D8] rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_#8961D8]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status Label */}
          <div className="flex items-center justify-between text-[11px] text-purple-200/90 font-medium">
            <span className="truncate pr-2 font-mono text-[10px]">
              {statusText}
            </span>
            <span className="font-mono font-bold text-[#18BDF5] text-[10px] shrink-0">
              {progress}%
            </span>
          </div>
        </div>

        {/* Discreet Skip Prompt */}
        <p className="mt-8 text-[11px] text-purple-400/50 hover:text-purple-300 transition-colors font-medium">
          Click anywhere to enter immediately →
        </p>

      </div>

      {/* Embedded Animation Styles */}
      <style>{`
        @keyframes ilms-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1deg);
          }
        }
        @keyframes ilms-shimmer {
          0% {
            transform: translateX(-150%) skewX(-20deg);
          }
          50%, 100% {
            transform: translateX(150%) skewX(-20deg);
          }
        }
      `}</style>
    </div>
  );
};
