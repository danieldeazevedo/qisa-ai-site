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
  Download
} from "lucide-react";

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

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Check if user is admin (daniel08)
  if (!user || user.username !== 'daniel08') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-red-100 dark:from-red-900 dark:via-background dark:to-red-800 flex items-center justify-center">
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

  // Fetch admin data
  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: systemStatus, isLoading: statusLoading } = useQuery<SystemStatus>({
    queryKey: ['/api/admin/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: logs, isLoading: logsLoading } = useQuery<SystemLog[]>({
    queryKey: ['/api/admin/logs'],
  });

  // Admin mutations
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

  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-slate-900 dark:via-background dark:to-slate-800">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
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