import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Instance, CreateInstanceData, CreateProxyData, Proxy, Service, CreateServiceData, InstanceStatus } from "@/types/instance";
import { useProxies } from "@/hooks/useProxies";
import { useServices } from "@/hooks/useServices";

interface InstanceFormProps {
  instance?: Instance | null;
  onSubmit: (data: CreateInstanceData, proxyData?: CreateProxyData) => void;
  onCancel: () => void;
}

export function InstanceForm({ instance, onSubmit, onCancel }: InstanceFormProps) {
  const { proxies } = useProxies();
  const { services } = useServices();
  const [formData, setFormData] = useState<CreateInstanceData>({
    instance_name: "",
    instance_number: 1,
    pid1: "0000",
    pid2: "0000",
    proxy_id: "",
    service_id: "",
    status: "Repouso",
  });

  const [proxyFormData, setProxyFormData] = useState<CreateProxyData>({
    name: "",
    ip: "",
    port: 8080,
    username: "",
    password: "",
  });

  const [useExistingProxy, setUseExistingProxy] = useState(true);
  const [showProxyForm, setShowProxyForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (instance) {
      setFormData({
        instance_name: instance.instance_name,
        instance_number: instance.instance_number,
        pid1: instance.pid1,
        pid2: instance.pid2,
        proxy_id: instance.proxy_id,
        service_id: instance.service_id || "",
        status: instance.status,
      });
      setUseExistingProxy(true);
    } else {
      // Auto-generate next instance number
      const maxNumber = proxies.length > 0 ? Math.max(...proxies.map((_, i) => i + 1)) : 0;
      setFormData(prev => ({ ...prev, instance_number: maxNumber + 1 }));
    }
  }, [instance, proxies]);

  const handleInputChange = (field: keyof CreateInstanceData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleProxyInputChange = (field: keyof CreateProxyData, value: string | number) => {
    setProxyFormData(prev => ({ ...prev, [field]: value }));
    clearError(`proxy_${field}`);
  };

  const clearError = (field: string) => {
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

    if (!formData.instance_name.trim()) {
      newErrors.instance_name = "Nome da instância é obrigatório";
    }

    if (formData.instance_number < 1) {
      newErrors.instance_number = "Número da instância deve ser maior que 0";
    }

    if (!useExistingProxy) {
      if (!proxyFormData.name.trim()) {
        newErrors.proxy_name = "Nome do proxy é obrigatório";
      }

      if (!proxyFormData.ip.trim()) {
        newErrors.proxy_ip = "IP do proxy é obrigatório";
      } else {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(proxyFormData.ip)) {
          newErrors.proxy_ip = "IP inválido";
        }
      }

      if (proxyFormData.port < 1 || proxyFormData.port > 65535) {
        newErrors.proxy_port = "Porta deve estar entre 1 e 65535";
      }

      if (!proxyFormData.username.trim()) {
        newErrors.proxy_username = "Username do proxy é obrigatório";
      }

      if (!proxyFormData.password.trim()) {
        newErrors.proxy_password = "Senha do proxy é obrigatória";
      }
    } else {
      if (!formData.proxy_id) {
        newErrors.proxy_id = "Selecione um proxy";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData, useExistingProxy ? undefined : proxyFormData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="instance_name">Nome da Instância *</Label>
          <Input
            id="instance_name"
            value={formData.instance_name}
            onChange={(e) => handleInputChange("instance_name", e.target.value)}
            placeholder="Ex: Instância WhatsApp 1"
            className={errors.instance_name ? "border-destructive" : ""}
          />
          {errors.instance_name && (
            <p className="text-sm text-destructive">{errors.instance_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instance_number">Número da Instância *</Label>
          <Input
            id="instance_number"
            type="number"
            value={formData.instance_number}
            onChange={(e) => handleInputChange("instance_number", parseInt(e.target.value) || 1)}
            placeholder="1"
            min="1"
            className={errors.instance_number ? "border-destructive" : ""}
          />
          {errors.instance_number && (
            <p className="text-sm text-destructive">{errors.instance_number}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_id">Serviço</Label>
          <Select
            value={formData.service_id || ""}
            onValueChange={(value) =>
              handleInputChange("service_id", value === "none" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um serviço (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum serviço</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado *</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value as InstanceStatus)}>
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="pid1">PID 1</Label>
          <Input
            id="pid1"
            value={formData.pid1}
            onChange={(e) => handleInputChange("pid1", e.target.value)}
            placeholder="0000"
            className={errors.pid1 ? "border-destructive" : ""}
          />
          {errors.pid1 && (
            <p className="text-sm text-destructive">{errors.pid1}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pid2">PID 2</Label>
          <Input
            id="pid2"
            value={formData.pid2}
            onChange={(e) => handleInputChange("pid2", e.target.value)}
            placeholder="0000"
            className={errors.pid2 ? "border-destructive" : ""}
          />
          {errors.pid2 && (
            <p className="text-sm text-destructive">{errors.pid2}</p>
          )}
        </div>
      </div>

      {/* Proxy Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant={useExistingProxy ? "default" : "outline"}
            onClick={() => setUseExistingProxy(true)}
          >
            Usar Proxy Existente
          </Button>
          <Button
            type="button"
            variant={!useExistingProxy ? "default" : "outline"}
            onClick={() => setUseExistingProxy(false)}
          >
            Criar Novo Proxy
          </Button>
        </div>

        {useExistingProxy ? (
          <div className="space-y-2">
            <Label htmlFor="proxy_id">Selecionar Proxy *</Label>
            <Select value={formData.proxy_id} onValueChange={(value) => handleInputChange("proxy_id", value)}>
              <SelectTrigger className={errors.proxy_id ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione um proxy" />
              </SelectTrigger>
              <SelectContent>
                {proxies.map((proxy) => (
                  <SelectItem key={proxy.id} value={proxy.id}>
                    {proxy.name} - {proxy.ip}:{proxy.port}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.proxy_id && (
              <p className="text-sm text-destructive">{errors.proxy_id}</p>
            )}
          </div>
        ) : (
          <Collapsible open={showProxyForm} onOpenChange={setShowProxyForm}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                <ChevronDown className="h-4 w-4 mr-2" />
                {showProxyForm ? "Ocultar" : "Mostrar"} Formulário do Proxy
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proxy_name">Nome do Proxy *</Label>
                  <Input
                    id="proxy_name"
                    value={proxyFormData.name}
                    onChange={(e) => handleProxyInputChange("name", e.target.value)}
                    placeholder="Ex: Proxy Brasil 1"
                    className={errors.proxy_name ? "border-destructive" : ""}
                  />
                  {errors.proxy_name && (
                    <p className="text-sm text-destructive">{errors.proxy_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxy_ip">IP do Proxy *</Label>
                  <Input
                    id="proxy_ip"
                    value={proxyFormData.ip}
                    onChange={(e) => handleProxyInputChange("ip", e.target.value)}
                    placeholder="Ex: 192.168.1.100"
                    className={errors.proxy_ip ? "border-destructive" : ""}
                  />
                  {errors.proxy_ip && (
                    <p className="text-sm text-destructive">{errors.proxy_ip}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxy_port">Porta do Proxy *</Label>
                  <Input
                    id="proxy_port"
                    type="number"
                    value={proxyFormData.port}
                    onChange={(e) => handleProxyInputChange("port", parseInt(e.target.value) || 0)}
                    placeholder="Ex: 8080"
                    min="1"
                    max="65535"
                    className={errors.proxy_port ? "border-destructive" : ""}
                  />
                  {errors.proxy_port && (
                    <p className="text-sm text-destructive">{errors.proxy_port}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxy_username">Username do Proxy *</Label>
                  <Input
                    id="proxy_username"
                    value={proxyFormData.username}
                    onChange={(e) => handleProxyInputChange("username", e.target.value)}
                    placeholder="Ex: usuario123"
                    className={errors.proxy_username ? "border-destructive" : ""}
                  />
                  {errors.proxy_username && (
                    <p className="text-sm text-destructive">{errors.proxy_username}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="proxy_password">Senha do Proxy *</Label>
                  <Input
                    id="proxy_password"
                    type="password"
                    value={proxyFormData.password}
                    onChange={(e) => handleProxyInputChange("password", e.target.value)}
                    placeholder="Digite a senha"
                    className={errors.proxy_password ? "border-destructive" : ""}
                  />
                  {errors.proxy_password && (
                    <p className="text-sm text-destructive">{errors.proxy_password}</p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      <Card className="bg-muted/20 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Dica:</strong> Todos os campos marcados com * são obrigatórios. 
            Você pode usar um proxy existente ou criar um novo. Os PIDs podem ser atualizados 
            posteriormente usando a ferramenta "Rastrear PID".
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 pt-4">
        <Button
          type="submit"
          className="bg-gradient-golden hover:shadow-golden"
        >
          {instance ? "Atualizar Instância" : "Criar Instância"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border hover:bg-muted"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}