export function calculateRepetitions(targetTimeSeconds: number, bpm: number): number {
  return Math.round((targetTimeSeconds * bpm) / (4 * 60));
}

export function calculateTimingWindow(bpm: number, percentageOfBeat: number = 10): number {
  const beatMs = (60 / bpm) * 1000;
  return (percentageOfBeat / 100) * beatMs;
}

export function calculatePrecision(
  detectedHits: number[],
  expectedBeatTimes: number[],
  windowMs: number
): number {
  if (expectedBeatTimes.length === 0) return 0;

  let hitCount = 0;
  for (const expectedTime of expectedBeatTimes) {
    const isHit = detectedHits.some(
      (detectedTime) =>
        Math.abs(detectedTime - expectedTime) <= windowMs
    );
    if (isHit) hitCount++;
  }

  return (hitCount / expectedBeatTimes.length) * 100;
}
