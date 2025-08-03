import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQkoins } from "@/hooks/use-qkoins";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Link, useLocation } from "wouter";
import rewardSoundPath from "@assets/2025-07-31-13-14-20-Trim_1753978942570.mp3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Coins,
  Gift,
  Calendar,
  Mail,
  ArrowLeft,
  Sun,
  Moon,
  Trophy,
  Zap,
  Clock
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Profile() {
  const { user, logout } = useAuth();
  const { balance, transactions, claimDailyReward, isClaimingReward } = useQkoins();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Function to play reward sound
  const playRewardSound = () => {
    try {
      const audio = new Audio(rewardSoundPath);
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing reward sound:', error);
    }
  };

  // Claim bonus QKoins mutation
  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/qkoins/claim-bonus');
      return await response.json();
    },
    onSuccess: (data: any) => {
      playRewardSound();
      toast({
        title: "Bônus resgatado!",
        description: `+5 QKoins adicionados. Total: ${data.qkoins} QKoins`,
      });
      
      // Invalidate and refetch balance
      queryClient.invalidateQueries({ queryKey: ['/api/qkoins/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/qkoins/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível resgatar o bônus",
        variant: "destructive",
      });
    },
  });

  const handleClaimBonus = () => {
    claimBonusMutation.mutate();
  };

  if (!user || user.username?.includes('anonymous')) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <AnimatedBackground opacity="light" />
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Login necessário</h2>
            <p className="text-muted-foreground mb-4">
              Você precisa fazer login para acessar seu perfil.
            </p>
            <Link href="/auth">
              <Button className="w-full">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qkoins = balance?.qkoins || 0;
  const canClaimDaily = balance?.canClaimDaily || false;
  const canClaimBonus = balance?.canClaimBonus || false;
  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground opacity="medium" />
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Meu Perfil</h1>
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

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Informações da Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nome de usuário
                </label>
                <p className="text-lg font-semibold">{user.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg">{user.email}</p>
                </div>
              </div>
              {user.displayName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nome de exibição
                  </label>
                  <p className="text-lg">{user.displayName}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Membro desde
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QKoins Management Card */}
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
              <Coins className="w-5 h-5" />
              <span>QKoins - Moeda Virtual</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Balance */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-full mb-4">
                <Coins className="w-10 h-10 text-white" />
              </div>
              <p className="text-4xl font-bold text-amber-800 dark:text-amber-200 mb-2">
                {qkoins}
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                QKoins disponíveis
              </p>
            </div>

            <Separator className="bg-amber-200 dark:bg-amber-800" />

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Daily Reward */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300">
                  <Gift className="w-5 h-5" />
                  <span className="font-medium">Recompensa Diária</span>
                </div>
                {canClaimDaily ? (
                  <Button
                    onClick={claimDailyReward}
                    disabled={isClaimingReward}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {isClaimingReward ? "Coletando..." : "Coletar +10 QKoins"}
                  </Button>
                ) : (
                  <div className="w-full">
                    <Badge variant="secondary" className="w-full py-2 bg-gray-100 dark:bg-gray-800">
                      <Clock className="w-3 h-3 mr-2" />
                      Aguarde 24h para próxima recompensa
                    </Badge>
                  </div>
                )}
              </div>

              {/* Bonus Reward */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-300">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Bônus Extra</span>
                </div>
                <Button
                  onClick={handleClaimBonus}
                  disabled={!canClaimBonus || claimBonusMutation.isPending}
                  variant="outline"
                  className={`w-full ${
                    canClaimBonus 
                      ? "border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950" 
                      : "border-gray-200 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:text-gray-500"
                  }`}
                >
                  {canClaimBonus ? (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      {claimBonusMutation.isPending ? "Resgatando..." : "Resgatar +5 QKoins"}
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Aguarde 4h para próximo bônus
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Usage Info */}
            <div className="bg-amber-100 dark:bg-amber-900 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Como usar seus QKoins:
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• 1 QKoin = 1 geração de imagem</li>
                <li>• Recompensa diária: 10 QKoins (a cada 24h)</li>
                <li>• Bônus extra: 5 QKoins (a cada 4 horas)</li>
                <li>• QKoins são salvos na sua conta permanentemente</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Transações Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'earned' || transaction.type === 'daily_reward' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                      }`}>
                        {transaction.type === 'earned' || transaction.type === 'daily_reward' ? (
                          <Gift className="w-4 h-4" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.amount > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}