import { Instance } from "@/types/instance";
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

interface ApiInstancesTableProps {
  instances: Instance[];
  loading?: boolean;
}

export function ApiInstancesTable({ instances, loading }: ApiInstancesTableProps) {
  const apiInstances = instances
    .filter((inst) => inst.sent_to_api)
    .sort((a, b) => {
      const dateA = a.api_sent_at ? new Date(a.api_sent_at).getTime() : 0;
      const dateB = b.api_sent_at ? new Date(b.api_sent_at).getTime() : 0;
      return dateB - dateA;
    });

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
              <TableCell>{apiInstance.phone_number || ""}</TableCell>
              <TableCell>{apiInstance.proxies?.ip || ""}</TableCell>
              <TableCell>{apiInstance.proxies?.port || ""}</TableCell>
              <TableCell>{apiInstance.proxies?.username || ""}</TableCell>
              <TableCell>
                {apiInstance.api_sent_at
                  ? new Date(apiInstance.api_sent_at).toLocaleString("pt-BR")
                  : ""}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{apiInstance.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
