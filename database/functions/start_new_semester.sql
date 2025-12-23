CREATE OR REPLACE FUNCTION start_new_semester(new_session TEXT, new_semester TEXT)
RETURNS uuid AS $$
DECLARE
    new_semester_id uuid;
BEGIN
    -- 1. Deactivate current semesters (added WHERE clause for safety/compatibility)
    UPDATE public.semesters 
    SET is_current = false 
    WHERE is_current = true;

    -- 2. Reset student status counts for the new semester
    UPDATE public.students
    SET pending_count = 0,
        rejected_count = 0,
        cleared_count = 0;

    -- 2. Insert new semester
    INSERT INTO public.semesters (session, semester, is_current)
    VALUES (new_session, new_semester, true)
    RETURNING id INTO new_semester_id;

    -- 3. Create new clearance_status records for all students and all units (except ICT)
    INSERT INTO public.clearance_status (user_id, unit_id, semester_id, status)
    SELECT 
        p.user_id, 
        u.id as unit_id, 
        new_semester_id, 
        'submit_receipt' as status
    FROM public.profiles p
    CROSS JOIN public.units u
    WHERE p.role = 'student'
    AND u.name != 'ICT'
    ON CONFLICT (user_id, unit_id, semester_id) DO NOTHING;

    RETURN new_semester_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
