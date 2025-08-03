import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Users,
  MessageSquare,
  Activity,
  Shield,
  Trash2,
  Ban,
  Power,
  ArrowLeft,
  Sun,
  Moon,
  Search,
  RefreshCw,
  Database,
  Server,
  UserX,
  Eye,
  Download,
  Wrench,
  AlertTriangle,
  Clock,
  PlayCircle,
  StopCircle
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  qkoins: number;
  lastLogin: string;
  messageCount: number;
  banned: boolean;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
}

interface SystemStatus {
  online: boolean;
  uptime: string;
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  systemLoad: number;
}

interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

interface UserChat {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
  };
  sessions: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }>;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  imageUrl?: string | null;
}

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Always call hooks at the top level - use enabled to conditionally fetch
  const isAdmin = user?.username === 'daniel08';

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
  });

  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ['/api/admin/status'],
    refetchInterval: 30000,
    enabled: isAdmin,
  });

  const { data: logs, isLoading: logsLoading } = useQuery<SystemLog[]>({
    queryKey: ['/api/admin/logs'],
    enabled: isAdmin,
  });

  // New queries for maintenance and chat viewing
  const { data: systemConfig, isLoading: configLoading } = useQuery<SystemConfig>({
    queryKey: ['/api/admin/system/config'],
    enabled: isAdmin,
  });

  const { data: userChats, isLoading: chatsLoading } = useQuery<UserChat[]>({
    queryKey: ['/api/admin/chats'],
    enabled: isAdmin,
  });

  // State for maintenance mode and chat viewing
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [selectedUserChat, setSelectedUserChat] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");

  // Update maintenance message when config loads
  React.useEffect(() => {
    if (systemConfig) {
      setMaintenanceMessage(systemConfig.maintenanceMessage);
    }
  }, [systemConfig]);

  // Admin mutations - define all hooks before any conditional returns
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Usuário excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o usuário",
        variant: "destructive",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banned }: { userId: string; banned: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/ban`, {
        body: JSON.stringify({ banned }),
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({ 
        title: variables.banned ? "Usuário banido" : "Usuário desbanido",
        description: variables.banned ? "Usuário não poderá mais acessar o sistema" : "Usuário pode acessar o sistema novamente"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar status do usuário",
        variant: "destructive",
      });
    },
  });

  const clearUserHistoryMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}/history`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Histórico do usuário limpo com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível limpar o histórico",
        variant: "destructive",
      });
    },
  });

  const toggleSystemMutation = useMutation({
    mutationFn: async (online: boolean) => {
      const response = await apiRequest('PATCH', '/api/admin/system/toggle', {
        body: JSON.stringify({ online }),
      });
      return await response.json();
    },
    onSuccess: (data, online) => {
      toast({ 
        title: online ? "Sistema ativado" : "Sistema desativado",
        description: online ? "Usuários podem acessar o sistema" : "Sistema em manutenção"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar status do sistema",
        variant: "destructive",
      });
    },
  });

  const clearAllLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/logs');
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Logs limpos com sucesso" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível limpar os logs",
        variant: "destructive",
      });
    },
  });

  // Maintenance mode mutations
  const toggleMaintenanceMutation = useMutation({
    mutationFn: async ({ enabled, message }: { enabled: boolean; message: string }) => {
      const response = await apiRequest('PATCH', '/api/admin/system/maintenance', {
        body: JSON.stringify({ enabled, message }),
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({ 
        title: variables.enabled ? "Modo manutenção ativado" : "Modo manutenção desativado",
        description: variables.enabled ? "Apenas você pode acessar o sistema" : "Sistema liberado para todos os usuários"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar modo de manutenção",
        variant: "destructive",
      });
    },
  });

  // Chat viewing queries
  const { data: chatMessages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/admin/chats', selectedUserChat, selectedSession],
    enabled: isAdmin && !!selectedUserChat && !!selectedSession,
  });

  // Check if user is admin (daniel08) - render after all hooks
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground opacity="light" />
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar o painel administrativo.
            </p>
            <Link href="/chat">
              <Button className="w-full">Voltar ao Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users?.filter(user => 
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground opacity="strong" />
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Painel Administrativo</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* System Status Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status do Sistema</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${systemStatus?.online ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className="font-semibold">{systemStatus?.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <Server className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-2xl font-bold">{systemStatus?.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{systemStatus?.activeUsers || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Mensagens</p>
                  <p className="text-2xl font-bold">{systemStatus?.totalMessages || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
            <TabsTrigger value="chats">Chat Usuários</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Gerenciamento de Usuários</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usersLoading ? (
                    <p>Carregando usuários...</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div 
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            user.banned ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {user.banned ? <Ban className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{user.username}</p>
                              {user.banned && <Badge variant="destructive">Banido</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.qkoins} QKoins • {user.messageCount} mensagens
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => clearUserHistoryMutation.mutate(user.id)}
                            disabled={clearUserHistoryMutation.isPending}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Limpar Chat
                          </Button>
                          
                          <Button
                            variant={user.banned ? "default" : "outline"}
                            size="sm"
                            onClick={() => banUserMutation.mutate({ userId: user.id, banned: !user.banned })}
                            disabled={banUserMutation.isPending}
                          >
                            {user.banned ? <Eye className="w-4 h-4 mr-1" /> : <Ban className="w-4 h-4 mr-1" />}
                            {user.banned ? "Desbanir" : "Banir"}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <UserX className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir permanentemente o usuário "{user.username}"? 
                                  Esta ação não pode ser desfeita e todos os dados serão perdidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir Permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Control */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Controle do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Status do Sistema</h3>
                    <p className="text-sm text-muted-foreground">
                      {systemStatus?.online ? 'Sistema online e disponível para usuários' : 'Sistema em manutenção'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={systemStatus?.online || false}
                      onCheckedChange={(checked) => toggleSystemMutation.mutate(checked)}
                      disabled={toggleSystemMutation.isPending}
                    />
                    <div className={`w-2 h-2 rounded-full ${systemStatus?.online ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Estatísticas do Sistema</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span>{systemStatus?.uptime || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Carga do Sistema:</span>
                        <span>{systemStatus?.systemLoad || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usuários Registrados:</span>
                        <span>{systemStatus?.totalUsers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mensagens Enviadas:</span>
                        <span>{systemStatus?.totalMessages || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Ações do Sistema</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => queryClient.invalidateQueries()}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar Cache
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          // Download system report
                          const data = {
                            timestamp: new Date().toISOString(),
                            systemStatus,
                            totalUsers: users?.length || 0,
                            users: users?.map(u => ({ username: u.username, qkoins: u.qkoins, messageCount: u.messageCount, banned: u.banned }))
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Relatório
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Mode */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="w-5 h-5" />
                  <span>Modo de Manutenção</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${systemConfig?.maintenanceMode ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <span className="font-medium">
                      Status: {systemConfig?.maintenanceMode ? 'Manutenção Ativa' : 'Sistema Normal'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {systemConfig?.maintenanceMode 
                      ? 'O sistema está em modo de manutenção. Apenas você (daniel08) pode acessar.'
                      : 'O sistema está funcionando normalmente para todos os usuários.'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mensagem de Manutenção</label>
                    <Textarea
                      placeholder="Digite a mensagem que será exibida aos usuários durante a manutenção..."
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => toggleMaintenanceMutation.mutate({ 
                        enabled: !systemConfig?.maintenanceMode, 
                        message: maintenanceMessage 
                      })}
                      disabled={toggleMaintenanceMutation.isPending || configLoading}
                      variant={systemConfig?.maintenanceMode ? "default" : "destructive"}
                      className="min-w-[160px]"
                    >
                      {systemConfig?.maintenanceMode ? (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Desativar Manutenção
                        </>
                      ) : (
                        <>
                          <StopCircle className="w-4 h-4 mr-2" />
                          Ativar Manutenção
                        </>
                      )}
                    </Button>
                    
                    {systemConfig?.maintenanceMode && (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Apenas você pode acessar o sistema
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Como funciona o modo de manutenção:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Quando ativado, todos os usuários (exceto daniel08) verão a página de manutenção</li>
                    <li>• As APIs também retornarão erro 503 para usuários não autorizados</li>
                    <li>• Você pode personalizar a mensagem exibida aos usuários</li>
                    <li>• O sistema continuará funcionando normalmente para você</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Chats Viewer */}
          <TabsContent value="chats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Visualizador de Chat dos Usuários</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chatsLoading ? (
                  <p>Carregando conversas...</p>
                ) : userChats && userChats.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* User List */}
                    <div className="space-y-2">
                      <h4 className="font-medium mb-3">Usuários com Conversas</h4>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {userChats.map((userChat) => (
                          <div
                            key={userChat.user.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedUserChat === userChat.user.id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => {
                              setSelectedUserChat(userChat.user.id);
                              setSelectedSession('');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{userChat.user.username}</p>
                                <p className="text-sm text-muted-foreground">{userChat.user.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{userChat.sessions.length} sessões</p>
                                <p className="text-xs text-muted-foreground">{userChat.messageCount} mensagens</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sessions and Messages */}
                    <div className="space-y-4">
                      {selectedUserChat ? (
                        <>
                          {/* Sessions List */}
                          <div>
                            <h4 className="font-medium mb-3">Sessões de Chat</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {userChats.find(uc => uc.user.id === selectedUserChat)?.sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className={`p-2 border rounded cursor-pointer transition-colors ${
                                    selectedSession === session.id
                                      ? 'bg-primary/10 border-primary'
                                      : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => setSelectedSession(session.id)}
                                >
                                  <p className="font-medium text-sm">{session.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(session.updatedAt).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Messages */}
                          {selectedSession && (
                            <div>
                              <h4 className="font-medium mb-3">Mensagens</h4>
                              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                                {messagesLoading ? (
                                  <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
                                ) : chatMessages && chatMessages.length > 0 ? (
                                  chatMessages.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`p-3 rounded-lg ${
                                        message.role === 'user'
                                          ? 'bg-blue-50 dark:bg-blue-900/20 ml-4'
                                          : 'bg-gray-50 dark:bg-gray-800/50 mr-4'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-medium ${
                                          message.role === 'user' ? 'text-blue-600' : 'text-gray-600'
                                        }`}>
                                          {message.role === 'user' ? 'Usuário' : 'Assistente'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(message.createdAt).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                      {message.imageUrl && (
                                        <img 
                                          src={message.imageUrl} 
                                          alt="Anexo"
                                          className="mt-2 max-w-xs rounded"
                                        />
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center">Nenhuma mensagem encontrada</p>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Eye className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Selecione um usuário para visualizar suas conversas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma conversa encontrada</h3>
                    <p className="text-muted-foreground">
                      Quando os usuários iniciarem conversas, elas aparecerão aqui.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Logs do Sistema</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] })}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Limpar Logs
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Limpar todos os logs</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja limpar todos os logs do sistema? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => clearAllLogsMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Limpar Todos
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logsLoading ? (
                    <p>Carregando logs...</p>
                  ) : logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <div 
                        key={log.id}
                        className={`p-3 rounded-lg text-sm font-mono ${
                          log.level === 'error' ? 'bg-red-50 border-l-4 border-red-500 dark:bg-red-950' :
                          log.level === 'warn' ? 'bg-yellow-50 border-l-4 border-yellow-500 dark:bg-yellow-950' :
                          'bg-muted/50 border-l-4 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${
                            log.level === 'error' ? 'text-red-600' :
                            log.level === 'warn' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            [{log.level.toUpperCase()}]
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="mb-1">{log.message}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground">{log.details}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum log encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Gerenciamento de Database</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Funcionalidade em Desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Ferramentas avançadas de gerenciamento de database estarão disponíveis em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}