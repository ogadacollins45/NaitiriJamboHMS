-- Insert 50 Random Lab Requests - CORRECTED VERSION
-- Using actual column names from lab_requests table

INSERT INTO lab_requests (request_number, patient_id, doctor_id, priority, status, clinical_notes, request_date, created_at, updated_at) VALUES
('LAB-2026-001', 1, 1, 'stat', 'pending', 'Urgent - High fever', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW()),
('LAB-2026-002', 2, 1, 'routine', 'sample_collected', 'Regular checkup', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW()),
('LAB-2026-003', 3, 1, 'urgent', 'processing', 'Follow-up tests', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), NOW()),
('LAB-2026-004', 4, 1, 'routine', 'pending', 'Annual screening', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW()),
('LAB-2026-005', 1, 1, 'stat', 'sample_collected', 'Suspected infection', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NOW()),
('LAB-2026-006', 2, 1, 'routine', 'pending', 'Routine blood work', NOW(), NOW(), NOW()),
('LAB-2026-007', 3, 1, 'urgent', 'processing', 'Abnormal symptoms', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
('LAB-2026-008', 4, 1, 'routine', 'sample_collected', 'Pre-surgery screening', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW()),
('LAB-2026-009', 1, 1, 'stat', 'pending', 'Emergency - Chest pain', NOW(), NOW(), NOW()),
('LAB-2026-010', 2, 1, 'routine', 'pending', 'Diabetes monitoring', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW(), NOW()),
('LAB-2026-011', 3, 1, 'urgent', 'sample_collected', 'High blood pressure', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NOW()),
('LAB-2026-012', 4, 1, 'routine', 'processing', 'Cholesterol check', DATE_SUB(NOW(), INTERVAL 12 DAY), NOW(), NOW()),
('LAB-2026-013', 1, 1, 'stat', 'pending', 'Severe headache', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW()),
('LAB-2026-014', 2, 1, 'routine', 'sample_collected', 'Thyroid function', DATE_SUB(NOW(), INTERVAL 14 DAY), NOW(), NOW()),
('LAB-2026-015', 3, 1, 'urgent', 'pending', 'Abdominal pain', NOW(), NOW(), NOW()),
('LAB-2026-016', 4, 1, 'routine', 'processing', 'Liver function', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW()),
('LAB-2026-017', 1, 1, 'stat', 'sample_collected', 'Trauma case', DATE_SUB(NOW(), INTERVAL 17 DAY), NOW(), NOW()),
('LAB-2026-018', 2, 1, 'routine', 'pending', 'General wellness', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), NOW()),
('LAB-2026-019', 3, 1, 'urgent', 'processing', 'Shortness of breath', DATE_SUB(NOW(), INTERVAL 19 DAY), NOW(), NOW()),
('LAB-2026-020', 4, 1, 'routine', 'sample_collected', 'Medication monitoring', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW(), NOW()),
('LAB-2026-021', 1, 1, 'stat', 'pending', 'Acute illness', NOW(), NOW(), NOW()),
('LAB-2026-022', 2, 1, 'routine', 'pending', 'Pregnancy test', DATE_SUB(NOW(), INTERVAL 22 DAY), NOW(), NOW()),
('LAB-2026-023', 3, 1, 'urgent', 'sample_collected', 'Persistent cough', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NOW()),
('LAB-2026-024', 4, 1, 'routine', 'processing', 'Kidney function', DATE_SUB(NOW(), INTERVAL 24 DAY), NOW(), NOW()),
('LAB-2026-025', 1, 1, 'stat', 'pending', 'High fever - child', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW()),
('LAB-2026-026', 2, 1, 'routine', 'sample_collected', 'Vitamin levels', DATE_SUB(NOW(), INTERVAL 26 DAY), NOW(), NOW()),
('LAB-2026-027', 3, 1, 'urgent', 'pending', 'Dizziness', DATE_SUB(NOW(), INTERVAL 9 DAY), NOW(), NOW()),
('LAB-2026-028', 4, 1, 'routine', 'processing', 'Anemia check', DATE_SUB(NOW(), INTERVAL 28 DAY), NOW(), NOW()),
('LAB-2026-029', 1, 1, 'stat', 'sample_collected', 'Suspected appendicitis', NOW(), NOW(), NOW()),
('LAB-2026-030', 2, 1, 'routine', 'pending', 'Nutritional assessment', DATE_SUB(NOW(), INTERVAL 11 DAY), NOW(), NOW()),
('LAB-2026-031', 3, 1, 'urgent', 'processing', 'Joint pain', DATE_SUB(NOW(), INTERVAL 15 DAY), NOW(), NOW()),
('LAB-2026-032', 4, 1, 'routine', 'sample_collected', 'Heart health', DATE_SUB(NOW(), INTERVAL 13 DAY), NOW(), NOW()),
('LAB-2026-033', 1, 1, 'stat', 'pending', 'Seizure activity', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW()),
('LAB-2026-034', 2, 1, 'routine', 'pending', 'Bone density', DATE_SUB(NOW(), INTERVAL 18 DAY), NOW(), NOW()),
('LAB-2026-035', 3, 1, 'urgent', 'sample_collected', 'Skin rash investigation', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
('LAB-2026-036', 4, 1, 'routine', 'processing', 'Prostate screening', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW(), NOW()),
('LAB-2026-037', 1, 1, 'stat', 'pending', 'Motor vehicle accident', NOW(), NOW(), NOW()),
('LAB-2026-038', 2, 1, 'routine', 'sample_collected', 'Immunization titers', DATE_SUB(NOW(), INTERVAL 16 DAY), NOW(), NOW()),
('LAB-2026-039', 3, 1, 'urgent', 'pending', 'Weight loss investigation', DATE_SUB(NOW(), INTERVAL 21 DAY), NOW(), NOW()),
('LAB-2026-040', 4, 1, 'routine', 'processing', 'Memory concerns', DATE_SUB(NOW(), INTERVAL 25 DAY), NOW(), NOW()),
('LAB-2026-041', 1, 1, 'stat', 'sample_collected', 'Fall from height', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), NOW()),
('LAB-2026-042', 2, 1, 'routine', 'pending', 'Cancer screening', NOW(), NOW(), NOW()),
('LAB-2026-043', 3, 1, 'urgent', 'processing', 'Fatigue workup', DATE_SUB(NOW(), INTERVAL 27 DAY), NOW(), NOW()),
('LAB-2026-044', 4, 1, 'routine', 'sample_collected', 'STD screening', DATE_SUB(NOW(), INTERVAL 23 DAY), NOW(), NOW()),
('LAB-2026-045', 1, 1, 'stat', 'pending', 'Poisoning suspected', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW()),
('LAB-2026-046', 2, 1, 'routine', 'pending', 'Travel health', DATE_SUB(NOW(), INTERVAL 29 DAY), NOW(), NOW()),
('LAB-2026-047', 3, 1, 'urgent', 'sample_collected', 'Chronic pain', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW(), NOW()),
('LAB-2026-048', 4, 1, 'routine', 'processing', 'Sports physical', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), NOW()),
('LAB-2026-049', 1, 1, 'stat', 'pending', 'Allergic reaction', NOW(), NOW(), NOW()),
('LAB-2026-050', 2, 1, 'routine', 'sample_collected', 'Post-treatment follow-up', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NOW());

-- Get base ID
SET @base_id = LAST_INSERT_ID();

-- Add lab request tests (1-2 tests per request)
INSERT INTO lab_request_tests (lab_request_id, test_template_id, status, created_at, updated_at)
SELECT 
    lr.id,
    CASE (lr.id % 5)
        WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE 7
    END,
    'pending', NOW(), NOW()
FROM lab_requests lr WHERE lr.id >= @base_id LIMIT 50;

SELECT 'SUCCESS: 50 lab requests created!' as Result;
