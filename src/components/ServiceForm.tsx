import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, CreateServiceData, Client } from "@/types/instance";

interface ServiceFormProps {
  service?: Service | null;
  clients: Client[];
  onSubmit: (data: CreateServiceData) => void;
  onCancel: () => void;
}

export function ServiceForm({ service, clients, onSubmit, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState<CreateServiceData>({
    name: "",
    description: "",
    client_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        client_id: service.client_id || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        client_id: "",
      });
    }
  }, [service]);

  const handleInputChange = (field: keyof CreateServiceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, client_id: value }));
    clearError('client_id');
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

    if (!formData.name.trim()) {
      newErrors.name = "Nome do serviço é obrigatório";
    }

    if (!formData.client_id) {
      newErrors.client_id = "Cliente é obrigatório";
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Serviço *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Ex: WhatsApp Business"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_id">Cliente *</Label>
          <Select value={formData.client_id} onValueChange={handleSelectChange}>
            <SelectTrigger className={errors.client_id ? "border-destructive" : ""}>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.client_id && (
            <p className="text-sm text-destructive">{errors.client_id}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Descrição opcional do serviço"
            rows={3}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button
          type="submit"
          className="bg-gradient-golden hover:shadow-golden"
        >
          {service ? "Atualizar Serviço" : "Criar Serviço"}
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