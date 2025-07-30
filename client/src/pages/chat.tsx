import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
// import { useAuth } from "@/hooks/use-auth"; // Removed authentication
import { useChat } from "@/hooks/use-chat";
import { ArrowLeft, Bot, Settings, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  // const { user, loading: authLoading } = useAuth(); // Removed authentication
  const { messages, loading: chatLoading, sendMessage, clearHistory, isSending } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="min-h-screen flex flex-col">
      {/* Chat Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Bot className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Qisa</h1>
                <p className="text-sm text-gray-500">IA Conversacional</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
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
            <div className="flex items-start space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100 max-w-md">
                <p className="text-gray-900">
                  Olá! Eu sou a Qisa, sua assistente de IA. Como posso ajudá-lo
                  hoje? Posso conversar sobre qualquer assunto ou gerar imagens
                  a partir de suas descrições!
                </p>
                <span className="text-xs text-gray-500 mt-2 block">Agora</span>
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
              <div className="flex items-start space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white text-sm" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-gray-500 text-sm">
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
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Modo escuro</span>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Limpar histórico</span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Exportar conversa</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportHistory}
                className="text-primary border-primary hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
