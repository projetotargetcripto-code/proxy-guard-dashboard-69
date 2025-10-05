-- Corrigir instâncias gerenciadas pelo ZapGuard para usar account_id 0
UPDATE public.instances
SET instance_number = '0-' || SPLIT_PART(instance_number, '-', 2)
WHERE managed_by_zapguard = true
  AND instance_number NOT LIKE '0-%';

-- Garantir que instâncias do admin sempre comecem com 0-
UPDATE public.instances i
SET instance_number = '0-' || SPLIT_PART(instance_number, '-', 2)
WHERE EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = i.user_id
    AND ur.role = 'admin'
)
AND instance_number NOT LIKE '0-%';