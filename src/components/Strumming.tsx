import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { StrummingPattern } from '../lib/supabase';

interface StrummingProps {
  pattern: StrummingPattern;
  isActive: boolean;
  currentBPM: number;
}

export function Strumming({ pattern, isActive, currentBPM }: StrummingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const strokes = pattern.pattern.split(' ').filter(s => s.length > 0);
  const beatDurationMs = (60 / currentBPM) * 1000;

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

    const interval = setInterval(() => {
      setCurrentBeat(prev => {
        const next = (prev + 1) % strokes.length;
        if (next === 0 && prev !== 0) {
          playBeat(next);
        } else {
          playBeat(next);
        }
        return next;
      });
    }, beatDurationMs);

    return () => clearInterval(interval);
  }, [isPlaying, audioContext, isActive, beatDurationMs, strokes.length]);

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
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          {strokes.map((stroke, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
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

        <div className="flex justify-center gap-3">
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
