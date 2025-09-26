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
  Users,
  Mail,
  Phone,
} from "lucide-react";
import { Client } from "@/types/instance";

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  clientServiceCounts?: Record<string, number>;
  clientInstanceCounts?: Record<string, number>;
}

export function ClientTable({
  clients,
  onEdit,
  onDelete,
  clientServiceCounts,
  clientInstanceCounts,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-32 h-32 bg-muted/20 rounded-full flex items-center justify-center">
              <Users className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-primary">
              Nenhum cliente encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não criou nenhum cliente. Clique em "Adicionar Cliente" 
              para começar a organizar seus serviços e instâncias por cliente.
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
          <Users className="h-5 w-5" />
          Clientes Cadastrados
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-16 gap-4 p-4 bg-muted/20 border-b border-border/50 text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Nome</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-2">Telefone</div>
              <div className="col-span-1">ID Conta</div>
              <div className="col-span-3">Descrição</div>
              <div className="col-span-1 text-center">Serviços</div>
              <div className="col-span-2 text-center">Instâncias</div>
              <div className="col-span-2">Ações</div>
            </div>

            {/* Rows */}
            {clients.map((client) => {
              const serviceCount = clientServiceCounts?.[client.id] ?? 0;
              const instanceCount = clientInstanceCounts?.[client.id] ?? 0;

              return (
                <div
                  key={client.id}
                  className="grid grid-cols-16 gap-4 p-4 border-b border-border/20 hover:bg-muted/10 transition-colors"
                >
                  <div className="col-span-3">
                    <p className="font-medium text-foreground truncate" title={client.name}>
                      {client.name}
                    </p>
                  </div>

                  <div className="col-span-2">
                    {client.email ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="text-sm truncate" title={client.email}>
                          {client.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>

                  <div className="col-span-2">
                    {client.phone ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="text-sm truncate" title={client.phone}>
                          {client.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>

                  <div className="col-span-1">
                    <p className="text-muted-foreground text-sm">
                      {client.account_id || '-'}
                    </p>
                  </div>

                  <div className="col-span-3">
                    <p className="text-muted-foreground text-sm truncate" title={client.description}>
                      {client.description || 'Sem descrição'}
                    </p>
                  </div>

                  <div className="col-span-1 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {`${serviceCount} serviço${serviceCount === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  <div className="col-span-2 text-center">
                    <p className="text-sm font-semibold text-primary">
                      {`${instanceCount} instância${instanceCount === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
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
                                  Tem certeza que deseja excluir o cliente "{client.name}"?
                                  Esta ação não pode ser desfeita e pode afetar serviços e instâncias associadas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(client.id)}
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