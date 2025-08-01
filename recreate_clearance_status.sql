-- Recreate clearance_status table with current schema
CREATE TABLE IF NOT EXISTS public.clearance_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'pending',
  amount_owed numeric DEFAULT 0,
  rejection_reason text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clearance_status_pkey PRIMARY KEY (id),
  CONSTRAINT clearance_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT clearance_status_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE,
  CONSTRAINT user_unit_unique UNIQUE (user_id, unit_id)
);

-- Enable RLS
ALTER TABLE public.clearance_status ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Allow user read access to clearance_status" ON public.clearance_status
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff');

CREATE POLICY "Allow admin update for clearance_status" ON public.clearance_status
  FOR UPDATE USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff');

-- Repopulate with data (your existing script)
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