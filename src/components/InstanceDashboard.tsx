import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstanceForm } from "./InstanceForm";
import { InstanceTable } from "./InstanceTable";
import { PidTracker } from "./PidTracker";
import { BulkImportForm } from "./BulkImportForm";
import { Search, RotateCcw, Download, Plus, FileDown, Upload } from "lucide-react";
import { useInstances } from "@/hooks/useInstances";
import { useProxies } from "@/hooks/useProxies";
import { Instance, CreateInstanceData, CreateProxyData } from "@/types/instance";
import { useToast } from "@/hooks/use-toast";
import { downloadPpx } from "@/utils/ppx-generator";

export function InstanceDashboard() {
  console.log("InstanceDashboard: Component started rendering");
  
  const { instances, loading, createInstance, updateInstance, deleteInstance, updatePids, clearAllPids } = useInstances();
  const { createProxy } = useProxies();
  const { toast } = useToast();
  
  console.log("InstanceDashboard: Hooks loaded", { instances, loading });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const handleAddInstance = async (instanceData: CreateInstanceData, proxyData?: CreateProxyData) => {
    try {
      let proxyId = instanceData.proxy_id;
      
      // If creating a new proxy, create it first
      if (proxyData) {
        const newProxy = await createProxy(proxyData);
        proxyId = newProxy.id;
      }

      await createInstance({
        ...instanceData,
        proxy_id: proxyId,
      });

      setIsAddingInstance(false);
    } catch (error) {
      console.error("Error creating instance:", error);
    }
  };

  const handleEditInstance = async (instance: Instance, instanceData: CreateInstanceData, proxyData?: CreateProxyData) => {
    try {
      let proxyId = instanceData.proxy_id;
      
      // If creating a new proxy, create it first
      if (proxyData) {
        const newProxy = await createProxy(proxyData);
        proxyId = newProxy.id;
      }

      await updateInstance(instance.id, {
        ...instanceData,
        proxy_id: proxyId,
      });

      setEditingInstance(null);
    } catch (error) {
      console.error("Error updating instance:", error);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      await deleteInstance(instanceId);
    } catch (error) {
      console.error("Error deleting instance:", error);
    }
  };

  const handleClearAllPids = async () => {
    try {
      await clearAllPids();
    } catch (error) {
      console.error("Error clearing PIDs:", error);
    }
  };

  const handleUpdatePids = async (pidUpdates: { instanceId: string; pid1: string; pid2: string }[]) => {
    try {
      await updatePids(pidUpdates);
    } catch (error) {
      console.error("Error updating PIDs:", error);
      toast({
        title: "Erro ao atualizar PIDs",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleExportToSpreadsheet = () => {
    const csvHeader = "Número,Nome,PID1,PID2,Proxy Nome,Proxy IP,Proxy Porta,Proxy Username,Data Criação\n";
    const csvData = filteredInstances.map(instance => {
      const proxy = instance.proxies;
      return [
        instance.instance_number,
        `"${instance.instance_name}"`,
        instance.pid1,
        instance.pid2,
        proxy ? `"${proxy.name}"` : "",
        proxy ? proxy.ip : "",
        proxy ? proxy.port : "",
        proxy ? `"${proxy.username}"` : "",
        new Date(instance.created_at).toLocaleDateString('pt-BR'),
      ].join(",");
    }).join("\n");

    const csv = csvHeader + csvData;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `instancias_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação realizada com sucesso",
      description: "Os dados foram exportados para um arquivo CSV.",
    });
  };

  const handleBulkImport = async (instances: any[]) => {
    try {
      toast({
        title: "Importando instâncias...",
        description: `Criando ${instances.length} instâncias...`,
      });

      // Create proxies and instances sequentially to avoid conflicts
      for (const instance of instances) {
        // Create proxy first
        const proxyData: CreateProxyData = {
          name: instance.proxy_name,
          ip: instance.proxy_ip,
          port: instance.proxy_port,
          username: instance.proxy_username,
          password: instance.proxy_password,
        };

        const newProxy = await createProxy(proxyData);

        // Create instance with the new proxy
        const instanceData: CreateInstanceData = {
          instance_name: instance.instance_name,
          instance_number: instance.instance_number,
          pid1: instance.pid1,
          pid2: instance.pid2,
          proxy_id: newProxy.id,
        };

        await createInstance(instanceData);
      }

      setIsBulkImporting(false);
      toast({
        title: "Importação concluída",
        description: `${instances.length} instâncias criadas com sucesso.`,
      });
    } catch (error) {
      console.error("Error bulk importing:", error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar todas as instâncias.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePpx = async () => {
    try {
      toast({
        title: "Gerando arquivo PPX...",
        description: "Aguarde enquanto o arquivo é preparado.",
      });

      const blob = await downloadPpx();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `perfil.proxifier.ppx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PPX gerado com sucesso",
        description: "O arquivo do Proxifier foi baixado.",
      });
    } catch (error) {
      console.error("Error generating PPX:", error);
      toast({
        title: "Erro ao gerar PPX",
        description: "Não foi possível gerar o arquivo do Proxifier.",
        variant: "destructive",
      });
    }
  };

  const filteredInstances = instances.filter(instance =>
    instance.instance_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.instance_number.toString().includes(searchTerm) ||
    (instance.proxies?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    console.log("InstanceDashboard: Still loading...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando instâncias...</p>
        </div>
      </div>
    );
  }

  console.log("InstanceDashboard: Rendering main content", { instancesCount: instances.length });

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-golden bg-clip-text text-transparent">
            Dashboard de Instâncias
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="bg-card border-primary/20 text-primary">
              {instances.length} instância{instances.length !== 1 ? 's' : ''} configurada{instances.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="bg-card border-accent/20 text-accent">
              {filteredInstances.length} visível{filteredInstances.length !== 1 ? 'is' : ''}
            </Badge>
          </div>
        </div>

        {/* Actions Bar */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, número ou proxy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleGeneratePpx}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PPX
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearAllPids}
                  className="border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar PIDs
                </Button>

                <PidTracker
                  instances={instances}
                  onUpdatePids={handleUpdatePids}
                />

                <Button
                  variant="outline"
                  onClick={handleExportToSpreadsheet}
                  className="border-accent/20 text-accent hover:bg-accent/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsBulkImporting(true)}
                  className="border-secondary/20 text-secondary hover:bg-secondary/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar em Massa
                </Button>

                <Button
                  onClick={() => setIsAddingInstance(true)}
                  className="bg-gradient-golden hover:shadow-golden"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Instância
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {isBulkImporting ? (
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <BulkImportForm
                onSubmit={handleBulkImport}
                onCancel={() => setIsBulkImporting(false)}
              />
            </CardContent>
          </Card>
        ) : isAddingInstance || editingInstance ? (
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-primary">
                {editingInstance ? "Editar Instância" : "Nova Instância"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InstanceForm
                instance={editingInstance}
                onSubmit={(data, proxyData) => {
                  if (editingInstance) {
                    handleEditInstance(editingInstance, data, proxyData);
                  } else {
                    handleAddInstance(data, proxyData);
                  }
                }}
                onCancel={() => {
                  setIsAddingInstance(false);
                  setEditingInstance(null);
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <InstanceTable
            instances={filteredInstances}
            onEdit={setEditingInstance}
            onDelete={handleDeleteInstance}
          />
        )}
      </div>
    </div>
  );
}