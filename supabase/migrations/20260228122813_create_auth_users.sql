/*
  # Setup authentication users table

  1. New Tables
    - `auth_users` - Links auth.users to app profile data
      - `id` (uuid, primary key, references auth.users.id)
      - `email` (text)
      - `role` (text, defaults to 'user', can be 'admin')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `auth_users` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to update their own data
    - Add policy for admins to read all users
*/

CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON auth_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON auth_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON auth_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND auth_users.role = 'admin'
    )
  );
