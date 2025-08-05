import { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatSearch } from "@/components/chat-search";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useSessions } from "@/hooks/use-sessions";
import { useTheme } from "@/hooks/use-theme";
import { useQkoins } from "@/hooks/use-qkoins";
import { QkoinDisplay } from "@/components/qkoin-display";
import { ArrowLeft, Bot, Settings, Download, Trash2, User, LogOut, Moon, Sun, Shield, ChevronDown, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { TypingIndicator } from "@/components/typing-indicator";
import { QuickReplies } from "@/components/quick-replies";
import { useCommandHistory } from "@/hooks/use-command-history";
import { useThemeCustomization } from "@/hooks/use-theme-customization";


export default function Chat() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const chatId = params.id;
  
  const { user, loading: authLoading, logout } = useAuth();
  const { messages, loading: chatLoading, sendMessage, clearHistory, isSending, isClearing } = useChat(chatId);
  const { isAuthenticated, sessions, createSession, switchToSession, currentSession, isLoading } = useSessions();
  const { theme, toggleTheme } = useTheme();
  const { canGenerateImage } = useQkoins();
  const { getThemeGradients } = useThemeCustomization();
  const { addToHistory, navigateHistory, saveDraft } = useCommandHistory();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [lastAiMessage, setLastAiMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive and track AI responses
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Find the last AI message for context in quick replies
    const lastAi = messages.findLast(msg => msg.role === 'assistant');
    if (lastAi && lastAi.content !== lastAiMessage) {
      setLastAiMessage(lastAi.content);
      setShowQuickReplies(true);
    }
  }, [messages, lastAiMessage]);

  // Handle typing indicator during message sending
  useEffect(() => {
    if (isSending) {
      setIsTyping(true);
      setShowQuickReplies(false);
    } else {
      // Delay hiding typing indicator to make it feel more natural
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isSending]);

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

  const handleSearchMessageClick = (sessionId: string, messageId: string) => {
    // Navigate to the session if different from current
    if (sessionId !== chatId) {
      setLocation(`/chat/${sessionId}`);
    }
    
    // Scroll to message (if needed in the future)
    // For now, just navigate to the session
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16 py-2">
            {/* Left Section - Compact */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl hover:bg-primary/10 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              )}
              {!isAuthenticated && (
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl hover:bg-primary/10 flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Bot className="text-white w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                  {(currentSession as any)?.title || "Qisa"}
                </h1>
                {isAuthenticated && (
                  <div className="hidden sm:flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Histórico salvo</p>
                  </div>
                )}
                {!isAuthenticated && (
                  <div className="hidden sm:flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Modo anônimo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Responsive */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* QKoin Display - Hidden on mobile */}
              <div className="hidden md:block">
                <QkoinDisplay compact={true} />
              </div>

              {/* Search Button - only for authenticated users, hidden on mobile */}
              {isAuthenticated && (
                <div className="hidden sm:block">
                  <ChatSearch onMessageClick={handleSearchMessageClick} />
                </div>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>

              {/* User Menu Dropdown */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 bg-muted/50 rounded-lg px-2 py-2 hover:bg-muted/70 transition-all duration-300"
                    >
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'Usuário'} 
                          className="w-7 h-7 rounded-full border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="hidden lg:block text-sm font-medium text-foreground truncate max-w-20">
                        {user.displayName || 'Usuário'}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.displayName || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Mobile-only items */}
                    <div className="sm:hidden">
                      <DropdownMenuItem>
                        <QkoinDisplay compact={true} />
                      </DropdownMenuItem>
                      {isAuthenticated && (
                        <DropdownMenuItem>
                          <ChatSearch onMessageClick={handleSearchMessageClick} />
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </div>

                    <DropdownMenuItem asChild>
                      <Link href="/about" className="flex items-center">
                        <Info className="mr-2 h-4 w-4" />
                        <span>Sobre</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {user?.username && !user.username.includes('anonymous') && (
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Perfil</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {user.username === 'daniel08' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <ThemeCustomizer />
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-subtle"></div>
                  <span className="text-sm hidden sm:block">Anônimo</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              )}
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

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}

            {/* Quick Replies - only show when there's actually a recent AI message */}
            {showQuickReplies && messages.length > 0 && !isTyping && lastAiMessage && (
              <QuickReplies 
                onReplySelect={(message) => {
                  addToHistory(message);
                  sendMessage(message, false);
                  setShowQuickReplies(false);
                }}
                context={lastAiMessage}
              />
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
