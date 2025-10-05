-- Criar função para sincronizar account_id nas instâncias
CREATE OR REPLACE FUNCTION public.sync_instance_account_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se a instância não é gerenciada por ZapGuard, pegar o account_id do usuário dono do serviço
  IF NOT NEW.managed_by_zapguard AND NEW.service_id IS NOT NULL THEN
    SELECT p.account_id
    INTO NEW.account_id
    FROM profiles p
    JOIN services s ON s.user_id = p.id
    WHERE s.id = NEW.service_id;
  END IF;
  
  -- Se a instância é gerenciada por ZapGuard e está emprestada, pegar o account_id do usuário que pegou emprestado
  IF NEW.managed_by_zapguard AND NEW.borrowed_by_user_id IS NOT NULL THEN
    SELECT account_id
    INTO NEW.account_id
    FROM profiles
    WHERE id = NEW.borrowed_by_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para INSERT
CREATE TRIGGER sync_instance_account_id_on_insert
BEFORE INSERT ON public.instances
FOR EACH ROW
EXECUTE FUNCTION public.sync_instance_account_id();

-- Criar trigger para UPDATE
CREATE TRIGGER sync_instance_account_id_on_update
BEFORE UPDATE ON public.instances
FOR EACH ROW
EXECUTE FUNCTION public.sync_instance_account_id();