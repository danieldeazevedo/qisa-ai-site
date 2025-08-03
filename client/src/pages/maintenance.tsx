import { Card, CardContent } from "@/components/ui/card";
import { Settings, Clock } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  const maintenanceMessage = message || "Estamos em manutenção. Tente novamente mais tarde.";

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      <AnimatedBackground opacity="light" />
      <div className="max-w-md w-full mx-4">
        <Card className="border-orange-200 dark:border-orange-800 shadow-lg">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Settings className="h-10 w-10 text-orange-600 dark:text-orange-400 animate-spin-slow" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <Clock className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Sistema em Manutenção
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {maintenanceMessage}
            </p>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Nossa equipe está trabalhando para melhorar sua experiência. 
                Voltaremos em breve!
              </p>
            </div>

            <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Obrigado pela sua paciência
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}