import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Instance, InstanceStatus } from "@/types/instance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
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
  onTestingAllChange?: (isTesting: boolean) => void;
}

type TestConnectionResultState = {
  status: "idle" | "loading" | "positive" | "negative" | "error";
  message: string;
};

type ConnectionPresentation = {
  cardClass: string;
  containerClass: string;
  label: string;
  note?: string;
  icon: ReactNode;
};

const WEBHOOK_BASE = "https://webhook.targetfuturos.com/webhook";
const TEST_CONNECTION_WEBHOOK = `${WEBHOOK_BASE}/confirma`;

export function ApiInstancesGrid({
  instances,
  loading,
  onRemoveFromApi,
  onUpdateStatus,
  onTestingAllChange,
}: ApiInstancesGridProps) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<InstanceStatus>("Repouso");
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [connectionImage, setConnectionImage] = useState<
    { data: string; mimeType: string }
    | null
  >(null);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(
    null,
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [testConnectionResults, setTestConnectionResults] = useState<
    Record<string, TestConnectionResultState>
  >({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const webhookResponseResolversRef = useRef<Map<string, () => void>>(new Map());

  const updateTestConnectionResult = useCallback(
    (
      instanceId: string,
      result: TestConnectionResultState,
      notifyWebhook = false,
    ) => {
      setTestConnectionResults((prev) => ({
        ...prev,
        [instanceId]: result,
      }));

      if (notifyWebhook) {
        const resolversMap = webhookResponseResolversRef.current;
        const resolver = resolversMap.get(instanceId);

        if (resolver) {
          resolver();
          resolversMap.delete(instanceId);
        }
      }
    },
    [webhookResponseResolversRef],
  );

  const waitForWebhookResponse = useCallback(
    (instanceId: string) =>
      new Promise<void>((resolve) => {
        const resolversMap = webhookResponseResolversRef.current;
        const existingResolver = resolversMap.get(instanceId);

        if (existingResolver) {
          resolversMap.delete(instanceId);
          existingResolver();
        }

        resolversMap.set(instanceId, resolve);
      }),
    [webhookResponseResolversRef],
  );

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

  const parseWebhookText = (
    text: string,
  ): Record<string, unknown> | { raw: string } | null => {
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { raw: text };
    }
  };

  const apiInstances = useMemo(
    () =>
      instances
        .filter((inst) => inst.sent_to_api)
        .sort((a, b) => a.instance_number - b.instance_number),
    [instances],
  );

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

  const blobToBase64 = (blob: Blob): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Falha ao converter imagem."));
          return;
        }

        const [metadata, data] = reader.result.split(",", 2);
        const mimeTypeMatch = metadata?.match(/data:(.*?);base64/);

        resolve({
          base64: data ?? "",
          mimeType: mimeTypeMatch?.[1] ?? blob.type ?? "image/png",
        });
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error("Erro ao ler imagem."));
      };
      reader.readAsDataURL(blob);
    });

  const normalizeImagePayload = (
    value: string,
    fallbackMimeType = "image/png",
  ): { data: string; mimeType: string } | null => {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("data:")) {
      const [metadata, data] = trimmed.split(",", 2);
      const mimeTypeMatch = metadata?.match(/data:(.*?);base64/);

      return {
        data: data ?? "",
        mimeType: mimeTypeMatch?.[1] ?? fallbackMimeType,
      };
    }

    return {
      data: trimmed,
      mimeType: fallbackMimeType,
    };
  };

  type TriggerWebhookResult = {
    ok: boolean;
    status: number;
    text?: string;
    json?: unknown;
    image?: { base64: string; mimeType: string } | null;
    errorMessage?: string;
  };

  const triggerWebhook = async (
    action: string,
    instance: Instance,
  ): Promise<TriggerWebhookResult> => {
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

      const responseClone = response.clone();
      const contentType =
        response.headers.get("content-type")?.toLowerCase() ?? "";
      const contentDisposition =
        response.headers.get("content-disposition")?.toLowerCase() ?? "";
      let text = "";
      let parsedJson: unknown;
      let image: TriggerWebhookResult["image"] = null;

      try {
        text = await response.text();
        if (text) {
          try {
            parsedJson = JSON.parse(text) as unknown;
          } catch {
            parsedJson = undefined;
          }
        }
      } catch (error) {
        console.error("Erro ao ler resposta do webhook:", error);
        text = "";
      }

      try {
        const blob = await responseClone.blob();
        const blobType = blob.type?.toLowerCase();

        const shouldProcessImage =
          blob.size > 0 &&
          (blobType?.startsWith("image/") ||
            contentType.startsWith("image/") ||
            contentDisposition.includes("qrcode") ||
            contentDisposition.includes(".png"));

        if (shouldProcessImage) {
          const { base64, mimeType } = await blobToBase64(blob);
          image = { base64, mimeType };
        }
      } catch (error) {
        console.error("Erro ao processar imagem retornada pelo webhook:", error);
      }

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
        json: parsedJson,
        image,
        errorMessage: !response.ok ? text : undefined,
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
        image: null,
        json: undefined,
        errorMessage: message,
      };
    }
  };

  const handleTestConnection = useCallback(
    async (instance: Instance) => {
      updateTestConnectionResult(instance.id, {
        status: "loading",
        message: "Testando conexão...",
      });

      try {
        const response = await fetch(TEST_CONNECTION_WEBHOOK, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain",
          },
          body: JSON.stringify({ instanceName: instance.instance_name }),
        });

        const responseClone = response.clone();
        const rawText = (await response.text()).trim();
        let parsedJson: unknown;

        if (rawText) {
          try {
            parsedJson = JSON.parse(rawText) as unknown;
          } catch {
            parsedJson = undefined;
          }
        } else {
          try {
            parsedJson = await responseClone.json();
          } catch {
            parsedJson = undefined;
          }
        }

      const extractStatusFromJson = (value: unknown): string | null => {
        if (!value || typeof value !== "object") {
          return null;
        }

        if (
          "status" in value &&
          typeof (value as { status?: unknown }).status === "string"
        ) {
          return (value as { status: string }).status;
        }

        if (
          "message" in value &&
          typeof (value as { message?: unknown }).message === "string"
        ) {
          return (value as { message: string }).message;
        }

        if (
          "result" in value &&
          typeof (value as { result?: unknown }).result === "string"
        ) {
          return (value as { result: string }).result;
        }

        return null;
      };

      const combinedResponse = (rawText || extractStatusFromJson(parsedJson) || "")
        .toString()
        .trim();
      const normalizedResponse = combinedResponse.toLowerCase();

      const isPositive = normalizedResponse.includes("positivo");
      const isNegative = normalizedResponse.includes("negativo");

      if (!response.ok) {
        throw new Error(rawText || "Falha ao testar conexão.");
      }

      if (isPositive) {
        updateTestConnectionResult(
          instance.id,
          {
            status: "positive",
            message: "Conta conectada e ativa.",
          },
          true,
        );
        return;
      }

      if (isNegative) {
        updateTestConnectionResult(
          instance.id,
          {
            status: "negative",
            message: "Conta desconectada.",
          },
          true,
        );
        return;
      }

      updateTestConnectionResult(
        instance.id,
        {
          status: "positive",
          message: combinedResponse
            ? combinedResponse
            : "Conta conectada e ativa.",
        },
        true,
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível testar a conexão.";

      updateTestConnectionResult(
        instance.id,
        {
          status: "error",
          message,
        },
        true,
      );
    }
    },
    [updateTestConnectionResult],
  );

  const handleConnect = async (instance: Instance) => {
    setConnectionDialogOpen(true);
    setConnectionState("loading");
    setConnectionImage(null);
    setConnectionMessage(null);
    setConnectionError(null);
    setCountdown(15);

    const result = await triggerWebhook("connect", instance);

    const responseData =
      result.json ?? parseWebhookText(result.text ?? "") ?? undefined;

    if (!result.ok) {
      const errorMessage =
        (responseData &&
          typeof responseData === "object" &&
          responseData !== null &&
          "error" in responseData &&
          typeof (responseData as { error?: unknown }).error === "string"
          ? (responseData as { error: string }).error
          : undefined) ||
        result.errorMessage ||
        result.text ||
        "Erro ao conectar instância.";

      setConnectionError(errorMessage ?? "Erro ao conectar instância.");
      setConnectionState("error");
      return;
    }

    if (result.image && result.image.base64) {
      setConnectionImage({
        data: result.image.base64,
        mimeType: result.image.mimeType,
      });
      setConnectionMessage("Escaneie o código para conectar a instância.");
      setConnectionState("success");
      return;
    }

    if (responseData && typeof responseData === "object") {
      if ("error" in responseData && typeof (responseData as { error: unknown }).error === "string") {
        setConnectionError((responseData as { error: string }).error);
        setConnectionState("error");
        return;
      }

      if ("qrcode" in responseData && typeof (responseData as { qrcode: unknown }).qrcode === "string") {
        const normalized = normalizeImagePayload(
          (responseData as { qrcode: string }).qrcode,
        );

        if (normalized) {
          setConnectionImage(normalized);
          setConnectionMessage("Escaneie o código para conectar a instância.");
          setConnectionState("success");
          return;
        }
      }

      if ("image" in responseData && typeof (responseData as { image: unknown }).image === "string") {
        const normalized = normalizeImagePayload(
          (responseData as { image: string }).image,
        );

        if (normalized) {
          setConnectionImage(normalized);
          setConnectionMessage("Escaneie o código para conectar a instância.");
          setConnectionState("success");
          return;
        }
      }

      if (
        "message" in responseData &&
        typeof (responseData as { message: unknown }).message === "string"
      ) {
        const message = (responseData as { message: string }).message.trim();
        setConnectionMessage(message || "Conexão realizada com sucesso.");
        setConnectionState("success");
        return;
      }

      if (
        "raw" in responseData &&
        typeof (responseData as { raw: unknown }).raw === "string"
      ) {
        const rawMessage = (responseData as { raw: string }).raw.trim();
        if (rawMessage) {
          setConnectionMessage(rawMessage);
          setConnectionState("success");
          return;
        }
      }
    }

    if (typeof result.text === "string" && result.text.trim()) {
      setConnectionMessage(result.text.trim());
      setConnectionState("success");
      return;
    }

    setConnectionMessage("Conexão realizada com sucesso.");
    setConnectionState("success");
  };

  useEffect(() => {
    if (apiInstances.length === 0) {
      return undefined;
    }

    let cancelled = false;
    let isRunning = false;
    const resolversMap = webhookResponseResolversRef.current;
    const intervalMs = 30 * 60 * 1000;

    const runSequentialTests = async () => {
      if (cancelled || isRunning || apiInstances.length === 0) {
        return;
      }

      isRunning = true;
      setIsTestingAll(true);
      onTestingAllChange?.(true);

      try {
        for (let index = 0; index < apiInstances.length; index += 1) {
          if (cancelled) {
            break;
          }

          const instance = apiInstances[index];
          const waitForResponse = waitForWebhookResponse(instance.id);

          await handleTestConnection(instance);
          await waitForResponse;

          if (cancelled) {
            break;
          }
        }
      } finally {
        if (!cancelled) {
          setIsTestingAll(false);
          onTestingAllChange?.(false);
        }
        isRunning = false;
      }
    };

    runSequentialTests();

    const intervalId = window.setInterval(runSequentialTests, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      setIsTestingAll(false);
      onTestingAllChange?.(false);
      resolversMap.forEach((resolve) => resolve());
      resolversMap.clear();
    };
  }, [
    apiInstances,
    onTestingAllChange,
    handleTestConnection,
    waitForWebhookResponse,
  ]);

  const getConnectionPresentation = useCallback(
    (status?: TestConnectionResultState["status"]): ConnectionPresentation | null => {
      switch (status) {
        case "positive":
          return {
            cardClass: "ring-1 ring-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.35)]",
            containerClass:
              "border-emerald-500/60 bg-emerald-500/10 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.35)]",
            label: "Conexão estável",
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
          };
        case "negative":
          return {
            cardClass:
              "ring-2 ring-red-500/70 shadow-[0_0_30px_rgba(239,68,68,0.45)]",
            containerClass:
              "border-red-500/70 bg-red-500/15 text-red-100 shadow-[0_0_22px_rgba(239,68,68,0.55)] motion-safe:animate-pulse",
            label: "ATENÇÃO: Conta desconectada",
            note: "Reconecte a conta para retomar as operações.",
            icon: <XCircle className="h-6 w-6 text-red-200" />,
          };
        case "error":
          return {
            cardClass: "ring-1 ring-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.35)]",
            containerClass:
              "border-amber-500/60 bg-amber-500/10 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.35)]",
            label: "Falha ao testar conexão",
            icon: <AlertTriangle className="h-5 w-5 text-amber-300" />,
          };
        case "loading":
          return {
            cardClass: "ring-1 ring-slate-500/40",
            containerClass:
              "border-slate-400/60 bg-slate-800/70 text-slate-100",
            label: "Testando conexão",
            icon: <Loader2 className="h-5 w-5 animate-spin" />,
          };
        default:
          return null;
      }
    },
    [],
  );

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
      {apiInstances.map((apiInstance) => {
        const connectionResult = testConnectionResults[apiInstance.id];
        const presentation = getConnectionPresentation(connectionResult?.status);

        return (
          <Card
            key={apiInstance.id}
            className={`${statusStyles[apiInstance.status]} rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 animate-fade-in ${presentation?.cardClass ?? ""}`}
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
                <Button
                  onClick={() => handleTestConnection(apiInstance)}
                  disabled={
                    isTestingAll ||
                    testConnectionResults[apiInstance.id]?.status === "loading"
                  }
                >
                  {testConnectionResults[apiInstance.id]?.status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testando...
                    </span>
                  ) : (
                    "Testar Conexão"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedInstance(apiInstance);
                    setSelectedStatus(apiInstance.status);
                    setStatusModalOpen(true);
                  }}
                >
                  Status
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onRemoveFromApi(apiInstance.id)}
                >
                  Remover
                </Button>
              </div>
              {connectionResult && presentation && (
                <div
                  className={`flex items-start gap-3 rounded-md border px-3 py-2 text-sm leading-tight ${presentation.containerClass}`}
                >
                  <span className="mt-0.5 flex-shrink-0">{presentation.icon}</span>
                  <div className="space-y-1">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] opacity-80">
                      {presentation.label}
                    </p>
                    <p className="text-sm font-semibold">{connectionResult.message}</p>
                    {presentation.note && (
                      <p className="text-xs font-medium opacity-90">
                        {presentation.note}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
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
                  src={`data:${connectionImage.mimeType};base64,${connectionImage.data}`}
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
