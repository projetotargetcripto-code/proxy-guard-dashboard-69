import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Service, CreateServiceData } from "@/types/instance";
import { useToast } from "@/hooks/use-toast";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar a lista de serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: CreateServiceData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (error) throw error;

      setServices(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Serviço criado com sucesso",
        description: `O serviço "${data.name}" foi criado.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Erro ao criar serviço",
        description: "Não foi possível criar o serviço.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateService = async (id: string, serviceData: Partial<CreateServiceData>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setServices(prev => prev.map(s => s.id === id ? data : s));
      toast({
        title: "Serviço atualizado com sucesso",
        description: `O serviço "${data.name}" foi atualizado.`,
      });

      return data;
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Erro ao atualizar serviço",
        description: "Não foi possível atualizar o serviço.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Serviço excluído com sucesso",
        description: "O serviço foi removido do sistema.",
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Erro ao excluir serviço",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices,
  };
}