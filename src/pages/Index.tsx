import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientInstanceDashboard } from "@/components/ClientInstanceDashboard";
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="bg-card/80 backdrop-blur border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Painel de Cliente</h1>
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
        <ClientInstanceDashboard />
      </main>
    </div>
  );
};

export default Index;
