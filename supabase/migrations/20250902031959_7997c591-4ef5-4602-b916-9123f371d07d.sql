-- Add RLS policies for insert, update, delete operations
-- Proxies policies
CREATE POLICY "allow_all_proxies_insert" ON public.proxies FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_proxies_update" ON public.proxies FOR UPDATE USING (true);
CREATE POLICY "allow_all_proxies_delete" ON public.proxies FOR DELETE USING (true);

-- Instances policies  
CREATE POLICY "allow_all_instances_insert" ON public.instances FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_instances_update" ON public.instances FOR UPDATE USING (true);
CREATE POLICY "allow_all_instances_delete" ON public.instances FOR DELETE USING (true);