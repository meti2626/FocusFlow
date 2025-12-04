import React, { useState, useEffect, useCallback } from 'react';
import { Timer, Pause, Play, RotateCcw, X, Settings2, Coffee, Zap } from 'lucide-react';
import { PomodoroStatus } from '../types';

export const Pomodoro: React.FC = () => {
  const [focusDuration, setFocusDuration] = useState(25); // Minutes
  const [breakDuration, setBreakDuration] = useState(5); // Minutes
  const [autoStartBreak, setAutoStartBreak] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [status, setStatus] = useState<PomodoroStatus>(PomodoroStatus.IDLE);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync timeLeft when settings change (only if IDLE)
  useEffect(() => {
    if (status === PomodoroStatus.IDLE) {
      if (mode === 'FOCUS') {
        setTimeLeft(focusDuration * 60);
      } else {
        setTimeLeft(breakDuration * 60);
      }
    }
  }, [focusDuration, breakDuration, status, mode]);

  useEffect(() => {
    let interval: number | undefined;

    if (status === PomodoroStatus.FOCUS || status === PomodoroStatus.BREAK) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (mode === 'FOCUS') {
                // Focus finished -> Switch to Break
                const nextMode = 'BREAK';
                const nextTime = breakDuration * 60;
                
                setMode(nextMode);
                
                if (autoStartBreak) {
                    setStatus(PomodoroStatus.BREAK);
                } else {
                    setStatus(PomodoroStatus.IDLE);
                }
                
                return nextTime;
            } else {
                // Break finished -> Switch to Focus and Stop
                setMode('FOCUS');
                setStatus(PomodoroStatus.IDLE);
                return focusDuration * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status, mode, focusDuration, breakDuration, autoStartBreak]);

  const toggleTimer = useCallback(() => {
    if (status === PomodoroStatus.IDLE) {
      setStatus(mode === 'FOCUS' ? PomodoroStatus.FOCUS : PomodoroStatus.BREAK);
    } else {
      setStatus(PomodoroStatus.IDLE);
    }
  }, [status, mode]);

  const resetTimer = useCallback(() => {
    setStatus(PomodoroStatus.IDLE);
    if (mode === 'FOCUS') {
        setTimeLeft(focusDuration * 60);
    } else {
        // Optional: If resetting during break, do we go back to focus or reset break?
        // Let's reset the current mode's timer.
        setTimeLeft(breakDuration * 60);
    }
  }, [mode, focusDuration, breakDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 180) setFocusDuration(val);
  };

  const handleBreakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 60) setBreakDuration(val);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border ${
            status !== PomodoroStatus.IDLE 
            ? 'bg-brand-600 text-white border-brand-500 shadow-brand-500/30' 
            : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
        }`}
        title="Open Pomodoro Timer"
      >
        <Timer className={status !== PomodoroStatus.IDLE ? 'animate-pulse' : ''} size={24} />
        {status !== PomodoroStatus.IDLE && (
             <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-800 shadow-2xl rounded-2xl p-5 border border-zinc-200 dark:border-zinc-700 w-80 animate-in fade-in slide-in-from-bottom-8 duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${mode === 'FOCUS' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
             {mode === 'FOCUS' ? <Zap size={16} /> : <Coffee size={16} />}
          </div>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
            {mode === 'FOCUS' ? 'Focus Session' : 'Break Time'}
          </span>
        </div>
        <button 
            onClick={() => setIsExpanded(false)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
        >
            <X size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center mb-6">
        <div className={`text-6xl font-mono font-bold tracking-tight mb-2 ${mode === 'FOCUS' ? 'text-zinc-800 dark:text-zinc-100' : 'text-green-600 dark:text-green-400'}`}>
            {formatTime(timeLeft)}
        </div>
        <p className={`text-xs font-medium tracking-wide uppercase ${status !== PomodoroStatus.IDLE ? 'text-brand-600 dark:text-brand-400 animate-pulse' : 'text-zinc-400'}`}>
            {status === PomodoroStatus.IDLE ? 'Ready' : 'Running'}
        </p>
      </div>

      {/* Settings Section - Only visible when IDLE */}
      {status === PomodoroStatus.IDLE && (
        <div className="space-y-3 mb-6 bg-zinc-50 dark:bg-zinc-700/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
           <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <Settings2 size={12} /> Focus (min)
              </label>
              <input 
                type="number" 
                min="1" 
                max="180"
                value={focusDuration} 
                onChange={handleFocusChange}
                className="w-12 bg-white dark:bg-zinc-800 text-center font-bold text-zinc-700 dark:text-zinc-200 text-sm rounded border border-zinc-200 dark:border-zinc-600 focus:border-brand-500 outline-none p-1"
              />
           </div>
           <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <Coffee size={12} /> Break (min)
              </label>
              <input 
                type="number" 
                min="1" 
                max="60"
                value={breakDuration} 
                onChange={handleBreakChange}
                className="w-12 bg-white dark:bg-zinc-800 text-center font-bold text-zinc-700 dark:text-zinc-200 text-sm rounded border border-zinc-200 dark:border-zinc-600 focus:border-brand-500 outline-none p-1"
              />
           </div>
           <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700/50">
              <label className="text-xs font-medium text-zinc-500">Auto-start Break</label>
              <button 
                onClick={() => setAutoStartBreak(!autoStartBreak)}
                className={`w-8 h-4 rounded-full relative transition-colors ${autoStartBreak ? 'bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoStartBreak ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
           </div>
        </div>
      )}

      <div className="flex justify-center gap-3">
        <button
          onClick={toggleTimer}
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${
              status === PomodoroStatus.IDLE 
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 active:scale-95' 
              : 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 active:scale-95'
          }`}
        >
          {status === PomodoroStatus.IDLE ? (
             <>
               <Play size={16} fill="currentColor" /> START
             </>
          ) : (
             <>
               <Pause size={16} fill="currentColor" /> PAUSE
             </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="p-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-500 dark:text-zinc-400 transition-colors active:scale-95"
          title="Reset Timer"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};