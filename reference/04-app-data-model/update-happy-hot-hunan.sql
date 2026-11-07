-- Run once in Supabase SQL Editor if your database was already seeded
UPDATE kiosks
SET
  location_name = 'Happy Hot Hunan',
  address = '969 Amsterdam Ave, New York, NY 10025'
WHERE id = '11111111-0000-0000-0000-000000000001';
