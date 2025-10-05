import { useMemo } from "react";
import { ApiInstancesGrid } from "@/components/ApiInstancesGrid";
import { useInstances } from "@/hooks/useInstances";
import { useServices } from "@/hooks/useServices";
import { InstanceStatus } from "@/types/instance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ZapGuardApp = () => {
  const {
    instances,
    loading: instancesLoading,
    updateInstance,
  } = useInstances();
  const { services, loading: servicesLoading } = useServices();

  const apiInstances = useMemo(() => {
    return instances.filter((instance) => instance.sent_to_api);
  }, [instances]);

  const servicesWithApiInstanceCount = useMemo(() => {
    const counts: Record<string, number> = {};
    
    apiInstances.forEach((instance) => {
      const serviceId = instance.service_id ?? instance.services?.id ?? null;
      if (serviceId) {
        counts[serviceId] = (counts[serviceId] || 0) + 1;
      }
    });

    return services.map((service) => ({
      ...service,
      count: counts[service.id] || 0,
    }));
  }, [services, apiInstances]);

  const servicesInZapGuardApp = useMemo(() => {
    return servicesWithApiInstanceCount.filter(({ count }) => count > 0);
  }, [servicesWithApiInstanceCount]);

  const hasApiInstances = apiInstances.length > 0;

  const handleRemoveFromApi = async (instanceId: string) => {
    try {
      await updateInstance(instanceId, { sent_to_api: false, api_sent_at: null });
    } catch (error) {
      console.error("Error removing instance from API:", error);
    }
  };

  const handleApiInstanceUpdate = async (
    instanceId: string,
    data: { status: InstanceStatus; service_id: string | null; inbox_id: string | null },
  ) => {
    try {
      await updateInstance(instanceId, data);
    } catch (error) {
      console.error("Error updating API instance:", error);
    }
  };

  const isLoadingData = instancesLoading || servicesLoading;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-golden bg-clip-text text-transparent">
            ZapGuard App
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerenciamento de Instâncias na API
          </p>
        </header>

        {!hasApiInstances ? (
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-32 h-32 bg-muted/20 rounded-full flex items-center justify-center">
                  <p className="text-6xl">📱</p>
                </div>
                <h3 className="text-xl font-semibold text-primary">
                  Nenhuma instância na API
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Não há instâncias adicionadas à API no momento. 
                  Adicione instâncias através do painel principal.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="instances">Instâncias</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-primary">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total de Instâncias</p>
                      <p className="text-3xl font-bold text-primary">{apiInstances.length}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Serviços Ativos</p>
                      <p className="text-3xl font-bold text-accent">{servicesInZapGuardApp.length}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Status Geral</p>
                      <Badge variant="default" className="text-sm">
                        Operacional
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-primary">Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {servicesInZapGuardApp.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50"
                      >
                        <div>
                          <p className="font-medium text-foreground">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {service.count} instância{service.count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instances">
              <ApiInstancesGrid
                instances={apiInstances}
                services={services}
                onRemoveFromApi={handleRemoveFromApi}
                onUpdateInstance={handleApiInstanceUpdate}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ZapGuardApp;
