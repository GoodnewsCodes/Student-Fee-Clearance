-- Add columns to students table to track status counts
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS pending_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejected_count integer DEFAULT 0;

-- Add rejection_reason to receipts if not exists
ALTER TABLE public.receipts
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update the function to handle INSERT (upload), UPDATE (approval/rejection), and DELETE
CREATE OR REPLACE FUNCTION clear_units_for_approved_receipt()
RETURNS TRIGGER AS $$
DECLARE
    v_unit_id uuid;
    v_user_id uuid;
    v_fee_unit_name text;
    v_student_id uuid;
    v_fee_id uuid;
    v_semester_id uuid;
BEGIN
    -- Determine which record to use (NEW for INSERT/UPDATE, OLD for DELETE)
    IF (TG_OP = 'DELETE') THEN
        v_student_id := OLD.student_id;
        v_fee_id := OLD.fee_id;
        v_semester_id := OLD.semester_id;
    ELSE
        v_student_id := NEW.student_id;
        v_fee_id := NEW.fee_id;
        v_semester_id := NEW.semester_id;
    END IF;

    -- Get user_id from student_id
    SELECT user_id INTO v_user_id FROM public.students WHERE id = v_student_id;
    
    -- Get unit name from fee_unit_mappings (preferred)
    SELECT unit_name INTO v_fee_unit_name FROM public.fee_unit_mappings WHERE fee_id = v_fee_id;
    
    -- Fallback to fees table if not found in mapping
    IF v_fee_unit_name IS NULL THEN
        SELECT unit INTO v_fee_unit_name FROM public.fees WHERE id = v_fee_id;
    END IF;
    
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
            AND (semester_id = v_semester_id OR (semester_id IS NULL AND v_semester_id IS NULL));
        END IF;

        -- Increment pending count
        UPDATE public.students
        SET pending_count = pending_count + 1
        WHERE id = v_student_id;
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
                AND (semester_id = v_semester_id OR (semester_id IS NULL AND v_semester_id IS NULL));
            END IF;

            -- Decrement pending count
            UPDATE public.students
            SET pending_count = GREATEST(0, pending_count - 1)
            WHERE id = v_student_id;
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
                AND (semester_id = v_semester_id OR (semester_id IS NULL AND v_semester_id IS NULL));
            END IF;

            -- Increment rejected count and decrement pending count
            UPDATE public.students
            SET rejected_count = rejected_count + 1,
                pending_count = GREATEST(0, pending_count - 1)
            WHERE id = v_student_id;

            -- Create notification for the student
            INSERT INTO public.notifications (student_id, message, type)
            VALUES (
                v_student_id, 
                'Your receipt for ' || COALESCE(v_fee_unit_name, 'fee') || ' was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided'), 
                'error'
            );
        END IF;
    END IF;

    -- Handle DELETE (after rejection)
    IF (TG_OP = 'DELETE') THEN
        -- Only reset clearance status if the receipt was rejected
        IF OLD.status = 'rejected' THEN
            IF v_unit_id IS NOT NULL AND v_user_id IS NOT NULL THEN
                UPDATE public.clearance_status
                SET status = 'not_cleared',
                    updated_at = now()
                WHERE user_id = v_user_id
                AND unit_id = v_unit_id
                AND (semester_id = v_semester_id OR (semester_id IS NULL AND v_semester_id IS NULL));
            END IF;
        END IF;
    END IF;

    -- Return appropriate record
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to recreate it with correct events
DROP TRIGGER IF EXISTS trigger_clear_units_on_receipt_approval ON public.receipts;

-- Create trigger for INSERT, UPDATE, and DELETE
CREATE TRIGGER trigger_clear_units_on_receipt_approval
AFTER INSERT OR UPDATE OR DELETE ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION clear_units_for_approved_receipt();
