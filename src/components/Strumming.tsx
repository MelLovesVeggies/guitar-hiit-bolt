import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { StrummingPattern } from '../lib/supabase';

interface StrummingProps {
  pattern: StrummingPattern;
  isActive: boolean;
  currentBPM: number;
  onBPMChange?: (bpm: number) => void;
  isCompact?: boolean;
}

export function Strumming({ pattern, isActive, currentBPM, onBPMChange, isCompact }: StrummingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRefCompact = useRef<HTMLDivElement>(null);
  const containerRefFull = useRef<HTMLDivElement>(null);
  const nextStepTimeRef = useRef(0);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  const strokes = pattern.pattern.split(' ').filter(s => s.length > 0);
  const stepLengthMs = (60 / currentBPM / 2) * 1000;

  useEffect(() => {
    if (!isActive) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);

    return () => {
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isPlaying || !audioContext || !isActive) return;

    const startTime = audioContext.currentTime;
    const stepDurationSeconds = stepLengthMs / 1000;
    let lastUpdatedStep = -1;

    const schedule = () => {
      const elapsed = audioContext.currentTime - startTime;
      const currentStepIndex = Math.floor(elapsed / stepDurationSeconds) % strokes.length;

      if (currentStepIndex !== lastUpdatedStep) {
        playBeat(currentStepIndex);
        lastUpdatedStep = currentStepIndex;
      }

      setCurrentBeat(currentStepIndex);
    };

    timerIdRef.current = setInterval(schedule, 25);

    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isPlaying, audioContext, isActive, stepLengthMs, strokes.length]);

  const playBeat = (beatIndex: number) => {
    if (!audioContext) return;

    const stroke = strokes[beatIndex];
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    if (stroke === 'D' || stroke === 'U') {
      osc.frequency.value = stroke === 'D' ? 400 : 600;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (stroke === 'X') {
      osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  };

  useEffect(() => {
    if (!playheadRef.current) return;

    const containerRef = isCompact ? containerRefCompact.current : containerRefFull.current;
    if (!containerRef) return;

    const buttons = containerRef.querySelectorAll('[data-stroke-index]');
    if (buttons.length === 0) return;

    const currentButton = buttons[currentBeat] as HTMLElement;
    if (!currentButton) return;

    const containerRect = containerRef.getBoundingClientRect();
    const buttonRect = currentButton.getBoundingClientRect();

    const playheadLeft = buttonRect.left - containerRect.left + buttonRect.width / 2;
    playheadRef.current.style.left = `${playheadLeft}px`;
  }, [currentBeat, strokes.length, isCompact]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  const getStrokeColor = (stroke: string, index: number) => {
    const isActive = index === currentBeat;
    if (stroke === 'D') return isActive ? 'bg-blue-500' : 'bg-blue-200';
    if (stroke === 'U') return isActive ? 'bg-green-500' : 'bg-green-200';
    if (stroke === 'X') return isActive ? 'bg-red-500' : 'bg-red-200';
    return 'bg-gray-200';
  };

  const getStrokeLabel = (stroke: string) => {
    if (stroke === 'D') return 'Down';
    if (stroke === 'U') return 'Up';
    if (stroke === 'X') return 'Mute';
    return stroke;
  };

  const handleIncreaseBPM = () => {
    const newBPM = Math.min(currentBPM + 5, pattern.bpm_range_max);
    onBPMChange?.(newBPM);
  };

  const handleDecreaseBPM = () => {
    const newBPM = Math.max(currentBPM - 5, pattern.bpm_range_min);
    onBPMChange?.(newBPM);
  };

  if (isCompact) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{pattern.name}</h3>

        <div className="mb-6 p-4 bg-white rounded-lg">
          <div className="relative mb-6">
            <div ref={containerRefCompact} className="flex justify-center gap-2 mb-4 flex-wrap relative">
              {strokes.map((stroke, index) => (
                <div key={index} className="flex flex-col items-center gap-1" data-stroke-index={index}>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white transition-all duration-75 text-sm ${getStrokeColor(
                      stroke,
                      index
                    )}`}
                  >
                    {getStrokeLabel(stroke)}
                  </div>
                </div>
              ))}
            </div>
            {isPlaying && (
              <div
                ref={playheadRef}
                className="absolute top-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-lg transition-all duration-75"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))',
                }}
              />
            )}
          </div>

          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            <button
              onClick={togglePlayback}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition text-sm ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleDecreaseBPM}
              disabled={currentBPM <= pattern.bpm_range_min}
              className="p-1 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded text-sm"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="text-center min-w-[60px]">
              <div className="text-xs text-gray-600">Tempo</div>
              <div className="text-xl font-bold text-[#8c52ff]">{currentBPM}</div>
            </div>
            <button
              onClick={handleIncreaseBPM}
              disabled={currentBPM >= pattern.bpm_range_max}
              className="p-1 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{pattern.name}</h3>
        <p className="text-gray-600 mb-3">{pattern.description}</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            {pattern.genre}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold capitalize">
            {pattern.difficulty}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            {pattern.time_signature}
          </span>
        </div>
      </div>

      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <div className="relative mb-6">
          <div ref={containerRefFull} className="flex justify-center gap-2 mb-4 flex-wrap relative">
            {strokes.map((stroke, index) => (
              <div key={index} className="flex flex-col items-center gap-2" data-stroke-index={index}>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white transition-all duration-75 ${getStrokeColor(
                    stroke,
                    index
                  )}`}
                >
                  {getStrokeLabel(stroke)}
                </div>
                <span className="text-xs text-gray-600">{index + 1}</span>
              </div>
            ))}
          </div>
          {isPlaying && (
            <div
              ref={playheadRef}
              className="absolute top-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-lg transition-all duration-75"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.9))',
              }}
            />
          )}
        </div>

        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={togglePlayback}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Play
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleDecreaseBPM}
            disabled={currentBPM <= pattern.bpm_range_min}
            className="p-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded-lg"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center min-w-[80px]">
            <div className="text-xs text-gray-600">Tempo</div>
            <div className="text-2xl font-bold text-[#8c52ff]">{currentBPM}</div>
          </div>
          <button
            onClick={handleIncreaseBPM}
            disabled={currentBPM >= pattern.bpm_range_max}
            className="p-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">BPM Range:</span>
          <span className="ml-2 font-semibold">
            {pattern.bpm_range_min} - {pattern.bpm_range_max}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Current BPM:</span>
          <span className="ml-2 font-semibold text-[#8c52ff]">{currentBPM}</span>
        </div>
      </div>
    </div>
  );
}
