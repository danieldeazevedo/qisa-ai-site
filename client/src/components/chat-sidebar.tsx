import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessions } from "@/hooks/use-sessions";
import { useAuth } from "@/hooks/use-auth";
import {
  MessageCircle,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChatSession } from "@shared/schema";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ChatSidebar({ isOpen, onToggle, className = "" }: ChatSidebarProps) {
  const { user } = useAuth();
  const {
    sessions,
    currentSession,
    isAuthenticated,
    isLoading,
    createSession,
    renameSession,
    switchToSession,
    deleteSession,
    isCreating,
    isDeleting,
  } = useSessions();

  // Type cast sessions to handle unknown type
  const typedSessions = sessions as ChatSession[];

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [newSessionDialogOpen, setNewSessionDialogOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");

  // If user is not authenticated, don't show the sidebar
  if (!isAuthenticated) {
    return null;
  }

  const handleCreateSession = () => {
    const title = newSessionTitle.trim() || "Nova Conversa";
    createSession(title);
    setNewSessionTitle("");
    setNewSessionDialogOpen(false);
  };

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveEdit = () => {
    if (editingSessionId && editingTitle.trim()) {
      renameSession(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleDeleteSession = (sessionId: string) => {
    if (typedSessions.length <= 1) {
      // Don't delete the last session
      return;
    }
    deleteSession(sessionId);
  };

  const formatSessionDate = (date: Date | string) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(sessionDate, "HH:mm", { locale: ptBR });
    } else if (diffInHours < 24 * 7) {
      return format(sessionDate, "EEEE", { locale: ptBR });
    } else {
      return format(sessionDate, "dd/MM", { locale: ptBR });
    }
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border shadow-sm"
      >
        {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-border transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Conversas</h2>
              <Dialog open={newSessionDialogOpen} onOpenChange={setNewSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={isCreating}>
                    <Plus className="w-4 h-4 mr-1" />
                    Nova
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Nome da conversa (opcional)"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateSession();
                        }
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setNewSessionDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateSession} disabled={isCreating}>
                        Criar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {user && (
              <div className="text-sm text-muted-foreground">
                Logado como <span className="font-medium">{user.username}</span>
              </div>
            )}
          </div>

          {/* Sessions List */}
          <ScrollArea className="flex-1 p-2">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando conversas...
              </div>
            ) : typedSessions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conversa ainda</p>
                <p className="text-xs">Crie uma nova conversa para começar</p>
              </div>
            ) : (
              <div className="space-y-1">
                {typedSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                      (currentSession as ChatSession)?.id === session.id
                        ? "bg-gradient-to-r from-primary/15 to-secondary/10 border-l-4 border-primary shadow-sm ring-1 ring-primary/20"
                        : "hover:bg-muted/70 hover:shadow-sm"
                    }`}
                    onClick={() => {
                      if ((currentSession as ChatSession)?.id !== session.id) {
                        switchToSession(session.id);
                      }
                    }}
                  >
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit();
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {session.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {formatSessionDate(session.updatedAt)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(session);
                                }}
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Renomear
                              </DropdownMenuItem>
                              {typedSessions.length > 1 && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(session.id);
                                  }}
                                  className="text-destructive"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {(currentSession as ChatSession)?.id === session.id && (
                          <div className="mt-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              {typedSessions.length} conversa{typedSessions.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}