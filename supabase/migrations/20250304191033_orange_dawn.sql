/*
  # Fix Row Level Security policies for users table

  1. Changes
     - Add a new policy that allows insertion of new users
     - This is required for the guest creation flow in conversations
     
  2. Reason
     - The current RLS policies only allow users to modify their own data
     - When creating a guest user as part of conversation creation, we need to allow insertion of new users
*/

-- Add policy to allow insertion of new users
CREATE POLICY "Allow inserting new users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);