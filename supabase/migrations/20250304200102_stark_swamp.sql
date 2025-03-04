/*
  # Fix RLS policies for properties table

  1. Changes
     - Update property policies to allow creation by unauthenticated users
     - Ensure property-related operations work properly in the application
*/

-- Update property policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Hosts can manage their own properties" ON properties;
DROP POLICY IF EXISTS "Users can read all properties" ON properties;

-- Create new, more permissive policies
CREATE POLICY "Anyone can create properties"
  ON properties
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Hosts can manage their own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Users can read all properties"
  ON properties
  FOR SELECT
  TO anon, authenticated
  USING (true);