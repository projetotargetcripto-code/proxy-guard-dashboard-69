import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Plus, Download, FileText } from "lucide-react";
import { CreateInstanceData, CreateProxyData } from "@/types/instance";
import { useToast } from "@/hooks/use-toast";

interface BulkImportInstance {
  instance_name: string;
  instance_number: number;
  pid1: string;
  pid2: string;
  proxy_name: string;
  proxy_ip: string;
  proxy_port: number;
  proxy_username: string;
  proxy_password: string;
}

interface BulkImportFormProps {
  onSubmit: (instances: BulkImportInstance[]) => void;
  onCancel: () => void;
}

export function BulkImportForm({ onSubmit, onCancel }: BulkImportFormProps) {
  const [csvData, setCsvData] = useState("");
  const [instances, setInstances] = useState<BulkImportInstance[]>([]);
  const [parsedInstances, setParsedInstances] = useState<BulkImportInstance[]>([]);
  const { toast } = useToast();

  const addEmptyInstance = () => {
    const newInstance: BulkImportInstance = {
      instance_name: "",
      instance_number: instances.length + 1,
      pid1: "0000",
      pid2: "0000",
      proxy_name: "",
      proxy_ip: "",
      proxy_port: 8080,
      proxy_username: "",
      proxy_password: "",
    };
    setInstances([...instances, newInstance]);
  };

  const removeInstance = (index: number) => {
    setInstances(instances.filter((_, i) => i !== index));
  };

  const updateInstance = (index: number, field: keyof BulkImportInstance, value: string | number) => {
    const updated = [...instances];
    if (field === 'instance_number' || field === 'proxy_port') {
      updated[index] = { ...updated[index], [field]: typeof value === 'string' ? parseInt(value) || 0 : value };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setInstances(updated);
  };

  const parseCsv = (csvText: string) => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados");
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Expected columns
      const expectedColumns = [
        'instance_name', 'instance_number', 'pid1', 'pid2',
        'proxy_name', 'proxy_ip', 'proxy_port', 'proxy_username', 'proxy_password'
      ];

      // Parse data rows
      const parsed: BulkImportInstance[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== header.length) {
          throw new Error(`Linha ${i + 1}: número de colunas não confere com o cabeçalho`);
        }

          const instance: Partial<BulkImportInstance> = {};
          header.forEach((col, idx) => {
            if (col === 'instance_number' || col === 'proxy_port') {
              instance[col] = parseInt(values[idx]) || 0;
            } else {
              instance[col] = values[idx] || "";
            }
          });

        // Validate required fields
        if (!instance.instance_name || !instance.proxy_name || !instance.proxy_ip) {
          throw new Error(`Linha ${i + 1}: campos obrigatórios em branco`);
        }

        parsed.push(instance as BulkImportInstance);
      }

      setParsedInstances(parsed);
      toast({
        title: "CSV importado com sucesso",
        description: `${parsed.length} instâncias encontradas`,
      });
    } catch (error) {
      toast({
        title: "Erro ao importar CSV",
        description: error instanceof Error ? error.message : "Formato inválido",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const downloadCsvTemplate = () => {
    const template = `instance_name,instance_number,pid1,pid2,proxy_name,proxy_ip,proxy_port,proxy_username,proxy_password
"Instância 1",1,0000,0000,"Proxy Brasil 1",192.168.1.100,8080,usuario1,senha123
"Instância 2",2,0000,0000,"Proxy Brasil 2",192.168.1.101,8080,usuario2,senha456`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_instancias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = () => {
    const allInstances = parsedInstances.length > 0 ? parsedInstances : instances;
    
    if (allInstances.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma instância",
        variant: "destructive",
      });
      return;
    }

    // Validate all instances
    const errors: string[] = [];
    allInstances.forEach((instance, index) => {
      if (!instance.instance_name.trim()) {
        errors.push(`Instância ${index + 1}: Nome é obrigatório`);
      }
      if (!instance.proxy_name.trim()) {
        errors.push(`Instância ${index + 1}: Nome do proxy é obrigatório`);
      }
      if (!instance.proxy_ip.trim()) {
        errors.push(`Instância ${index + 1}: IP do proxy é obrigatório`);
      }
      if (instance.proxy_port < 1 || instance.proxy_port > 65535) {
        errors.push(`Instância ${index + 1}: Porta inválida`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Erros de validação",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    onSubmit(allInstances);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary">Importação em Massa</h3>
          <p className="text-sm text-muted-foreground">
            Adicione múltiplas instâncias de uma vez usando CSV ou formulário manual
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCsvTemplate}
          className="border-accent/20 text-accent hover:bg-accent/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar Template CSV
        </Button>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">Importar CSV</TabsTrigger>
          <TabsTrigger value="manual">Formulário Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Upload className="h-4 w-4 mr-2" />
                Upload de Arquivo CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="csvFile">Selecionar arquivo CSV</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Formato esperado:</strong></p>
                  <p>instance_name,instance_number,pid1,pid2,proxy_name,proxy_ip,proxy_port,proxy_username,proxy_password</p>
                </div>

                {csvData && (
                  <div>
                    <Label>Dados CSV (Preview)</Label>
                    <Textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      rows={6}
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={() => parseCsv(csvData)}
                      className="mt-2"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Re-processar CSV
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {parsedInstances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">
                  Instâncias Processadas ({parsedInstances.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {parsedInstances.map((instance, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{instance.instance_number}</Badge>
                          <span className="font-medium">{instance.instance_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {instance.proxy_name} • {instance.proxy_ip}:{instance.proxy_port}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-primary">
                Formulário Manual ({instances.length} instâncias)
              </CardTitle>
              <Button onClick={addEmptyInstance} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Instância
              </Button>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma instância adicionada ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Instância" para começar.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {instances.map((instance, index) => (
                    <Card key={index} className="bg-muted/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Instância {index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInstance(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label>Nome *</Label>
                            <Input
                              value={instance.instance_name}
                              onChange={(e) => updateInstance(index, "instance_name", e.target.value)}
                              placeholder="Nome da instância"
                            />
                          </div>
                          <div>
                            <Label>Número</Label>
                            <Input
                              type="number"
                              value={instance.instance_number.toString()}
                              onChange={(e) => updateInstance(index, "instance_number", parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>PID 1</Label>
                            <Input
                              value={instance.pid1}
                              onChange={(e) => updateInstance(index, "pid1", e.target.value)}
                              placeholder="0000"
                            />
                          </div>
                          <div>
                            <Label>PID 2</Label>
                            <Input
                              value={instance.pid2}
                              onChange={(e) => updateInstance(index, "pid2", e.target.value)}
                              placeholder="0000"
                            />
                          </div>
                          <div>
                            <Label>Nome do Proxy *</Label>
                            <Input
                              value={instance.proxy_name}
                              onChange={(e) => updateInstance(index, "proxy_name", e.target.value)}
                              placeholder="Nome do proxy"
                            />
                          </div>
                          <div>
                            <Label>IP do Proxy *</Label>
                            <Input
                              value={instance.proxy_ip}
                              onChange={(e) => updateInstance(index, "proxy_ip", e.target.value)}
                              placeholder="192.168.1.100"
                            />
                          </div>
                          <div>
                            <Label>Porta</Label>
                            <Input
                              type="number"
                              value={instance.proxy_port.toString()}
                              onChange={(e) => updateInstance(index, "proxy_port", parseInt(e.target.value) || 8080)}
                            />
                          </div>
                          <div>
                            <Label>Username *</Label>
                            <Input
                              value={instance.proxy_username}
                              onChange={(e) => updateInstance(index, "proxy_username", e.target.value)}
                              placeholder="Username"
                            />
                          </div>
                          <div>
                            <Label>Senha *</Label>
                            <Input
                              type="password"
                              value={instance.proxy_password}
                              onChange={(e) => updateInstance(index, "proxy_password", e.target.value)}
                              placeholder="Senha"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {parsedInstances.length > 0 
            ? `${parsedInstances.length} instâncias prontas para importar (CSV)`
            : `${instances.length} instâncias adicionadas manualmente`
          }
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-golden hover:shadow-golden"
          >
            Criar {parsedInstances.length > 0 ? parsedInstances.length : instances.length} Instâncias
          </Button>
        </div>
      </div>
    </div>
  );
}