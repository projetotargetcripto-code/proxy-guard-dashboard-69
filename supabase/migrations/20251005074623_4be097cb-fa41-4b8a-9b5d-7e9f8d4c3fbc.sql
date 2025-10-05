-- Fix RLS policy for inserting instances without service_id
-- The issue is that user_owns_service returns false when service_id is NULL
-- We need to allow users to insert instances without a service

-- Drop the old policy
DROP POLICY IF EXISTS "Users can insert own instances" ON instances;

-- Create new policy that properly handles NULL service_id
CREATE POLICY "Users can insert own instances"
ON instances
FOR INSERT
WITH CHECK (
  (service_id IS NULL) OR 
  EXISTS (
    SELECT 1 FROM services s 
    WHERE s.id = service_id 
    AND s.user_id = auth.uid()
  )
);