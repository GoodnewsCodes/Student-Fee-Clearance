-- Check if student exists and get their ID
SELECT s.*, p.name, p.track_no 
FROM students s 
JOIN profiles p ON s.user_id = p.user_id 
WHERE p.track_no = '25/132001';
