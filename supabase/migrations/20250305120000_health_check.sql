/*
  # Add health check function
  
  1. New Function
     - `healthcheck`: A simple stored procedure that returns true
     - Used to verify database connectivity efficiently
*/

-- Create a simple health check function
CREATE OR REPLACE FUNCTION healthcheck()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN true;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION healthcheck() TO anon, authenticated; 