import { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ChatSidebar } from "@/components/chat-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useSessions } from "@/hooks/use-sessions";
import { useTheme } from "@/hooks/use-theme";
import { useQkoins } from "@/hooks/use-qkoins";
import { QkoinDisplay } from "@/components/qkoin-display";
import { ArrowLeft, Bot, Settings, Download, Trash2, User, LogOut, Moon, Sun, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function Chat() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const chatId = params.id;
  
  const { user, loading: authLoading, logout } = useAuth();
  const { messages, loading: chatLoading, sendMessage, clearHistory, isSending, isClearing } = useChat(chatId);
  const { isAuthenticated, sessions, createSession, switchToSession, currentSession, isLoading } = useSessions();
  const { theme, toggleTheme } = useTheme();
  const { canGenerateImage } = useQkoins();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle navigation: if authenticated and no chatId, navigate to first session
  useEffect(() => {
    // Only navigate to existing session, don't create automatically
    if (isAuthenticated && !chatId && sessions && sessions.length > 0 && !isLoading) {
      setLocation(`/chat/${sessions[0].id}`);
    }
  }, [isAuthenticated, chatId, sessions?.length, isLoading]);

  // No authentication required - chat is open to everyone

  const handleExportHistory = () => {
    const exportData = {
      messages,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qisa-chat-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Histórico exportado",
      description: "Seu histórico de conversa foi baixado.",
    });
  };

  // No authentication checks - everyone can use the chat

  return (
    <div className="min-h-screen relative text-foreground bg-background">{/* Removed AnimatedBackground */}
      
      {/* Chat Sidebar */}
      <ChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Container */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 relative ${
        sidebarOpen && isAuthenticated ? "lg:ml-80" : ""
      }`}>
      {/* Chat Header */}
      <header className="bg-gradient-to-r from-background/80 via-background/70 to-background/80 backdrop-blur-xl shadow-lg border-b border-border/20 sticky top-0 z-10 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-2">
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2.5 text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl hover:bg-primary/10 hover:shadow-md animate-scale-in group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              )}
              {!isAuthenticated && (
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2.5 text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl hover:bg-primary/10 hover:shadow-md animate-scale-in group"
                  >
                    <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Button>
                </Link>
              )}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in hover:shadow-xl transition-all duration-300">
                <Bot className="text-white w-6 h-6" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-slide-in">
                  {(currentSession as any)?.title || "Qisa"}
                </h1>
                {isAuthenticated && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Histórico sendo salvo automaticamente</p>
                  </div>
                )}
                {!isAuthenticated && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Modo anônimo - sem histórico</p>
                  </div>
                )}
              </div>
            </div>
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

              {/* Profile Button - only for authenticated users */}
              {user?.username && !user.username.includes('anonymous') && (
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted animate-scale-in"
                  >
                    Perfil
                  </Button>
                </Link>
              )}
              
              {/* QKoin Display */}
              <QkoinDisplay compact={true} />
              
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

              {/* User Profile Section */}
              {user ? (
                <div className="flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-2 animate-slide-in">
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
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  {user.username && !user.username.includes('anonymous') && (
                    <Link href="/profile">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-primary/10"
                        title="Meu Perfil"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  {user.username === 'daniel08' && (
                    <Link href="/admin">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-muted-foreground hover:text-blue-500 transition-all duration-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950"
                        title="Painel Administrativo"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="p-1 text-muted-foreground hover:text-red-500 transition-all duration-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid="button-logout-chat"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground animate-pulse-gentle">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-subtle"></div>
                  <span className="text-sm">Modo Anônimo</span>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted animate-scale-in"
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-hidden flex flex-col bg-gradient-to-b from-transparent via-background/20 to-background/40 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Enhanced Welcome Section */}
            {messages.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-gentle shadow-2xl">
                  <Bot className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  {user ? `Olá, ${user.displayName || user.username}!` : "Bem-vindo à Qisa!"}
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  Como posso ajudá-lo hoje? Estou aqui para conversar, resolver problemas ou gerar imagens incríveis.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.querySelector<HTMLTextAreaElement>('textarea')?.focus()}
                    className="animate-scale-in hover:shadow-lg transition-all duration-300 rounded-xl border-2 hover:border-primary/50"
                  >
                    ✨ Começar conversa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
                      if (textarea) {
                        textarea.value = "Gere uma imagem criativa para mim";
                        textarea.focus();
                      }
                    }}
                    className="animate-scale-in hover:shadow-lg transition-all duration-300 rounded-xl border-2 hover:border-secondary/50"
                  >
                    🎨 Gerar imagem
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700/30">
                    <div className="text-blue-600 dark:text-blue-400 mb-2 text-xl">💬</div>
                    <h3 className="font-semibold text-sm mb-1">Conversas Inteligentes</h3>
                    <p className="text-xs text-muted-foreground">Respondo suas perguntas com precisão</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700/30">
                    <div className="text-purple-600 dark:text-purple-400 mb-2 text-xl">🎨</div>
                    <h3 className="font-semibold text-sm mb-1">Geração de Imagens</h3>
                    <p className="text-xs text-muted-foreground">Crio imagens únicas para você</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl border border-pink-200 dark:border-pink-700/30">
                    <div className="text-pink-600 dark:text-pink-400 mb-2 text-xl">📄</div>
                    <h3 className="font-semibold text-sm mb-1">Análise de Arquivos</h3>
                    <p className="text-xs text-muted-foreground">Leio PDFs e analiso imagens</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Regular Welcome Message for users with chat history */}
            {messages.length > 0 && (
              <div className="flex items-start space-x-3 mb-6 animate-fade-in">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="text-white w-5 h-5" />
                </div>
                <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg border border-border/50 max-w-md animate-scale-in">
                  <p className="text-foreground">
                    {user ? (
                      <>
                        Bem-vindo de volta, <strong>{user.displayName || user.username}</strong>! 
                        Eu sou sua assistente de IA pessoal. Como posso ajudá-lo hoje? 
                        Posso conversar sobre qualquer assunto ou gerar imagens usando seus QKoins!
                      </>
                    ) : (
                      <>
                        Olá! Eu sou a Qisa, sua assistente de IA. Como posso ajudá-lo
                        hoje? Posso conversar sobre qualquer assunto ou gerar imagens
                        a partir de suas descrições!
                      </>
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 block">Agora</span>
                </div>
              </div>
            )}

            {/* Messages */}
            {chatLoading ? (
              <div className="flex items-center justify-center py-8">
                <Bot className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-gray-600">Carregando mensagens...</span>
              </div>
            ) : (
              Array.isArray(messages) && messages.map((message, index) => {
                // Only animate if it's the latest AI message AND marked as new
                const aiMessages = messages.filter(m => m.role === 'assistant');
                const isLatestAI = message.role === 'assistant' && 
                                   aiMessages.length > 0 && 
                                   message.id === aiMessages[aiMessages.length - 1].id &&
                                   message.metadata?.isNewMessage === true;
                
                return (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    isLatest={isLatestAI}
                  />
                );
              })
            )}

            {/* Loading Message */}
            {isSending && (
              <div className="flex items-start space-x-3 mb-6 animate-fade-in">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 animate-pulse-gentle">
                  <Bot className="text-white text-sm" />
                </div>
                <div className="bg-card rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-border animate-scale-in">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      Qisa está digitando...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Chat Input */}
      <ChatInput onSendMessage={sendMessage} isLoading={isSending} />

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center animate-slide-in">
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-foreground">Modo {theme === 'dark' ? 'escuro' : 'claro'}</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                className="transition-all duration-300"
              />
            </div>
            <div className="flex justify-between items-center animate-slide-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {user?.username && !user.username.includes('anonymous') 
                    ? 'Limpar histórico salvo' 
                    : 'Limpar chat atual'
                  }
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                disabled={isClearing}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-all duration-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isClearing ? 'Limpando...' : 'Limpar'}
              </Button>
            </div>
            <div className="flex justify-between items-center animate-slide-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">Exportar conversa</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHistory}
                className="text-primary border-primary hover:bg-primary/10 transition-all duration-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
            
            {/* QKoins Section */}
            {user && !user.username?.includes('anonymous') && (
              <div className="mt-6 animate-slide-in" style={{ animationDelay: "0.3s" }}>
                <QkoinDisplay compact={false} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
