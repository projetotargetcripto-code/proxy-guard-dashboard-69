import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Instance, CreateInstanceData } from "@/types/instance";

interface InstanceFormProps {
  instance?: Instance | null;
  onSubmit: (data: CreateInstanceData) => void;
  onCancel: () => void;
}

export function InstanceForm({ instance, onSubmit, onCancel }: InstanceFormProps) {
  const [formData, setFormData] = useState<CreateInstanceData>({
    instanceName: "",
    pid1: "",
    pid2: "",
    proxyName: "",
    proxyIp: "",
    proxyPort: 8080,
    proxyLogin: "",
    proxyPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (instance) {
      setFormData({
        instanceName: instance.instanceName,
        pid1: instance.pid1,
        pid2: instance.pid2,
        proxyName: instance.proxyName,
        proxyIp: instance.proxyIp,
        proxyPort: instance.proxyPort,
        proxyLogin: instance.proxyLogin,
        proxyPassword: instance.proxyPassword,
      });
    }
  }, [instance]);

  const handleInputChange = (field: keyof CreateInstanceData, value: string | number) => {
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

    if (!formData.instanceName.trim()) {
      newErrors.instanceName = "Nome da instância é obrigatório";
    }

    if (!formData.pid1.trim()) {
      newErrors.pid1 = "PID 1 é obrigatório";
    }

    if (!formData.pid2.trim()) {
      newErrors.pid2 = "PID 2 é obrigatório";
    }

    if (!formData.proxyName.trim()) {
      newErrors.proxyName = "Nome do proxy é obrigatório";
    }

    if (!formData.proxyIp.trim()) {
      newErrors.proxyIp = "IP do proxy é obrigatório";
    } else {
      // Basic IP validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(formData.proxyIp)) {
        newErrors.proxyIp = "IP inválido";
      }
    }

    if (formData.proxyPort < 1 || formData.proxyPort > 65535) {
      newErrors.proxyPort = "Porta deve estar entre 1 e 65535";
    }

    if (!formData.proxyLogin.trim()) {
      newErrors.proxyLogin = "Login do proxy é obrigatório";
    }

    if (!formData.proxyPassword.trim()) {
      newErrors.proxyPassword = "Senha do proxy é obrigatória";
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
          <Label htmlFor="instanceName">Nome da Instância *</Label>
          <Input
            id="instanceName"
            value={formData.instanceName}
            onChange={(e) => handleInputChange("instanceName", e.target.value)}
            placeholder="Ex: Instância WhatsApp 1"
            className={errors.instanceName ? "border-destructive" : ""}
          />
          {errors.instanceName && (
            <p className="text-sm text-destructive">{errors.instanceName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proxyName">Nome do Proxy *</Label>
          <Input
            id="proxyName"
            value={formData.proxyName}
            onChange={(e) => handleInputChange("proxyName", e.target.value)}
            placeholder="Ex: Proxy Brasil 1"
            className={errors.proxyName ? "border-destructive" : ""}
          />
          {errors.proxyName && (
            <p className="text-sm text-destructive">{errors.proxyName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pid1">PID 1 *</Label>
          <Input
            id="pid1"
            value={formData.pid1}
            onChange={(e) => handleInputChange("pid1", e.target.value)}
            placeholder="Ex: 12345"
            className={errors.pid1 ? "border-destructive" : ""}
          />
          {errors.pid1 && (
            <p className="text-sm text-destructive">{errors.pid1}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pid2">PID 2 *</Label>
          <Input
            id="pid2"
            value={formData.pid2}
            onChange={(e) => handleInputChange("pid2", e.target.value)}
            placeholder="Ex: 67890"
            className={errors.pid2 ? "border-destructive" : ""}
          />
          {errors.pid2 && (
            <p className="text-sm text-destructive">{errors.pid2}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proxyIp">IP do Proxy *</Label>
          <Input
            id="proxyIp"
            value={formData.proxyIp}
            onChange={(e) => handleInputChange("proxyIp", e.target.value)}
            placeholder="Ex: 192.168.1.100"
            className={errors.proxyIp ? "border-destructive" : ""}
          />
          {errors.proxyIp && (
            <p className="text-sm text-destructive">{errors.proxyIp}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proxyPort">Porta do Proxy *</Label>
          <Input
            id="proxyPort"
            type="number"
            value={formData.proxyPort}
            onChange={(e) => handleInputChange("proxyPort", parseInt(e.target.value) || 0)}
            placeholder="Ex: 8080"
            min="1"
            max="65535"
            className={errors.proxyPort ? "border-destructive" : ""}
          />
          {errors.proxyPort && (
            <p className="text-sm text-destructive">{errors.proxyPort}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proxyLogin">Login do Proxy *</Label>
          <Input
            id="proxyLogin"
            value={formData.proxyLogin}
            onChange={(e) => handleInputChange("proxyLogin", e.target.value)}
            placeholder="Ex: usuario123"
            className={errors.proxyLogin ? "border-destructive" : ""}
          />
          {errors.proxyLogin && (
            <p className="text-sm text-destructive">{errors.proxyLogin}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="proxyPassword">Senha do Proxy *</Label>
          <Input
            id="proxyPassword"
            type="password"
            value={formData.proxyPassword}
            onChange={(e) => handleInputChange("proxyPassword", e.target.value)}
            placeholder="Digite a senha"
            className={errors.proxyPassword ? "border-destructive" : ""}
          />
          {errors.proxyPassword && (
            <p className="text-sm text-destructive">{errors.proxyPassword}</p>
          )}
        </div>
      </div>

      <Card className="bg-muted/20 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Dica:</strong> Todos os campos marcados com * são obrigatórios. 
            Certifique-se de que o IP do proxy esteja no formato correto (ex: 192.168.1.100) 
            e que a porta esteja entre 1 e 65535.
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