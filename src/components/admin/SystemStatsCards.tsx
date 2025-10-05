import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Database, Wifi, Server } from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";

export const SystemStatsCards = () => {
  const { stats, loading } = useAdminStats();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
    },
    {
      title: "Total de Instâncias",
      value: stats.totalInstances,
      icon: Database,
    },
    {
      title: "Total de Proxies",
      value: stats.totalProxies,
      icon: Wifi,
    },
    {
      title: "Total de Serviços",
      value: stats.totalServices,
      icon: Server,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-card/80 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.instancesByStatus.length > 0 && (
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="text-primary">Instâncias por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {stats.instancesByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-lg font-bold text-primary">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
