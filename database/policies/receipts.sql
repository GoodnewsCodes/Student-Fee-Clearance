-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow staff update for receipts
DROP POLICY IF EXISTS "Allow staff update for receipts" ON public.receipts;
CREATE POLICY "Allow staff update for receipts" ON public.receipts
FOR UPDATE
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'));

-- Policy: Allow individual and staff access to receipts
DROP POLICY IF EXISTS "Allow individual and staff access to receipts" ON public.receipts;
CREATE POLICY "Allow individual and staff access to receipts" ON public.receipts
FOR SELECT
TO public
USING (
  (auth.uid() = (SELECT students.user_id FROM students WHERE students.id = receipts.student_id))
  OR 
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'))
);

-- Policy: Allow individual insert for receipts
DROP POLICY IF EXISTS "Allow individual insert for receipts" ON public.receipts;
CREATE POLICY "Allow individual insert for receipts" ON public.receipts
FOR INSERT
TO public
WITH CHECK (auth.uid() = (SELECT students.user_id FROM students WHERE students.id = receipts.student_id));
