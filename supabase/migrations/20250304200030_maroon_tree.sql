/*
  # Fix RLS policies for users table

  1. Changes
     - Update the user insertion policy to properly handle public access
     - Make the policy apply to anon and authenticated roles
     - Ensure new conversations can be created without authentication issues
*/

-- First drop the existing insert policy if it exists
DROP POLICY IF EXISTS "Allow inserting new users" ON users;

-- Create a new, more permissive policy for inserting new users
CREATE POLICY "Allow inserting new users for all"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also ensure the select policy allows both anon and authenticated
DROP POLICY IF EXISTS "Users can read other users data" ON users;

CREATE POLICY "Users can read other users data"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);