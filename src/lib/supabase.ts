import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Exercise {
  id: string;
  title: string;
  description: string;
  video_url: string;
  tablature_file_url: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercise_type: 'strumming' | 'fingerpicking' | 'transitions' | 'riffs';
  bpm_min: number;
  bpm_max: number;
  time_signature: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  total_sessions: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  exercise_id: string;
  bpm: number;
  target_time_seconds: number;
  total_repetitions: number;
  completed_repetitions: number;
  precision_percentage: number | null;
  audio_clip_url: string | null;
  notes: string | null;
  session_date: string;
  created_at: string;
}
