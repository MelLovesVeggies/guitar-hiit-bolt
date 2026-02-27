import { create } from 'zustand';

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  total_sessions: number;
  created_at: string;
  updated_at: string;
}

interface TrainingState {
  currentBPM: number;
  targetTimeSeconds: number;
  totalRepetitions: number;
  completedRepetitions: number;
  isTraining: boolean;
  audioCoachEnabled: boolean;
  userStreak: UserStreak | null;
  latencyOffsetMs: number;

  setCurrentBPM: (bpm: number) => void;
  setTargetTimeSeconds: (seconds: number) => void;
  setTotalRepetitions: (reps: number) => void;
  setCompletedRepetitions: (reps: number) => void;
  incrementCompletedRepetitions: () => void;
  setIsTraining: (training: boolean) => void;
  setAudioCoachEnabled: (enabled: boolean) => void;
  setUserStreak: (streak: UserStreak | null) => void;
  setLatencyOffsetMs: (ms: number) => void;
  resetSession: () => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  currentBPM: 80,
  targetTimeSeconds: 60,
  totalRepetitions: 0,
  completedRepetitions: 0,
  isTraining: false,
  audioCoachEnabled: false,
  userStreak: null,
  latencyOffsetMs: 0,

  setCurrentBPM: (bpm) => set({ currentBPM: bpm }),
  setTargetTimeSeconds: (seconds) => set({ targetTimeSeconds: seconds }),
  setTotalRepetitions: (reps) => set({ totalRepetitions: reps }),
  setCompletedRepetitions: (reps) => set({ completedRepetitions: reps }),
  incrementCompletedRepetitions: () => set((state) => ({
    completedRepetitions: state.completedRepetitions + 1
  })),
  setIsTraining: (training) => set({ isTraining: training }),
  setAudioCoachEnabled: (enabled) => set({ audioCoachEnabled: enabled }),
  setUserStreak: (streak) => set({ userStreak: streak }),
  setLatencyOffsetMs: (ms) => set({ latencyOffsetMs: ms }),
  resetSession: () => set({
    completedRepetitions: 0,
    isTraining: false
  }),
}));
