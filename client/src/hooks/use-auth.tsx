import { useState, useEffect } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, signInWithGoogle, handleRedirectResult } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Store user in global context for API requests
            (window as any).currentUser = firebaseUser;
            
            // Send user data to backend
            await apiRequest("POST", "/api/auth/sync", {
              firebaseId: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
            setUser(firebaseUser);
            
            toast({
              title: "Login realizado",
              description: `Bem-vindo, ${firebaseUser.displayName || firebaseUser.email}!`,
            });
          } catch (error) {
            console.error("Error syncing user:", error);
            // Still set user even if sync fails
            setUser(firebaseUser);
            (window as any).currentUser = firebaseUser;
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      // Handle redirect result
      handleRedirectResult().catch((error) => {
        console.error("Redirect error:", error);
        if (error.code !== 'auth/unauthorized-domain') {
          toast({
            title: "Erro no login",
            description: "Não foi possível completar o login.",
            variant: "destructive",
          });
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setLoading(false);
    }
  }, [toast]);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.code === 'auth/unauthorized-domain') {
        toast({
          title: "Domínio não autorizado",
          description: "Adicione este domínio aos domínios autorizados no Firebase Console em Authentication > Settings > Authorized domains.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no login",
          description: "Não foi possível fazer login. Verifique as configurações do Firebase.",
          variant: "destructive",
        });
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Erro no logout",
        description: "Não foi possível fazer logout.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    loading,
    login,
    logout,
  };
}
