-- Enable RLS
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read semesters
DROP POLICY IF EXISTS "Allow authenticated users to read semesters" ON public.semesters;
CREATE POLICY "Allow authenticated users to read semesters" ON public.semesters
FOR SELECT
TO public
USING (auth.role() = 'authenticated');

-- Policy: Allow ICT, Bursary, and Accounts staff to manage semesters
DROP POLICY IF EXISTS "Allow authorized staff to manage semesters" ON public.semesters;
CREATE POLICY "Allow authorized staff to manage semesters" ON public.semesters
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'staff' 
    AND profiles.unit IN ('ict', 'bursary', 'accounts')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'staff' 
    AND profiles.unit IN ('ict', 'bursary', 'accounts')
  )
);
