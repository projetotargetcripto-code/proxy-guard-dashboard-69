import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SystemStatsCards } from "./SystemStatsCards";
import { UserManagementTable } from "./UserManagementTable";
import { UserInstancesView } from "./UserInstancesView";
import { ZapGuardInstancesView } from "./ZapGuardInstancesView";
import { CreateUserDialog } from "./CreateUserDialog";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus } from "lucide-react";

export const AdminPanel = () => {
  const { users, loading, updateUserRole, deleteUser, refetch } = useAdminUsers();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SystemStatsCards />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
          <TabsTrigger value="instances">Instâncias por Usuário</TabsTrigger>
          <TabsTrigger value="zapguard">Gestão ZapGuard</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Usuário
            </Button>
          </div>
          
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-primary">Usuários do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagementTable
                users={users}
                onUpdateRole={updateUserRole}
                onDeleteUser={deleteUser}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <UserInstancesView users={users} />
        </TabsContent>

        <TabsContent value="zapguard" className="space-y-4">
          <ZapGuardInstancesView users={users} />
        </TabsContent>
      </Tabs>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
};
