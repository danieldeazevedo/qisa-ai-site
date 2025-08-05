import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useTheme } from "@/hooks/use-theme";
import { useEffect } from "react";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import AuthPage from "@/pages/auth-page";
import About from "@/pages/about";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import MaintenancePage from "@/pages/maintenance";
import NotFound from "@/pages/not-found";
import { PWAInstallButton } from "@/components/PWAInstallButton";

function Router() {
  const { isMaintenanceMode, maintenanceMessage, isAdmin } = useMaintenance();
  const { theme } = useTheme();

  // Ensure theme is applied to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Show maintenance page if enabled and user is not admin
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={About} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <PWAInstallButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
