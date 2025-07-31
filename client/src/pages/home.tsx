import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageCircle, Image, Shield, LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
            
            {/* Auth Section */}
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
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
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
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
                    className="text-primary border-primary hover:bg-primary hover:text-white transition-colors"
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
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <TypewriterText text="Bem-vindo à " delay={80} />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <TypewriterText text="Qisa" delay={120} />
              </span>
            </h1>
          </FadeInUp>
          
          <FadeInUp delay={1500} className="mb-8">
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              <TypewriterText 
                text="Sua assistente de IA avançada que conversa naturalmente e gera imagens incríveis a partir de suas ideias." 
                delay={30}
              />
            </p>
          </FadeInUp>

          {/* Features Grid */}
          <FadeInUp delay={3000}>
            <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
              <Card className="border border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <MessageCircle className="text-primary text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Conversação Natural
                  </h3>
                  <p className="text-gray-600">
                    Converse de forma natural sobre qualquer assunto. A Qisa
                    entende contexto e mantém conversas fluidas.
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-secondary/20">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Image className="text-secondary text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Geração de Imagens
                  </h3>
                  <p className="text-gray-600">
                    Transforme suas ideias em imagens únicas. Descreva o que
                    imagina e veja ganhar vida.
                  </p>
                </CardContent>
              </Card>
            </div>
          </FadeInUp>

          {/* CTA Button */}
          <FadeInUp delay={4000}>
            <div className="space-y-4">
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
                <p className="text-sm text-gray-500 animate-fade-in">
                  <Shield className="inline w-4 h-4 mr-1" />
                  Suas conversas são seguras e privadas
                </p>
                {!user && (
                  <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    💡 O chat funciona sem login! Faça login para salvar seu histórico.
                  </p>
                )}
              </div>
            </div>
          </FadeInUp>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            © 2024 QisaSeek AI Labs.
          </p>
        </div>
      </footer>
    </div>
  );
}