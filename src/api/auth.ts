import { User } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
  message: string;
}

export interface ApiUser {
  id: number;
  name: string;
  role: number;
  email?: string;
  phone?: string;
  username: string;
}

export const login = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error en el inicio de sesión");
  }

  const data = await response.json();
  
  // Mapear el rol numérico a string
  const mapRole = (role: number): string => {
    switch (role) {
      case 0: return "secretaria";
      case 1: return "doctor";
      case 2: return "administrador";
      default: return "usuario";
    }
  };

  return {
    user: {
      id: data.user.id,
      name: data.user.name,
      role: mapRole(data.user.role),
      email: data.user.email,
      phone: data.user.phone,
      username: data.user.username
    },
    token: data.token,
    expiresIn: data.expiresIn,
    message: data.message
  };
};

export const verifyToken = async (token: string): Promise<{ isValid: boolean; user?: User }> => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { isValid: false };
    }

    const data = await response.json();
    
    if (data.success && data.user) {
      const mapRole = (role: number): string => {
        switch (role) {
          case 0: return "secretaria";
          case 1: return "doctor";
          case 2: return "administrador";
          default: return "usuario";
        }
      };

      return {
        isValid: true,
        user: {
          id: data.user.id,
          name: data.user.name,
          role: mapRole(data.user.role),
          email: data.user.email,
          phone: data.user.phone,
          username: data.user.username
        }
      };
    }

    return { isValid: false };
  } catch (error) {
    console.error("Error verifying token:", error);
    return { isValid: false };
  }
};

export const logout = async (): Promise<void> => {
  // Limpiar localStorage en el frontend
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
};

// Guardar datos en localStorage
export const saveAuthData = (user: User, token: string): void => {
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("token", token);
};

// Obtener datos del localStorage
export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem("currentUser");
  return stored ? JSON.parse(stored) : null;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem("token");
};