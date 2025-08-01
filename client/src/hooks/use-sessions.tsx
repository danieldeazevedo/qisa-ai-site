import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";
import type { ChatSession } from "@shared/schema";

export function useSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = user?.username && !user.username.includes('anonymous');

  // Get user's chat sessions
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    error: sessionsError
  } = useQuery({
    queryKey: ["/api/chat/sessions"],
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get current session
  const {
    data: currentSession,
    isLoading: currentSessionLoading,
    error: currentSessionError
  } = useQuery({
    queryKey: ["/api/chat/current-session"],
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (title?: string) => {
      const response = await apiRequest("POST", "/api/chat/sessions", {
        title: title || "Nova Conversa"
      });
      return await response.json();
    },
    onSuccess: (newSession: ChatSession) => {
      // Invalidate sessions list to include new session
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      
      // Navigate to the new session
      setLocation(`/chat/${newSession.id}`);
      
      toast({
        title: "Nova conversa criada",
        description: `"${newSession.title}" foi criada com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conversa",
        description: error.message || "Não foi possível criar a nova conversa.",
        variant: "destructive",
      });
    },
  });

  // Update session mutation (rename)
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const response = await apiRequest("PATCH", `/api/chat/sessions/${sessionId}`, {
        title
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate sessions list and current session
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/current-session"] });
      
      toast({
        title: "Conversa renomeada",
        description: "O nome da conversa foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao renomear",
        description: error.message || "Não foi possível renomear a conversa.",
        variant: "destructive",
      });
    },
  });

  // Activate session mutation
  const activateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("POST", `/api/chat/sessions/${sessionId}/activate`);
      return await response.json();
    },
    onSuccess: (_, sessionId) => {
      // Update current session in cache
      queryClient.invalidateQueries({ queryKey: ["/api/chat/current-session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      
      // Update local state
      setCurrentSessionId(sessionId);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alternar conversa",
        description: error.message || "Não foi possível alternar para esta conversa.",
        variant: "destructive",
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("DELETE", `/api/chat/sessions/${sessionId}`);
      return await response.json();
    },
    onSuccess: (_, deletedSessionId) => {
      console.log('🎯 Frontend: Delete mutation successful for session:', deletedSessionId);
      
      // Clear ALL cache and force immediate reload
      queryClient.clear();
      
      // Show success message
      toast({
        title: "Conversa excluída",
        description: "A conversa foi excluída com sucesso.",
      });
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a conversa.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const createSession = (title?: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para criar múltiplas conversas.",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate(title);
  };

  const renameSession = (sessionId: string, title: string) => {
    if (!isAuthenticated) return;
    updateSessionMutation.mutate({ sessionId, title });
  };

  const switchToSession = (sessionId: string) => {
    if (!isAuthenticated) return;
    setLocation(`/chat/${sessionId}`);
  };

  const deleteSession = (sessionId: string) => {
    if (!isAuthenticated) return;
    deleteSessionMutation.mutate(sessionId);
  };

  return {
    // Data
    sessions: sessions as ChatSession[],
    currentSession: currentSession as ChatSession,
    currentSessionId: currentSessionId || (currentSession as ChatSession)?.id,
    isAuthenticated,

    // Loading states
    isLoading: sessionsLoading || currentSessionLoading,
    isCreating: createSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
    isSwitching: activateSessionMutation.isPending,

    // Actions
    createSession,
    renameSession,
    switchToSession,
    deleteSession,

    // Error states
    error: sessionsError || currentSessionError,
  };
}