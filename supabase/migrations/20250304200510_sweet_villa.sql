/*
  # Ensure host user exists

  1. New Data
     - Create the host user if it doesn't exist yet
     - This ensures the mock host user is always available 
*/

-- Insert the host user if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO users (id, username, email, is_host, created_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 'host_user', 'host@example.com', true, now());
  END IF;
END $$;