-- Enable RLS on students table if not already enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow students to read their own records
CREATE POLICY "Students can read own record" ON public.students
FOR SELECT USING (
  auth.uid() = user_id
);

-- Allow staff/admin to read all student records
CREATE POLICY "Staff can read all students" ON public.students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff')
  )
);

-- Allow service role to read all (for your Python script)
CREATE POLICY "Service role can read all students" ON public.students
FOR SELECT USING (true);