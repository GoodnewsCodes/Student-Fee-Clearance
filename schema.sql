-- schema.sql
-- This script sets up the necessary tables and policies for the Student Fee Clearance application.

-- 1. Create the 'units' table (if not exists)
CREATE TABLE IF NOT EXISTS public.units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text NULL,
  priority character varying NULL DEFAULT 'medium'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.units IS 'Stores the different administrative units for clearance.';

-- 2. Create the 'students' table (if not exists)
CREATE TABLE IF NOT EXISTS public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name character varying NOT NULL,
    track_no character varying NOT NULL,
    email character varying NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT students_pkey PRIMARY KEY (id),
    CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT students_track_no_key UNIQUE (track_no)
);
COMMENT ON TABLE public.students IS 'Stores student profile information.';

-- 3. Create the 'receipts' table (updated for fee-based system)
CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  fee_id uuid,
  "imageUrl" text NOT NULL,
  file_path text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  amount numeric NULL,
  academic_year integer,
  semester varchar(10),
  rejection_reason text NULL,
  approved_by_bursary boolean DEFAULT false,
  approved_by_accounts boolean DEFAULT false,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
  CONSTRAINT receipts_fee_id_fkey FOREIGN KEY (fee_id) REFERENCES public.fees(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.receipts IS 'Stores uploaded payment receipts from students.';

-- 4. Create the 'clearance_status' table (if not exists)
CREATE TABLE IF NOT EXISTS public.clearance_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'Pending'::character varying,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clearance_status_pkey PRIMARY KEY (id),
  CONSTRAINT clearance_status_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
  CONSTRAINT clearance_status_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE,
  CONSTRAINT student_unit_unique UNIQUE (student_id, unit_id)
);
COMMENT ON TABLE public.clearance_status IS 'Tracks clearance status for each student and unit.';

-- 5. Set up Row Level Security (RLS)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearance_status ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies
DROP POLICY IF EXISTS "Allow public read access to units" ON public.units;
DROP POLICY IF EXISTS "Allow individual read access to students" ON public.students;
DROP POLICY IF EXISTS "Allow individual and admin access to receipts" ON public.receipts;
DROP POLICY IF EXISTS "Allow individual insert for receipts" ON public.receipts;
DROP POLICY IF EXISTS "Allow admin update for receipts" ON public.receipts;
DROP POLICY IF EXISTS "Allow individual and admin read access to clearance_status" ON public.clearance_status;
DROP POLICY IF EXISTS "Allow admin update for clearance_status" ON public.clearance_status;

-- Policy: Allow public read access to all authenticated users for 'units'.
CREATE POLICY "Allow public read access to units" ON public.units
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow users to view their own student profile.
CREATE POLICY "Allow individual read access to students" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Allow students to view their own receipts and admins to view all.
CREATE POLICY "Allow individual and admin access to receipts" ON public.receipts
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM students WHERE id = student_id) 
    OR (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff'
  );

-- Policy: Allow students to insert their own receipts.
CREATE POLICY "Allow individual insert for receipts" ON public.receipts
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.students WHERE id = student_id)
  );

-- Policy: Allow admins to update receipts.
CREATE POLICY "Allow admin update for receipts" ON public.receipts
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff'
  );

-- Policy: Allow students to see their own clearance status and admins to see all.
CREATE POLICY "Allow individual and admin read access to clearance_status" ON public.clearance_status
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM students WHERE id = student_id) OR (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff');

-- Policy: Allow admins to update clearance statuses.
CREATE POLICY "Allow admin update for clearance_status" ON public.clearance_status
  FOR UPDATE USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'staff');

-- 7. Insert initial data for 'units'
DO $$
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'units_name_key') THEN
        ALTER TABLE public.units ADD CONSTRAINT units_name_key UNIQUE (name);
    END IF;
END $$;

INSERT INTO public.units (name, description, priority) VALUES
('ICT', 'Handles all technology-related clearances.', 'high'),
('Bursary', 'Handles all financial clearances and school fees.', 'high'),
('Library', 'Clearance from the university library.', 'medium'),
('Student Affairs', 'Handles student conduct and welfare clearance.', 'medium'),
('Exams & Records', 'Handles academic records and examination clearance.', 'high'),
('Faculty', 'Clearance from the student''s faculty.', 'medium'),
('Department', 'Clearance from the student''s department.', 'medium'),
('Hospital', 'Clearance from the university hospital/clinic.', 'low'),
('Admissions', 'Handles admission and matriculation clearance.', 'high'),
('Accounts', 'Account settlement and payment verification', 'high')
ON CONFLICT (name) DO NOTHING;

-- 8. Update existing receipts table if needed (fee-based system)
DO $$
BEGIN
    -- Remove unit_id column if it exists (already removed, so this is safe)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'unit_id') THEN
        ALTER TABLE public.receipts DROP COLUMN unit_id;
    END IF;
    
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'fee_id') THEN
        ALTER TABLE public.receipts ADD COLUMN fee_id uuid REFERENCES public.fees(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'file_path') THEN
        ALTER TABLE public.receipts ADD COLUMN file_path text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'academic_year') THEN
        ALTER TABLE public.receipts ADD COLUMN academic_year integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'semester') THEN
        ALTER TABLE public.receipts ADD COLUMN semester varchar(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'approved_by_bursary') THEN
        ALTER TABLE public.receipts ADD COLUMN approved_by_bursary boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'approved_by_accounts') THEN
        ALTER TABLE public.receipts ADD COLUMN approved_by_accounts boolean DEFAULT false;
    END IF;
END $$;

-- End of script.

