import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useProxies } from "@/hooks/useProxies";
import { CreateProxyData } from "@/types/instance";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProxyManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProxyManagementModal({ open, onOpenChange }: ProxyManagementModalProps) {
  const { proxies, createProxy, updateProxy, deleteProxy, loading } = useProxies();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProxyData>({
    name: "",
    ip: "",
    port: 8080,
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: "",
      ip: "",
      port: 8080,
      username: "",
      password: "",
    });
    setErrors({});
    setIsAdding(false);
    setEditingId(null);
  };

  const handleInputChange = (field: keyof CreateProxyData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do proxy é obrigatório";
    }

    if (!formData.ip.trim()) {
      newErrors.ip = "IP do proxy é obrigatório";
    } else {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(formData.ip)) {
        newErrors.ip = "IP inválido";
      }
    }

    if (formData.port < 1 || formData.port > 65535) {
      newErrors.port = "Porta deve estar entre 1 e 65535";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username do proxy é obrigatório";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Senha do proxy é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testProxy = async (proxyData: CreateProxyData): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('test-proxy', {
        body: {
          ip: proxyData.ip,
          port: proxyData.port,
          username: proxyData.username,
          password: proxyData.password,
        }
      });

      if (error) {
        console.error('Error testing proxy:', error);
        toast({
          title: "Erro ao testar proxy",
          description: error.message || "Não foi possível testar o proxy.",
          variant: "destructive",
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "Proxy funcionando",
          description: `Conexão bem-sucedida. IP detectado: ${data.ip || 'N/A'}`,
        });
        return true;
      } else {
        toast({
          title: "Proxy não funcional",
          description: data?.error || "O proxy não respondeu corretamente.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Proxy test failed:', error);
      toast({
        title: "Erro ao testar proxy",
        description: "Ocorreu um erro inesperado ao testar o proxy.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Testar o proxy antes de salvar
      toast({
        title: "Testando proxy...",
        description: "Aguarde enquanto verificamos a conexão.",
      });

      setTestingId(editingId || "new");
      const isWorking = await testProxy(formData);
      setTestingId(null);

      if (!isWorking) {
        toast({
          title: "Proxy não funcional",
          description: "O proxy não está funcionando. Verifique os dados e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (editingId) {
        await updateProxy(editingId, formData);
      } else {
        await createProxy(formData);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving proxy:", error);
    }
  };

  const handleEdit = (id: string) => {
    const proxy = proxies.find(p => p.id === id);
    if (proxy) {
      setFormData({
        name: proxy.name,
        ip: proxy.ip,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
      });
      setEditingId(id);
      setIsAdding(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este proxy?")) {
      try {
        await deleteProxy(id);
      } catch (error) {
        console.error("Error deleting proxy:", error);
      }
    }
  };

  const handleTestProxy = async (id: string) => {
    const proxy = proxies.find(p => p.id === id);
    if (!proxy) return;

    setTestingId(id);
    const isWorking = await testProxy({
      name: proxy.name,
      ip: proxy.ip,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
    });
    setTestingId(null);

    if (isWorking) {
      toast({
        title: "Proxy funcionando",
        description: "O proxy está funcionando corretamente.",
      });
    } else {
      toast({
        title: "Proxy não funcional",
        description: "O proxy não está respondendo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Proxies</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add/Edit Form */}
          {isAdding ? (
            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">
                  {editingId ? "Editar Proxy" : "Adicionar Novo Proxy"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proxy_name">Nome do Proxy *</Label>
                    <Input
                      id="proxy_name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Ex: Proxy Brasil 1"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proxy_ip">IP do Proxy *</Label>
                    <Input
                      id="proxy_ip"
                      value={formData.ip}
                      onChange={(e) => handleInputChange("ip", e.target.value)}
                      placeholder="Ex: 192.168.1.100"
                      className={errors.ip ? "border-destructive" : ""}
                    />
                    {errors.ip && (
                      <p className="text-sm text-destructive">{errors.ip}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proxy_port">Porta do Proxy *</Label>
                    <Input
                      id="proxy_port"
                      type="number"
                      value={formData.port}
                      onChange={(e) => handleInputChange("port", parseInt(e.target.value) || 0)}
                      placeholder="Ex: 8080"
                      min="1"
                      max="65535"
                      className={errors.port ? "border-destructive" : ""}
                    />
                    {errors.port && (
                      <p className="text-sm text-destructive">{errors.port}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proxy_username">Username *</Label>
                    <Input
                      id="proxy_username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      placeholder="Ex: usuario123"
                      className={errors.username ? "border-destructive" : ""}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="proxy_password">Senha *</Label>
                    <Input
                      id="proxy_password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Digite a senha"
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={testingId === (editingId || "new")}
                    className="bg-gradient-golden hover:shadow-golden"
                  >
                    {testingId === (editingId || "new") ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testando proxy...
                      </>
                    ) : (
                      editingId ? "Salvar Alterações" : "Adicionar Proxy"
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Novo Proxy
            </Button>
          )}

          {/* Proxies List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Proxies Cadastrados</h3>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : proxies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum proxy cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {proxies.map((proxy) => (
                  <Card key={proxy.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-medium">{proxy.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {proxy.ip}:{proxy.port} • {proxy.username}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestProxy(proxy.id)}
                            disabled={testingId === proxy.id}
                          >
                            {testingId === proxy.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Testar"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(proxy.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(proxy.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
