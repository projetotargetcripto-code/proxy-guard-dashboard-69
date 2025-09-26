import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ApiInstancesGrid } from "@/components/ApiInstancesGrid";
import { useInstances } from "@/hooks/useInstances";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { InstanceStatus } from "@/types/instance";

const ZapGuardApp = () => {
  const { accountId: accountIdParam } = useParams<{ accountId?: string }>();
  const {
    instances,
    loading: instancesLoading,
    updateInstance,
  } = useInstances();
  const { services, loading: servicesLoading } = useServices();
  const { clients, loading: clientsLoading } = useClients();

  const accountId = useMemo(() => {
    if (!accountIdParam) {
      return null;
    }

    const parsed = Number(accountIdParam);

    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      return null;
    }

    return parsed;
  }, [accountIdParam]);

  const targetClient = useMemo(() => {
    if (accountId == null) {
      return undefined;
    }

    return clients.find(
      (client) =>
        typeof client.account_id === "number" && client.account_id === accountId,
    );
  }, [clients, accountId]);

  const clientServices = useMemo(() => {
    if (!targetClient) {
      return [];
    }

    return services.filter((service) => service.client_id === targetClient.id);
  }, [services, targetClient]);

  const clientServiceIds = useMemo(() => {
    return new Set(clientServices.map((service) => service.id));
  }, [clientServices]);

  const clientInstances = useMemo(() => {
    if (!targetClient) {
      return [] as typeof instances;
    }

    return instances.filter((instance) => {
      const instanceServiceId = instance.service_id ?? instance.services?.id ?? null;

      if (instanceServiceId && clientServiceIds.has(instanceServiceId)) {
        return true;
      }

      const nestedClientId = instance.services?.clients?.id;

      if (nestedClientId && nestedClientId === targetClient.id) {
        return true;
      }

      return false;
    });
  }, [instances, targetClient, clientServiceIds]);

  const handleRemoveFromApi = async (instanceId: string) => {
    try {
      await updateInstance(instanceId, { sent_to_api: false, api_sent_at: null });
    } catch (error) {
      console.error("Error removing instance from API:", error);
    }
  };

  const handleApiInstanceUpdate = async (
    instanceId: string,
    data: { status: InstanceStatus; service_id: string | null },
  ) => {
    try {
      await updateInstance(instanceId, data);
    } catch (error) {
      console.error("Error updating API instance:", error);
    }
  };

  const isLoadingData = instancesLoading || servicesLoading || clientsLoading;

  const errorMessage = useMemo(() => {
    if (!accountIdParam) {
      return "Nenhum account_id informado na URL.";
    }

    if (accountId == null) {
      return "O account_id informado na URL é inválido.";
    }

    if (!clientsLoading && !targetClient) {
      return "Cliente não encontrado para o account_id informado.";
    }

    return null;
  }, [accountIdParam, accountId, clientsLoading, targetClient]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-destructive/40 bg-card/80 p-6 text-center">
          <h2 className="text-xl font-semibold text-destructive">Erro</h2>
          <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!targetClient) {
    return null;
  }

  if (clientInstances.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
        <div className="max-w-lg rounded-lg border border-border/40 bg-card/80 p-6 text-center">
          <h2 className="text-2xl font-semibold text-primary">Instâncias na API</h2>
          <p className="mt-2 text-muted-foreground">
            Nenhuma instância cadastrada para este cliente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-golden bg-clip-text text-transparent">
            Instâncias na API
          </h1>
          <p className="text-muted-foreground">
            Cliente: <span className="text-foreground font-semibold">{targetClient.name}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Account ID: <span className="text-foreground font-semibold">{accountId}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur p-6 shadow-lg">
          <ApiInstancesGrid
            instances={clientInstances}
            loading={instancesLoading}
            onRemoveFromApi={handleRemoveFromApi}
            onUpdateInstance={handleApiInstanceUpdate}
            services={clientServices}
          />
        </div>
      </div>
    </div>
  );
};

export default ZapGuardApp;
