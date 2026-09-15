// src/api/cobrosapi.ts
const API_URL = import.meta.env.VITE_API_URL;

export const fetchTransacciones = async () => {
  const response = await fetch(`${API_URL}/cobros`);
  if (!response.ok) {
    throw new Error("Error al obtener las transacciones");
  }
  return response.json();
};

export const updateTransaccion = async (
  id: number,
  metodoPago: string,
  userId: string | number,
  monto: number
) => {
  const response = await fetch(`${API_URL}/cobros/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ metodoPago, userId: String(userId), monto }),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar la transacción");
  }
  return response.json();
};