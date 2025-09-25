import { useCallback, useEffect, useRef, useState } from "react";
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

type WebhookPayload =
  | { kind: "json"; data: Record<string, unknown> }
  | { kind: "text"; text: string }
  | { kind: "image"; blob: Blob; filename?: string }
  | { kind: "empty" };

interface WebhookResult {
  ok: boolean;
  status: number;
  payload: WebhookPayload;
}

export function ApiInstancesGrid({ instances, loading, onRemoveFromApi, onUpdateStatus }: ApiInstancesGridProps) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<InstanceStatus>("Repouso");
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [connectionImageSrc, setConnectionImageSrc] = useState<string | null>(
    null,
  );
  const [connectionMessage, setConnectionMessage] = useState<string | null>(
    null,
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const connectionImageObjectUrlRef = useRef<string | null>(null);

  const revokeImageObjectUrl = useCallback(() => {
    if (connectionImageObjectUrlRef.current) {
      URL.revokeObjectURL(connectionImageObjectUrlRef.current);
      connectionImageObjectUrlRef.current = null;
    }
  }, []);

  const resetConnectionImage = useCallback(() => {
    revokeImageObjectUrl();
    setConnectionImageSrc(null);
  }, [revokeImageObjectUrl]);

  useEffect(() => {
    return () => {
      revokeImageObjectUrl();
    };
  }, [revokeImageObjectUrl]);

  const handleCloseConnectionDialog = useCallback(() => {
    setConnectionDialogOpen(false);
    setConnectionState("idle");
    resetConnectionImage();
    setConnectionMessage(null);
    setConnectionError(null);
    setCountdown(15);
  }, [resetConnectionImage]);

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
  }, [connectionDialogOpen, connectionState, handleCloseConnectionDialog]);

  const getJsonStringField = (
    data: Record<string, unknown>,
    keys: string[],
  ): string | undefined => {
    for (const key of keys) {
      if (!(key in data)) {
        continue;
      }

      const value = data[key];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return undefined;
  };

  const ensureImageSrc = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return trimmed;
    }

    if (/^data:image\//i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith("//")) {
      if (typeof window !== "undefined") {
        return `${window.location.protocol}${trimmed}`;
      }
      return `https:${trimmed}`;
    }

    if (/\.png$/i.test(trimmed)) {
      try {
        return new URL(trimmed, `${WEBHOOK_BASE}/`).toString();
      } catch {
        return trimmed;
      }
    }

    return `data:image/png;base64,${trimmed}`;
  };

  const extractPayloadMessage = (payload: WebhookPayload) => {
    if (payload.kind === "text") {
      const text = payload.text.trim();
      return text || undefined;
    }

    if (payload.kind === "json") {
      return getJsonStringField(payload.data, [
        "error",
        "message",
        "detail",
        "description",
      ]);
    }

    return undefined;
  };

  const parseWebhookResponse = async (
    response: Response,
  ): Promise<WebhookPayload> => {
    const contentTypeHeader = response.headers.get("content-type");
    const contentType = contentTypeHeader?.toLowerCase() ?? "";
    const contentDisposition = response.headers.get("content-disposition") ?? "";
    const looksLikeImage =
      contentType.startsWith("image/") ||
      (contentType.includes("application/octet-stream") &&
        /\.png/i.test(contentDisposition));

    if (looksLikeImage) {
      const blob = await response.blob();
      const filenameMatch = contentDisposition.match(
        /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i,
      );
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1] ?? filenameMatch[2]).trim()
        : undefined;

      return { kind: "image", blob, filename };
    }

    const text = await response.text().catch(() => "");
    if (!text) {
      return { kind: "empty" };
    }

    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(text) as unknown;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          return { kind: "json", data: data as Record<string, unknown> };
        }

        if (typeof data === "string") {
          const trimmed = data.trim();
          if (trimmed) {
            return { kind: "text", text: trimmed };
          }
          return { kind: "empty" };
        }
      } catch {
        // se falhar o parse, continuamos para tratar como texto simples
      }
    }

    const trimmed = text.trim();
    if (trimmed) {
      return { kind: "text", text: trimmed };
    }

    return { kind: "empty" };
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
  ): Promise<WebhookResult> => {
    try {
      const body = new URLSearchParams({
        instanceName: instance.instance_name,
      }).toString();

      const response = await fetch(`${WEBHOOK_BASE}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json,image/png,*/*;q=0.8",
        },
        body,
      });

      const payload = await parseWebhookResponse(response);

      if (!response.ok) {
        const errorMessage =
          payload.kind === "text"
            ? payload.text
            : payload.kind === "json"
              ? JSON.stringify(payload.data)
              : payload.kind === "image"
                ? payload.filename ?? "imagem recebida"
                : "";

        console.error(
          "Erro HTTP ao acionar webhook:",
          response.status,
          errorMessage,
        );
      }

      return {
        ok: response.ok,
        status: response.status,
        payload,
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
        payload: { kind: "text", text: message },
        status: 0,
      };
    }
  };

  const handleConnect = async (instance: Instance) => {
    setConnectionDialogOpen(true);
    setConnectionState("loading");
    resetConnectionImage();
    setConnectionMessage(null);
    setConnectionError(null);
    setCountdown(15);

    const result = await triggerWebhook("connect", instance);

    if (!result.ok) {
      const messageFromPayload = extractPayloadMessage(result.payload);
      const httpMessage =
        result.status > 0 ? `Erro HTTP ${result.status}` : undefined;
      const errorMessage =
        messageFromPayload || httpMessage || "Erro ao conectar instância.";

      setConnectionError(errorMessage);
      setConnectionState("error");
      return;
    }

    const { payload } = result;

    if (payload.kind === "json") {
      const jsonError = getJsonStringField(payload.data, ["error"]);
      if (jsonError) {
        setConnectionError(jsonError);
        setConnectionState("error");
        return;
      }

      const qrField =
        getJsonStringField(payload.data, [
          "qrcode",
          "image",
          "qr",
          "qrCode",
          "qrcode_url",
          "qr_url",
          "qrImage",
        ]) ?? undefined;

      if (qrField) {
        const imageSrc = ensureImageSrc(qrField);
        if (imageSrc) {
          resetConnectionImage();
          setConnectionImageSrc(imageSrc);
          setConnectionMessage("Escaneie o código para conectar a instância.");
          setConnectionState("success");
          return;
        }
      }

      const message = getJsonStringField(payload.data, [
        "message",
        "status",
        "detail",
        "description",
      ]);
      if (message) {
        setConnectionMessage(message);
        setConnectionState("success");
        return;
      }

      if (Object.keys(payload.data).length > 0) {
        setConnectionMessage(JSON.stringify(payload.data));
        setConnectionState("success");
        return;
      }
    }

    if (payload.kind === "image") {
      resetConnectionImage();
      const objectUrl = URL.createObjectURL(payload.blob);
      connectionImageObjectUrlRef.current = objectUrl;
      setConnectionImageSrc(objectUrl);
      setConnectionMessage(
        payload.filename
          ? `Escaneie o arquivo ${payload.filename} para conectar a instância.`
          : "Escaneie o código para conectar a instância.",
      );
      setConnectionState("success");
      return;
    }

    if (payload.kind === "text") {
      const text = payload.text.trim();
      if (text) {
        setConnectionMessage(text);
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
              {connectionImageSrc && (
                <img
                  src={connectionImageSrc}
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
