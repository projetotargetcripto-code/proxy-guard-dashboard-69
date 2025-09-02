import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Proxy, CreateProxyData } from "@/types/instance";
import { useToast } from "@/hooks/use-toast";

export function useProxies() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProxies = async () => {
    try {
      const { data, error } = await supabase
        .from('proxies')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProxies(data || []);
    } catch (error) {
      console.error('Error fetching proxies:', error);
      toast({
        title: "Erro ao carregar proxies",
        description: "Não foi possível carregar a lista de proxies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProxy = async (proxyData: CreateProxyData) => {
    try {
      const { data, error } = await supabase
        .from('proxies')
        .insert([proxyData])
        .select()
        .single();

      if (error) throw error;

      setProxies(prev => [...prev, data]);
      toast({
        title: "Proxy criado com sucesso",
        description: `O proxy "${data.name}" foi criado.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating proxy:', error);
      toast({
        title: "Erro ao criar proxy",
        description: "Não foi possível criar o proxy.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProxy = async (id: string, proxyData: Partial<CreateProxyData>) => {
    try {
      const { data, error } = await supabase
        .from('proxies')
        .update(proxyData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProxies(prev => prev.map(p => p.id === id ? data : p));
      toast({
        title: "Proxy atualizado com sucesso",
        description: `O proxy "${data.name}" foi atualizado.`,
      });

      return data;
    } catch (error) {
      console.error('Error updating proxy:', error);
      toast({
        title: "Erro ao atualizar proxy",
        description: "Não foi possível atualizar o proxy.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProxy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('proxies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProxies(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Proxy excluído com sucesso",
        description: "O proxy foi removido do sistema.",
      });
    } catch (error) {
      console.error('Error deleting proxy:', error);
      toast({
        title: "Erro ao excluir proxy",
        description: "Não foi possível excluir o proxy. Verifique se não há instâncias usando este proxy.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchProxies();
  }, []);

  return {
    proxies,
    loading,
    createProxy,
    updateProxy,
    deleteProxy,
    refetch: fetchProxies,
  };
}