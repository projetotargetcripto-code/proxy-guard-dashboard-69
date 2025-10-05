-- Adicionar account_id à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN account_id integer;

-- Adicionar account_id à tabela instances
ALTER TABLE public.instances
ADD COLUMN account_id integer;

-- Criar função para obter account_id do usuário ou do borrower
CREATE OR REPLACE FUNCTION public.get_instance_account_id(instance_row instances)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT account_id FROM profiles WHERE id = instance_row.borrowed_by_user_id),
    (SELECT p.account_id FROM profiles p 
     JOIN services s ON s.user_id = p.id 
     WHERE s.id = instance_row.service_id)
  )
$$;

-- Adicionar política RLS para admins gerenciarem profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all profiles"
ON public.profiles
FOR DELETE
USING (is_admin(auth.uid()));