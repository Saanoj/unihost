/*
  # Create AI suggestions table

  1. New Tables
    - `ai_suggestions`: Stores AI-generated message suggestions
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `content` (text, not null)
      - `created_at` (timestamptz, default now())
      - `used` (boolean, default false)

  2. Security
    - Enable RLS on `ai_suggestions` table
    - Add policy for hosts to access AI suggestions for their conversations
*/

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  used boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Hosts can access AI suggestions for their conversations"
  ON ai_suggestions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = ai_suggestions.conversation_id
      AND auth.uid() = conversations.host_id
    )
  );