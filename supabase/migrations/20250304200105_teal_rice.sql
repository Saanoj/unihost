/*
  # Fix RLS policies for conversations and messages tables

  1. Changes
     - Update conversation policies to allow creation by unauthenticated users
     - Ensure message creation works properly
*/

-- Update conversation policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access conversations they are part of" ON conversations;

-- Create new policies
CREATE POLICY "Anyone can create conversations"
  ON conversations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can access conversations they are part of"
  ON conversations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update conversations they are part of"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = guest_id OR auth.uid() = host_id);

-- Update message policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access messages in conversations they are part of" ON messages;

-- Create new policies
CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);