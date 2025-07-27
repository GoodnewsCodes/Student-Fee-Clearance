-- Insert student records from profiles table
INSERT INTO public.students (user_id, full_name, registration_number, email)
SELECT 
  user_id,
  name as full_name,
  track_no as registration_number,
  email
FROM public.profiles 
WHERE role = 'student' AND track_no IS NOT NULL;