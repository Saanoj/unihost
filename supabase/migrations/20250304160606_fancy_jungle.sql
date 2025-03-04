/*
  # Create properties table

  1. New Tables
    - `properties`: Stores information about rental properties
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `location` (text, not null)
      - `host_id` (uuid, foreign key to users)
      - `platform` (text, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `properties` table
    - Add policy for hosts to manage their own properties
    - Add policy for all authenticated users to read properties
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  host_id uuid NOT NULL REFERENCES users(id),
  platform text NOT NULL CHECK (platform IN ('Airbnb', 'Booking.com')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Hosts can manage their own properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Users can read all properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);