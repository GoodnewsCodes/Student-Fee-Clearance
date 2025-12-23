-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow individual read access to notifications
DROP POLICY IF EXISTS "Allow individual read access to notifications" ON public.notifications;
CREATE POLICY "Allow individual read access to notifications" ON public.notifications
FOR SELECT
TO public
USING (auth.uid() = (SELECT students.user_id FROM students WHERE students.id = notifications.student_id));

-- Policy: Allow staff to manage notifications
DROP POLICY IF EXISTS "Allow staff to manage notifications" ON public.notifications;
CREATE POLICY "Allow staff to manage notifications" ON public.notifications
FOR ALL
TO public
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'staff'));
