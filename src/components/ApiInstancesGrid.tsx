import { useState } from "react";
import { Instance, InstanceStatus } from "@/types/instance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApiInstancesGridProps {
  instances: Instance[];
  loading?: boolean;
  onRemoveFromApi: (id: string) => Promise<void> | void;
  onUpdateStatus: (id: string, status: InstanceStatus) => Promise<void> | void;
}

const WEBHOOK_BASE = "https://webhook.targetfuturos.com";

export function ApiInstancesGrid({ instances, loading, onRemoveFromApi, onUpdateStatus }: ApiInstancesGridProps) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<InstanceStatus>("Repouso");

  const apiInstances = instances
    .filter((inst) => inst.sent_to_api)
    .sort((a, b) => a.instance_number - b.instance_number);

  const statusStyles: Record<InstanceStatus, string> = {
    Repouso:
      "border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900",
    Aquecendo:
      "border-yellow-700 bg-gradient-to-br from-yellow-700 via-amber-700 to-yellow-800",
    Disparando:
      "border-green-700 bg-gradient-to-br from-green-700 to-emerald-800",
    Banida:
      "border-red-700 bg-gradient-to-br from-red-700 to-rose-800",
  };

  const triggerWebhook = async (action: string, instanceId: string) => {
    try {
      await fetch(`${WEBHOOK_BASE}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId }),
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
    }
  };

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apiInstances.map((apiInstance) => (
        <Card
          key={apiInstance.id}
          className={`${statusStyles[apiInstance.status]} rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 animate-fade-in`}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {apiInstance.instance_name}
              <Badge variant="secondary">{apiInstance.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>Telefone: {apiInstance.phone_number || ""}</div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => triggerWebhook("connect", apiInstance.id)}>
                Conectar
              </Button>
              <Button onClick={() => triggerWebhook("chatwoot", apiInstance.id)}>
                Chatwoot
              </Button>
              <Button onClick={() => triggerWebhook("disconnect", apiInstance.id)}>
                Desconectar
              </Button>
              <Button onClick={() => {
                setSelectedInstance(apiInstance);
                setSelectedStatus(apiInstance.status);
                setStatusModalOpen(true);
              }}>
                Status
              </Button>
              <Button
                variant="destructive"
                onClick={() => onRemoveFromApi(apiInstance.id)}
              >
                Remover
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
            <DialogDescription>
              Selecione o novo status da conta
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as InstanceStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Repouso">Repouso</SelectItem>
              <SelectItem value="Aquecendo">Aquecendo</SelectItem>
              <SelectItem value="Disparando">Disparando</SelectItem>
              <SelectItem value="Banida">Banida</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedInstance) {
                  onUpdateStatus(selectedInstance.id, selectedStatus);
                }
                setStatusModalOpen(false);
              }}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
