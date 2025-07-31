import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Reset messages when user changes
  useEffect(() => {
    setMessages([]);
  }, [user?.username]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, isImageRequest }: { content: string; isImageRequest: boolean }) => {
      // Add user message immediately to UI
      const userMessage: Message = {
        id: Date.now().toString(),
        sessionId: "local",
        role: "user",
        content,
        imageUrl: null,
        metadata: null,
        createdAt: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Call API for AI response without saving
      const response = await apiRequest("POST", "/api/chat/simple-send", {
        content,
        isImageRequest,
        context: messages.slice(-10) // Last 10 messages for context
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to UI
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sessionId: "local",
        role: "assistant", 
        content: data.response,
        imageUrl: data.imageUrl || null,
        metadata: null,
        createdAt: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error("Send message error:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Clear history - simple local clear
  const clearHistory = () => {
    setMessages([]);
    toast({
      title: "Histórico limpo",
      description: "O histórico de conversas foi removido.",
    });
  };

  const sendMessage = (content: string, isImageRequest = false) => {
    sendMessageMutation.mutate({ content, isImageRequest });
  };

  return {
    messages,
    loading: false,
    sendMessage,
    clearHistory,
    isSending: sendMessageMutation.isPending,
  };
}
