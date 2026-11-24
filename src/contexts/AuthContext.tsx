// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { User } from "../types/auth";
import { useToast } from "@/components/ui/use-toast";

import {
  login as apiLogin,
  verifyToken,
  getStoredUser,
  getStoredToken,
  saveAuthData,
  clearAuthData,
  logout as apiLogout,
} from "../api/auth";

interface AuthContextType {
  user: User | null;
  login: (
    username: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  // Verificar autenticación al cargar.
  useEffect(() => {
    let activo = true;

    const checkAuth = async () => {
      const storedUser = getStoredUser();
      const storedToken = getStoredToken();

      try {
        if (!storedUser || !storedToken) {
          clearAuthData();

          if (activo) {
            setUser(null);
          }

          return;
        }

        const {
          isValid,
          user: verifiedUser,
        } = await verifyToken(storedToken);

        if (!activo) {
          return;
        }

        // Evitar modificar una sesión que haya cambiado
        // mientras se verificaba el token.
        if (getStoredToken() !== storedToken) {
          return;
        }

        if (isValid && verifiedUser) {
          setUser(verifiedUser);
          saveAuthData(verifiedUser, storedToken);
        } else {
          // Token inválido o expirado.
          // Limpiar únicamente la sesión local.
          // NO llamar al endpoint de logout.
          clearAuthData();
          setUser(null);
        }
      } catch (error) {
        console.error("Error verificando token:", error);

        if (
          activo &&
          getStoredToken() === storedToken
        ) {
          clearAuthData();
          setUser(null);
        }
      } finally {
        if (activo) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      activo = false;
    };
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const {
        user: loggedInUser,
        token,
      } = await apiLogin(username, password);

      saveAuthData(loggedInUser, token);
      setUser(loggedInUser);

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

  /**
   * Cierre de sesión manual.
   *
   * apiLogout recupera el token antes de limpiar
   * localStorage y notifica al backend.
   */
  const logout = () => {
    apiLogout().catch((error) => {
      console.warn(
        "Error al notificar logout al backend:",
        error
      );
    });

    setUser(null);

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
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth debe usarse dentro de un AuthProvider"
    );
  }

  return context;
};