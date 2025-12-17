-- Drop existing policies first
DROP POLICY IF EXISTS "Students can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow cleanup of receipts" ON storage.objects;

-- Allow students to upload receipts
CREATE POLICY "Students can upload receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'receipts'
);

-- Allow admins to view receipts
CREATE POLICY "Admins can view receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
);

-- Allow cleanup of failed uploads
CREATE POLICY "Allow cleanup of receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
);
