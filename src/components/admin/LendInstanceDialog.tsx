import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AdminUser } from "@/hooks/useAdminUsers";
import { Instance } from "@/types/instance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LendInstanceDialogProps {
  instance: Instance | null;
  users: AdminUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const LendInstanceDialog = ({
  instance,
  users,
  open,
  onOpenChange,
  onSuccess
}: LendInstanceDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [days, setDays] = useState<string>("30");
  const [loading, setLoading] = useState(false);

  const handleLend = async () => {
    if (!instance || !selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    try {
      setLoading(true);
      
      const borrowedUntil = new Date();
      borrowedUntil.setDate(borrowedUntil.getDate() + parseInt(days));

      const { error } = await supabase
        .from('instances')
        .update({
          borrowed_by_user_id: selectedUserId,
          borrowed_until: borrowedUntil.toISOString()
        })
        .eq('id', instance.id);

      if (error) throw error;

      toast.success("Instância emprestada com sucesso!");
      onSuccess();
      onOpenChange(false);
      setSelectedUserId("");
      setDays("30");
    } catch (error) {
      console.error('Error lending instance:', error);
      toast.error("Erro ao emprestar instância");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!instance) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('instances')
        .update({
          borrowed_by_user_id: null,
          borrowed_until: null
        })
        .eq('id', instance.id);

      if (error) throw error;

      toast.success("Empréstimo revogado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error revoking instance:', error);
      toast.error("Erro ao revogar empréstimo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {instance?.borrowed_by_user_id ? "Gerenciar Empréstimo" : "Emprestar Instância"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Instância</Label>
            <p className="text-sm font-medium mt-1">{instance?.instance_name}</p>
          </div>

          {instance?.borrowed_by_user_id ? (
            <div className="space-y-2">
              <div>
                <Label>Emprestada para</Label>
                <p className="text-sm mt-1">
                  {users.find(u => u.id === instance.borrowed_by_user_id)?.email || "Usuário não encontrado"}
                </p>
              </div>
              <div>
                <Label>Válido até</Label>
                <p className="text-sm mt-1">
                  {instance.borrowed_until ? new Date(instance.borrowed_until).toLocaleDateString('pt-BR') : "-"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Usuário</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.role !== 'admin').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="days">Dias de empréstimo</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {instance?.borrowed_by_user_id ? (
            <Button onClick={handleRevoke} disabled={loading} variant="destructive">
              Revogar Empréstimo
            </Button>
          ) : (
            <>
              <Button onClick={() => onOpenChange(false)} variant="outline" disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleLend} disabled={loading}>
                Emprestar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
