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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Send user data to backend
          await apiRequest("POST", "/api/auth/sync", {
            firebaseId: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          setUser(firebaseUser);
        } catch (error) {
          console.error("Error syncing user:", error);
          toast({
            title: "Erro de autenticação",
            description: "Não foi possível sincronizar seus dados.",
            variant: "destructive",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Handle redirect result
    handleRedirectResult().catch((error) => {
      console.error("Redirect error:", error);
      toast({
        title: "Erro no login",
        description: "Não foi possível completar o login.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: "Não foi possível fazer login.",
        variant: "destructive",
      });
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
