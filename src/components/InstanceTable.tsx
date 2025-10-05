import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddToApiModal } from "./AddToApiModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  Edit,
  Trash2,
  Zap,
  Calendar,
  Send,
} from "lucide-react";
import { Instance, Service, InstanceStatus } from "@/types/instance";
import { useToast } from "@/hooks/use-toast";

interface InstanceTableProps {
  instances: Instance[];
  services: Service[];
  onQuickEdit: (
    instanceId: string,
    data: { service_id: string | null; status: InstanceStatus; phone_number?: string | null; instance_name?: string }
  ) => void;
  onBulkEdit: (instanceIds: string[], data: { service_id: string | null; status: InstanceStatus }) => void;
  onEdit: (instance: Instance) => void;
  onDelete: (instanceId: string) => void;
  onRefresh: () => void;
  isClientView?: boolean; // Controla se é a visão do cliente com restrições
}

export function InstanceTable({
  instances,
  services,
  onQuickEdit,
  onBulkEdit,
  onEdit,
  onDelete,
  onRefresh,
  isClientView = false,
}: InstanceTableProps) {
  const [selectedApiInstance, setSelectedApiInstance] = useState<Instance | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [quickEditInstance, setQuickEditInstance] = useState<Instance | null>(null);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<InstanceStatus>("Repouso");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkService, setBulkService] = useState<string | undefined>(undefined);
  const [bulkStatus, setBulkStatus] = useState<InstanceStatus>("Repouso");
  const { toast } = useToast();

  const handleAddToApi = (instance: Instance) => {
    setSelectedApiInstance(instance);
    setIsApiModalOpen(true);
  };

  const handleApiModalClose = () => {
    setIsApiModalOpen(false);
    setSelectedApiInstance(null);
  };

  const handleApiSuccess = () => {
    onRefresh();
  };

  const openQuickEdit = (instance: Instance) => {
    setQuickEditInstance(instance);
    setSelectedService(instance.service_id || undefined);
    setSelectedStatus(instance.status);
    setSelectedPhone(instance.phone_number || "");
    setSelectedName(instance.instance_name);
  };

  const handleQuickEditSave = () => {
    if (quickEditInstance) {
      onQuickEdit(quickEditInstance.id, {
        service_id: selectedService || null,
        status: selectedStatus,
        phone_number: selectedPhone || null,
        instance_name: selectedName,
      });
      setQuickEditInstance(null);
    }
  };

  const toggleInstanceSelection = (id: string, checked: boolean) => {
    setSelectedInstances(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInstances(new Set(instances.map(i => i.id)));
    } else {
      setSelectedInstances(new Set());
    }
  };

  const handleBulkEditSave = () => {
    onBulkEdit(Array.from(selectedInstances), {
      service_id: bulkService || null,
      status: bulkStatus,
    });
    setBulkEditOpen(false);
    setSelectedInstances(new Set());
    setBulkService(undefined);
    setBulkStatus("Repouso");
  };

  const allSelected =
    selectedInstances.size === instances.length && instances.length > 0;
  const headerChecked = allSelected
    ? true
    : selectedInstances.size > 0
      ? "indeterminate"
      : false;

  const togglePasswordVisibility = (instanceId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(instanceId)) {
        newSet.delete(instanceId);
      } else {
        newSet.add(instanceId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado para a área de transferência",
        description: `${type} copiado com sucesso.`,
      });
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  if (instances.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-32 h-32 bg-muted/20 rounded-full flex items-center justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-primary">
              Nenhuma instância encontrada
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não criou nenhuma instância. Clique em "Adicionar Instância" 
              para começar a gerenciar seus proxies.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/80 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Instâncias Configuradas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {selectedInstances.size > 0 && (
              <div className="flex items-center justify-between p-2 bg-muted/30 border-b border-border/50">
                <span className="text-sm">{selectedInstances.size} selecionada(s)</span>
                <Button size="sm" variant="outline" onClick={() => setBulkEditOpen(true)}>
                  Editar em Massa
                </Button>
              </div>
            )}
            {/* Header */}
            <div className="grid grid-cols-13 gap-4 p-4 bg-muted/20 border-b border-border/50 text-sm font-medium text-muted-foreground">
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                />
              </div>
              <div className="col-span-1">#</div>
              <div className="col-span-2">Instância</div>
              <div className="col-span-1">Serviço</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1">PIDs</div>
              <div className="col-span-3">Proxy & Credenciais</div>
              <div className="col-span-2">Endereço</div>
              <div className="col-span-1">Ações</div>
            </div>

            {/* Rows */}
            {instances.map((instance) => {
              const isBorrowed = isClientView && !!instance.borrowed_by_user_id;
              const isExpired = instance.borrowed_until && new Date(instance.borrowed_until) < new Date();
              
              return (
                <div
                  key={instance.id}
                  className={cn(
                    "grid grid-cols-13 gap-4 p-4 border-b border-border/20 transition-colors relative",
                    instance.status === "Banida" && "bg-destructive/20 text-destructive",
                    isBorrowed && !isExpired && "bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border-l-4 border-l-purple-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30",
                    !isBorrowed && "hover:bg-muted/10"
                  )}
                >
                  <div className="col-span-1 flex items-center">
                    {!(isBorrowed && !isExpired) && (
                      <Checkbox
                        checked={selectedInstances.has(instance.id)}
                        onCheckedChange={(checked) => toggleInstanceSelection(instance.id, checked === true)}
                      />
                    )}
                  </div>
                  <div className="col-span-1">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {instance.instance_number}
                    </Badge>
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate" title={instance.instance_name}>
                          {instance.instance_name}
                        </p>
                        {instance.sent_to_api && (
                          <Badge variant="secondary" className="text-xs">
                            API
                          </Badge>
                        )}
                        {isBorrowed && !isExpired && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold shadow-md animate-pulse">
                            ⚡ ZapGuard
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {instance.phone_number && !(isBorrowed && !isExpired) && (
                          <span className="font-bold">{`Tel: ${instance.phone_number}`}</span>
                        )}
                        {instance.phone_number && !(isBorrowed && !isExpired) && " • "}
                        {isBorrowed && !isExpired && (
                          <span className="font-bold text-purple-400">
                            Emprestada até {new Date(instance.borrowed_until!).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {(!(isBorrowed && !isExpired)) && `Criado: ${new Date(instance.created_at).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <Badge
                      variant="outline"
                      className="bg-accent/10 text-accent-foreground border-accent/20 text-xs truncate"
                      title={instance.services?.name || 'Nenhum serviço'}
                    >
                      {instance.services?.name || 'N/A'}
                    </Badge>
                  </div>

                  <div className="col-span-1">
                    <Badge
                      variant={
                        instance.status === "Disparando" || instance.status === "Banida"
                          ? "destructive"
                          : instance.status === "Aquecendo"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {instance.status}
                    </Badge>
                  </div>

                  <div className="col-span-1">
                    {isBorrowed && !isExpired ? (
                      <span className="text-xs text-muted-foreground italic">Oculto</span>
                    ) : (
                      <div className="space-y-1">
                        <Badge variant={instance.pid1 !== '0000' ? 'default' : 'secondary'} className="text-xs">
                          {instance.pid1}
                        </Badge>
                        <Badge variant={instance.pid2 !== '0000' ? 'default' : 'secondary'} className="text-xs">
                          {instance.pid2}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="col-span-3">
                    {isBorrowed && !isExpired ? (
                      <div className="text-xs text-muted-foreground italic">
                        Credenciais ocultas
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{instance.proxies?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs hover:text-primary"
                            onClick={() => copyToClipboard(instance.proxies?.username || '', "Username")}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {instance.proxies?.username}
                          </Button>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0"
                              onClick={() => togglePasswordVisibility(instance.id)}
                            >
                              {visiblePasswords.has(instance.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            {visiblePasswords.has(instance.id) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs hover:text-primary"
                                onClick={() => copyToClipboard(instance.proxies?.password || '', "Senha")}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                {instance.proxies?.password}
                              </Button>
                            ) : (
                              <span className="text-xs">••••••••</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    {isBorrowed && !isExpired ? (
                      <span className="text-xs text-muted-foreground italic">Oculto</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(`${instance.proxies?.ip}:${instance.proxies?.port}`, "Endereço do proxy")}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {instance.proxies?.ip}:{instance.proxies?.port}
                      </Button>
                    )}
                  </div>

                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isBorrowed && !isExpired}>
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(instance.instance_name, "Nome da instância")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar nome
                        </DropdownMenuItem>
                        {!(isBorrowed && !isExpired) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openQuickEdit(instance)}>
                              <Zap className="mr-2 h-4 w-4" />
                              Edição rápida
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(instance)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddToApi(instance)}>
                              <Send className="mr-2 h-4 w-4" />
                              Adicionar à API
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="w-full text-left flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a instância "{instance.instance_name}"?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDelete(instance.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog
      open={!!quickEditInstance}
      onOpenChange={(open) => !open && setQuickEditInstance(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edição rápida</DialogTitle>
          <DialogDescription>
            Atualize rapidamente o serviço e o estado da instância.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da instância</Label>
            <Input
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              placeholder="Nome"
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select
              value={selectedService ?? "none"}
              onValueChange={(value) =>
                setSelectedService(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum serviço" />
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
            <Label>Estado</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as InstanceStatus)}
            >
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setQuickEditInstance(null)}>
            Cancelar
          </Button>
          <Button onClick={handleQuickEditSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edição em Massa</DialogTitle>
          <DialogDescription>
            Atualize o serviço e o estado das instâncias selecionadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select
              value={bulkService ?? "none"}
              onValueChange={(value) =>
                setBulkService(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum serviço" />
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
            <Label>Estado</Label>
            <Select
              value={bulkStatus}
              onValueChange={(value) => setBulkStatus(value as InstanceStatus)}
            >
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
        <DialogFooter>
          <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleBulkEditSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AddToApiModal
      instance={selectedApiInstance}
      isOpen={isApiModalOpen}
      onClose={handleApiModalClose}
      onSuccess={handleApiSuccess}
    />
  </>
  );
}