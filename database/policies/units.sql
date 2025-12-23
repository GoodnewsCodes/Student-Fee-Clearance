-- Enable RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to units
DROP POLICY IF EXISTS "Allow public read access to units" ON public.units;
CREATE POLICY "Allow public read access to units" ON public.units
FOR SELECT
TO public
USING (auth.role() = 'authenticated');
