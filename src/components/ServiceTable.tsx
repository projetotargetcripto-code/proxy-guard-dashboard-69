import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";
import { Service } from "@/types/instance";

interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  serviceInstanceCounts?: Record<string, number>;
}

export function ServiceTable({
  services,
  onEdit,
  onDelete,
  serviceInstanceCounts,
}: ServiceTableProps) {
  if (services.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-32 h-32 bg-muted/20 rounded-full flex items-center justify-center">
              <Settings className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-primary">
              Nenhum serviço encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não criou nenhum serviço. Clique em "Adicionar Serviço" 
              para começar a organizar suas instâncias por categorias.
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
          <Settings className="h-5 w-5" />
          Serviços Configurados
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/20 border-b border-border/50 text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Nome</div>
              <div className="col-span-5">Descrição</div>
              <div className="col-span-2 text-center">Instâncias</div>
              <div className="col-span-1">Criado</div>
              <div className="col-span-1">Ações</div>
            </div>

            {/* Rows */}
              {services.map((service) => {
                const count = serviceInstanceCounts?.[service.id] ?? 0;

                return (
                  <div
                    key={service.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <div className="col-span-3">
                      <p className="font-medium text-foreground truncate" title={service.name}>
                        {service.name}
                      </p>
                    </div>

                    <div className="col-span-5">
                      <p className="text-muted-foreground truncate" title={service.description}>
                        {service.description || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="col-span-2 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {`${count} instância${count === 1 ? '' : 's'}`}
                      </p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(service.created_at).toLocaleDateString('pt-BR')}
                      </p>
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
                          <DropdownMenuItem onClick={() => onEdit(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                                    Tem certeza que deseja excluir o serviço "{service.name}"?
                                    Esta ação não pode ser desfeita e pode afetar instâncias associadas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(service.id)}
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
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}