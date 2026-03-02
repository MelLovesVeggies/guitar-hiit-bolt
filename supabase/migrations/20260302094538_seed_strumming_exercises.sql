/*
  # Seed Strumming Exercises

  1. New Data
    - Add 5 strumming exercises to get users started
    - Includes beginner to intermediate levels
    - Various genres and styles
*/

INSERT INTO exercises (
  title,
  description,
  video_url,
  difficulty,
  exercise_type,
  bpm_min,
  bpm_max,
  time_signature,
  tags
) VALUES
(
  'Basic Downstrokes',
  'Master the fundamentals with simple downstrokes. Perfect for beginners to build muscle memory and consistency.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'beginner',
  'strumming',
  60,
  100,
  '4/4',
  ARRAY['beginner', 'fundamentals', 'downstroke']
),
(
  'Down-Up Alternating',
  'Learn alternating down and up strokes to increase speed and fluidity. Foundation for all strumming techniques.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'beginner',
  'strumming',
  70,
  120,
  '4/4',
  ARRAY['beginner', 'alternating', 'rhythm']
),
(
  'Folk Strumming',
  'Traditional folk strumming pattern with emphasis on rhythm and feel. Great for acoustic guitar.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'intermediate',
  'strumming',
  80,
  130,
  '4/4',
  ARRAY['intermediate', 'folk', 'acoustic']
),
(
  'Rock Power Strumming',
  'Classic rock strumming pattern with strong downbeats. Build energy and dynamics.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'intermediate',
  'strumming',
  100,
  160,
  '4/4',
  ARRAY['intermediate', 'rock', 'electric']
),
(
  'Reggae Skank',
  'Syncopated reggae strumming with upstroke emphasis. Develop groove and pocket playing.',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'intermediate',
  'strumming',
  90,
  140,
  '4/4',
  ARRAY['intermediate', 'reggae', 'groove']
);
