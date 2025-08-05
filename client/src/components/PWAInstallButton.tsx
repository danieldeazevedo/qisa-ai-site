import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X } from 'lucide-react';
import { installPWA, isPWA, isPWASupported } from '@/lib/pwa';

export function PWAInstallButton() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Verificar se deve mostrar o prompt de instalação
    const checkInstallPrompt = () => {
      // Não mostrar se já está instalado como PWA
      if (isPWA()) {
        setShowInstallPrompt(false);
        return;
      }

      // Não mostrar se não suporta PWA
      if (!isPWASupported()) {
        setShowInstallPrompt(false);
        return;
      }

      // Verificar se o usuário já rejeitou a instalação recentemente
      const lastRejected = localStorage.getItem('pwa-install-rejected');
      if (lastRejected) {
        const rejectedTime = parseInt(lastRejected);
        const daysSinceRejection = (Date.now() - rejectedTime) / (1000 * 60 * 60 * 24);
        
        // Não mostrar se rejeitou há menos de 7 dias
        if (daysSinceRejection < 7) {
          setShowInstallPrompt(false);
          return;
        }
      }

      // Verificar se já foi mostrado muitas vezes
      const showCount = parseInt(localStorage.getItem('pwa-install-shown') || '0');
      if (showCount >= 3) {
        setShowInstallPrompt(false);
        return;
      }

      setShowInstallPrompt(true);
    };

    // Verificar imediatamente
    checkInstallPrompt();

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstall = () => {
      checkInstallPrompt();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listener para quando o app for instalado
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      localStorage.removeItem('pwa-install-rejected');
      localStorage.removeItem('pwa-install-shown');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await installPWA();
      
      if (installed) {
        setShowInstallPrompt(false);
        localStorage.removeItem('pwa-install-rejected');
        localStorage.removeItem('pwa-install-shown');
      } else {
        // Usuário rejeitou - marcar e esconder por um tempo
        localStorage.setItem('pwa-install-rejected', Date.now().toString());
        setShowInstallPrompt(false);
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    
    // Incrementar contador de vezes mostrado
    const showCount = parseInt(localStorage.getItem('pwa-install-shown') || '0');
    localStorage.setItem('pwa-install-shown', (showCount + 1).toString());
    
    // Se foi mostrado muitas vezes, marcar como rejeitado
    if (showCount >= 2) {
      localStorage.setItem('pwa-install-rejected', Date.now().toString());
    }
  };

  // Não renderizar se não deve mostrar
  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Instalar Qisa</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione o Qisa à sua tela inicial para acesso rápido e experiência similar a um app nativo.
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isInstalling ? 'Instalando...' : 'Instalar'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="px-3"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para verificar status PWA
export function usePWAStatus() {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [isPWASupportedBrowser, setIsPWASupportedBrowser] = useState(false);

  useEffect(() => {
    setIsPWAInstalled(isPWA());
    setIsPWASupportedBrowser(isPWASupported());
  }, []);

  return {
    isPWAInstalled,
    isPWASupportedBrowser
  };
}