import { useState } from "react";
import { Edit, Trash2, Eye, EyeOff, Copy, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { Instance } from "@/types/instance";

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
        title: "Copiado!",
        description: `${type} copiado para a área de transferência.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive",
      });
    }
  };

  if (instances.length === 0) {
    return (
      <Card className="border-border/50 shadow-elegant">
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma instância encontrada</h3>
            <p>Adicione sua primeira instância para começar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-elegant">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 font-semibold text-primary">Nº</th>
                <th className="text-left p-4 font-semibold text-primary">Nome da Instância</th>
                <th className="text-left p-4 font-semibold text-primary">PID 1</th>
                <th className="text-left p-4 font-semibold text-primary">PID 2</th>
                <th className="text-left p-4 font-semibold text-primary">Proxy</th>
                <th className="text-left p-4 font-semibold text-primary">Endereço</th>
                <th className="text-left p-4 font-semibold text-primary">Credenciais</th>
                <th className="text-right p-4 font-semibold text-primary">Ações</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance, index) => (
                <tr 
                  key={instance.id}
                  className={`border-b border-border/20 hover:bg-muted/20 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  }`}
                >
                  <td className="p-4">
                    <Badge variant="outline" className="border-primary/30">
                      {instance.instanceNumber}
                    </Badge>
                  </td>
                  
                  <td className="p-4">
                    <div className="font-medium">{instance.instanceName}</div>
                    <div className="text-sm text-muted-foreground">
                      Criado em {instance.createdAt.toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {instance.pid1}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(instance.pid1, "PID 1")}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {instance.pid2}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(instance.pid2, "PID 2")}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="font-medium">{instance.proxyName}</div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {instance.proxyIp}:{instance.proxyPort}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${instance.proxyIp}:${instance.proxyPort}`, "Endereço")}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Login:</span>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {instance.proxyLogin}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(instance.proxyLogin, "Login")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Senha:</span>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {visiblePasswords.has(instance.id) 
                            ? instance.proxyPassword 
                            : "••••••••"
                          }
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(instance.id)}
                          className="h-6 w-6 p-0"
                        >
                          {visiblePasswords.has(instance.id) ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(instance.proxyPassword, "Senha")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(instance)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a instância "{instance.instanceName}"? 
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}