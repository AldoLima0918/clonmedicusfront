import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types/auth";
import { useToast } from "@/components/ui/use-toast";
import { login as apiLogin, verifyToken, getStoredUser, getStoredToken, saveAuthData, logout as apiLogout } from "../api/auth";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();

      if (storedUser && storedToken) {
        try {
          const { isValid, user: verifiedUser } = await verifyToken(storedToken);
          if (isValid && verifiedUser) {
            setUser(verifiedUser);
          } else {
            // Token inválido, limpiar
            await apiLogout();
          }
        } catch (error) {
          console.error("Error verificando token:", error);
          await apiLogout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, token } = await apiLogin(username, password);
      
      setUser(loggedInUser);
      saveAuthData(loggedInUser, token);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${loggedInUser.name}`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiLogout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};