-- Create enum for instance status
CREATE TYPE public.instance_status AS ENUM ('Repouso', 'Aquecendo', 'Disparando', 'Banida');

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for services
CREATE POLICY "read_all_services" ON public.services FOR SELECT USING (true);
CREATE POLICY "allow_all_services_insert" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_services_update" ON public.services FOR UPDATE USING (true);
CREATE POLICY "allow_all_services_delete" ON public.services FOR DELETE USING (true);

-- Add service_id and status columns to instances table
ALTER TABLE public.instances 
ADD COLUMN service_id UUID REFERENCES public.services(id),
ADD COLUMN status instance_status NOT NULL DEFAULT 'Repouso';

-- Create trigger for services updated_at
CREATE TRIGGER set_updated_at_services
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Insert some default services
INSERT INTO public.services (name, description) VALUES
('WhatsApp Business', 'Serviço para automação de WhatsApp Business'),
('Instagram DM', 'Serviço para automação de Direct Messages do Instagram'),
('Facebook Messenger', 'Serviço para automação do Facebook Messenger'),
('Telegram Bot', 'Serviço para automação de bots do Telegram');