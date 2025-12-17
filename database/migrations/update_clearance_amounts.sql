-- Update clearance_status table to calculate amount_owed based on applicable fees
UPDATE public.clearance_status 
SET amount_owed = (
  SELECT COALESCE(SUM(f.amount), 0)
  FROM public.fees f
  JOIN public.fee_unit_mappings fum ON f.id = fum.fee_id
  JOIN public.units u ON clearance_status.unit_id = u.id
  WHERE fum.unit_name = u.name
);

-- Update status to 'submit_receipt' for units that have fees
UPDATE public.clearance_status 
SET status = 'submit_receipt'
WHERE amount_owed > 0 AND status = 'pending';