-- Update the trigger to set account_id from user's profile when service_id is NULL
CREATE OR REPLACE FUNCTION public.sync_instance_account_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Se service_id é NULL e não está emprestada, pegar o account_id do usuário atual
  IF NEW.service_id IS NULL AND NEW.borrowed_by_user_id IS NULL THEN
    SELECT account_id
    INTO NEW.account_id
    FROM profiles
    WHERE id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$function$;