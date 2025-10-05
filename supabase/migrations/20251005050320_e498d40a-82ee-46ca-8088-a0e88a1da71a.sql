-- 1. Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles (cada usuário vê apenas seu próprio perfil)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Adicionar user_id às tabelas principais
ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.proxies ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Migrar dados existentes para o primeiro usuário autenticado
-- (assumindo que há pelo menos um usuário já cadastrado)
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Pega o ID do primeiro usuário
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  
  -- Se existir um usuário, atribui todos os dados a ele
  IF first_user_id IS NOT NULL THEN
    -- Criar perfil se não existir
    INSERT INTO public.profiles (id, email)
    SELECT id, email FROM auth.users WHERE id = first_user_id
    ON CONFLICT (id) DO NOTHING;
    
    -- Atribuir todos os clientes ao primeiro usuário
    UPDATE public.clients SET user_id = first_user_id WHERE user_id IS NULL;
    
    -- Atribuir todos os proxies ao primeiro usuário
    UPDATE public.proxies SET user_id = first_user_id WHERE user_id IS NULL;
  END IF;
END $$;

-- Tornar user_id obrigatório
ALTER TABLE public.clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.proxies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.proxies ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. Criar funções de segurança (Security Definer)
CREATE OR REPLACE FUNCTION public.user_owns_client(client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients
    WHERE id = client_id
      AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.user_owns_service(service_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.services s
    INNER JOIN public.clients c ON s.client_id = c.id
    WHERE s.id = service_id
      AND c.user_id = auth.uid()
  )
$$;

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
    LEFT JOIN public.clients c ON s.client_id = c.id
    WHERE i.id = instance_id
      AND (c.user_id = auth.uid() OR i.service_id IS NULL)
  )
$$;

CREATE OR REPLACE FUNCTION public.user_owns_proxy(proxy_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proxies
    WHERE id = proxy_id
      AND user_id = auth.uid()
  )
$$;

-- 5. Atualizar políticas RLS para CLIENTS
DROP POLICY IF EXISTS "allow_all_clients_delete" ON public.clients;
DROP POLICY IF EXISTS "allow_all_clients_insert" ON public.clients;
DROP POLICY IF EXISTS "allow_all_clients_update" ON public.clients;
DROP POLICY IF EXISTS "read_all_clients" ON public.clients;

CREATE POLICY "Users can view own clients"
  ON public.clients
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own clients"
  ON public.clients
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own clients"
  ON public.clients
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own clients"
  ON public.clients
  FOR DELETE
  USING (user_id = auth.uid());

-- 6. Atualizar políticas RLS para SERVICES
DROP POLICY IF EXISTS "allow_all_services_delete" ON public.services;
DROP POLICY IF EXISTS "allow_all_services_insert" ON public.services;
DROP POLICY IF EXISTS "allow_all_services_update" ON public.services;
DROP POLICY IF EXISTS "read_all_services" ON public.services;

CREATE POLICY "Users can view own services"
  ON public.services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = services.client_id
        AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert services for own clients"
  ON public.services
  FOR INSERT
  WITH CHECK (public.user_owns_client(client_id));

CREATE POLICY "Users can update own services"
  ON public.services
  FOR UPDATE
  USING (public.user_owns_service(id));

CREATE POLICY "Users can delete own services"
  ON public.services
  FOR DELETE
  USING (public.user_owns_service(id));

-- 7. Atualizar políticas RLS para INSTANCES
DROP POLICY IF EXISTS "allow_all_instances_delete" ON public.instances;
DROP POLICY IF EXISTS "allow_all_instances_insert" ON public.instances;
DROP POLICY IF EXISTS "allow_all_instances_update" ON public.instances;
DROP POLICY IF EXISTS "read_all_instances" ON public.instances;

CREATE POLICY "Users can view own instances"
  ON public.instances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.services s
      INNER JOIN public.clients c ON s.client_id = c.id
      WHERE s.id = instances.service_id
        AND c.user_id = auth.uid()
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

-- 8. Atualizar políticas RLS para PROXIES
DROP POLICY IF EXISTS "allow_all_proxies_delete" ON public.proxies;
DROP POLICY IF EXISTS "allow_all_proxies_insert" ON public.proxies;
DROP POLICY IF EXISTS "allow_all_proxies_update" ON public.proxies;
DROP POLICY IF EXISTS "read_all_proxies" ON public.proxies;

CREATE POLICY "Users can view own proxies"
  ON public.proxies
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own proxies"
  ON public.proxies
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own proxies"
  ON public.proxies
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own proxies"
  ON public.proxies
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();