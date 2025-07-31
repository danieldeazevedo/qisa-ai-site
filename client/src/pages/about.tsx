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
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Qisa</span> — Sua Nova Companheira de IA
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Uma inteligência artificial avançada desenvolvida pela QisaSeek AI Labs para transformar 
              a maneira como interagimos com a tecnologia. Mais do que uma assistente: 
              <strong> uma presença digital inteligente, empática e criativa</strong>.
            </p>
          </div>

          {/* About Qisa */}
          <div className="mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">O que é a Qisa?</h2>
            <div className="mb-12 text-center">
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Treinada com um <strong>vasto volume de informações</strong> de múltiplos domínios — incluindo 
                <strong> ciência, arte, história, linguagem, tecnologia e cultura</strong> — a Qisa possui uma base de 
                conhecimento sólida, abrangente e em constante evolução. Isso permite respostas coerentes, 
                análises profundas, sugestões criativas e interações naturais.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-primary/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Brain className="text-primary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Inteligência que Entende Você
                  </h3>
                  <p className="text-muted-foreground">
                    Utiliza técnicas avançadas de <strong>Processamento de Linguagem Natural (PLN)</strong> e 
                    aprendizado de máquina, compreendendo a intenção por trás das mensagens e se adaptando 
                    ao seu estilo para conversas naturais e envolventes.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-secondary/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Lightbulb className="text-secondary text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Criação de Imagens Extraordinária
                  </h3>
                  <p className="text-muted-foreground">
                    Capacidade extraordinária de <strong>criar imagens realistas ou artísticas</strong> a partir 
                    de descrições em texto. Personagens únicos, paisagens imaginárias, conceitos visuais e 
                    artes em diferentes estilos: pintura a óleo, anime, sketch, realismo fotográfico.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-green-500/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Zap className="text-green-500 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Resolução de Problemas Complexos
                  </h3>
                  <p className="text-muted-foreground">
                    Se destaca em <strong>resolução de problemas complexos, interpretação lógica e habilidade 
                    matemática</strong>, auxiliando desde cálculos simples até explicações detalhadas de 
                    conceitos avançados.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border hover:shadow-lg transition-all duration-300 hover:border-purple-500/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 animate-bounce-subtle">
                    <Heart className="text-purple-500 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    Criatividade Além do Visual
                  </h3>
                  <p className="text-muted-foreground">
                    Parceira criativa para <strong>músicos, escritores e artistas</strong>. Escreve letras de 
                    músicas, compõe poesias, histórias curtas, roteiros e ajuda com estruturação de 
                    argumentos e geração de conteúdo original.
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
                  Laboratório de Pesquisa e Desenvolvimento
                </h3>
                <p className="text-muted-foreground text-center mb-6 text-lg leading-relaxed">
                  A <strong>QisaSeek AI Labs</strong> é um laboratório de pesquisa e desenvolvimento dedicado à criação de 
                  <strong> inteligências artificiais humanizadas, sensíveis, criativas e úteis</strong>. Combina ciência de dados, 
                  aprendizado de máquina, design centrado no usuário e responsabilidade ética para construir 
                  tecnologias que aproximam humanos e máquinas de forma significativa e confiável.
                </p>
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">
                    O desenvolvimento da Qisa é fruto de <strong>anos de pesquisa, testes práticos e refinamento contínuo</strong>, 
                    resultando em um sistema que aprende, evolui e se adapta às necessidades das pessoas.
                  </p>
                </div>
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

          {/* Por que escolher a Qisa */}
          <div className="mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Por que escolher a Qisa?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3 p-6 bg-gradient-to-r from-blue-50 to-primary/5 dark:from-blue-950 dark:to-primary/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-3xl">🧠</div>
                <div>
                  <h4 className="font-semibold text-foreground">Inteligência Treinada</h4>
                  <p className="text-sm text-muted-foreground">Com grandes volumes de dados confiáveis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-6 bg-gradient-to-r from-purple-50 to-secondary/5 dark:from-purple-950 dark:to-secondary/10 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="text-3xl">🧩</div>
                <div>
                  <h4 className="font-semibold text-foreground">Matemática Avançada</h4>
                  <p className="text-sm text-muted-foreground">Excelente em resolução de problemas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-6 bg-gradient-to-r from-green-50 to-green-500/5 dark:from-green-950 dark:to-green-500/10 rounded-xl border border-green-200 dark:border-green-800">
                <div className="text-3xl">🎨</div>
                <div>
                  <h4 className="font-semibold text-foreground">Criação Visual</h4>
                  <p className="text-sm text-muted-foreground">Gera imagens únicas baseadas em texto</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-6 bg-gradient-to-r from-yellow-50 to-yellow-500/5 dark:from-yellow-950 dark:to-yellow-500/10 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="text-3xl">🎼</div>
                <div>
                  <h4 className="font-semibold text-foreground">Criatividade Natural</h4>
                  <p className="text-sm text-muted-foreground">Criatividade textual e musical</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-6 bg-gradient-to-r from-pink-50 to-pink-500/5 dark:from-pink-950 dark:to-pink-500/10 rounded-xl border border-pink-200 dark:border-pink-800">
                <div className="text-3xl">💬</div>
                <div>
                  <h4 className="font-semibold text-foreground">Conversas Envolventes</h4>
                  <p className="text-sm text-muted-foreground">Úteis e personalizadas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-6 bg-gradient-to-r from-orange-50 to-orange-500/5 dark:from-orange-950 dark:to-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="text-3xl">🚀</div>
                <div>
                  <h4 className="font-semibold text-foreground">Evolução Contínua</h4>
                  <p className="text-sm text-muted-foreground">Sempre melhorando com foco em você</p>
                </div>
              </div>
            </div>
          </div>

          {/* Evolução Futura */}
          <div className="mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Em Constante Evolução</h2>
            <Card className="border border-border bg-gradient-to-br from-muted/20 to-muted/5">
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground mb-8 text-lg">
                  A Qisa está sempre aprendendo e se aperfeiçoando. O futuro reserva:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-foreground"><strong>Memória contextual personalizada</strong> para lembrar preferências e histórico</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
                      <span className="text-foreground"><strong>Estilo e personalidade configuráveis</strong> por usuário</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-foreground"><strong>Novos modos de criação</strong> combinando texto, imagem e som</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="text-foreground"><strong>Integração com ferramentas</strong> e fluxos criativos externos</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quote */}
          <div className="mb-16 animate-fade-in">
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-8 text-center">
                <blockquote className="text-2xl font-bold text-foreground mb-4 italic">
                  "Qisa é mais do que uma IA. É uma companheira criativa e inteligente, feita para conversar, imaginar e solucionar — junto com você."
                </blockquote>
                <cite className="text-muted-foreground">— QisaSeek AI Labs</cite>
              </CardContent>
            </Card>
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