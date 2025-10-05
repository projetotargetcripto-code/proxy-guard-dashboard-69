import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstanceDashboard } from "@/components/InstanceDashboard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

const DashFarm = () => {
  const { user, loading, isAdmin, adminChecking, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && !adminChecking && user && !isAdmin) {
      // Redireciona usuários não-admin para a página inicial
      navigate('/');
    }
  }, [user, loading, isAdmin, adminChecking, navigate]);

  if (loading || adminChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="bg-card/80 backdrop-blur border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Painel de Administração - DashFarm</h1>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Tabs defaultValue="instances" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instances">Instâncias</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="instances" className="space-y-4">
            <InstanceDashboard />
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <AdminPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashFarm;
