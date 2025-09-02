import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import blockchainHero from '@/assets/blockchain-hero.jpg';
import securityIcon from '@/assets/security-icon.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos. Verifique suas credenciais.');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden cyber-grid"
      style={{
        backgroundImage: `url(${blockchainHero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-hero backdrop-blur-sm"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-16 h-16 blockchain-primary/20 rounded-full blur-xl animate-pulse-glow"></div>
      <div className="absolute top-40 right-20 w-24 h-24 cyber-purple/20 rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-32 left-20 w-20 h-20 cyber-cyan/20 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 right-10 w-12 h-12 blockchain-glow/20 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          
          {/* Left side - Branding */}
          <div className="text-center md:text-left space-y-8 animate-slide-in-left">
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <img 
                  src={securityIcon} 
                  alt="Security" 
                  className="w-16 h-16 animate-pulse-glow"
                />
                <div className="w-px h-16 bg-gradient-blockchain"></div>
                <Shield className="w-16 h-16 text-blockchain-primary animate-float" />
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-blockchain bg-clip-text text-transparent animate-scale-in">
                Sistema
                <br />
                <span className="bg-gradient-cyber bg-clip-text text-transparent">
                  Seguro
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-md animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                Acesso protegido por blockchain e criptografia avançada. 
                Entre com suas credenciais para acessar o dashboard.
              </p>
            </div>

            {/* Security features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto md:mx-0 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 backdrop-blur border border-blockchain-primary/20">
                <Lock className="w-5 h-5 text-blockchain-primary" />
                <span className="text-sm">Criptografia AES-256</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 backdrop-blur border border-cyber-cyan/20">
                <Shield className="w-5 h-5 text-cyber-cyan" />
                <span className="text-sm">Proteção Multicamada</span>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
            <Card className="blockchain-glow bg-card/80 backdrop-blur-xl border-blockchain-primary/20 shadow-blockchain">
              <CardHeader className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-blockchain rounded-full flex items-center justify-center animate-pulse-glow">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-blockchain bg-clip-text text-transparent">
                  Acesso Autorizado
                </CardTitle>
                <CardDescription className="text-base">
                  Digite suas credenciais de acesso para entrar no sistema
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 p-8">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-semibold text-blockchain-primary">
                      Email de Acesso
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@sistema.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base bg-background/50 border-blockchain-primary/30 focus:border-blockchain-primary focus:ring-blockchain-primary/20 transition-smooth"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-semibold text-blockchain-primary">
                      Senha Segura
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 text-base bg-background/50 border-blockchain-primary/30 focus:border-blockchain-primary focus:ring-blockchain-primary/20 pr-12 transition-smooth"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 
                          <EyeOff className="h-4 w-4 text-muted-foreground" /> : 
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                      <AlertDescription className="text-center">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-base font-semibold bg-gradient-blockchain hover:shadow-glow disabled:opacity-50 transition-bounce"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Validando Acesso...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-3 h-5 w-5" />
                        Acessar Sistema
                      </>
                    )}
                  </Button>
                </form>
                
                {/* Security notice */}
                <div className="pt-4 border-t border-blockchain-primary/20">
                  <p className="text-xs text-center text-muted-foreground">
                    🔒 Conexão protegida por SSL/TLS • Dados criptografados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;