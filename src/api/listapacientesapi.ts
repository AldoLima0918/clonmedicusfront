// listapacientesapi.ts
const API_URL = import.meta.env.VITE_API_URL;

export type FormPaciente = {
  id?: number;
  idpaciente: number;
  ci: string;
  nombre_completo: string;
  telefono: string;
  correo: string;
  fecha_nacimiento: string;
  direccion: string;
  tipo_sangre: string;
  genero: string;
  alergias: string;
  enfermedad_base: string;
  ultima_consulta?: string;
};

export type PaginationInfo = {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type GetPacientesResponse = {
  data: FormPaciente[];
  pagination: PaginationInfo;
};

export interface CheckCiResponse {
  exists: boolean;
  paciente?: {
    idpaciente: number;
    nombre_completo: string;
  };
}

export const getPacientes = async ({
  page = 1,
  limit = 20,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<GetPacientesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: search,
  });

  const response = await fetch(`${API_URL}/listapacientes?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Error al obtener los pacientes");
  }
  return response.json();
};

export const updatePaciente = async (
  id: number,
  paciente: FormPaciente
): Promise<FormPaciente> => {
  const response = await fetch(`${API_URL}/listapacientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paciente),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar el paciente");
  }
  return response.json();
};

export const deletePaciente = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/listapacientes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Error al marcar el paciente como inactivo");
  }
};

// ✅ NUEVA FUNCIÓN: Verificar si un CI ya existe (excluyendo opcionalmente un paciente)
export const checkCiExists = async (
  ci: string,
  excludeId?: number
): Promise<CheckCiResponse> => {
  const params = new URLSearchParams();
  if (excludeId) {
    params.append("excludeId", String(excludeId));
  }

  const url = `${API_URL}/listapacientes/check-ci/${encodeURIComponent(ci)}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error al verificar el CI");
  }
  return response.json();
};