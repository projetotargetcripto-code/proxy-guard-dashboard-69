import { useEffect, useState } from "react";
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

const WEBHOOK_BASE = "https://webhook.targetfuturos.com/webhook";

export function ApiInstancesGrid({ instances, loading, onRemoveFromApi, onUpdateStatus }: ApiInstancesGridProps) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<InstanceStatus>("Repouso");
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [connectionImage, setConnectionImage] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(
    null,
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);

  const handleCloseConnectionDialog = () => {
    setConnectionDialogOpen(false);
    setConnectionState("idle");
    setConnectionImage(null);
    setConnectionMessage(null);
    setConnectionError(null);
    setCountdown(15);
  };

  useEffect(() => {
    if (!connectionDialogOpen) {
      return;
    }

    if (connectionState !== "success" && connectionState !== "error") {
      return;
    }

    setCountdown(15);

    const interval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          handleCloseConnectionDialog();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [connectionDialogOpen, connectionState]);

  const parseWebhookText = (text: string) => {
    if (!text) {
      return {} as Record<string, unknown>;
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { raw: text } as Record<string, unknown>;
    }
  };

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

  const triggerWebhook = async (
    action: string,
    instance: Instance,
  ): Promise<{ ok: boolean; text: string; status: number }> => {
    try {
      const body = new URLSearchParams({
        instanceName: instance.instance_name,
      }).toString();

      const response = await fetch(`${WEBHOOK_BASE}/${action}`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const text = await response.text().catch(() => "");

      if (!response.ok) {
        console.error(
          "Erro HTTP ao acionar webhook:",
          response.status,
          text,
        );
      }

      return {
        ok: response.ok,
        text,
        status: response.status,
      };
    } catch (error) {
      console.error("Error triggering webhook:", error);
      const message =
        error instanceof Error
          ? error.message.includes("Failed to fetch")
            ? "Não foi possível contatar o webhook."
            : error.message
          : "Erro desconhecido ao conectar.";

      return {
        ok: false,
        text: message,
        status: 0,
      };
    }
  };

  const handleConnect = async (instance: Instance) => {
    setConnectionDialogOpen(true);
    setConnectionState("loading");
    setConnectionImage(null);
    setConnectionMessage(null);
    setConnectionError(null);
    setCountdown(15);

    const result = await triggerWebhook("connect", instance);

    const data = parseWebhookText(result.text);

    if (!result.ok) {
      const errorMessage =
        (typeof data === "object" && data !== null && "error" in data
          ? (data as { error?: string }).error
          : undefined) || result.text || "Erro ao conectar instância.";

      setConnectionError(errorMessage ?? "Erro ao conectar instância.");
      setConnectionState("error");
      return;
    }

    if (typeof data === "object" && data !== null) {
      if ("error" in data && typeof (data as { error: unknown }).error === "string") {
        setConnectionError((data as { error: string }).error);
        setConnectionState("error");
        return;
      }

      if ("qrcode" in data && typeof (data as { qrcode: unknown }).qrcode === "string") {
        setConnectionImage((data as { qrcode: string }).qrcode);
        setConnectionMessage("Escaneie o código para conectar a instância.");
        setConnectionState("success");
        return;
      }

      if ("image" in data && typeof (data as { image: unknown }).image === "string") {
        setConnectionImage((data as { image: string }).image);
        setConnectionMessage("Escaneie o código para conectar a instância.");
        setConnectionState("success");
        return;
      }

      if ("message" in data && typeof (data as { message: unknown }).message === "string") {
        const message = (data as { message: string }).message.trim();
        setConnectionMessage(message || "Conexão realizada com sucesso.");
        setConnectionState("success");
        return;
      }
    }

    if (typeof data === "object" && data !== null && "raw" in data) {
      const raw = String((data as { raw: unknown }).raw).trim();
      if (raw) {
        setConnectionMessage(raw);
        setConnectionState("success");
        return;
      }
    }

    setConnectionMessage("Conexão realizada com sucesso.");
    setConnectionState("success");
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
              <Button onClick={() => handleConnect(apiInstance)}>
                Conectar
              </Button>
              <Button onClick={() => triggerWebhook("disconnect", apiInstance)}>
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
      <Dialog
        open={connectionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseConnectionDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conexão da instância</DialogTitle>
            <DialogDescription>
              {connectionState === "loading" || connectionState === "idle"
                ? "Aguardando resposta do webhook..."
                : connectionState === "success"
                  ? "Resposta recebida com sucesso."
                  : "O webhook retornou um erro."}
            </DialogDescription>
          </DialogHeader>
          {connectionState === "loading" && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          )}
          {connectionState === "success" && (
            <div className="space-y-4 text-center">
              {connectionImage && (
                <img
                  src={`data:image/png;base64,${connectionImage}`}
                  alt="QR Code"
                  className="mx-auto"
                />
              )}
              {connectionMessage && (
                <p className="text-sm text-muted-foreground">
                  {connectionMessage}
                </p>
              )}
            </div>
          )}
          {connectionState === "error" && (
            <p className="text-sm text-center text-destructive">
              {connectionError ?? "Não foi possível conectar a instância."}
            </p>
          )}
          {(connectionState === "success" || connectionState === "error") && (
            <p className="text-xs text-muted-foreground text-center pt-4">
              Esta janela será fechada em {countdown}s.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
