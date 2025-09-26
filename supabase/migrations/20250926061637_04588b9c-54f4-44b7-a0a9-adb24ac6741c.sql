-- Add account_id column to clients table
ALTER TABLE public.clients 
ADD COLUMN account_id INTEGER;

-- Add inbox_id column to instances table  
ALTER TABLE public.instances 
ADD COLUMN inbox_id TEXT;