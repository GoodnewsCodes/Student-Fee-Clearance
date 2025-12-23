CREATE OR REPLACE FUNCTION clear_units_for_approved_receipt()
RETURNS TRIGGER AS $$
DECLARE
    v_unit_id uuid;
    v_user_id uuid;
    v_fee_unit_name text;
BEGIN
    -- Get user_id from student_id
    SELECT user_id INTO v_user_id FROM public.students WHERE id = NEW.student_id;
    
    -- Get unit name from fee
    SELECT unit INTO v_fee_unit_name FROM public.fees WHERE id = NEW.fee_id;
    
    -- Get unit_id from unit name
    SELECT id INTO v_unit_id FROM public.units WHERE name = v_fee_unit_name;

    -- Handle INSERT (New Receipt Upload)
    IF (TG_OP = 'INSERT') THEN
        -- Update clearance status to pending
        IF v_unit_id IS NOT NULL AND v_user_id IS NOT NULL THEN
            UPDATE public.clearance_status
            SET status = 'pending',
                updated_at = now()
            WHERE user_id = v_user_id
            AND unit_id = v_unit_id
            AND (semester_id = NEW.semester_id OR (semester_id IS NULL AND NEW.semester_id IS NULL));
        END IF;

        -- Increment pending count
        UPDATE public.students
        SET pending_count = pending_count + 1
        WHERE id = NEW.student_id;
    END IF;

    -- Handle UPDATE
    IF (TG_OP = 'UPDATE') THEN
        -- If status changed to approved
        IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
            -- Update clearance status to cleared
            IF v_unit_id IS NOT NULL AND v_user_id IS NOT NULL THEN
                UPDATE public.clearance_status
                SET status = 'cleared',
                    updated_at = now()
                WHERE user_id = v_user_id
                AND unit_id = v_unit_id
                AND (semester_id = NEW.semester_id OR (semester_id IS NULL AND NEW.semester_id IS NULL));
            END IF;

            -- Decrement pending count and increment cleared count
            UPDATE public.students
            SET pending_count = GREATEST(0, pending_count - 1),
                cleared_count = cleared_count + 1
            WHERE id = NEW.student_id;
        END IF;

        -- If status changed to rejected
        IF (NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected')) THEN
             -- Update clearance status to rejected
            IF v_unit_id IS NOT NULL AND v_user_id IS NOT NULL THEN
                UPDATE public.clearance_status
                SET status = 'rejected',
                    updated_at = now()
                WHERE user_id = v_user_id
                AND unit_id = v_unit_id
                AND (semester_id = NEW.semester_id OR (semester_id IS NULL AND NEW.semester_id IS NULL));
            END IF;

            -- Increment rejected count and decrement pending count
            UPDATE public.students
            SET rejected_count = rejected_count + 1,
                pending_count = GREATEST(0, pending_count - 1)
            WHERE id = NEW.student_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
