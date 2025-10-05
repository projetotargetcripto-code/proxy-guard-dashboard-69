import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Instance, CreateInstanceData, InstanceStatus } from "@/types/instance";
import { useProxies } from "@/hooks/useProxies";
import { useServices } from "@/hooks/useServices";

interface InstanceFormProps {
  instance?: Instance | null;
  onSubmit: (data: CreateInstanceData) => void;
  onCancel: () => void;
}

export function InstanceForm({ instance, onSubmit, onCancel }: InstanceFormProps) {
  const { proxies, updateProxy } = useProxies();
  const { services } = useServices();
  const [formData, setFormData] = useState<CreateInstanceData>({
    instance_name: "",
    instance_number: "1",
    pid1: "0000",
    pid2: "0000",
    phone_number: "",
    proxy_id: "",
    service_id: null,
    status: "Repouso",
  });


  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProxy = proxies.find((proxy) => proxy.id === formData.proxy_id);

  useEffect(() => {
    if (instance) {
      setFormData({
        instance_name: instance.instance_name,
        instance_number: instance.instance_number,
        pid1: instance.pid1,
        pid2: instance.pid2,
        phone_number: instance.phone_number || "",
        proxy_id: instance.proxy_id,
        service_id: instance.service_id ?? null,
        status: instance.status,
      });
    }
  }, [instance]);

  const handleInputChange = <K extends keyof CreateInstanceData>(
    field: K,
    value: CreateInstanceData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field as string);
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

    if (!formData.instance_number || formData.instance_number.trim() === "") {
      newErrors.instance_number = "Número da instância é obrigatório";
    }

    if (!formData.proxy_id) {
      newErrors.proxy_id = "Selecione um proxy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
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
          <Label htmlFor="phone_number">Telefone</Label>
          <Input
            id="phone_number"
            value={formData.phone_number || ""}
            onChange={(e) => handleInputChange("phone_number", e.target.value)}
            placeholder="(00) 00000-0000"
          />
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
      </div>

      {/* Proxy Selection */}
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