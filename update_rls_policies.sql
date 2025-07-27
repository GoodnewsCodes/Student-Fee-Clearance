-- Drop old policies
DROP POLICY IF EXISTS "Allow individual and admin read access to clearance_status" ON public.clearance_status;
DROP POLICY IF EXISTS "Allow admin update for clearance_status" ON public.clearance_status;

-- Create new policies using user_id
CREATE POLICY "Allow user read access to clearance_status" ON public.clearance_status
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff');

CREATE POLICY "Allow admin update for clearance_status" ON public.clearance_status
  FOR UPDATE USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff');