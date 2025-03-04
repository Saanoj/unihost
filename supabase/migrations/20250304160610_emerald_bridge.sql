/*
  # Create conversations table

  1. New Tables
    - `conversations`: Stores conversations between hosts and travelers
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `guest_id` (uuid, foreign key to users)
      - `host_id` (uuid, foreign key to users)
      - `last_message_at` (timestamptz, default now())
      - `created_at` (timestamptz, default now())
      - `platform` (text, not null)
      - `check_in_date` (date, nullable)
      - `check_out_date` (date, nullable)
      - `vectorshift_conversation_id` (text, nullable)

  2. Security
    - Enable RLS on `conversations` table
    - Add policy for hosts and guests to access conversations they're part of
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  guest_id uuid NOT NULL REFERENCES users(id),
  host_id uuid NOT NULL REFERENCES users(id),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  platform text NOT NULL CHECK (platform IN ('Airbnb', 'Booking.com')),
  check_in_date date,
  check_out_date date,
  vectorshift_conversation_id text
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access conversations they are part of"
  ON conversations
  FOR ALL
  TO authenticated
  USING (auth.uid() = guest_id OR auth.uid() = host_id);