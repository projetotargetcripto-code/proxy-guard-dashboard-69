import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstanceDashboard } from "@/components/InstanceDashboard";
import { ServiceTable } from "@/components/ServiceTable";
import { ServiceForm } from "@/components/ServiceForm";
import { useServices } from "@/hooks/useServices";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, LogOut } from "lucide-react";
import { Service, CreateServiceData } from "@/types/instance";
import { useInstances } from "@/hooks/useInstances";

const DashFarm = () => {
  const { user, loading, isAdmin, adminChecking, signOut } = useAuth();
  const navigate = useNavigate();
  const { services, loading: servicesLoading, createService, updateService, deleteService } = useServices();
  const { instances } = useInstances();
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && !adminChecking && user && !isAdmin) {
      // Redireciona usuários não-admin para a página inicial
      navigate('/');
    }
  }, [user, loading, isAdmin, adminChecking, navigate]);

  const handleAddService = async (data: CreateServiceData) => {
    try {
      await createService(data);
      setIsAddingService(false);
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleEditService = async (service: Service, data: CreateServiceData) => {
    try {
      await updateService(service.id, data);
      setEditingService(null);
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  // Calculate service instance counts
  const serviceInstanceCounts = instances.reduce((acc, instance) => {
    if (instance.service_id) {
      acc[instance.service_id] = (acc[instance.service_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  if (loading || adminChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="bg-card/80 backdrop-blur border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Painel de Administração - DashFarm</h1>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Tabs defaultValue="instances" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instances">Instâncias</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="instances" className="space-y-4">
            <InstanceDashboard />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Gerenciar Serviços</h2>
              <Button
                onClick={() => setIsAddingService(true)}
                className="bg-gradient-golden hover:shadow-golden"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Serviço
              </Button>
            </div>

            {isAddingService || editingService ? (
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="text-primary">
                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ServiceForm
                    service={editingService}
                    onSubmit={(data) => {
                      if (editingService) {
                        handleEditService(editingService, data);
                      } else {
                        handleAddService(data);
                      }
                    }}
                    onCancel={() => {
                      setIsAddingService(false);
                      setEditingService(null);
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <ServiceTable
                services={services}
                onEdit={setEditingService}
                onDelete={handleDeleteService}
                serviceInstanceCounts={serviceInstanceCounts}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashFarm;
