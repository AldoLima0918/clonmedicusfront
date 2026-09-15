import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface Servicio {
  nombre: string;
  precio: number;
  idespecialidad: number;
}

interface ServicioCompleto {
  idservicio: number;
  nombre: string;
  precio: number;
  idespecialidad: number;
  especialidad: string;
}

export const obtenerServicios = async (): Promise<ServicioCompleto[]> => {
  const response = await axios.get(`${API_URL}/servicios`);
  return response.data;
};

export const obtenerEspecialidades = async () => {
  const response = await axios.get(`${API_URL}/especialidades`);
  return response.data;
};

export const crearServicio = async (servicio: Servicio) => {
  const response = await axios.post(`${API_URL}/servicios`, servicio);
  return response.data;
};

export const actualizarServicio = async (id: number, servicio: Servicio) => {
  const response = await axios.put(`${API_URL}/servicios/${id}`, servicio);
  return response.data;
};

export const eliminarServicio = async (id: number) => {
  const response = await axios.delete(`${API_URL}/servicios/${id}`);
  return response.data;
};