-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "read_all_clients" 
ON public.clients 
FOR SELECT 
USING (true);

CREATE POLICY "allow_all_clients_insert" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "allow_all_clients_update" 
ON public.clients 
FOR UPDATE 
USING (true);

CREATE POLICY "allow_all_clients_delete" 
ON public.clients 
FOR DELETE 
USING (true);

-- Add client_id to services table
ALTER TABLE public.services 
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Create trigger for clients updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();