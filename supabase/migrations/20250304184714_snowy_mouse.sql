/*
  # Add unique constraint to username column

  1. Changes
     - Add unique constraint to the `username` column in the `users` table
     
  2. Reason
     - This is needed to support the ON CONFLICT operation when upserting users
     - Without this constraint, upsert operations specifying username as conflict target fail
*/

-- Add unique constraint to username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;