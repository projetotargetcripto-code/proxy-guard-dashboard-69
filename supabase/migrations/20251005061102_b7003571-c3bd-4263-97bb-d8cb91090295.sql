-- Adicionar políticas RLS para admins visualizarem todos os dados

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins podem ver todas as instâncias
CREATE POLICY "Admins can view all instances"
ON public.instances
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins podem ver todos os proxies
CREATE POLICY "Admins can view all proxies"
ON public.proxies
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins podem ver todos os serviços
CREATE POLICY "Admins can view all services"
ON public.services
FOR SELECT
USING (public.is_admin(auth.uid()));