-- Adicionar colunas para PPX (persistência do ID e ordem de regra)
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS ppx_proxy_id integer;
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS ppx_rule_order integer;

-- Unificar colunas de proxy na tabela instances para simplificar geração do PPX
-- (mantendo a referência ao proxy separado mas adicionando campos diretos)
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS proxy_name text;
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS proxy_ip text;  
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS proxy_port integer;
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS proxy_login text;
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS proxy_password text;

-- Função para sincronizar dados do proxy com a instância
CREATE OR REPLACE FUNCTION sync_instance_proxy_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma instância é inserida ou atualizada, sincronizar dados do proxy
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT p.name, p.ip, p.port, p.username, p.password
    INTO NEW.proxy_name, NEW.proxy_ip, NEW.proxy_port, NEW.proxy_login, NEW.proxy_password
    FROM proxies p
    WHERE p.id = NEW.proxy_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para sincronizar dados do proxy automaticamente
DROP TRIGGER IF EXISTS sync_instance_proxy_data_trigger ON public.instances;
CREATE TRIGGER sync_instance_proxy_data_trigger
  BEFORE INSERT OR UPDATE ON public.instances
  FOR EACH ROW
  EXECUTE FUNCTION sync_instance_proxy_data();

-- Sincronizar dados existentes
UPDATE public.instances 
SET proxy_name = p.name,
    proxy_ip = p.ip,
    proxy_port = p.port, 
    proxy_login = p.username,
    proxy_password = p.password
FROM proxies p 
WHERE instances.proxy_id = p.id;