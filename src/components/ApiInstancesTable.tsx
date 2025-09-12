import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ApiInstance {
  id: string;
  instance_name: string;
  phone_number: string;
  proxy_host: string;
  proxy_port: number;
  proxy_user: string;
  sent_at: string;
  status: string;
}

export function ApiInstancesTable() {
  const [apiInstances, setApiInstances] = useState<ApiInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiInstances = async () => {
    try {
      // For now, just show empty since sent_to_api column doesn't exist yet
      setApiInstances([]);
    } catch (error) {
      console.error('Error fetching API instances:', error);
      toast({
        title: "Erro ao carregar instâncias da API",
        description: "Não foi possível carregar a lista de instâncias enviadas para a API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiInstances();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (apiInstances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma instância foi enviada para a API ainda.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Instância</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Proxy Host</TableHead>
            <TableHead>Proxy Port</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Data de Envio</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiInstances.map((apiInstance) => (
            <TableRow key={apiInstance.id}>
              <TableCell className="font-medium">
                {apiInstance.instance_name}
              </TableCell>
              <TableCell>{apiInstance.phone_number}</TableCell>
              <TableCell>{apiInstance.proxy_host}</TableCell>
              <TableCell>{apiInstance.proxy_port}</TableCell>
              <TableCell>{apiInstance.proxy_user}</TableCell>
              <TableCell>
                {new Date(apiInstance.sent_at).toLocaleString('pt-BR')}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {apiInstance.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}