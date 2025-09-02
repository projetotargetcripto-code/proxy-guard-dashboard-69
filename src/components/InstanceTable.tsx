import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
} from "lucide-react";
import { Instance } from "@/types/instance";
import { useToast } from "@/hooks/use-toast";

interface InstanceTableProps {
  instances: Instance[];
  onEdit: (instance: Instance) => void;
  onDelete: (instanceId: string) => void;
}

export function InstanceTable({ instances, onEdit, onDelete }: InstanceTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/20 border-b border-border/50 text-sm font-medium text-muted-foreground">
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
            {instances.map((instance) => (
              <div
                key={instance.id}
                className="grid grid-cols-12 gap-4 p-4 border-b border-border/20 hover:bg-muted/10 transition-colors"
              >
                <div className="col-span-1">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {instance.instance_number}
                  </Badge>
                </div>

                <div className="col-span-2">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground truncate" title={instance.instance_name}>
                      {instance.instance_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criado: {new Date(instance.created_at).toLocaleDateString('pt-BR')}
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
                      instance.status === 'Disparando' ? 'destructive' : 
                      instance.status === 'Aquecendo' ? 'default' : 
                      instance.status === 'Banida' ? 'outline' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {instance.status}
                  </Badge>
                </div>

                <div className="col-span-1">
                  <div className="space-y-1">
                    <Badge variant={instance.pid1 !== '0000' ? 'default' : 'secondary'} className="text-xs">
                      {instance.pid1}
                    </Badge>
                    <Badge variant={instance.pid2 !== '0000' ? 'default' : 'secondary'} className="text-xs">
                      {instance.pid2}
                    </Badge>
                  </div>
                </div>

                <div className="col-span-3">
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
                </div>

                <div className="col-span-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
                    onClick={() => copyToClipboard(`${instance.proxies?.ip}:${instance.proxies?.port}`, "Endereço do proxy")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {instance.proxies?.ip}:{instance.proxies?.port}
                  </Button>
                </div>

                <div className="col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(instance)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}