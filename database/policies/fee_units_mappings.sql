-- Enable RLS
ALTER TABLE public.fee_unit_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read mappings
DROP POLICY IF EXISTS "Allow authenticated users to read mappings" ON public.fee_unit_mappings;
CREATE POLICY "Allow authenticated users to read mappings" ON public.fee_unit_mappings
FOR SELECT
TO public
USING (auth.role() = 'authenticated');

-- Policy: Allow staff to manage mappings
DROP POLICY IF EXISTS "Allow staff to manage mappings" ON public.fee_unit_mappings;
CREATE POLICY "Allow staff to manage mappings" ON public.fee_unit_mappings
FOR ALL
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'));