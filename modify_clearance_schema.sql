-- Add user_id directly to clearance_status and remove student_id dependency
ALTER TABLE public.clearance_status 
DROP CONSTRAINT IF EXISTS clearance_status_student_id_fkey,
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS amount_owed numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update existing records to use user_id from students table
UPDATE public.clearance_status 
SET user_id = (
  SELECT s.user_id 
  FROM public.students s 
  WHERE s.id = clearance_status.student_id
);

-- Add foreign key constraint to auth.users
ALTER TABLE public.clearance_status 
ADD CONSTRAINT clearance_status_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update unique constraint
ALTER TABLE public.clearance_status 
DROP CONSTRAINT IF EXISTS student_unit_unique,
ADD CONSTRAINT user_unit_unique UNIQUE (user_id, unit_id);