-- 1. Criar ENUM para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Criar tabela user_roles (conforme melhores práticas de segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Criar função de segurança para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Criar função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- 5. Políticas RLS para user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- 6. Adicionar user_id à tabela services
ALTER TABLE public.services ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. Migrar dados: copiar user_id dos clients para services
UPDATE public.services s
SET user_id = c.user_id
FROM public.clients c
WHERE s.client_id = c.id;

-- 8. Tornar user_id obrigatório em services
ALTER TABLE public.services ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 9. REMOVER TODAS AS POLÍTICAS QUE DEPENDEM DE client_id e funções antigas
DROP POLICY IF EXISTS "Users can view own services" ON public.services;
DROP POLICY IF EXISTS "Users can insert services for own clients" ON public.services;
DROP POLICY IF EXISTS "Users can update own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete own services" ON public.services;
DROP POLICY IF EXISTS "Users can view own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can insert own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can update own instances" ON public.instances;
DROP POLICY IF EXISTS "Users can delete own instances" ON public.instances;

-- 10. Remover client_id de services AGORA
ALTER TABLE public.services DROP COLUMN client_id;

-- 11. Remover funções antigas (agora que as políticas foram removidas)
DROP FUNCTION IF EXISTS public.user_owns_client(UUID);
DROP FUNCTION IF EXISTS public.user_owns_service(UUID);
DROP FUNCTION IF EXISTS public.user_owns_instance(UUID);

-- 12. Criar nova função user_owns_service
CREATE OR REPLACE FUNCTION public.user_owns_service(service_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.services
    WHERE id = service_id
      AND user_id = auth.uid()
  )
$$;

-- 13. Criar função user_owns_instance (não depende mais de clients)
CREATE OR REPLACE FUNCTION public.user_owns_instance(instance_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.instances i
    LEFT JOIN public.services s ON i.service_id = s.id
    WHERE i.id = instance_id
      AND (s.user_id = auth.uid() OR i.service_id IS NULL)
  )
$$;

-- 14. CRIAR NOVAS POLÍTICAS para services
CREATE POLICY "Users can view own services"
  ON public.services
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own services"
  ON public.services
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own services"
  ON public.services
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own services"
  ON public.services
  FOR DELETE
  USING (user_id = auth.uid());

-- 15. CRIAR NOVAS POLÍTICAS para instances
CREATE POLICY "Users can view own instances"
  ON public.instances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.services s
      WHERE s.id = instances.service_id
        AND s.user_id = auth.uid()
    ) OR service_id IS NULL
  );

CREATE POLICY "Users can insert own instances"
  ON public.instances
  FOR INSERT
  WITH CHECK (
    service_id IS NULL OR public.user_owns_service(service_id)
  );

CREATE POLICY "Users can update own instances"
  ON public.instances
  FOR UPDATE
  USING (public.user_owns_instance(id));

CREATE POLICY "Users can delete own instances"
  ON public.instances
  FOR DELETE
  USING (public.user_owns_instance(id));

-- 16. Deletar tabela clients
DROP TABLE IF EXISTS public.clients CASCADE;

-- 17. Atribuir role admin ao primeiro usuário existente
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Pega o ID do primeiro usuário
  SELECT id INTO first_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  
  -- Se existir um usuário, atribui role de admin
  IF first_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;