import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioAnalyzerOptions {
  latencyOffsetMs?: number;
  onOnsetDetected?: (timestamp: number) => void;
  threshold?: number;
}

export function useAudioAnalyzer(options: AudioAnalyzerOptions = {}) {
  const {
    latencyOffsetMs = 0,
    onOnsetDetected,
    threshold = 0.5,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const previousLevelRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);

  const activate = useCallback(async () => {
    try {
      setError(null);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const stream = streamRef.current;

      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaStreamSource(stream);
      }

      if (!analyzerRef.current) {
        analyzerRef.current = audioContext.createAnalyser();
        analyzerRef.current.fftSize = 2048;
      }

      const source = sourceRef.current;
      const analyzer = analyzerRef.current;

      source.connect(analyzer);

      if (!dataArrayRef.current) {
        dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
      }

      setIsActive(true);
      monitorAudio(analyzer, dataArrayRef.current, threshold, latencyOffsetMs, onOnsetDetected);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate audio';
      setError(message);
      setIsActive(false);
      return false;
    }
  }, [threshold, latencyOffsetMs, onOnsetDetected]);

  const deactivate = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (sourceRef.current && sourceRef.current.disconnect) {
      sourceRef.current.disconnect();
    }

    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => {
      deactivate();
    };
  }, [deactivate]);

  return {
    isActive,
    error,
    activate,
    deactivate,
  };
}

function monitorAudio(
  analyzer: AnalyserNode,
  dataArray: Uint8Array,
  threshold: number,
  latencyOffsetMs: number,
  onOnsetDetected?: (timestamp: number) => void
) {
  let previousLevel = 0;

  function analyze() {
    analyzer.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const normalizedLevel = average / 255;

    if (
      normalizedLevel > threshold &&
      previousLevel <= threshold
    ) {
      const timestamp = performance.now() + latencyOffsetMs;
      onOnsetDetected?.(timestamp);
    }

    previousLevel = normalizedLevel;

    requestAnimationFrame(analyze);
  }

  analyze();
}
