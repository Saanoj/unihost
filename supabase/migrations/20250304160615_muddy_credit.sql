/*
  # Create messages table

  1. New Tables
    - `messages`: Stores individual messages within conversations
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `sender_id` (uuid, foreign key to users)
      - `content` (text, not null)
      - `created_at` (timestamptz, default now())
      - `status` (text, default 'sent')
      - `is_from_host` (boolean, not null)

  2. Security
    - Enable RLS on `messages` table
    - Add policy for participants to access messages in conversations they're part of
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  is_from_host boolean NOT NULL
);

-- Create an index for quicker message retrieval
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access messages in conversations they are part of"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (auth.uid() = conversations.guest_id OR auth.uid() = conversations.host_id)
    )
  );