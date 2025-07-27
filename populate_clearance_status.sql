-- Create clearance status records for all students across all units
INSERT INTO public.clearance_status (student_id, unit_id, status)
SELECT 
  s.id as student_id,
  u.id as unit_id,
  'Pending' as status
FROM public.students s
CROSS JOIN public.units u;