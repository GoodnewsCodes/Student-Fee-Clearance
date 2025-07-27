-- Create clearance status records directly with user_id
INSERT INTO public.clearance_status (user_id, unit_id, status, amount_owed)
SELECT 
  p.user_id,
  u.id as unit_id,
  CASE 
    WHEN u.name IN ('Bursary', 'Library', 'Hospital') THEN 'submit_receipt'
    ELSE 'pending'
  END as status,
  CASE 
    WHEN u.name = 'Bursary' THEN 50000
    WHEN u.name = 'Library' THEN 5000
    WHEN u.name = 'Hospital' THEN 10000
    ELSE 0
  END as amount_owed
FROM public.profiles p
CROSS JOIN public.units u
WHERE p.role = 'student'
ON CONFLICT (user_id, unit_id) DO NOTHING;