import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export interface QkoinBalance {
  qkoins: number;
  canClaimDaily: boolean;
  userId?: string;
  message?: string;
}

export interface QkoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent' | 'daily_reward';
  description: string;
  createdAt: string;
}

export function useQkoins() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get QKoins balance
  const { data: balance, isLoading: isLoadingBalance } = useQuery<QkoinBalance>({
    queryKey: ['qkoins', 'balance'],
    enabled: !!user && !user.username?.includes('anonymous'),
  });

  // Get QKoins transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<QkoinTransaction[]>({
    queryKey: ['qkoins', 'transactions'],
    enabled: !!user && !user.username?.includes('anonymous'),
  });

  // Claim daily reward mutation
  const claimDailyRewardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/qkoins/daily-reward');
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Recompensa coletada!",
        description: `+10 QKoins adicionados. Total: ${data.qkoins} QKoins`,
      });
      
      // Invalidate and refetch balance
      queryClient.invalidateQueries({ queryKey: ['qkoins'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível coletar a recompensa",
        variant: "destructive",
      });
    },
  });

  const claimDailyReward = () => {
    claimDailyRewardMutation.mutate();
  };

  // Claim bonus QKoins mutation
  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/qkoins/claim-bonus');
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Bônus resgatado!",
        description: `+5 QKoins adicionados. Total: ${data.qkoins} QKoins`,
      });
      
      // Invalidate and refetch balance
      queryClient.invalidateQueries({ queryKey: ['qkoins'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível resgatar o bônus",
        variant: "destructive",
      });
    },
  });

  const claimBonus = () => {
    claimBonusMutation.mutate();
  };

  const canGenerateImage = () => {
    if (!user || user.username?.includes('anonymous')) {
      return false;
    }
    return (balance?.qkoins || 0) >= 1;
  };

  const getQkoinStatus = () => {
    if (!user || user.username?.includes('anonymous')) {
      return {
        canGenerate: false,
        message: "Login necessário para usar QKoins",
        qkoins: 0
      };
    }

    const qkoins = balance?.qkoins || 0;
    
    return {
      canGenerate: qkoins >= 1,
      message: qkoins >= 1 ? 
        `Você tem ${qkoins} QKoins` : 
        "QKoins insuficientes para gerar imagens",
      qkoins
    };
  };

  return {
    balance,
    transactions,
    isLoadingBalance,
    isLoadingTransactions,
    claimDailyReward,
    isClaimingReward: claimDailyRewardMutation.isPending,
    claimBonus,
    isClaimingBonus: claimBonusMutation.isPending,
    canGenerateImage,
    getQkoinStatus,
  };
}