-- Function to clear multiple units when a receipt is approved
CREATE OR REPLACE FUNCTION clear_units_for_approved_receipt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if receipt was approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Clear all units associated with this fee
    UPDATE public.clearance_status cs
    SET status = 'cleared', updated_at = now()
    FROM public.fee_unit_mappings fum
    JOIN public.units u ON fum.unit_name = u.name
    WHERE cs.unit_id = u.id
      AND fum.fee_id = NEW.fee_id
      AND cs.user_id = (
        SELECT s.user_id 
        FROM public.students s 
        WHERE s.id = NEW.student_id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic clearance
DROP TRIGGER IF EXISTS trigger_clear_units_on_receipt_approval ON public.receipts;
CREATE TRIGGER trigger_clear_units_on_receipt_approval
  AFTER UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION clear_units_for_approved_receipt();