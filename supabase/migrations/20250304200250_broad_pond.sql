/*
  # Add unique constraint to properties table

  1. Changes
     - Add a unique constraint on the name and host_id columns in the properties table
     - This enables the ON CONFLICT upsert functionality to work correctly
*/

-- Add a unique constraint for the combination of name and host_id
ALTER TABLE properties ADD CONSTRAINT properties_name_host_id_key UNIQUE (name, host_id);