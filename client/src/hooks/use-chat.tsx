import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>("main");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load chat history for authenticated users
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/chat/history', sessionId, user?.username],
    queryFn: async () => {
      if (!user?.username || user.username.includes('anonymous')) {
        return [];
      }
      const response = await apiRequest("GET", `/api/chat/history/${sessionId}`);
      return response.json();
    },
    enabled: !!user?.username && !user.username.includes('anonymous'),
  });

  // Update messages when history loads or user changes
  useEffect(() => {
    if (user?.username && !user.username.includes('anonymous') && historyData) {
      setMessages(historyData);
    } else {
      // For anonymous users, start fresh
      setMessages([]);
    }
  }, [historyData, user?.username]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, isImageRequest }: { content: string; isImageRequest: boolean }) => {
      const isAuthenticated = user?.username && !user.username.includes('anonymous');
      
      if (isAuthenticated) {
        // Use the new API with history persistence
        const response = await apiRequest("POST", "/api/chat/send", {
          content,
          isImageRequest,
          sessionId
        });
        return response.json();
      } else {
        // Add user message immediately for anonymous users
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

        // Use simple API without persistence
        const response = await apiRequest("POST", "/api/chat/simple-send", {
          content,
          isImageRequest,
          context: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        });
        return { ...response.json(), isAnonymous: true };
      }
    },
    onSuccess: (data) => {
      const isAuthenticated = user?.username && !user.username.includes('anonymous');
      
      if (isAuthenticated) {
        // For authenticated users, refetch history to get updated messages
        queryClient.invalidateQueries({ queryKey: ['/api/chat/history', sessionId, user?.username] });
        
        if (data.saved) {
          toast({
            title: "Mensagem salva",
            description: "Sua conversa foi salva no histórico.",
            variant: "default",
          });
        }
      } else {
        // For anonymous users, add AI response to local state
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
      }
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

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const isAuthenticated = user?.username && !user.username.includes('anonymous');
      
      if (isAuthenticated) {
        const response = await apiRequest("DELETE", `/api/chat/history/${sessionId}`);
        return response.json();
      } else {
        return { success: true, message: "Histórico local limpo" };
      }
    },
    onSuccess: (data) => {
      const isAuthenticated = user?.username && !user.username.includes('anonymous');
      
      if (isAuthenticated) {
        // Invalidate and refetch history
        queryClient.invalidateQueries({ queryKey: ['/api/chat/history', sessionId, user?.username] });
      } else {
        // Clear local messages for anonymous users
        setMessages([]);
      }
      
      toast({
        title: "Histórico limpo",
        description: data.message || "O histórico de conversas foi removido.",
      });
    },
    onError: (error) => {
      console.error("Clear history error:", error);
      toast({
        title: "Erro ao limpar histórico",
        description: "Não foi possível limpar o histórico. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = (content: string, isImageRequest = false) => {
    sendMessageMutation.mutate({ content, isImageRequest });
  };

  const clearHistory = () => {
    clearHistoryMutation.mutate();
  };

  return {
    messages,
    loading: historyLoading,
    sendMessage,
    clearHistory,
    isSending: sendMessageMutation.isPending,
    isClearing: clearHistoryMutation.isPending,
    sessionId,
    setSessionId,
  };
}
