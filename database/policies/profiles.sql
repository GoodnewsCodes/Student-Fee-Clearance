-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Function to check if user is staff (breaks RLS recursion)
CREATE OR REPLACE FUNCTION public.check_is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'staff'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Allow individual user access to their own profile
DROP POLICY IF EXISTS "Allow individual user access to their own profile" ON public.profiles;
CREATE POLICY "Allow individual user access to their own profile" ON public.profiles
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Policy: Allow staff to read all profiles
DROP POLICY IF EXISTS "Allow staff to read all profiles" ON public.profiles;
CREATE POLICY "Allow staff to read all profiles" ON public.profiles
FOR SELECT
TO public
USING (public.check_is_staff());

-- Policy: Allow individual user to insert their own profile
DROP POLICY IF EXISTS "Allow individual user to insert their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to insert their own profile" ON public.profiles
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow individual user to update their own profile
DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to update their own profile" ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
