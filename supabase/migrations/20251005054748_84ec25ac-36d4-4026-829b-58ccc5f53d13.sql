-- First, create profile if it doesn't exist
INSERT INTO profiles (id, email)
VALUES ('2f9d5c69-7329-4ec0-980d-10b176689a8f', 'vistaprodutora@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- Then add admin role
INSERT INTO user_roles (user_id, role) 
VALUES ('2f9d5c69-7329-4ec0-980d-10b176689a8f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;