import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Instance, CreateInstanceData, InstanceStatus } from "@/types/instance";
import { useToast } from "@/hooks/use-toast";

export function useInstances() {
  
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .select(`
          *,
          proxies (
            id,
            name,
            ip,
            port,
            username,
            password,
            created_at,
            updated_at
          ),
          services (
            id,
            name,
            description,
            created_at,
            updated_at,
            clients (
              id,
              name
            )
          )
        `)
        .order('instance_number', { ascending: true });

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('useInstances: Error fetching instances:', error);
      toast({
        title: "Erro ao carregar instâncias",
        description: "Não foi possível carregar a lista de instâncias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (instanceData: CreateInstanceData) => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .insert([instanceData])
        .select(`
          *,
          proxies (
            id,
            name,
            ip,
            port,
            username,
            password,
            created_at,
            updated_at
          ),
          services (
            id,
            name,
            description,
            created_at,
            updated_at,
            clients (
              id,
              name
            )
          )
        `)
        .single();

      if (error) throw error;

      setInstances(prev => [...prev, data].sort((a, b) => a.instance_number - b.instance_number));
      toast({
        title: "Instância criada com sucesso",
        description: `A instância "${data.instance_name}" foi criada.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating instance:', error);
      toast({
        title: "Erro ao criar instância",
        description: "Não foi possível criar a instância.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateInstance = async (id: string, instanceData: Partial<Instance>) => {
    try {
      const { data, error } = await supabase
        .from('instances')
        .update(instanceData)
        .eq('id', id)
        .select(`
          *,
          proxies (
            id,
            name,
            ip,
            port,
            username,
            password,
            created_at,
            updated_at
          ),
          services (
            id,
            name,
            description,
            created_at,
            updated_at,
            clients (
              id,
              name
            )
          )
        `)
        .single();

      if (error) throw error;

      setInstances(prev => prev.map(i => i.id === id ? data : i));
      toast({
        title: "Instância atualizada com sucesso",
        description: `A instância "${data.instance_name}" foi atualizada.`,
      });

      return data;
    } catch (error) {
      console.error('Error updating instance:', error);
      toast({
        title: "Erro ao atualizar instância",
        description: "Não foi possível atualizar a instância.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstances(prev => prev.filter(i => i.id !== id));
      toast({
        title: "Instância excluída com sucesso",
        description: "A instância foi removida do sistema.",
      });
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast({
        title: "Erro ao excluir instância",
        description: "Não foi possível excluir a instância.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const bulkUpdateInstances = async (
    ids: string[],
    data: { service_id: string | null; status: InstanceStatus }
  ) => {
    try {
      const { error } = await supabase
        .from('instances')
        .update(data)
        .in('id', ids);

      if (error) throw error;

      await fetchInstances();
      toast({
        title: "Instâncias atualizadas com sucesso",
        description: `${ids.length} instância(s) foram atualizadas.`,
      });
    } catch (error) {
      console.error('Error bulk updating instances:', error);
      toast({
        title: "Erro ao atualizar instâncias",
        description: "Não foi possível atualizar as instâncias.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePids = async (pidUpdates: { instanceId: string; pid1: string; pid2: string }[]) => {
    try {
      const promises = pidUpdates.map(update =>
        supabase
          .from('instances')
          .update({ pid1: update.pid1, pid2: update.pid2 })
          .eq('id', update.instanceId)
      );

      const results = await Promise.all(promises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Some PID updates failed');
      }

      await fetchInstances(); // Refresh the data
      toast({
        title: "PIDs atualizados com sucesso",
        description: `${pidUpdates.length} instância(s) foram atualizadas.`,
      });
    } catch (error) {
      console.error('Error updating PIDs:', error);
      toast({
        title: "Erro ao atualizar PIDs",
        description: "Não foi possível atualizar os PIDs.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const clearAllPids = async () => {
    try {
      const { error } = await supabase
        .from('instances')
        .update({ pid1: '0000', pid2: '0000' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (error) throw error;

      await fetchInstances(); // Refresh the data
      toast({
        title: "PIDs limpos com sucesso",
        description: "Todos os PIDs foram redefinidos para 0000.",
      });
    } catch (error) {
      console.error('Error clearing PIDs:', error);
      toast({
        title: "Erro ao limpar PIDs",
        description: "Não foi possível limpar os PIDs.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  return {
    instances,
    loading,
    createInstance,
    updateInstance,
    deleteInstance,
    updatePids,
    bulkUpdateInstances,
    clearAllPids,
    refetch: fetchInstances,
  };
}