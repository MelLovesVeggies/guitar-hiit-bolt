/*
  # Add Strumming Patterns for Each Exercise

  1. New Data
    - Add strumming patterns matching each exercise
    - Basic Downstrokes pattern
    - Down-Up Alternating pattern
    - Folk Strumming pattern
    - Rock Power Strumming pattern
    - Reggae Skank pattern
*/

INSERT INTO strumming_patterns (name, description, pattern, difficulty, bpm_range_min, bpm_range_max, time_signature, genre)
VALUES
(
  'Basic Downstrokes',
  'Simple downstrokes for beginners to build consistency',
  'D D D D D D D D',
  'beginner',
  60,
  100,
  '4/4',
  'beginner'
),
(
  'Down-Up Alternating',
  'Alternating down and up strokes to build fluidity',
  'D U D U D U D U',
  'beginner',
  70,
  120,
  '4/4',
  'pop'
),
(
  'Folk Strumming',
  'Traditional folk strumming with rhythm and feel',
  'D D U U D U U D',
  'intermediate',
  80,
  130,
  '4/4',
  'folk'
),
(
  'Rock Power Strumming',
  'Classic rock pattern with strong downbeats',
  'D D X D D X D X',
  'intermediate',
  100,
  160,
  '4/4',
  'rock'
),
(
  'Reggae Skank',
  'Syncopated reggae with upstroke emphasis',
  'X U X U X U X U',
  'intermediate',
  90,
  140,
  '4/4',
  'reggae'
);
