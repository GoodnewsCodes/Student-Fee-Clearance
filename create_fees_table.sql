-- Create fees table
CREATE TABLE IF NOT EXISTS public.fees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  amount numeric NOT NULL,
  account_number character varying NOT NULL,
  description text,
  unit character varying NOT NULL,
  department_id uuid,
  department character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fees_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read fees
CREATE POLICY "Allow authenticated users to read fees" ON public.fees
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow bursary and accounts staff to manage fees
CREATE POLICY "Allow bursary staff to manage fees" ON public.fees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND unit IN ('bursary', 'accounts')
    )
  );

-- Insert initial fees data
INSERT INTO public.fees (name, amount, account_number, description, unit) VALUES
('ACCEPTANCE FEE (NEW STUDENT)', 50000, '1027335816', 'One-time fee for new students', 'admissions'),
('FACULTY DUES (PER SEMESTER)', 10000, '1027335816', 'Dues for faculty resources', 'faculty'),
('DEPARTMENTAL DUES (PER SEMESTER)', 10000, '1027335816', 'Dues for departmental resources', 'department'),
('GSS FEE (PER SEMESTER)', 10000, '1027335816', 'General studies fee', 'bursary'),
('ID CARD FEE', 10000, '1027335816', 'Student identification card fee', 'student_affairs'),
('LIBRARY FEE (PER SEMESTER)', 10000, '1027335816', 'Access to university libraries', 'library'),
('MATRICULATION FEE (NEW STUDENT)', 20000, '1027335816', 'Fee for matriculation ceremony', 'admissions'),
('CONVOCATION FEE (FINAL YEAR STUDENTS)', 60000, '1027335816', 'Fee for graduation ceremony', 'exams'),
('ALUMNI FEE (FINAL YEAR STUDENTS)', 10000, '1027335816', 'Fee for alumni association', 'alumni'),
('TRANSFER FEE', 100000, '1027335816', 'For students transferring from other institutions', 'admissions'),
('TRANSCRIPT FEE (Local)', 50000, '1027335816', 'Processing of transcripts for local use', 'exams'),
('TRANSCRIPT FEE (Foreign)', 100000, '1027335816', 'Processing of transcripts for foreign use', 'exams'),
('SPORTS LEVY (PER SESSION)', 10000, '1027335816', 'Levy for sports activities', 'student_affairs'),
('MEDICAL CARE DEPOSIT (Compulsory Per session)', 40000, '1027335816', 'Deposit for medical services', 'hospital'),
('TECHNOLOGY FEE (PER SEMESTER)', 30000, '1027335816', 'Fee for technology services and infrastructure', 'ict'),
('SRC LEVY (PER SESSION)', 5000, '1023041667', 'Student Representative Council levy', 'student_affairs'),
('UTILITY BILL (PER SEMESTER)', 25000, '1027335816', 'Contribution to utility expenses', 'bursary'),
('LAB/STUDIO FEES (LAB RELATED COURSES) PER SESSION', 40000, '1027335816', 'Fees for laboratory or studio usage', 'department'),
('ACCREDITATION FEES (PER SESSION)', 30000, '1027335816', 'Fees for programme accreditation', 'bursary'),
('PROJECT DEFENCE FEES (FINAL YEAR STUDENTS)', 30000, '1027335816', 'Fee for final year project defence', 'department');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON public.fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();