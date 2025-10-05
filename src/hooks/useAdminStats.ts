import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalInstances: number;
  totalProxies: number;
  totalServices: number;
  instancesByStatus: {
    status: string;
    count: number;
  }[];
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInstances: 0,
    totalProxies: 0,
    totalServices: 0,
    instancesByStatus: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Contar usuários
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Contar instâncias
      const { count: instancesCount } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true });

      // Contar proxies
      const { count: proxiesCount } = await supabase
        .from('proxies')
        .select('*', { count: 'exact', head: true });

      // Contar serviços
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

      // Buscar instâncias agrupadas por status
      const { data: instances } = await supabase
        .from('instances')
        .select('status');

      // Agrupar por status
      const statusCounts = instances?.reduce((acc, instance) => {
        const status = instance.status || 'Indefinido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const instancesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      setStats({
        totalUsers: usersCount || 0,
        totalInstances: instancesCount || 0,
        totalProxies: proxiesCount || 0,
        totalServices: servicesCount || 0,
        instancesByStatus,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};
