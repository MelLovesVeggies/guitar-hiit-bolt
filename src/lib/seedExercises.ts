import { supabase, Exercise } from './supabase';

const initialExercises = [
  {
    title: 'Whole Note Strumming',
    description: 'Master basic whole note strumming patterns on open chords.',
    video_url: 'https://example.com/whole-note.mp4',
    difficulty: 'beginner' as const,
    exercise_type: 'strumming' as const,
    bpm_min: 60,
    bpm_max: 100,
    time_signature: '4/4',
    tags: ['strumming', 'beginner', 'whole-notes'],
  },
  {
    title: 'Half Note Strumming',
    description: 'Learn half note strumming with consistent rhythm.',
    video_url: 'https://example.com/half-note.mp4',
    difficulty: 'beginner' as const,
    exercise_type: 'strumming' as const,
    bpm_min: 70,
    bpm_max: 110,
    time_signature: '4/4',
    tags: ['strumming', 'beginner', 'half-notes'],
  },
  {
    title: 'Quarter Note Strumming',
    description: 'Develop speed with quarter note strumming patterns.',
    video_url: 'https://example.com/quarter-note.mp4',
    difficulty: 'beginner' as const,
    exercise_type: 'strumming' as const,
    bpm_min: 80,
    bpm_max: 140,
    time_signature: '4/4',
    tags: ['strumming', 'beginner', 'quarter-notes'],
  },
  {
    title: 'Eighth Note Strumming',
    description: 'Master rapid eighth note strumming technique.',
    video_url: 'https://example.com/eighth-note.mp4',
    difficulty: 'intermediate' as const,
    exercise_type: 'strumming' as const,
    bpm_min: 90,
    bpm_max: 160,
    time_signature: '4/4',
    tags: ['strumming', 'intermediate', 'eighth-notes'],
  },
  {
    title: 'Campfire Pattern 1 - Basic Folk',
    description: 'Classic folk strumming pattern for campfire songs.',
    video_url: 'https://example.com/campfire1.mp4',
    difficulty: 'beginner' as const,
    exercise_type: 'strumming' as const,
    bpm_min: 80,
    bpm_max: 120,
    time_signature: '4/4',
    tags: ['campfire', 'folk', 'pattern'],
  },
  {
    title: 'Campfire Pattern 2 - Upbeat',
    description: 'Upbeat campfire strumming with syncopation.',
    video_url: 'https://example.com/campfire2.mp4',
    difficulty: 'intermediate' as const,
    exercise_type: 'strumming' as const,
    bpm_min: 100,
    bpm_max: 140,
    time_signature: '4/4',
    tags: ['campfire', 'upbeat', 'pattern'],
  },
  {
    title: 'Campfire Pattern 3 - Fingerstyle',
    description: 'Fingerstyle campfire pattern with dynamics.',
    video_url: 'https://example.com/campfire3.mp4',
    difficulty: 'intermediate' as const,
    exercise_type: 'strumming' as const,
    bpm_min: 90,
    bpm_max: 130,
    time_signature: '4/4',
    tags: ['campfire', 'fingerstyle', 'pattern'],
  },
  {
    title: 'Am to C Transition',
    description: 'Smooth chord transition between A minor and C using pivot fingers.',
    video_url: 'https://example.com/am-c.mp4',
    difficulty: 'beginner' as const,
    exercise_type: 'transitions' as const,
    bpm_min: 60,
    bpm_max: 100,
    time_signature: '4/4',
    tags: ['transitions', 'open-chords', 'beginner'],
  },
  {
    title: 'D to G Transition',
    description: 'Master the D to G transition with minimal finger movement.',
    video_url: 'https://example.com/d-g.mp4',
    difficulty: 'beginner' as const,
    exercise_type: 'transitions' as const,
    bpm_min: 60,
    bpm_max: 100,
    time_signature: '4/4',
    tags: ['transitions', 'open-chords', 'beginner'],
  },
  {
    title: 'PIMAMI Fingerpicking',
    description: 'Learn the classic PIMAMI fingerpicking pattern.',
    video_url: 'https://example.com/pimami.mp4',
    difficulty: 'intermediate' as const,
    exercise_type: 'fingerpicking' as const,
    bpm_min: 70,
    bpm_max: 120,
    time_signature: '4/4',
    tags: ['fingerpicking', 'pattern', 'intermediate'],
  },
  {
    title: 'Peter Gunn Riff',
    description: 'Play the iconic Peter Gunn surf rock riff.',
    video_url: 'https://example.com/peter-gunn.mp4',
    difficulty: 'intermediate' as const,
    exercise_type: 'riffs' as const,
    bpm_min: 120,
    bpm_max: 180,
    time_signature: '4/4',
    tags: ['riff', 'surf-rock', 'intermediate'],
  },
  {
    title: 'Smoke on the Water Riff',
    description: 'Learn the legendary Smoke on the Water riff.',
    video_url: 'https://example.com/smoke-water.mp4',
    difficulty: 'intermediate' as const,
    exercise_type: 'riffs' as const,
    bpm_min: 90,
    bpm_max: 140,
    time_signature: '4/4',
    tags: ['riff', 'rock', 'intermediate'],
  },
  {
    title: 'Wonderwall Riff',
    description: 'Master the fingerpicking riff from Wonderwall.',
    video_url: 'https://example.com/wonderwall.mp4',
    difficulty: 'advanced' as const,
    exercise_type: 'riffs' as const,
    bpm_min: 80,
    bpm_max: 140,
    time_signature: '4/4',
    tags: ['riff', 'fingerpicking', 'advanced'],
  },
  {
    title: 'Chord Switching Speed Drill',
    description: 'Rapid chord switching exercises to build muscle memory.',
    video_url: 'https://example.com/chord-speed.mp4',
    difficulty: 'intermediate' as const,
    exercise_type: 'transitions' as const,
    bpm_min: 100,
    bpm_max: 160,
    time_signature: '4/4',
    tags: ['transitions', 'speed-drill', 'intermediate'],
  },
  {
    title: 'Advanced Fingerpicking Patterns',
    description: 'Complex fingerpicking patterns for advanced players.',
    video_url: 'https://example.com/advanced-fingerpick.mp4',
    difficulty: 'advanced' as const,
    exercise_type: 'fingerpicking' as const,
    bpm_min: 100,
    bpm_max: 180,
    time_signature: '4/4',
    tags: ['fingerpicking', 'advanced', 'patterns'],
  },
];

export async function seedExercises() {
  try {
    const { data: existingExercises } = await supabase
      .from('exercises')
      .select('id')
      .limit(1);

    if (existingExercises && existingExercises.length > 0) {
      console.log('Exercises already seeded');
      return;
    }

    const { error } = await supabase.from('exercises').insert(
      initialExercises.map((exercise) => ({
        ...exercise,
        tablature_file_url: null,
      }))
    );

    if (error) {
      console.error('Error seeding exercises:', error);
    } else {
      console.log('Exercises seeded successfully');
    }
  } catch (error) {
    console.error('Error checking/seeding exercises:', error);
  }
}
