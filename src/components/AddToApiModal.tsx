import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Instance } from "@/types/instance";
import { sendToApi, WebhookData } from "@/utils/webhook";
import { supabase } from "@/integrations/supabase/client";

interface AddToApiModalProps {
  instance: Instance | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToApiModal({ instance, isOpen, onClose, onSuccess }: AddToApiModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    instanceName: instance?.instance_name || "",
    phoneNumber: instance?.phone_number || "",
    proxyHost: instance?.proxies?.ip || "",
    proxyPort: instance?.proxies?.port?.toString() || "",
    proxyUser: instance?.proxies?.username || "",
    proxyPass: instance?.proxies?.password || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['instanceName', 'phoneNumber', 'proxyHost', 'proxyPort', 'proxyUser', 'proxyPass'];
    return required.every(field => formData[field as keyof typeof formData]?.trim());
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    if (!instance) return;

    setLoading(true);
    try {
      const webhookData: WebhookData = {
        instanceName: formData.instanceName,
        phoneNumber: formData.phoneNumber,
        proxyHost: formData.proxyHost,
        proxyPort: formData.proxyPort,
        proxyUser: formData.proxyUser,
        proxyPass: formData.proxyPass,
      };

      const result = await sendToApi(webhookData);
      
      if (result.success) {
        // Update instance as sent to API
        await supabase
          .from('instances')
          .update({ 
            sent_to_api: true, 
            api_sent_at: new Date().toISOString(),
            phone_number: formData.phoneNumber // Update phone if it was missing
          })
          .eq('id', instance.id);

        // For now, we'll just track sent_to_api status in instances table
        // Future: Record in api_instances table when schema is updated

        toast({
          title: "Enviado para API",
          description: "A instância foi enviada para a API com sucesso.",
        });

        onSuccess();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending to API:', error);
      toast({
        title: "Erro ao enviar para API",
        description: "Não foi possível enviar a instância para a API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form when instance changes
  useState(() => {
    if (instance) {
      setFormData({
        instanceName: instance.instance_name || "",
        phoneNumber: instance.phone_number || "",
        proxyHost: instance.proxies?.ip || "",
        proxyPort: instance.proxies?.port?.toString() || "",
        proxyUser: instance.proxies?.username || "",
        proxyPass: instance.proxies?.password || "",
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à API</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="instanceName">Nome da Instância *</Label>
            <Input
              id="instanceName"
              value={formData.instanceName}
              onChange={(e) => handleInputChange('instanceName', e.target.value)}
              placeholder="Nome da instância"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Número do Telefone *</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Número do telefone"
            />
          </div>

          <div>
            <Label htmlFor="proxyHost">Host do Proxy *</Label>
            <Input
              id="proxyHost"
              value={formData.proxyHost}
              onChange={(e) => handleInputChange('proxyHost', e.target.value)}
              placeholder="IP do proxy"
            />
          </div>

          <div>
            <Label htmlFor="proxyPort">Porta do Proxy *</Label>
            <Input
              id="proxyPort"
              value={formData.proxyPort}
              onChange={(e) => handleInputChange('proxyPort', e.target.value)}
              placeholder="Porta do proxy"
              type="number"
            />
          </div>

          <div>
            <Label htmlFor="proxyUser">Usuário do Proxy *</Label>
            <Input
              id="proxyUser"
              value={formData.proxyUser}
              onChange={(e) => handleInputChange('proxyUser', e.target.value)}
              placeholder="Usuário do proxy"
            />
          </div>

          <div>
            <Label htmlFor="proxyPass">Senha do Proxy *</Label>
            <Input
              id="proxyPass"
              type="password"
              value={formData.proxyPass}
              onChange={(e) => handleInputChange('proxyPass', e.target.value)}
              placeholder="Senha do proxy"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !validateForm()}
          >
            {loading ? "Enviando..." : "Enviar para API"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}