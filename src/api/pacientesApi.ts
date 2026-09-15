const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ✅ Clase de error personalizada para la API
export class ApiError extends Error {
  public response?: {
    data?: {
      error?: string;
      details?: string;
    };
  };

  constructor(
    message: string,
    response?: { data?: { error?: string; details?: string } }
  ) {
    super(message);
    this.name = 'ApiError';
    this.response = response;

    // Necesario para que instanceof funcione correctamente al compilar a ES5
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ✅ Tipos para las respuestas
export interface Paciente {
  id: number;
  name: string;
  phone: string;
  birthdate: string;
  bloodType: string;
  ci: string;
  gender: string;
  lastVisit: string | null;
}

export interface GetPacientesResponse {
  patients: Paciente[];
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  searchTerm: string;
}

export interface CheckCiResponse {
  exists: boolean;
  paciente?: {
    idpaciente: number;
    nombre_completo: string;
  };
}

export interface AddPacientePayload {
  nombre_Completo: string;
  telefono: string;
  correo: string;
  fecha_Nacimiento: string;
  tipo_Sangre: string;
  genero: string;
  direccion: string;
  alergias: string;
  enfermedad_base: string;
  ci: string;
  doctorId?: number;
}

// ✅ Helper para parsear errores de respuesta
const parseErrorResponse = async (response: Response): Promise<ApiError> => {
  const text = await response.text();
  console.error('Error response:', text);

  let errorData: { error?: string; details?: string } = { error: text };

  try {
    errorData = JSON.parse(text);
  } catch {
    // No es JSON, dejar el texto plano
  }

  return new ApiError(`HTTP error! status: ${response.status}`, {
    data: errorData,
  });
};

export const getPacientes = async (
  userId: number | string,
  page = 1,
  pageSize = 100,
  searchTerm = ''
): Promise<GetPacientesResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('userId', userId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    if (searchTerm && searchTerm.trim() !== '') {
      params.append('search', searchTerm);
    }

    const url = `${API_BASE_URL}/pacientes?${params.toString()}`;
    console.log('Fetching URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data: GetPacientesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getPacientes:', error);
    throw error;
  }
};

export const addPaciente = async (paciente: AddPacientePayload) => {
  try {
    const url = `${API_BASE_URL}/pacientes`;
    console.log('Posting to URL:', url);
    console.log('Data:', paciente);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paciente),
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en addPaciente:', error);
    throw error;
  }
};

export const checkCiExists = async (ci: string): Promise<CheckCiResponse> => {
  try {
    const url = `${API_BASE_URL}/pacientes/check-ci/${encodeURIComponent(ci)}`;
    console.log('Checking CI URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data: CheckCiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error en checkCiExists:', error);
    throw error;
  }
};