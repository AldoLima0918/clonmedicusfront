import axios from "axios";
import { format } from "date-fns";
const API_URL = import.meta.env.VITE_API_URL;
export const getHistorialPagos = async (filtros: {
  busqueda?: string; periodo?: string; anio?: number;
  fechaInicio?: Date; fechaFin?: Date; iddoctor?: number;
  pagina?: number; exportar?: boolean;
}, signal?: AbortSignal) => {
  const params = new URLSearchParams();
  if (filtros.busqueda?.trim()) params.append("busqueda", filtros.busqueda.trim());
  params.append("periodo", filtros.periodo || "hoy");
  if (filtros.anio) params.append("anio", String(filtros.anio));
  if (filtros.fechaInicio) params.append("fechaInicio", format(filtros.fechaInicio, "yyyy-MM-dd"));
  if (filtros.fechaFin) params.append("fechaFin", format(filtros.fechaFin, "yyyy-MM-dd"));
  if (filtros.iddoctor) params.append("iddoctor", String(filtros.iddoctor));
  if (filtros.pagina) params.append("pagina", String(filtros.pagina));
  if (filtros.exportar) params.append("exportar", "true");
  return (await axios.get(`${API_URL}/historial-pagos`, { params, signal })).data;
};
export const getDoctores = async () => (await axios.get(`${API_URL}/historial-pagos/doctores`)).data;
