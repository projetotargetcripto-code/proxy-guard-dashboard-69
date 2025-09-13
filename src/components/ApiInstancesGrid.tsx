import { Instance } from "@/types/instance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ApiInstancesGridProps {
  instances: Instance[];
  loading?: boolean;
  onRemoveFromApi: (id: string) => Promise<void> | void;
}

const WEBHOOK_BASE = "https://webhook.targetfuturos.com";

export function ApiInstancesGrid({ instances, loading, onRemoveFromApi }: ApiInstancesGridProps) {
  const apiInstances = instances
    .filter((inst) => inst.sent_to_api)
    .sort((a, b) => {
      const dateA = a.api_sent_at ? new Date(a.api_sent_at).getTime() : 0;
      const dateB = b.api_sent_at ? new Date(b.api_sent_at).getTime() : 0;
      return dateB - dateA;
    });

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
        <Card key={apiInstance.id}>
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
    </div>
  );
}
