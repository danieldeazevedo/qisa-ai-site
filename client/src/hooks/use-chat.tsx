import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSessions } from "@/hooks/use-sessions";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentSession, isAuthenticated } = useSessions();
  const queryClient = useQueryClient();
  
  // Use current session ID or fallback to "main" for anonymous users
  const sessionId = (currentSession as any)?.id || "main";

  // Load chat history for authenticated users
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/chat/messages', sessionId, user?.username],
    queryFn: async () => {
      if (!isAuthenticated || !sessionId || sessionId === "main") {
        return [];
      }
      const response = await apiRequest("GET", `/api/chat/messages/${sessionId}`);
      return response.json();
    },
    enabled: !!isAuthenticated && !!sessionId && sessionId !== "main",
  });

  // Update messages when history loads, session changes, or user changes
  useEffect(() => {
    if (isAuthenticated && historyData) {
      setMessages(historyData);
    } else {
      // For anonymous users or when no history, start fresh
      setMessages([]);
    }
  }, [historyData, isAuthenticated, sessionId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, isImageRequest }: { content: string; isImageRequest: boolean }) => {
      
      if (isAuthenticated) {
        // Add user message immediately to UI for authenticated users too
        const userMessage: Message = {
          id: Date.now().toString(),
          sessionId: sessionId,
          role: "user",
          content,
          imageUrl: null,
          metadata: null,
          createdAt: new Date(),
        };
        
        setMessages(prev => [...prev, userMessage]);

        // Use the new API with history persistence
        const response = await apiRequest("POST", "/api/chat/send", {
          content,
          isImageRequest,
          sessionId
        });
        return await response.json();
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
        const responseData = await response.json();
        return { ...responseData, isAnonymous: true };
      }
    },
    onSuccess: (data) => {
      const isAuthenticated = user?.username && !user.username.includes('anonymous');
      
      // Add AI response to UI immediately for both authenticated and anonymous users
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sessionId: isAuthenticated ? sessionId : "local",
        role: "assistant", 
        content: data.response,
        imageUrl: data.imageUrl || null,
        metadata: null,
        createdAt: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (isAuthenticated && data.saved) {
        // Optionally show success toast for authenticated users
        console.log("Mensagem salva no histórico");
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
      if (isAuthenticated && sessionId !== "main") {
        // For authenticated users, clear server history for current session
        const response = await apiRequest("DELETE", `/api/chat/messages/${sessionId}`);
        return response.json();
      } else {
        // For anonymous users, just clear local state
        return { success: true, message: "Histórico local limpo" };
      }
    },
    onSuccess: (data) => {
      setMessages([]);
      
      // Invalidate history cache for authenticated users
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      }
      
      toast({
        title: "Histórico limpo",
        description: data.message || "O histórico desta conversa foi apagado.",
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
  };
}
