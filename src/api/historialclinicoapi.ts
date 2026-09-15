const API_URL = import.meta.env.VITE_API_URL;

export const getHistorialClinico = async (
  idPaciente: string,
  idDoctor: string
) => {
  const url = new URL(`${API_URL}/historialclinica/${idPaciente}`);
  url.searchParams.append("doctorId", idDoctor);

  const response = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || "Error al obtener el historial clínico"
    );
  }
  return response.json();
};

export const addConsulta = async (idPaciente: string, consultaData: any) => {
  const response = await fetch(
    `${API_URL}/historialclinica/${idPaciente}/consulta`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(consultaData),
    }
  );
  if (!response.ok) {
    throw new Error("Error al agregar la consulta");
  }
  return response.json();
};

export const addPago = async (pagoData: any) => {
  const response = await fetch(`${API_URL}/pagoshistorialclinica`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pagoData),
  });
  if (!response.ok) {
    throw new Error("Error al agregar el pago");
  }
  return response.json();
};

export const updatePacienteNotas = async (
  idPaciente: string,
  notas: string
) => {
  const response = await fetch(
    `${API_URL}/pacienteshistorialclinica/${idPaciente}/notas`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notas }),
    }
  );
  if (!response.ok) {
    throw new Error("Error al actualizar las notas del paciente");
  }
  return response.json();
};

export const getServicios = async (userId: string) => {
  const response = await fetch(
    `${API_URL}/servicioshistorialclinica?userId=${userId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Error al obtener los servicios");
  }
  return response.json();
};

export const updatePaciente = async (idPaciente: string, pacienteData: any) => {
  const response = await fetch(
    `${API_URL}/pacienteshistorialclinica/${idPaciente}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pacienteData),
    }
  );
  if (!response.ok) {
    throw new Error("Error al actualizar la información del paciente");
  }
  return response.json();
};

export const updateCitaEstado = async (idcita: string, estado: number) => {
  const response = await fetch(`${API_URL}/citas/${idcita}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar el estado de la cita");
  }
  return response.json();
};

export const getDoctorInfo = async (userId: string) => {
  const response = await fetch(`${API_URL}/doctorinfo/${userId}`);
  if (!response.ok) {
    throw new Error("Error al obtener la información del doctor");
  }
  return response.json();
};

// NUEVA FUNCIÓN: Actualizar antecedente (solo texto)
export const updateAntecedente = async (
  idhistoria: string,
  antecedente: string
) => {
  const response = await fetch(
    `${API_URL}/historialclinica/antecedente/${idhistoria}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ antecedente }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || "Error al actualizar el antecedente"
    );
  }
  return response.json();
};