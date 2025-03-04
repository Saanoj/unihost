/*
  # Create users table

  1. New Tables
    - `users`: Stores information about hosts and travelers
      - `id` (uuid, primary key)
      - `username` (text, not null)
      - `avatar_url` (text, nullable)
      - `email` (text, not null, unique)
      - `created_at` (timestamptz, default now())
      - `is_host` (boolean, default false)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for authenticated users to read all users (required for listing conversations)
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  avatar_url text,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  is_host boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read and update their own data"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read other users data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);