const API_URL = import.meta.env.VITE_API_URL;

export interface ExportarCitasParams {
  fechaInicio: string;
  fechaFin: string;
  servicios?: number[] | null;
  tipoReporte: string;
  estados?: string[] | null;
}

export interface CitaExportacion {
  idcita: number;
  paciente: string;
  doctor: string;
  servicio: string;
  telefono: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: number;
}

export const fetchCitas = async () => {
  const response = await fetch(`${API_URL}/listacitas`);
  if (!response.ok) {
    throw new Error("Error al obtener las citas");
  }
  return response.json();
};

export const fetchCitasCompletadas = async (params: ExportarCitasParams) => {
  const queryParams = new URLSearchParams();
  queryParams.append('fechaInicio', params.fechaInicio);
  queryParams.append('fechaFin', params.fechaFin);
  queryParams.append('tipoReporte', params.tipoReporte);
  
  if (params.servicios && params.servicios.length > 0) {
    queryParams.append('servicios', params.servicios.join(','));
  }
  
  if (params.estados && params.estados.length > 0) {
    queryParams.append('estados', params.estados.join(','));
  }
  
  const response = await fetch(`${API_URL}/citas/historial?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error("Error al obtener el historial de citas");
  }
  return response.json();
};

export const fetchServicios = async () => {
  const response = await fetch(`${API_URL}/servicios`);
  if (!response.ok) {
    throw new Error("Error al obtener los servicios");
  }
  return response.json();
};

export const updateEstadoCita = async (id: number, nuevoEstado: number) => {
  const response = await fetch(`${API_URL}/citas/${id}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado: nuevoEstado }),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar el estado de la cita");
  }
  return response.json();
};

export const deleteCita = async (id: number, motivo?: string) => {
  const response = await fetch(`${API_URL}/citas/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ motivo }), // Solo para visual, no se guarda en BD
  });
  if (!response.ok) {
    throw new Error("Error al eliminar la cita");
  }
  return response.json();
};

export const procesarPago = async (id: number, metodoPago: string) => {
  const response = await fetch(`${API_URL}/citas/${id}/pago`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ metodoPago }),
  });
  if (!response.ok) {
    throw new Error("Error al procesar el pago");
  }
  return response.json();
};