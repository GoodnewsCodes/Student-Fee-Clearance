-- Enable RLS
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read fees
DROP POLICY IF EXISTS "Allow authenticated users to read fees" ON public.fees;
CREATE POLICY "Allow authenticated users to read fees" ON public.fees
FOR SELECT
TO public
USING (auth.role() = 'authenticated');

-- Policy: Allow bursary staff to manage fees
DROP POLICY IF EXISTS "Allow bursary staff to manage fees" ON public.fees;
CREATE POLICY "Allow bursary staff to manage fees" ON public.fees
FOR ALL
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff' AND profiles.unit IN ('bursary', 'accounts')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff' AND profiles.unit IN ('bursary', 'accounts')));
