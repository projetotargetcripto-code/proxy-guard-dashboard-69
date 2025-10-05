-- Transfer all services from billionairebotz to vistaprodutora
UPDATE services 
SET user_id = '2f9d5c69-7329-4ec0-980d-10b176689a8f'
WHERE user_id = 'd83eaf3a-cca9-4c7f-806b-641b5ac31a1b';

-- Transfer all proxies from billionairebotz to vistaprodutora
UPDATE proxies 
SET user_id = '2f9d5c69-7329-4ec0-980d-10b176689a8f'
WHERE user_id = 'd83eaf3a-cca9-4c7f-806b-641b5ac31a1b';

-- Remove admin role from billionairebotz
DELETE FROM user_roles 
WHERE user_id = 'd83eaf3a-cca9-4c7f-806b-641b5ac31a1b' 
AND role = 'admin';