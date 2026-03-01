/*
  # Add Strumming Patterns Table

  1. New Tables
    - `strumming_patterns`
      - `id` (uuid, primary key)
      - `name` (text) - Pattern name
      - `description` (text) - Pattern description
      - `pattern` (text) - ASCII representation of strumming pattern (D = down, U = up, X = mute)
      - `difficulty` (text) - beginner/intermediate/advanced
      - `bpm_range_min` (integer) - Minimum BPM for this pattern
      - `bpm_range_max` (integer) - Maximum BPM for this pattern
      - `time_signature` (text) - Time signature (4/4, 3/4, etc)
      - `genre` (text) - Music genre/style
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `strumming_patterns`
    - Add policy for authenticated users to read patterns
    - Add policy for admins to manage patterns
*/

CREATE TABLE IF NOT EXISTS strumming_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  pattern text NOT NULL,
  difficulty text NOT NULL DEFAULT 'beginner',
  bpm_range_min integer DEFAULT 60,
  bpm_range_max integer DEFAULT 200,
  time_signature text DEFAULT '4/4',
  genre text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_difficulty CHECK (difficulty = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))
);

ALTER TABLE strumming_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view strumming patterns"
  ON strumming_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert patterns"
  ON strumming_patterns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND auth_users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update patterns"
  ON strumming_patterns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND auth_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND auth_users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete patterns"
  ON strumming_patterns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND auth_users.role = 'admin'
    )
  );

INSERT INTO strumming_patterns (name, description, pattern, difficulty, bpm_range_min, bpm_range_max, time_signature, genre) VALUES
('Basic Down', 'Simple downstrokes for beginners', 'D D D D D D D D', 'beginner', 60, 100, '4/4', 'General'),
('Down-Up Basic', 'Alternating down and up strokes', 'D U D U D U D U', 'beginner', 70, 120, '4/4', 'Pop'),
('Folk Pattern', 'Traditional folk strumming', 'D D U U D U U D', 'beginner', 80, 120, '4/4', 'Folk'),
('Reggae Skank', 'Syncopated upstroke emphasis', 'X U X U X U X U', 'intermediate', 90, 140, '4/4', 'Reggae'),
('Rock Steady', 'Strong rock rhythm pattern', 'D U D D U D U D', 'intermediate', 100, 160, '4/4', 'Rock'),
('Fingerstyle Basis', 'Fingerstyle strumming foundation', 'D D U U D U D U', 'intermediate', 80, 130, '4/4', 'General'),
('Flamenco Rasgueado', 'Fast flamenco-style strumming', 'D D D U U D D D', 'advanced', 120, 200, '4/4', 'Flamenco'),
('Blues Shuffle', 'Classic blues shuffle pattern', 'D D U D U D D U', 'intermediate', 100, 140, '4/4', 'Blues'),
('Country Rhythm', 'Country music shuffle pattern', 'D D D U U D D U', 'intermediate', 90, 130, '4/4', 'Country'),
('Metal Chop', 'Heavy metal palm mute chop', 'D X D X D X D X', 'advanced', 120, 200, '4/4', 'Metal'),
('Jazz Swing', 'Smooth jazz strumming pattern', 'D U D U D U D U', 'advanced', 100, 160, '4/4', 'Jazz'),
('Waltz Pattern', 'Three-quarter time waltz', 'D D U D D U', 'beginner', 80, 120, '3/4', 'Waltz');
