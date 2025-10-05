-- Adicionar coluna user_id na tabela instances para rastrear o dono da instância
ALTER TABLE public.instances 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Definir user_id automaticamente como auth.uid() para novas inserções
ALTER TABLE public.instances 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Atualizar instâncias existentes que não têm service_id para ter o user_id do dono do serviço ou do proxy
UPDATE public.instances i
SET user_id = (
  CASE 
    WHEN i.service_id IS NOT NULL THEN (SELECT s.user_id FROM services s WHERE s.id = i.service_id)
    WHEN i.borrowed_by_user_id IS NOT NULL THEN i.borrowed_by_user_id
    ELSE (SELECT p.user_id FROM proxies p WHERE p.id = i.proxy_id)
  END
)
WHERE i.user_id IS NULL;

-- Tornar user_id NOT NULL após preencher os valores existentes
ALTER TABLE public.instances 
ALTER COLUMN user_id SET NOT NULL;

-- Atualizar política de INSERT para permitir usuários criarem suas próprias instâncias
DROP POLICY IF EXISTS "Users can insert own instances" ON public.instances;
CREATE POLICY "Users can insert own instances"
ON public.instances
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR
  ((service_id IS NULL) OR (EXISTS (
    SELECT 1 FROM services s
    WHERE s.id = instances.service_id AND s.user_id = auth.uid()
  )))
);

-- Atualizar política de SELECT para incluir instâncias do próprio usuário
DROP POLICY IF EXISTS "Users can view own instances" ON public.instances;
CREATE POLICY "Users can view own instances"
ON public.instances
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  borrowed_by_user_id = auth.uid() OR
  (EXISTS (
    SELECT 1 FROM services s
    WHERE s.id = instances.service_id AND s.user_id = auth.uid()
  ))
);

-- Atualizar função user_owns_instance para verificar também o user_id
CREATE OR REPLACE FUNCTION public.user_owns_instance(instance_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM instances i
    LEFT JOIN services s ON s.id = i.service_id
    WHERE i.id = instance_id
      AND (s.user_id = auth.uid() OR i.user_id = auth.uid())
  );
$$;