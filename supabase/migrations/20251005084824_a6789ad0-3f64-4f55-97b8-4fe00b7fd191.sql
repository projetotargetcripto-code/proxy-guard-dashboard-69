-- Alterar o tipo da coluna instance_number de integer para text
ALTER TABLE public.instances 
ALTER COLUMN instance_number TYPE text USING instance_number::text;

-- Atualizar instâncias existentes para incluir account_id no número
UPDATE public.instances
SET instance_number = COALESCE(account_id::text, '0') || '-' || instance_number
WHERE instance_number NOT LIKE '%-%';

-- Remover a constraint única antiga se existir
ALTER TABLE public.instances 
DROP CONSTRAINT IF EXISTS instances_instance_number_key;

-- Adicionar nova constraint única para instance_number
ALTER TABLE public.instances 
ADD CONSTRAINT instances_instance_number_key UNIQUE (instance_number);