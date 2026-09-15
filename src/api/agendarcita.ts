import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getPacientes = async (searchTerm = "") => {
  const response = await axios.get(`${API_URL}/pacientesagendarcita`, {
    params: { search: searchTerm },
  });
  return response.data;
};

export const getServicios = async () => {
  const response = await axios.get(`${API_URL}/serviciosagendarcita`);
  return response.data;
};

export const getDoctoresByServicio = async (idservicio: number) => {
  const response = await axios.get(
    `${API_URL}/doctoresagendarcita/servicio/${idservicio}`
  );
  return response.data;
};

export const getHorariosDisponibles = async (
  iddoctor: string,
  fecha: string
) => {
  const response = await axios.get(
    `${API_URL}/horariosdisponibles/${iddoctor}/${fecha}`
  );
  return response.data;
};

export const verificarCitaExistente = async (
  idpaciente: number,
  iddoctor: number,
  fecha: string
): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${API_URL}/verificar-cita-existente/${idpaciente}/${iddoctor}/${fecha}`
    );
    return response.data.existe;
  } catch (error) {
    console.error("Error al verificar cita existente:", error);
    return false;
  }
};

export const agendarCita = async (citaData: any) => {
  try {
    // Primero verificar si ya existe una cita
    const citaExistente = await verificarCitaExistente(
      citaData.idpaciente,
      citaData.iddoctor,
      citaData.fecha
    );

    if (citaExistente) {
      throw new Error("El paciente ya tiene una cita agendada con este doctor para hoy");
    }

    const responseCita = await axios.post(
      `${API_URL}/citasagendarcita`,
      citaData
    );

    const { idpaciente, iddoctor } = citaData;
    await axios.post(`${API_URL}/paciente_doctor`, {
      idpaciente,
      iddoctor,
    });

    return responseCita.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || "Error al agendar la cita");
  }
};