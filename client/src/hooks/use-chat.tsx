import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message, ChatSession } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useChat() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get or create current session
  const { data: currentSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/chat/current-session"],
    enabled: true,
  });

  // Get messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chat/messages", currentSessionId],
    enabled: !!currentSessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, isImageRequest }: { content: string; isImageRequest: boolean }) => {
      const response = await apiRequest("POST", "/api/chat/send", {
        sessionId: currentSessionId,
        content,
        isImageRequest,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", currentSessionId] });
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
      await apiRequest("DELETE", `/api/chat/sessions/${currentSessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/current-session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      toast({
        title: "Histórico limpo",
        description: "O histórico de conversas foi removido.",
      });
    },
    onError: (error) => {
      console.error("Clear history error:", error);
      toast({
        title: "Erro ao limpar histórico",
        description: "Não foi possível limpar o histórico.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (currentSession && typeof currentSession === 'object' && currentSession !== null && 'id' in currentSession) {
      setCurrentSessionId((currentSession as any).id);
    }
  }, [currentSession]);

  const sendMessage = (content: string, isImageRequest = false) => {
    sendMessageMutation.mutate({ content, isImageRequest });
  };

  const clearHistory = () => {
    clearHistoryMutation.mutate();
  };

  return {
    messages: messages || [],
    loading: messagesLoading || sessionLoading,
    sendMessage,
    clearHistory,
    isSending: sendMessageMutation.isPending,
  };
}
