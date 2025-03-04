/*
  # Fix RLS policies for AI suggestions table

  1. Changes
     - Update AI suggestion policies to work with unauthenticated flows
*/

-- Update AI suggestions policies
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Hosts can access AI suggestions for their conversations" ON ai_suggestions;

-- Create new policies
CREATE POLICY "Anyone can create AI suggestions"
  ON ai_suggestions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read AI suggestions"
  ON ai_suggestions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update AI suggestions"
  ON ai_suggestions
  FOR UPDATE
  TO anon, authenticated
  USING (true);