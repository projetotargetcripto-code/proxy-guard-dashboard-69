import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstanceDashboard } from "@/components/InstanceDashboard";
import { ServiceTable } from "@/components/ServiceTable";
import { ServiceForm } from "@/components/ServiceForm";
import { ClientTable } from "@/components/ClientTable";
import { ClientForm } from "@/components/ClientForm";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Users, Loader2, LogOut } from "lucide-react";
import { Service, CreateServiceData, Client, CreateClientData } from "@/types/instance";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { services, loading: servicesLoading, createService, updateService, deleteService } = useServices();
  const { clients, loading: clientsLoading, createClient, updateClient, deleteClient } = useClients();
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  const handleAddClient = async (data: CreateClientData) => {
    try {
      await createClient(data);
      setIsAddingClient(false);
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleEditClient = async (client: Client, data: CreateClientData) => {
    try {
      await updateClient(client.id, data);
      setEditingClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="bg-card/80 backdrop-blur border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Painel de Controle</h1>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="instances">Instâncias</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="instances" className="space-y-4">
            <InstanceDashboard />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Gerenciar Clientes</h2>
              <Button
                onClick={() => setIsAddingClient(true)}
                className="bg-gradient-golden hover:shadow-golden"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            </div>

            {isAddingClient || editingClient ? (
              <ClientForm
                client={editingClient}
                onSubmit={(data) => {
                  if (editingClient) {
                    handleEditClient(editingClient, data);
                  } else {
                    handleAddClient(data);
                  }
                }}
                onCancel={() => {
                  setIsAddingClient(false);
                  setEditingClient(null);
                }}
              />
            ) : (
              <ClientTable
                clients={clients}
                onEdit={setEditingClient}
                onDelete={handleDeleteClient}
                clientServiceCounts={services.reduce((acc, service) => {
                  if (service.client_id) {
                    acc[service.client_id] = (acc[service.client_id] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>)}
              />
            )}
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
                    clients={clients}
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
                serviceInstanceCounts={{}}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;