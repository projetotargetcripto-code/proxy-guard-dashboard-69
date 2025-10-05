import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemStatsCards } from "./SystemStatsCards";
import { UserManagementTable } from "./UserManagementTable";
import { UserInstancesView } from "./UserInstancesView";
import { ZapGuardInstancesView } from "./ZapGuardInstancesView";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminPanel = () => {
  const { users, loading, updateUserRole, deleteUser } = useAdminUsers();

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
    </div>
  );
};
