import { useEffect, useState } from 'react';
import { Play, RotateCcw, Mic, MicOff, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useTrainingStore } from '../store/useTrainingStore';
import { useHIITTimer } from '../hooks/useHIITTimer';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { ProgressRing } from '../components/ProgressRing';
import { StrummingPatternSelector } from '../components/StrummingPatternSelector';
import { supabase, Exercise } from '../lib/supabase';
import { calculateRepetitions, calculatePrecision, calculateTimingWindow } from '../lib/calculations';

interface TrainingProps {
  exercise: Exercise;
  onBack: () => void;
}

export function Training({ exercise, onBack }: TrainingProps) {
  const {
    currentBPM,
    setCurrentBPM,
    targetTimeSeconds,
    setTargetTimeSeconds,
    totalRepetitions,
    completedRepetitions,
    isTraining,
    audioCoachEnabled,
    setAudioCoachEnabled,
    setTotalRepetitions,
    resetSession,
  } = useTrainingStore();

  const [detectedHits, setDetectedHits] = useState<number[]>([]);
  const [showBPMModal, setShowBPMModal] = useState(false);
  const [sessionPrecision, setSessionPrecision] = useState<number | null>(null);

  const { expectedBeatTimes, start, stop } = useHIITTimer({
    onRepetitionComplete: (rep) => {
      console.log(`Repetition ${rep} completed`);
    },
    onSessionComplete: async () => {
      await handleSessionComplete();
    },
  });

  const { isActive: audioActive, activate: activateAudio, deactivate: deactivateAudio, error: audioError } = useAudioAnalyzer({
    latencyOffsetMs: 0,
    onOnsetDetected: (timestamp) => {
      if (audioCoachEnabled && isTraining) {
        setDetectedHits(prev => [...prev, timestamp]);
      }
    },
  });

  useEffect(() => {
    setCurrentBPM(exercise.bpm_min);
    const reps = calculateRepetitions(targetTimeSeconds, exercise.bpm_min);
    setTotalRepetitions(reps);

    return () => {
      resetSession();
      if (audioActive) {
        deactivateAudio();
      }
    };
  }, [exercise]);

  useEffect(() => {
    const reps = calculateRepetitions(targetTimeSeconds, currentBPM);
    setTotalRepetitions(reps);
  }, [currentBPM, targetTimeSeconds]);

  const handleToggleAudioCoach = async () => {
    if (!audioCoachEnabled) {
      const success = await activateAudio();
      if (success) {
        setAudioCoachEnabled(true);
      }
    } else {
      deactivateAudio();
      setAudioCoachEnabled(false);
    }
  };

  const handleStart = () => {
    setDetectedHits([]);
    setSessionPrecision(null);
    start();
  };

  const handleStop = () => {
    stop();
  };

  const handleSessionComplete = async () => {
    if (audioCoachEnabled && detectedHits.length > 0) {
      const windowMs = calculateTimingWindow(currentBPM);
      const precision = calculatePrecision(detectedHits, expectedBeatTimes, windowMs);
      setSessionPrecision(precision);

      if (precision > 90) {
        setShowBPMModal(true);
      }

      await saveSession(precision);
    } else {
      await saveSession(null);
    }
  };

  const saveSession = async (precision: number | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from('training_sessions').insert({
        user_id: user.id,
        exercise_id: exercise.id,
        bpm: currentBPM,
        target_time_seconds: targetTimeSeconds,
        total_repetitions: totalRepetitions,
        completed_repetitions: completedRepetitions,
        precision_percentage: precision,
        session_date: new Date().toISOString(),
      });

      const today = new Date().toISOString().split('T')[0];
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (streak) {
        const lastDate = streak.last_session_date;
        const daysDiff = lastDate
          ? Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const newStreak = daysDiff <= 1 ? streak.current_streak + 1 : 1;
        const longestStreak = Math.max(newStreak, streak.longest_streak);

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_session_date: today,
            total_sessions: streak.total_sessions + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase.from('user_streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_session_date: today,
          total_sessions: 1,
        });
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleIncreaseBPM = () => {
    setShowBPMModal(false);
    setCurrentBPM(Math.min(currentBPM + 5, exercise.bpm_max));
    setDetectedHits([]);
    setSessionPrecision(null);
  };

  const handleIncreaseReps = () => {
    setTotalRepetitions(totalRepetitions + 1);
  };

  const handleDecreaseReps = () => {
    setTotalRepetitions(Math.max(1, totalRepetitions - 1));
  };

  const progress = totalRepetitions > 0 ? (completedRepetitions / totalRepetitions) * 100 : 0;
  const [showStrumming, setShowStrumming] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Exercises</span>
        </button>

        {!showStrumming ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{exercise.title}</h2>
              <div className="aspect-video bg-gradient-to-br from-[#8c52ff] to-[#00bf63] rounded-lg flex items-center justify-center text-white text-6xl">
                {exercise.exercise_type === 'strumming' && '🎸'}
                {exercise.exercise_type === 'fingerpicking' && '🎵'}
                {exercise.exercise_type === 'transitions' && '🔄'}
                {exercise.exercise_type === 'riffs' && '⚡'}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Controls</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">BPM</label>
                  <input
                    type="range"
                    min={exercise.bpm_min}
                    max={exercise.bpm_max}
                    value={currentBPM}
                    onChange={(e) => setCurrentBPM(parseInt(e.target.value))}
                    disabled={isTraining}
                    className="w-full"
                  />
                  <div className="text-center font-bold text-2xl text-[#8c52ff] mt-2">{currentBPM}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Time (seconds)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={targetTimeSeconds}
                    onChange={(e) => setTargetTimeSeconds(parseInt(e.target.value))}
                    disabled={isTraining}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                {!isTraining ? (
                  <button
                    onClick={handleStart}
                    className="bg-gradient-to-r from-[#8c52ff] to-[#00bf63] text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition flex items-center space-x-2"
                  >
                    <Play className="w-6 h-6" />
                    <span>Start</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="bg-red-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-600 transition flex items-center space-x-2"
                  >
                    <RotateCcw className="w-6 h-6" />
                    <span>Stop</span>
                  </button>
                )}

                <button
                  onClick={handleToggleAudioCoach}
                  className={`${
                    audioCoachEnabled
                      ? 'bg-[#00bf63] text-white'
                      : 'bg-gray-200 text-gray-700'
                  } font-bold py-3 px-6 rounded-lg hover:opacity-90 transition flex items-center space-x-2`}
                >
                  {audioCoachEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  <span>Audio Coach</span>
                </button>
              </div>

              {audioError && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {audioError}
                </div>
              )}

              {sessionPrecision !== null && (
                <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                  <p className="text-center font-bold text-blue-900">
                    Session Precision: {sessionPrecision.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Progress</h3>
              <div className="flex justify-center mb-4">
                <ProgressRing progress={progress} size={150}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{completedRepetitions}</div>
                    <div className="text-sm text-gray-500">/ {totalRepetitions}</div>
                  </div>
                </ProgressRing>
              </div>

              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={handleDecreaseReps}
                  disabled={isTraining || totalRepetitions <= 1}
                  className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Adjust Reps</span>
                <button
                  onClick={handleIncreaseReps}
                  disabled={isTraining}
                  className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Exercise Info</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold capitalize">{exercise.exercise_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="font-semibold capitalize">{exercise.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Signature:</span>
                  <span className="font-semibold">{exercise.time_signature}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BPM Range:</span>
                  <span className="font-semibold">{exercise.bpm_min}-{exercise.bpm_max}</span>
                </div>
              </div>

              {exercise.exercise_type === 'strumming' && (
                <button
                  onClick={() => setShowStrumming(true)}
                  className="w-full mt-4 bg-gradient-to-r from-[#8c52ff] to-[#00bf63] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition"
                >
                  View Strumming Patterns
                </button>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div>
            <button
              onClick={() => setShowStrumming(false)}
              className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Exercise</span>
            </button>
            <StrummingPatternSelector currentBPM={currentBPM} isActive={audioActive} />
          </div>
        )}
      </div>

      {showBPMModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Excellent Work!</h3>
            <p className="text-gray-600 mb-6 text-center">
              Your precision was over 90%! Would you like to increase the BPM by 5?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleIncreaseBPM}
                className="flex-1 bg-gradient-to-r from-[#8c52ff] to-[#00bf63] text-white font-bold py-3 rounded-lg hover:opacity-90"
              >
                Ready
              </button>
              <button
                onClick={() => setShowBPMModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
