-- Enable RLS
ALTER TABLE public.clearance_status ENABLE ROW LEVEL SECURITY;

-- Policy: Allow staff update for clearance_status
DROP POLICY IF EXISTS "Allow staff update for clearance_status" ON public.clearance_status;
CREATE POLICY "Allow staff update for clearance_status" ON public.clearance_status
FOR UPDATE
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'));

-- Policy: Allow staff insert for clearance_status
DROP POLICY IF EXISTS "Allow staff insert for clearance_status" ON public.clearance_status;
CREATE POLICY "Allow staff insert for clearance_status" ON public.clearance_status
FOR INSERT
TO public
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'));

-- Policy: Allow user and staff read access to clearance_status
DROP POLICY IF EXISTS "Allow user and staff read access to clearance_status" ON public.clearance_status;
CREATE POLICY "Allow user and staff read access to clearance_status" ON public.clearance_status
FOR SELECT
TO public
USING (auth.uid() = user_id OR (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff')));
