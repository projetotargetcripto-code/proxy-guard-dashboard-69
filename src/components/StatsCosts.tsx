import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Instance, InstanceStatus } from "@/types/instance";
import { differenceInMonths } from "date-fns";
import { TrendingUp, DollarSign, Cpu, Smartphone } from "lucide-react";

interface StatsCostsProps {
  instances: Instance[];
}

export function StatsCosts({ instances }: StatsCostsProps) {
  const totalInstances = instances.length;

  const statusCounts = instances.reduce((acc, instance) => {
    acc[instance.status] = (acc[instance.status] || 0) + 1;
    return acc;
  }, {} as Record<InstanceStatus, number>);

  const activeInstancesCount =
    (statusCounts["Aquecendo"] || 0) + (statusCounts["Disparando"] || 0);

  // Cost constants
  const COSTS = {
    chipPurchaseBRL: 30,
    chipRenewBRL: 10,
    ipPurchaseUSD: 4,
    ipRenewUSD: 4,
  };

  const USD_TO_BRL = 5.2;
  const initialCostPerInstanceBRL =
    COSTS.chipPurchaseBRL + COSTS.ipPurchaseUSD * USD_TO_BRL;
  const renewalCostBRL =
    COSTS.chipRenewBRL + COSTS.ipRenewUSD * USD_TO_BRL;

  const now = new Date();
  let totalPaidBRL = 0;
  let nextMonthBRL = 0;
  let renewalsPaidCount = 0;
  let activeRenewalCount = 0;

  instances.forEach((instance) => {
    totalPaidBRL += initialCostPerInstanceBRL;

    if (instance.status === "Aquecendo" || instance.status === "Disparando") {
      const monthsActive = differenceInMonths(now, new Date(instance.created_at));
      renewalsPaidCount += monthsActive;
      totalPaidBRL += monthsActive * renewalCostBRL;

      if (monthsActive >= 1) {
        activeRenewalCount += 1;
        nextMonthBRL += renewalCostBRL;
      }
    }
  });

  const statusInfo = [
    { status: "Repouso" as InstanceStatus, color: "bg-blue-500", label: "Em Repouso" },
    { status: "Aquecendo" as InstanceStatus, color: "bg-yellow-500", label: "Aquecendo" },
    { status: "Disparando" as InstanceStatus, color: "bg-green-500", label: "Disparando" },
    { status: "Banida" as InstanceStatus, color: "bg-red-500", label: "Banida" },
  ];

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Cpu className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total de Instâncias</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalInstances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-300">Instâncias Ativas</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {activeInstancesCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Total Já Pago</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  R$ {totalPaidBRL.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-300">Próximo Mês</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  R$ {nextMonthBRL.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Instâncias */}
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span>Distribuição por Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusInfo.map(({ status, color, label }) => {
            const count = statusCounts[status] || 0;
            const percentage = totalInstances > 0 ? (count / totalInstances) * 100 : 0;

            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {count} ({percentage.toFixed(1)}%)
                  </Badge>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Detalhamento de Custos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Já Pago */}
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Custos Já Pagos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Investimento Inicial ({totalInstances} × R$ {initialCostPerInstanceBRL.toFixed(2)})
                </span>
              </div>
              <span className="font-semibold">
                R$ {(initialCostPerInstanceBRL * totalInstances).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-purple-500" />
                <span className="text-sm">
                  Renovações Pagas ({renewalsPaidCount} × R$ {renewalCostBRL.toFixed(2)})
                </span>
              </div>
              <span className="font-semibold">
                R$ {(renewalsPaidCount * renewalCostBRL).toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total Pago:</span>
                <span className="text-primary">R$ {totalPaidBRL.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximo Mês */}
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Custos do Próximo Mês</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Renovações Previstas ({activeRenewalCount} × R$ {renewalCostBRL.toFixed(2)})
                </span>
              </div>
              <span className="font-semibold">
                R$ {nextMonthBRL.toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total Próximo Mês:</span>
                <span className="text-accent">R$ {nextMonthBRL.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
