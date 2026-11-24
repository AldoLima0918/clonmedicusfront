// src/api/auth.ts

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

const mapRole = (role: number): string => {
  switch (role) {
    case 0:
      return "secretaria";
    case 1:
      return "doctor";
    case 2:
      return "administrador";
    default:
      return "usuario";
  }
};

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

    throw new Error(
      errorData.message || "Error en el inicio de sesión"
    );
  }

  const data = await response.json();

  return {
    user: {
      id: data.user.id,
      name: data.user.name,
      role: mapRole(data.user.role),
      email: data.user.email,
      phone: data.user.phone,
      username: data.user.username,
    },
    token: data.token,
    expiresIn: data.expiresIn,
    message: data.message,
  };
};

export const verifyToken = async (
  token: string
): Promise<{ isValid: boolean; user?: User }> => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { isValid: false };
    }

    const data = await response.json();

    if (data.success && data.user) {
      const storedUser = getStoredUser();

      const sameUser = storedUser?.id === data.user.id;

      return {
        isValid: true,
        user: {
          id: data.user.id,
          name:
            data.user.name ??
            (sameUser ? storedUser?.name : undefined) ??
            data.user.username,
          role: mapRole(data.user.role),
          email:
            data.user.email ??
            (sameUser ? storedUser?.email : undefined),
          phone:
            data.user.phone ??
            (sameUser ? storedUser?.phone : undefined),
          username: data.user.username,
        },
      };
    }

    return { isValid: false };
  } catch (error) {
    console.error("Error verificando token:", error);

    return { isValid: false };
  }
};

/**
 * Limpia exclusivamente la sesión local.
 * No realiza peticiones al backend.
 *
 * Se utiliza cuando el token es inválido,
 * expirado o inexistente.
 */
export const clearAuthData = (): void => {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
};

/**
 * Cierra la sesión:
 *
 * 1. Recupera el token actual.
 * 2. Limpia inmediatamente la sesión local.
 * 3. Notifica al backend para marcar en_linea = false.
 */
export const logout = async (): Promise<void> => {
  const token = getStoredToken();

  clearAuthData();

  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      keepalive: true,
    });

    // La sesión local ya se encuentra cerrada.
    if (response.status === 401 || response.status === 403) {
      return;
    }

    if (!response.ok) {
      throw new Error(
        `Error al cerrar sesión en el servidor: ${response.status}`
      );
    }
  } catch (error) {
    console.warn(
      "No se pudo notificar al backend sobre el logout:",
      error
    );
  }
};

// Guardar datos en localStorage.
export const saveAuthData = (
  user: User,
  token: string
): void => {
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("token", token);
};

// Obtener usuario almacenado.
export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem("currentUser");

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Obtener token almacenado.
export const getStoredToken = (): string | null => {
  return localStorage.getItem("token");
};