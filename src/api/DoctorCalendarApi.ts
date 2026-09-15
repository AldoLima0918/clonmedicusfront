const API_URL = import.meta.env.VITE_API_URL;

export interface ServiceItem {
  nombre: string;
}

export interface Appointment {
  id: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  services: ServiceItem[];
  price: number;
  date: string;
  time: string;
  status: number;
}

export const fetchDoctorAppointments = async (
  doctorId: number,
  startDate: string,
  endDate?: string
): Promise<Appointment[]> => {
  const response = await fetch(
    `${API_URL}/doctor-calendar/${doctorId}?startDate=${startDate}${
      endDate ? `&endDate=${endDate}` : ""
    }`
  );
  if (!response.ok) {
    throw new Error("Error al obtener las citas del doctor");
  }
  const data = await response.json();

  return data.map((appointment: any) => ({
    id: appointment.id,
    patientName: appointment.patientname,
    patientId: appointment.patientid,
    doctorName: appointment.doctorname,
    services: appointment.services || [],
    price: Number(appointment.price) || 0,
    date: appointment.date.split("T")[0],
    time: appointment.time,
    status: appointment.status,
  }));
};