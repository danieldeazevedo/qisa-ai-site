import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageCircle, Image, Shield, LogIn, LogOut, User, Moon, Sun, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useQkoins } from "@/hooks/use-qkoins";
import { QkoinDisplay } from "@/components/qkoin-display";

// Componente de texto animado com efeito de digitação
function TypewriterText({ text, delay = 50, className = "" }: { text: string; delay?: number; className?: string }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span className={className}>{displayText}</span>;
}

// Componente de animação de entrada
function FadeInUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md shadow-sm border-b border-border sticky top-0 z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="text-white text-lg" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Qisa
              </h1>
            </div>
            
            {/* Navigation & Auth Section */}
            <div className="flex items-center space-x-3">
              {/* About Button */}
              <Link href="/about">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted animate-scale-in"
                >
                  Sobre
                </Button>
              </Link>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted animate-scale-in"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>

              {loading ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-3 bg-muted/50 rounded-lg px-3 py-2 animate-slide-in">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Usuário'} 
                      className="w-8 h-8 rounded-full border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {user.displayName || 'Usuário'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="text-muted-foreground border-border hover:bg-muted transition-all duration-300"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300 animate-scale-in"
                    data-testid="button-login"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInUp className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl mb-6 shadow-lg animate-pulse">
              <Bot className="text-white text-3xl" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
              <TypewriterText text="Bem-vindo à " delay={80} />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <TypewriterText text="Qisa" delay={120} />
              </span>
            </h1>
          </FadeInUp>
          
          <div className="mb-8">
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              <TypewriterText 
                text="Sua assistente de IA avançada que conversa naturalmente e gera imagens incríveis a partir de suas ideias." 
                delay={30}
              />
            </p>
            
            {/* CTA Button */}
            <FadeInUp delay={2500}>
              <div className="space-y-4 mb-12">
                <Link href="/chat">
                  <Button
                    size="lg"
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg animate-gradient bg-gradient-to-r from-primary via-secondary to-primary bg-size-200 hover:bg-right-bottom"
                    data-testid="button-start-chat"
                  >
                    <MessageCircle className="mr-3 animate-bounce" />
                    Conversar com a Qisa
                  </Button>
                </Link>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground animate-fade-in">
                    <Shield className="inline w-4 h-4 mr-1" />
                    Suas conversas são seguras e privadas
                  </p>
                  {!user && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                      💡 O chat funciona sem login! Faça login para salvar seu histórico.
                    </p>
                  )}
                </div>
              </div>
            </FadeInUp>
          </div>

          {/* Features Grid */}
          <FadeInUp delay={3000}>
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
              <Card className="border border-border hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-primary/20 bg-card animate-fade-in">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto animate-bounce-subtle">
                    <MessageCircle className="text-primary text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Conversação Natural
                  </h3>
                  <p className="text-muted-foreground">
                    Converse de forma natural sobre qualquer assunto. A Qisa
                    entende contexto e mantém conversas fluidas.
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-secondary/20 bg-card animate-fade-in">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 mx-auto animate-bounce-subtle">
                    <Image className="text-secondary text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Geração de Imagens
                  </h3>
                  <p className="text-muted-foreground">
                    Transforme suas ideias em imagens únicas usando QKoins. 
                    Receba 10 QKoins diários e use 1 por imagem gerada.
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-green-500/20 bg-card animate-fade-in">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto animate-bounce-subtle">
                    <span className="text-green-500 text-xl">🧩</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Matemática Avançada
                  </h3>
                  <p className="text-muted-foreground">
                    Resolução de problemas complexos e suporte a LaTeX para
                    expressões matemáticas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </FadeInUp>

          {/* Principais diferenciais */}
          <FadeInUp delay={4000}>
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Por que escolher a Qisa?</h2>
              <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-primary/5 dark:from-blue-950 dark:to-primary/10 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl">🧠</div>
                  <div>
                    <h4 className="font-semibold text-foreground">Inteligência Treinada</h4>
                    <p className="text-sm text-muted-foreground">Com grandes volumes de dados confiáveis</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-secondary/5 dark:from-purple-950 dark:to-secondary/10 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl">💰</div>
                  <div>
                    <h4 className="font-semibold text-foreground">Sistema QKoins</h4>
                    <p className="text-sm text-muted-foreground">10 QKoins diários para gerar suas imagens</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-500/5 dark:from-green-950 dark:to-green-500/10 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-2xl">💬</div>
                  <div>
                    <h4 className="font-semibold text-foreground">Conversas Envolventes</h4>
                    <p className="text-sm text-muted-foreground">Úteis e personalizadas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-orange-500/5 dark:from-orange-950 dark:to-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-800">
                  <div className="text-2xl">🚀</div>
                  <div>
                    <h4 className="font-semibold text-foreground">Evolução Contínua</h4>
                    <p className="text-sm text-muted-foreground">Sempre melhorando com foco em você</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>


        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground">
            © 2025 QisaSeek AI Labs. Desenvolvido com ❤️ para conectar humanos e IA.
          </p>
        </div>
      </footer>
    </div>
  );
}