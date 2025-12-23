-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Policy: Allow individual read access to students
DROP POLICY IF EXISTS "Allow individual read access to students" ON public.students;
CREATE POLICY "Allow individual read access to students" ON public.students
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Policy: Staff can read all students
DROP POLICY IF EXISTS "Staff can read all students" ON public.students;
CREATE POLICY "Staff can read all students" ON public.students
FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'));
