import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, CreateClientData } from '@/types/instance';
import { toast } from 'sonner';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching clients:', error);
        toast.error('Erro ao carregar clientes');
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: CreateClientData) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        toast.error('Erro ao criar cliente');
        throw error;
      }

      setClients(prev => [...prev, data]);
      toast.success('Cliente criado com sucesso');
      return data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, clientData: Partial<CreateClientData>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        toast.error('Erro ao atualizar cliente');
        throw error;
      }

      setClients(prev => prev.map(client => 
        client.id === id ? data : client
      ));
      toast.success('Cliente atualizado com sucesso');
      return data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting client:', error);
        toast.error('Erro ao excluir cliente');
        throw error;
      }

      setClients(prev => prev.filter(client => client.id !== id));
      toast.success('Cliente excluído com sucesso');
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
}