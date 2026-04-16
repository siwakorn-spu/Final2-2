-- Allow companies to manage their own job posts
-- This fixes the Row Level Security (RLS) violation when companies try to post a job

-- 1. Policy: Companies can create jobs
CREATE POLICY "Companies can insert jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (
  company_user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'company'
  )
);

-- 2. Policy: Companies can update their own jobs
CREATE POLICY "Companies can update their own jobs"
ON jobs FOR UPDATE
TO authenticated
USING (
  company_user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'company'
  )
);

-- 3. Policy: Companies can delete their own jobs
CREATE POLICY "Companies can delete their own jobs"
ON jobs FOR DELETE
TO authenticated
USING (
  company_user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'company'
  )
);
