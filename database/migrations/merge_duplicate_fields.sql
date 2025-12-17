-- Merge duplicate fields: track_no -> track_no, name -> name

-- 1. First, check for duplicates and clean them up
-- Find duplicate track numbers (using current column name)
SELECT track_no, COUNT(*) 
FROM public.students 
GROUP BY track_no 
HAVING COUNT(*) > 1;

-- Remove duplicate students (keep the first record based on created_at)
DELETE FROM public.students 
WHERE id NOT IN (
    SELECT DISTINCT ON (track_no) id
    FROM public.students 
    ORDER BY track_no, created_at ASC
);

-- 2. Update students table: rename name to name (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'students' AND column_name = 'name') THEN
        ALTER TABLE public.students RENAME COLUMN name TO name;
    END IF;
END $$;

-- Update the unique constraint name (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_track_no_key') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_track_no_key UNIQUE (track_no);
    END IF;
END $$;

-- 3. Update profiles table: rename name to name (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'name') THEN
        ALTER TABLE public.profiles RENAME COLUMN name TO name;
    END IF;
END $$;

-- 4. Update table comments
COMMENT ON COLUMN public.students.track_no IS 'Student registration/track number';
COMMENT ON COLUMN public.students.name IS 'Student full name';


