// src/api/mensajesapi.ts

export type Contacto = {
  id: number;
  nombre: string;
  rol: string;
  online: boolean;
  noLeidos: number;
  avatarColor?: string; // lo asignamos en el front para no depender de back
};

export type Mensaje = {
  id: number;
  conversacionId: number;
  texto: string;
  emisor: "yo" | "contacto";
  emisorId: number;
  fecha: string;
  leido: boolean;
  fechaLeido: string | null;
};

const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ─────────────────────────────────────────────
   Paleta para avatares (determinista por id)
   ───────────────────────────────────────────── */
const COLORS = [
  "from-pink-500 to-rose-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-purple-500 to-fuchsia-500",
  "from-cyan-500 to-sky-500",
  "from-lime-500 to-green-500",
  "from-red-500 to-rose-600",
];

const colorForId = (id: number) => COLORS[id % COLORS.length];

/* ─────────────────────────────────────────────
   API
   ───────────────────────────────────────────── */

export const getContactos = async (): Promise<Contacto[]> => {
  const res = await fetch(`${API_URL}/mensajes/contactos`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener contactos");
  const data: any[] = await res.json();
  return data.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    rol: c.rol,
    online: c.online,
    noLeidos: c.noLeidos,
    avatarColor: colorForId(c.id),
  }));
};

export const getMensajes = async (contactoId: number): Promise<Mensaje[]> => {
  const res = await fetch(`${API_URL}/mensajes/${contactoId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener mensajes");
  return res.json();
};

export const enviarMensaje = async (
  contactoId: number,
  texto: string
): Promise<Mensaje> => {
  const res = await fetch(`${API_URL}/mensajes/${contactoId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ texto }),
  });
  if (!res.ok) throw new Error("Error al enviar mensaje");
  return res.json();
};

export const marcarComoLeidos = async (contactoId: number): Promise<void> => {
  const res = await fetch(`${API_URL}/mensajes/${contactoId}/leidos`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al marcar como leídos");
};

export const getNoLeidosPorContacto = async (): Promise<
  Record<number, number>
> => {
  const res = await fetch(`${API_URL}/mensajes/no-leidos`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener no leídos");
  const data: { porContacto: Record<string, number>; total: number } =
    await res.json();

  const conteo: Record<number, number> = {};
  Object.entries(data.porContacto || {}).forEach(([k, v]) => {
    conteo[parseInt(k, 10)] = v;
  });
  return conteo;
};

export const getTotalNoLeidos = async (): Promise<number> => {
  const res = await fetch(`${API_URL}/mensajes/no-leidos`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al obtener total no leídos");
  const data: { porContacto: Record<string, number>; total: number } =
    await res.json();
  return data.total;
};

/* ─────────────────────────────────────────────
   Suscripción a cambios (evento local)
   Se mantiene porque permite que varias instancias
   de ChatWindow / ContactosPanel se sincronicen.
   ───────────────────────────────────────────── */
const EVENT_NAME = "medicus-mensajes-update";

export const notificarCambio = () => {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const suscribirseACambios = (cb: () => void) => {
  window.addEventListener(EVENT_NAME, cb);
  return () => window.removeEventListener(EVENT_NAME, cb);
};

/**
 * Polling sencillo: cada X ms notifica un cambio para que los
 * componentes vuelvan a consultar al backend.
 * Útil si no tienes websockets.
 */
export const iniciarPolling = (intervaloMs = 8000) => {
  const id = setInterval(() => notificarCambio(), intervaloMs);
  return () => clearInterval(id);
};