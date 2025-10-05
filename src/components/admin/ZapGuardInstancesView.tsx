import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Instance } from '@/types/instance';
import { AdminUser } from '@/hooks/useAdminUsers';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { LendInstanceDialog } from './LendInstanceDialog';
import { AlertTriangle } from 'lucide-react';

interface ZapGuardInstancesViewProps {
  users: AdminUser[];
}

export const ZapGuardInstancesView = ({ users }: ZapGuardInstancesViewProps) => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [lendDialogOpen, setLendDialogOpen] = useState(false);

  const fetchZapGuardInstances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instances')
        .select(`
          *,
          proxies (*),
          services (*)
        `)
        .eq('managed_by_zapguard', true)
        .eq('sent_to_api', true)
        .order('instance_number');

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('Error fetching ZapGuard instances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZapGuardInstances();
  }, []);

  const handleLendClick = (instance: Instance) => {
    setSelectedInstance(instance);
    setLendDialogOpen(true);
  };

  const getBorrowedUserEmail = (userId: string | null | undefined) => {
    if (!userId) return "-";
    return users.find(u => u.id === userId)?.email || "Usuário não encontrado";
  };

  const isExpired = (borrowedUntil: string | null | undefined) => {
    if (!borrowedUntil) return false;
    return new Date(borrowedUntil) < new Date();
  };

  const expiredInstances = useMemo(() => {
    return instances.filter(inst => 
      inst.borrowed_by_user_id && 
      inst.borrowed_until && 
      isExpired(inst.borrowed_until)
    );
  }, [instances]);

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <>
      {expiredInstances.length > 0 && (
        <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Empréstimos Expirados</AlertTitle>
          <AlertDescription>
            {expiredInstances.length} instância{expiredInstances.length > 1 ? 's' : ''} com empréstimo expirado.
            Revogue manualmente se necessário:
            <ul className="mt-2 space-y-1">
              {expiredInstances.map(inst => (
                <li key={inst.id} className="text-sm">
                  • <strong>{inst.instance_name}</strong> - Emprestada para {getBorrowedUserEmail(inst.borrowed_by_user_id)} (Expirou em {new Date(inst.borrowed_until!).toLocaleDateString('pt-BR')})
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-primary">Instâncias Gestão ZapGuard (Enviadas à API)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>PID1</TableHead>
                  <TableHead>PID2</TableHead>
                  <TableHead>Proxy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emprestada para</TableHead>
                  <TableHead>Válido até</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhuma instância ZapGuard encontrada
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
                      <TableCell>
                        <Badge variant="secondary">{instance.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {instance.borrowed_by_user_id ? (
                          <span className="text-sm">
                            {getBorrowedUserEmail(instance.borrowed_by_user_id)}
                          </span>
                        ) : (
                          <Badge variant="outline">Disponível</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {instance.borrowed_until ? (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isExpired(instance.borrowed_until) ? 'text-destructive font-bold' : ''}`}>
                              {new Date(instance.borrowed_until).toLocaleDateString('pt-BR')}
                            </span>
                            {isExpired(instance.borrowed_until) && (
                              <Badge variant="destructive" className="text-xs">
                                Expirado
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isExpired(instance.borrowed_until) ? "destructive" : "outline"}
                          onClick={() => handleLendClick(instance)}
                        >
                          {isExpired(instance.borrowed_until) ? "Revogar" : instance.borrowed_by_user_id ? "Gerenciar" : "Emprestar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LendInstanceDialog
        instance={selectedInstance}
        users={users}
        open={lendDialogOpen}
        onOpenChange={setLendDialogOpen}
        onSuccess={fetchZapGuardInstances}
      />
    </>
  );
};
