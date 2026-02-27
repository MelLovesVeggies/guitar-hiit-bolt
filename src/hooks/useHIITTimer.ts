import { useState, useEffect, useCallback, useRef } from 'react';
import { useTrainingStore } from '../store/useTrainingStore';
import { calculateRepetitions } from '../lib/calculations';

interface HIITTimerOptions {
  onRepetitionComplete?: (rep: number) => void;
  onSessionComplete?: () => void;
  onBeatTick?: (beatNumber: number, timestamp: number) => void;
}

export function useHIITTimer(options: HIITTimerOptions = {}) {
  const { onRepetitionComplete, onSessionComplete, onBeatTick } = options;

  const {
    currentBPM,
    targetTimeSeconds,
    totalRepetitions,
    completedRepetitions,
    isTraining,
    setTotalRepetitions,
    incrementCompletedRepetitions,
    setIsTraining,
  } = useTrainingStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);

  const startTimeRef = useRef<number>(0);
  const lastBeatTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const expectedBeatTimesRef = useRef<number[]>([]);

  const beatIntervalMs = (60 / currentBPM) * 1000;

  const updateTimer = useCallback(() => {
    if (!isTraining) return;

    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    setElapsedSeconds(elapsed);

    if (now - lastBeatTimeRef.current >= beatIntervalMs) {
      const newBeat = currentBeat + 1;
      setCurrentBeat(newBeat);
      lastBeatTimeRef.current = now;
      onBeatTick?.(newBeat, now);

      if (newBeat % 4 === 0) {
        const repNumber = Math.floor(newBeat / 4);
        if (repNumber > completedRepetitions && repNumber <= totalRepetitions) {
          incrementCompletedRepetitions();
          onRepetitionComplete?.(repNumber);

          if (repNumber === totalRepetitions) {
            setIsTraining(false);
            onSessionComplete?.();
            return;
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [
    isTraining,
    currentBPM,
    currentBeat,
    completedRepetitions,
    totalRepetitions,
    beatIntervalMs,
    onBeatTick,
    onRepetitionComplete,
    onSessionComplete,
    incrementCompletedRepetitions,
    setIsTraining,
  ]);

  const start = useCallback(() => {
    const reps = calculateRepetitions(targetTimeSeconds, currentBPM);
    setTotalRepetitions(reps);

    setElapsedSeconds(0);
    setCurrentBeat(0);
    startTimeRef.current = performance.now();
    lastBeatTimeRef.current = performance.now();

    expectedBeatTimesRef.current = [];
    for (let i = 0; i < reps * 4; i++) {
      expectedBeatTimesRef.current.push(startTimeRef.current + (i * beatIntervalMs));
    }

    setIsTraining(true);
  }, [currentBPM, targetTimeSeconds, beatIntervalMs, setTotalRepetitions, setIsTraining]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsTraining(false);
    setElapsedSeconds(0);
    setCurrentBeat(0);
  }, [setIsTraining]);

  const pause = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsTraining(false);
  }, [setIsTraining]);

  useEffect(() => {
    if (isTraining) {
      updateTimer();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTraining, updateTimer]);

  return {
    elapsedSeconds,
    currentBeat,
    expectedBeatTimes: expectedBeatTimesRef.current,
    start,
    stop,
    pause,
  };
}
