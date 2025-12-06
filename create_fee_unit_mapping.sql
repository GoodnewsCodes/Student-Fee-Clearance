-- Create fee-unit mapping table for multi-unit clearances
CREATE TABLE IF NOT EXISTS public.fee_unit_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fee_id uuid NOT NULL,
  unit_name character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fee_unit_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT fee_unit_mappings_fee_id_fkey FOREIGN KEY (fee_id) REFERENCES public.fees(id) ON DELETE CASCADE
);

-- Insert fee-to-unit mappings based on our discussion
INSERT INTO public.fee_unit_mappings (fee_id, unit_name)
SELECT f.id, unnest(units_array) as unit_name
FROM (
  SELECT id, name,
    CASE name
      WHEN 'ACCEPTANCE FEE (NEW STUDENT)' THEN ARRAY['Admissions']
      WHEN 'FACULTY DUES (PER SEMESTER)' THEN ARRAY['Faculty']
      WHEN 'DEPARTMENTAL DUES (PER SEMESTER)' THEN ARRAY['Department']
      WHEN 'GSS FEE (PER SEMESTER)' THEN ARRAY['Bursary']
      WHEN 'ID CARD FEE' THEN ARRAY['Student Affairs']
      WHEN 'LIBRARY FEE (PER SEMESTER)' THEN ARRAY['Library']
      WHEN 'MATRICULATION FEE (NEW STUDENT)' THEN ARRAY['Admissions', 'Student Affairs']
      WHEN 'CONVOCATION FEE (FINAL YEAR STUDENTS)' THEN ARRAY['Exams & Records', 'Faculty', 'Department', 'Student Affairs']
      WHEN 'ALUMNI FEE (FINAL YEAR STUDENTS)' THEN ARRAY['Student Affairs', 'Faculty', 'Department']
      WHEN 'TRANSFER FEE' THEN ARRAY['Admissions']
      WHEN 'TRANSCRIPT FEE (Local)' THEN ARRAY['Exams & Records', 'Admissions']
      WHEN 'TRANSCRIPT FEE (Foreign)' THEN ARRAY['Exams & Records', 'Admissions']
      WHEN 'SPORTS LEVY (PER SESSION)' THEN ARRAY['Student Affairs', 'Faculty']
      WHEN 'MEDICAL CARE DEPOSIT (Compulsory Per session)' THEN ARRAY['Hospital']
      WHEN 'SRC LEVY (PER SESSION)' THEN ARRAY['Student Affairs']
      WHEN 'UTILITY BILL (PER SEMESTER)' THEN ARRAY['Bursary']
      WHEN 'LAB/STUDIO FEES (LAB RELATED COURSES) PER SESSION' THEN ARRAY['Department']
      WHEN 'ACCREDITATION FEES (PER SESSION)' THEN ARRAY['Bursary']
      WHEN 'PROJECT DEFENCE FEES (FINAL YEAR STUDENTS)' THEN ARRAY['Bursary', 'Department', 'Faculty']
    END as units_array
  FROM public.fees
) f
WHERE units_array IS NOT NULL;