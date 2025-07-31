import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Gift, Clock, Zap } from "lucide-react";
import { useQkoins } from "@/hooks/use-qkoins";
import { useAuth } from "@/hooks/use-auth";

interface QkoinDisplayProps {
  compact?: boolean;
  showClaimButton?: boolean;
}

export function QkoinDisplay({ compact = false, showClaimButton = true }: QkoinDisplayProps) {
  const { user } = useAuth();
  const { balance, claimDailyReward, isClaimingReward } = useQkoins();

  if (!user || user.username?.includes('anonymous')) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Coins className="w-4 h-4" />
          <span className="text-sm">Login para QKoins</span>
        </div>
      );
    }
    return null;
  }

  const qkoins = balance?.qkoins || 0;
  const canClaimDaily = balance?.canClaimDaily || false;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">
          <Coins className="w-4 h-4" />
          <span className="text-sm font-medium">{qkoins}</span>
        </div>
        {canClaimDaily && showClaimButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={claimDailyReward}
            disabled={isClaimingReward}
            className="text-xs px-2 py-1 h-6 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950"
          >
            <Gift className="w-3 h-3 mr-1" />
            +10
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-700 dark:text-amber-300">QKoins</h3>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{qkoins}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                1 QKoin = 1 Imagem
              </p>
            </div>
          </div>
          
          <div className="text-right">
            {canClaimDaily ? (
              <Button
                onClick={claimDailyReward}
                disabled={isClaimingReward}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Gift className="w-4 h-4 mr-2" />
                {isClaimingReward ? "Coletando..." : "Coletar +10"}
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                <Clock className="w-3 h-3 mr-1" />
                Aguarde 24h
              </Badge>
            )}
          </div>
        </div>
        
        {qkoins < 1 && (
          <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
            <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              QKoins insuficientes para gerar imagens. {canClaimDaily ? "Colete sua recompensa diária!" : "Volte amanhã para mais QKoins!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}