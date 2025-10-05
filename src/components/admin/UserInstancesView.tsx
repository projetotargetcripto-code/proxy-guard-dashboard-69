import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminUser } from "@/hooks/useAdminUsers";
import { supabase } from '@/integrations/supabase/client';
import { Instance } from '@/types/instance';
import { Skeleton } from "@/components/ui/skeleton";

interface UserInstancesViewProps {
  users: AdminUser[];
}

export const UserInstancesView = ({ users }: UserInstancesViewProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalInstances: 0,
    totalProxies: 0,
    totalServices: 0,
  });

  useEffect(() => {
    if (selectedUserId) {
      fetchUserData();
    }
  }, [selectedUserId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Buscar serviços do usuário
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('user_id', selectedUserId);

      const serviceIds = services?.map(s => s.id) || [];

      // Buscar instâncias dos serviços do usuário
      const { data: userInstances } = await supabase
        .from('instances')
        .select(`
          *,
          proxies (*),
          services (*)
        `)
        .in('service_id', serviceIds)
        .order('instance_number');

      setInstances(userInstances || []);

      // Buscar proxies do usuário
      const { count: proxiesCount } = await supabase
        .from('proxies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', selectedUserId);

      // Buscar serviços do usuário
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', selectedUserId);

      setStats({
        totalInstances: userInstances?.length || 0,
        totalProxies: proxiesCount || 0,
        totalServices: servicesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-primary">Visualizar Instâncias por Usuário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedUserId && (
          <>
            {loading ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
                <Skeleton className="h-64" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Instâncias</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalInstances}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Proxies</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalProxies}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Serviços</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalServices}</p>
                  </div>
                </div>

                <div className="rounded-md border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>PID1</TableHead>
                        <TableHead>PID2</TableHead>
                        <TableHead>Proxy</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Nenhuma instância encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        instances.map((instance) => (
                          <TableRow key={instance.id}>
                            <TableCell className="font-medium">{instance.instance_name}</TableCell>
                            <TableCell>{instance.instance_number}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{instance.pid1}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{instance.pid2}</Badge>
                            </TableCell>
                            <TableCell>{instance.proxies?.name || '-'}</TableCell>
                            <TableCell>{instance.services?.name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{instance.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
