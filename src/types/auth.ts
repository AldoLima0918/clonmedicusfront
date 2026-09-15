export type UserRole = "administrador" | "doctor" | "secretaria";

export interface User {
  id: number;
  name: string;
  role: string; // "secretaria" | "doctor" | "administrador"
  email?: string;
  phone?: string;
  username: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}