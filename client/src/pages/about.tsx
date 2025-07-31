import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, ArrowLeft, Users, Brain, Shield, Zap, Heart, Lightbulb, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function About() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md shadow-sm border-b border-border sticky top-0 z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted animate-scale-in"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sobre a Qisa
              </h1>
            </div>
            
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl mb-6 shadow-lg animate-pulse">
              <Bot className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
              Conheça a <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Qisa</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Sua assistente de IA pessoal, desenvolvida pela QisaSeek AI Labs para proporcionar 
              conversas naturais e experiências inteligentes adaptadas às suas necessidades.
            </p>
          </div>

          {/* About Qisa */}
          <div className="mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">O que é a Qisa?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-primary/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Brain className="text-primary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Inteligência Avançada
                  </h3>
                  <p className="text-muted-foreground">
                    Desenvolvida com a mais avançada tecnologia Google Gemini, a Qisa oferece 
                    conversas naturais e inteligentes, entendendo contexto e mantendo diálogos fluidos.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-secondary/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Lightbulb className="text-secondary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Criatividade Visual
                  </h3>
                  <p className="text-muted-foreground">
                    Transforme suas ideias em imagens únicas. A Qisa pode gerar ilustrações, 
                    logos, arte conceitual e qualquer imagem que você conseguir imaginar.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-green-500/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Shield className="text-green-500 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Privacidade Garantida
                  </h3>
                  <p className="text-muted-foreground">
                    Suas conversas são seguras e privadas. Para usuários autenticados, 
                    mantemos histórico pessoal, enquanto usuários anônimos podem conversar sem registro.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-purple-500/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Heart className="text-purple-500 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Experiência Personalizada
                  </h3>
                  <p className="text-muted-foreground">
                    A Qisa se adapta ao seu estilo de conversa, lembrando de preferências 
                    e mantendo o contexto para proporcionar uma experiência única e pessoal.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* QisaSeek AI Labs */}
          <div className="mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">QisaSeek AI Labs</h2>
            <Card className="border border-border bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                    <Users className="text-white text-2xl" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground text-center mb-4">
                  Inovação em Inteligência Artificial
                </h3>
                <p className="text-muted-foreground text-center mb-6 text-lg leading-relaxed">
                  A QisaSeek AI Labs é uma empresa de tecnologia dedicada ao desenvolvimento 
                  de soluções de inteligência artificial que aproximam humanos e máquinas 
                  através de interfaces intuitivas e experiências personalizadas.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Zap className="text-primary text-lg" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Inovação</h4>
                    <p className="text-sm text-muted-foreground">
                      Sempre na vanguarda da tecnologia de IA
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Users className="text-secondary text-lg" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Humanidade</h4>
                    <p className="text-sm text-muted-foreground">
                      Tecnologia centrada no ser humano
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Heart className="text-green-500 text-lg" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Paixão</h4>
                    <p className="text-sm text-muted-foreground">
                      Dedicação em cada projeto desenvolvido
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Features */}
          <div className="mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Recursos Técnicos</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Suporte completo a Markdown</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Renderização de expressões matemáticas (LaTeX)</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Histórico persistente de conversas</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-foreground">Autenticação segura personalizada</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-foreground">Geração de imagens com IA</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-foreground">Interface responsiva e moderna</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-foreground">Temas claro e escuro</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-foreground">Experiência otimizada para todos os dispositivos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Pronto para conversar com a Qisa?
            </h2>
            <p className="text-muted-foreground mb-8">
              Descubra o poder da inteligência artificial em suas mãos
            </p>
            <Link href="/chat">
              <Button
                size="lg"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
              >
                <Bot className="mr-3 animate-bounce" />
                Começar Conversa
              </Button>
            </Link>
          </div>
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