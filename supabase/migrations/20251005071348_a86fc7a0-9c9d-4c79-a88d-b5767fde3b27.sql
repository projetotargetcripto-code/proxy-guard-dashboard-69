-- Remover política existente que permite ver instâncias sem service_id
DROP POLICY IF EXISTS "Users can view own instances" ON public.instances;

-- Criar nova política mais restritiva
CREATE POLICY "Users can view own instances"
ON public.instances
FOR SELECT
USING (
  -- Instâncias do próprio usuário (via service)
  (EXISTS (
    SELECT 1
    FROM services s
    WHERE s.id = instances.service_id 
    AND s.user_id = auth.uid()
  ))
  OR 
  -- Instâncias emprestadas para o usuário
  (borrowed_by_user_id = auth.uid())
);