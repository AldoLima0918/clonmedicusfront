const API_URL = import.meta.env.VITE_API_URL;

export interface User {
  idusuario: number;
  nombre_completo: string;
  usuario: string;
  rol: number;
  telefono: string;
  correo: string;
  estado: number;
  especialidades?: number[];
  password?: string;
}

export interface Especialidad {
  idespecialidad: number;
  nombre: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener los usuarios");
  }

  const users = await response.json();
  return users.filter((user: User) => user.rol !== 2 && user.estado !== 3);
};

export const getEspecialidades = async (): Promise<Especialidad[]> => {
  const response = await fetch(`${API_URL}/especialidades`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener las especialidades");
  }

  return response.json();
};

export const createUser = async (
  user: Omit<User, "idusuario">
): Promise<User> => {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al crear el usuario");
  }

  return response.json();
};

export const updateUser = async (user: User): Promise<User> => {
  const response = await fetch(`${API_URL}/users/${user.idusuario}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      idusuario: user.idusuario,
      usuario: user.usuario,
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      telefono: user.telefono,
      correo: user.correo,
      estado: user.estado,
      especialidades: user.especialidades,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al actualizar el usuario");
  }

  return response.json();
};

export const updateUserPassword = async (
  id: number,
  newPassword: string
): Promise<{ message: string; user: { idusuario: number; usuario: string } }> => {
  const response = await fetch(`${API_URL}/users/${id}/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al actualizar la contraseña");
  }

  return response.json();
};

export const updateUserStatus = async (
  id: number,
  estado: number
): Promise<void> => {
  const response = await fetch(`${API_URL}/users/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ estado }),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar el estado del usuario");
  }
};