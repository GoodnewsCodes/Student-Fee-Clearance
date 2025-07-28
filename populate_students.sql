-- Insert student records from profiles table
INSERT INTO public.students (user_id, name, track_no, email)
SELECT 
  user_id,
  name,
  track_no,
  email
FROM public.profiles 
WHERE role = 'student' AND track_no IS NOT NULL;
