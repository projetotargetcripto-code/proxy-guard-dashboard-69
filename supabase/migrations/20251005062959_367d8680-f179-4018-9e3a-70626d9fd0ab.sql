-- Remover associação de serviços das instâncias
UPDATE public.instances
SET service_id = null;

-- Deletar todos os serviços existentes
DELETE FROM public.services;