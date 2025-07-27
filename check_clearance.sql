-- Check clearance status records
SELECT cs.*, u.name as unit_name, s.full_name 
FROM clearance_status cs
JOIN units u ON cs.unit_id = u.id
JOIN students s ON cs.student_id = s.id;