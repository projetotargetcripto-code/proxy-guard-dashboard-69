-- Adicionar campos para gestão ZapGuard nas instâncias

ALTER TABLE public.instances
ADD COLUMN managed_by_zapguard boolean NOT NULL DEFAULT false,
ADD COLUMN borrowed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN borrowed_until timestamp with time zone;

-- Marcar as instâncias existentes criadas pelo admin como "Gestão ZapGuard"
-- Assumindo que instâncias sem service_id foram criadas pelo admin
UPDATE public.instances
SET managed_by_zapguard = true
WHERE service_id IS NULL;

-- Atualizar política RLS para permitir usuários verem instâncias emprestadas
DROP POLICY IF EXISTS "Users can view own instances" ON public.instances;

CREATE POLICY "Users can view own instances"
ON public.instances
FOR SELECT
USING (
  (EXISTS (
    SELECT 1
    FROM services s
    WHERE s.id = instances.service_id
      AND s.user_id = auth.uid()
  ))
  OR (service_id IS NULL)
  OR (borrowed_by_user_id = auth.uid())
);

-- Comentário explicativo
COMMENT ON COLUMN public.instances.managed_by_zapguard IS 'Indica se a instância é gerenciada pela ZapGuard (criada pelo admin)';
COMMENT ON COLUMN public.instances.borrowed_by_user_id IS 'Usuário que está usando temporariamente esta instância';
COMMENT ON COLUMN public.instances.borrowed_until IS 'Data/hora até quando a instância está emprestada';