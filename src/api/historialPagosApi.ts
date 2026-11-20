import axios from "axios";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL;

export const getHistorialPagos = async (filtros: {
  busqueda?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  iddoctor?: number;
  pagina?: number;
  exportar?: boolean;
}, signal?: AbortSignal) => {
  const params = new URLSearchParams();
  if (filtros.busqueda) params.append("busqueda", filtros.busqueda);
  if (filtros.fechaInicio) params.append("fechaInicio", format(filtros.fechaInicio, "yyyy-MM-dd"));
  if (filtros.fechaFin) params.append("fechaFin", format(filtros.fechaFin, "yyyy-MM-dd"));
  if (filtros.iddoctor) params.append("iddoctor", filtros.iddoctor.toString());
  if (filtros.pagina) params.append("pagina", filtros.pagina.toString());
  if (filtros.exportar) params.append("exportar", "true");
  const response = await axios.get(`${API_URL}/historial-pagos`, { params, signal });
  return response.data;
};

export const getDoctores = async () => {
  const response = await axios.get(`${API_URL}/historial-pagos/doctores`);
  return response.data;
};
