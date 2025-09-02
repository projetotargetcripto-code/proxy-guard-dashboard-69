import { useState, useRef, useEffect } from "react";
import { Plus, Upload, Download, Search, Edit, Trash2, Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { InstanceTable } from "./InstanceTable";
import { InstanceForm } from "./InstanceForm";
import { PidTracker } from "./PidTracker";
import { Instance, CreateInstanceData } from "@/types/instance";

export function InstanceDashboard() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load instances from localStorage on component mount
  useEffect(() => {
    const savedInstances = localStorage.getItem('proxy-instances');
    if (savedInstances) {
      try {
        const parsedInstances = JSON.parse(savedInstances).map((inst: any) => ({
          ...inst,
          createdAt: new Date(inst.createdAt),
          updatedAt: new Date(inst.updatedAt),
        }));
        setInstances(parsedInstances);
      } catch (error) {
        console.error('Erro ao carregar instâncias do localStorage:', error);
      }
    }
  }, []);

  const saveInstances = (instancesData: Instance[]) => {
    localStorage.setItem('proxy-instances', JSON.stringify(instancesData));
  };

  const handleSave = () => {
    saveInstances(instances);
    toast({
      title: "Dados salvos",
      description: "Todas as instâncias foram salvas com sucesso.",
    });
  };

  const handleAddInstance = (data: CreateInstanceData) => {
    const newInstance: Instance = {
      id: crypto.randomUUID(),
      instanceNumber: instances.length + 1,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setInstances(prev => [...prev, newInstance]);
    setIsAddingInstance(false);
    
    toast({
      title: "Instância adicionada",
      description: `${data.instanceName} foi adicionada com sucesso.`,
    });
  };

  const handleEditInstance = (instance: Instance, data: CreateInstanceData) => {
    const updatedInstance: Instance = {
      ...instance,
      ...data,
      updatedAt: new Date(),
    };

    setInstances(prev => 
      prev.map(inst => inst.id === instance.id ? updatedInstance : inst)
    );
    setEditingInstance(null);
    
    toast({
      title: "Instância atualizada",
      description: `${data.instanceName} foi atualizada com sucesso.`,
    });
  };

  const handleDeleteInstance = (instanceId: string) => {
    setInstances(prev => prev.filter(inst => inst.id !== instanceId));
    toast({
      title: "Instância removida",
      description: "A instância foi removida com sucesso.",
    });
  };

  const handleClearAllPids = () => {
    setInstances(prev => 
      prev.map(instance => ({
        ...instance,
        pid1: '0000',
        pid2: '0000',
        updatedAt: new Date(),
      }))
    );
    toast({
      title: "PIDs zerados",
      description: "Todos os PIDs foram zerados com sucesso.",
    });
  };

  const handleUpdatePids = (pidUpdates: { instanceId: string; pid1: string; pid2: string }[]) => {
    setInstances(prev => 
      prev.map(instance => {
        const update = pidUpdates.find(u => u.instanceId === instance.id);
        if (update) {
          return {
            ...instance,
            pid1: update.pid1,
            pid2: update.pid2,
            updatedAt: new Date(),
          };
        }
        return instance;
      })
    );
  };

  const handleExportToSpreadsheet = () => {
    const csvContent = [
      ["Número", "Nome", "PID 1", "PID 2", "Nome Proxy", "IP Proxy", "Porta Proxy", "Login Proxy", "Senha Proxy", "Criado em", "Atualizado em"],
      ...instances.map(inst => [
        inst.instanceNumber,
        inst.instanceName,
        inst.pid1,
        inst.pid2,
        inst.proxyName,
        inst.proxyIp,
        inst.proxyPort,
        inst.proxyLogin,
        inst.proxyPassword,
        inst.createdAt.toLocaleDateString('pt-BR'),
        inst.updatedAt.toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `instancias_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Dados exportados",
      description: "As instâncias foram exportadas para planilha.",
    });
  };

  const handleImportFromSpreadsheet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const importedInstances: Instance[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 9) {
            const newInstance: Instance = {
              id: crypto.randomUUID(),
              instanceNumber: parseInt(values[0]) || instances.length + importedInstances.length + 1,
              instanceName: values[1] || '',
              pid1: values[2] || '',
              pid2: values[3] || '',
              proxyName: values[4] || '',
              proxyIp: values[5] || '',
              proxyPort: parseInt(values[6]) || 0,
              proxyLogin: values[7] || '',
              proxyPassword: values[8] || '',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            importedInstances.push(newInstance);
          }
        }

        setInstances(prev => [...prev, ...importedInstances]);
        toast({
          title: "Dados importados",
          description: `${importedInstances.length} instâncias foram importadas da planilha.`,
        });
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Não foi possível importar os dados da planilha.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredInstances = instances.filter(instance =>
    instance.instanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.proxyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.proxyIp.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-golden bg-clip-text text-transparent">
              Proxy Guard Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas instâncias de proxy com facilidade
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {instances.length} instâncias
            </Badge>
          </div>
        </div>

        {/* Actions Bar */}
        <Card className="border-border/50 shadow-elegant">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, proxy ou IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSave}
                  className="bg-gradient-to-r from-primary/20 to-primary/30 hover:from-primary/30 hover:to-primary/40"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAllPids}
                  disabled={instances.length === 0}
                  className="hover:shadow-destructive"
                >
                  ZERAR PID
                </Button>

                <PidTracker
                  instances={instances}
                  onUpdatePids={handleUpdatePids}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-primary/20 hover:border-primary/40"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToSpreadsheet}
                  disabled={instances.length === 0}
                  className="border-primary/20 hover:border-primary/40"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>

                <Button
                  size="sm"
                  onClick={() => setIsAddingInstance(true)}
                  className="bg-gradient-golden hover:shadow-golden"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Instância
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isAddingInstance || editingInstance ? (
          <Card className="border-border/50 shadow-elegant">
            <CardHeader>
              <CardTitle className="text-primary">
                {editingInstance ? 'Editar Instância' : 'Nova Instância'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InstanceForm
                instance={editingInstance}
                onSubmit={editingInstance ? 
                  (data) => handleEditInstance(editingInstance, data) : 
                  handleAddInstance
                }
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleImportFromSpreadsheet}
          className="hidden"
        />
      </div>
    </div>
  );
}