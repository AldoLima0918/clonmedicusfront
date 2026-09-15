// listaespecialidadapi.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // Ajusta la URL según tu configuración

export const obtenerEspecialidades = async () => {
  const response = await axios.get(`${API_URL}/listaespecialidad`);
  return response.data;
};

export const crearEspecialidad = async (nombre: string) => {
  const response = await axios.post(`${API_URL}/listaespecialidad`, { nombre });
  return response.data;
};

export const actualizarEspecialidad = async (id: number, nombre: string) => {
  const response = await axios.put(`${API_URL}/listaespecialidad/${id}`, {
    nombre,
  });
  return response.data;
};

export const eliminarEspecialidad = async (id: number) => {
  const response = await axios.delete(`${API_URL}/listaespecialidad/${id}`);
  return response.data;
};
