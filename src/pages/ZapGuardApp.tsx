import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ApiInstancesGrid } from "@/components/ApiInstancesGrid";
import { useInstances } from "@/hooks/useInstances";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { InstanceStatus } from "@/types/instance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const apiInstancesForClient = useMemo(() => {
    return clientInstances.filter((instance) => instance.sent_to_api);
  }, [clientInstances]);

  const servicesWithApiInstanceCount = useMemo(() => {
    const counts = new Map<string, number>();

    apiInstancesForClient.forEach((instance) => {
      const serviceId = instance.service_id ?? instance.services?.id ?? null;

      if (!serviceId) {
        return;
      }

      counts.set(serviceId, (counts.get(serviceId) ?? 0) + 1);
    });

    return clientServices.map((service) => ({
      service,
      count: counts.get(service.id) ?? 0,
    }));
  }, [clientServices, apiInstancesForClient]);

  const servicesInZapGuardApp = useMemo(() => {
    return servicesWithApiInstanceCount.filter(({ count }) => count > 0);
  }, [servicesWithApiInstanceCount]);

  const hasApiInstances = apiInstancesForClient.length > 0;

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
        <Tabs
          defaultValue={hasApiInstances ? "instances" : "services"}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instances">Instâncias na API</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
          </TabsList>
          <TabsContent value="instances" className="space-y-4">
            {hasApiInstances ? (
              <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur p-6 shadow-lg">
                <ApiInstancesGrid
                  instances={apiInstancesForClient}
                  loading={instancesLoading}
                  onRemoveFromApi={handleRemoveFromApi}
                  onUpdateInstance={handleApiInstanceUpdate}
                  services={clientServices}
                  showRemoveButton={false}
                  allowStatusEdit={false}
                />
              </div>
            ) : (
              <Card className="border border-border/40 bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">
                    Nenhuma instância cadastrada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Não encontramos instâncias enviadas para a API para este cliente no
                    momento.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="services" className="space-y-4">
            {servicesInZapGuardApp.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {servicesInZapGuardApp.map(({ service, count }) => (
                  <Card
                    key={service.id}
                    className="border border-border/40 bg-card/60 backdrop-blur"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary">
                        {service.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {service.description ? (
                        <p>{service.description}</p>
                      ) : (
                        <p className="italic text-muted-foreground/70">
                          Nenhuma descrição cadastrada.
                        </p>
                      )}
                      <div>
                        <Badge variant="outline" className="border-primary/40 text-primary">
                          {count} {count === 1 ? "instância" : "instâncias"} na API
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border/40 bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">
                    Nenhum serviço encontrado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Não há serviços com instâncias ativas na ZapGuardApp para este cliente
                    no momento.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ZapGuardApp;
