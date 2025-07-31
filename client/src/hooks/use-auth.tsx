import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, LoginUser, InsertUser } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('qisa_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('User loaded from localStorage:', parsedUser.username);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('qisa_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginUser) => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('qisa_user', JSON.stringify(data.user));
        
        toast({
          title: "Login realizado",
          description: `Bem-vindo à Qisa, ${data.user.displayName || data.user.username}!`,
        });
        
        return data.user;
      } else {
        throw new Error(data.error || "Erro no login");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Não foi possível fazer login");
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: InsertUser) => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('qisa_user', JSON.stringify(data.user));
        
        toast({
          title: "Conta criada",
          description: `Bem-vindo à Qisa, ${data.user.displayName || data.user.username}!`,
        });
        
        return data.user;
      } else {
        throw new Error(data.error || "Erro ao criar conta");
      }
    } catch (error: any) {
      console.error("Register error:", error);
      throw new Error(error.message || "Não foi possível criar a conta");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('qisa_user');
      
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
    register,
    logout,
  };
}
