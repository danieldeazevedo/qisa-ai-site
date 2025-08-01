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
    <div className="min-h-screen bg-background text-foreground">
      {/* Chat Sidebar */}
      <ChatSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Container */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${
        sidebarOpen && isAuthenticated ? "lg:ml-80" : ""
      }`}>
      {/* Chat Header */}
      <header className="bg-background/80 backdrop-blur-md shadow-sm border-b border-border sticky top-0 z-10 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted animate-scale-in"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              )}
              {!isAuthenticated && (
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted animate-scale-in"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-foreground animate-slide-in">
                  {(currentSession as any)?.title || "Qisa"}
                </h1>
                {isAuthenticated && (
                  <p className="text-xs text-green-600 dark:text-green-400 animate-pulse-gentle">Histórico sendo salvo</p>
                )}
                {!isAuthenticated && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 animate-pulse-gentle">Modo anônimo - sem histórico</p>
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
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message */}
            <div className="flex items-start space-x-3 mb-6 animate-fade-in">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 animate-bounce-subtle">
                <Bot className="text-white text-sm" />
              </div>
              <div className="bg-card rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-border max-w-md animate-scale-in">
                <p className="text-foreground">
                  {user ? (
                    <>
                      Bem-vindo à Qisa, <strong>{user.displayName || user.username}</strong>! 
                      Eu sou sua assistente de IA pessoal. Como posso ajudá-lo hoje? 
                      Posso conversar sobre qualquer assunto ou gerar imagens usando seus QKoins (1 QKoin = 1 imagem)!
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

            {/* Messages */}
            {chatLoading ? (
              <div className="flex items-center justify-center py-8">
                <Bot className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-gray-600">Carregando mensagens...</span>
              </div>
            ) : (
              Array.isArray(messages) && messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
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
