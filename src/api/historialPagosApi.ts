import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getHistorialPagos = async (filtros: {
  busqueda?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  iddoctor?: number;
}) => {
  const params = new URLSearchParams();
  if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
  if (filtros.fechaInicio)
    params.append("fechaInicio", filtros.fechaInicio.toISOString());
  if (filtros.fechaFin)
    params.append("fechaFin", filtros.fechaFin.toISOString());
  if (filtros.iddoctor) params.append("iddoctor", filtros.iddoctor.toString());

  const response = await axios.get(`${API_URL}/historial-pagos`, { params });
  return response.data;
};

export const getDoctores = async () => {
  const response = await axios.get(`${API_URL}/historial-pagos/doctores`);
  return response.data;
};
