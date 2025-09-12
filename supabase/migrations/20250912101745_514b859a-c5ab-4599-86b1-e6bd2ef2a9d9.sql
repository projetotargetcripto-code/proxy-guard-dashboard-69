-- Add API tracking columns to instances table
ALTER TABLE public.instances 
ADD COLUMN sent_to_api boolean DEFAULT false,
ADD COLUMN api_sent_at timestamp with time zone DEFAULT null;