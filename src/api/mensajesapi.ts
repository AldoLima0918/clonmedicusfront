// src/api/mensajesapi.ts

export type Contacto = {
  id: string;
  nombre: string;
  rol: string;
  avatarColor: string;
  online: boolean;
};

export type Mensaje = {
  id: string;
  contactoId: string;
  texto: string;
  emisor: "yo" | "contacto";
  fecha: string; // ISO
  leido: boolean;
};

// ─────────────────────────────────────────────
// Datos mock
// ─────────────────────────────────────────────
const CONTACTOS_MOCK: Contacto[] = [
  {
    id: "c1",
    nombre: "Dra. María González",
    rol: "Doctora",
    avatarColor: "from-pink-500 to-rose-500",
    online: true,
  },
  {
    id: "c2",
    nombre: "Dr. Carlos Pérez",
    rol: "Doctor",
    avatarColor: "from-blue-500 to-indigo-500",
    online: false,
  },
  {
    id: "c3",
    nombre: "Ana Rodríguez",
    rol: "Secretaria",
    avatarColor: "from-emerald-500 to-teal-500",
    online: true,
  },
  {
    id: "c4",
    nombre: "Luis Fernández",
    rol: "Administrador",
    avatarColor: "from-amber-500 to-orange-500",
    online: false,
  },
  {
    id: "c5",
    nombre: "Sofía Ramírez",
    rol: "Enfermera",
    avatarColor: "from-purple-500 to-fuchsia-500",
    online: true,
  },
];

const MENSAJES_MOCK: Mensaje[] = [
  {
    id: "m1",
    contactoId: "c1",
    texto: "Hola, ¿puedes revisar la agenda de mañana?",
    emisor: "contacto",
    fecha: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    leido: false,
  },
  {
    id: "m2",
    contactoId: "c1",
    texto: "Claro, ahora lo reviso.",
    emisor: "yo",
    fecha: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    leido: true,
  },
  {
    id: "m3",
    contactoId: "c3",
    texto: "Paciente nuevo agendado para las 3pm.",
    emisor: "contacto",
    fecha: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    leido: false,
  },
  {
    id: "m4",
    contactoId: "c2",
    texto: "¿Me pasas el historial del paciente?",
    emisor: "contacto",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    leido: true,
  },
  {
    id: "m5",
    contactoId: "c5",
    texto: "Listo, ya firmé los documentos.",
    emisor: "contacto",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    leido: false,
  },
];

// ─────────────────────────────────────────────
// Persistencia en localStorage
// ─────────────────────────────────────────────
const STORAGE_MENSAJES = "medicus_mensajes";
const STORAGE_CONTACTOS = "medicus_contactos";

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

let contactosCache: Contacto[] = loadFromStorage(
  STORAGE_CONTACTOS,
  CONTACTOS_MOCK
);
let mensajesCache: Mensaje[] = loadFromStorage(
  STORAGE_MENSAJES,
  MENSAJES_MOCK
);

const persist = () => {
  saveToStorage(STORAGE_CONTACTOS, contactosCache);
  saveToStorage(STORAGE_MENSAJES, mensajesCache);
};

// Si no había nada en storage, guardamos los mocks iniciales
if (!localStorage.getItem(STORAGE_CONTACTOS)) persist();

// ─────────────────────────────────────────────
// Simulación de latencia
// ─────────────────────────────────────────────
const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

// ─────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────

export const getContactos = async (): Promise<Contacto[]> => {
  await delay();
  return [...contactosCache];
};

export const getMensajes = async (contactoId: string): Promise<Mensaje[]> => {
  await delay();
  return mensajesCache
    .filter((m) => m.contactoId === contactoId)
    .sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
};

export const enviarMensaje = async (
  contactoId: string,
  texto: string
): Promise<Mensaje> => {
  await delay(150);
  const nuevo: Mensaje = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contactoId,
    texto,
    emisor: "yo",
    fecha: new Date().toISOString(),
    leido: true,
  };
  mensajesCache = [...mensajesCache, nuevo];
  persist();
  return nuevo;
};

export const marcarComoLeidos = async (contactoId: string): Promise<void> => {
  await delay(80);
  mensajesCache = mensajesCache.map((m) =>
    m.contactoId === contactoId && m.emisor === "contacto"
      ? { ...m, leido: true }
      : m
  );
  persist();
};

export const getNoLeidosPorContacto = async (): Promise<
  Record<string, number>
> => {
  await delay(80);
  const conteo: Record<string, number> = {};
  mensajesCache.forEach((m) => {
    if (m.emisor === "contacto" && !m.leido) {
      conteo[m.contactoId] = (conteo[m.contactoId] || 0) + 1;
    }
  });
  return conteo;
};

export const getTotalNoLeidos = async (): Promise<number> => {
  await delay(60);
  return mensajesCache.filter((m) => m.emisor === "contacto" && !m.leido)
    .length;
};

/**
 * Simula la recepción de un mensaje entrante (útil para demo).
 * Devuelve el mensaje creado.
 */
export const simularMensajeEntrante = async (
  contactoId?: string
): Promise<Mensaje> => {
  await delay(100);
  const id =
    contactoId ||
    contactosCache[Math.floor(Math.random() * contactosCache.length)].id;
  const textos = [
    "¿Tienes un momento?",
    "Ya llegó el paciente.",
    "Necesito confirmar la cita.",
    "¿Puedes revisar esto?",
    "Gracias por la información.",
    "Todo listo por aquí.",
  ];
  const nuevo: Mensaje = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contactoId: id,
    texto: textos[Math.floor(Math.random() * textos.length)],
    emisor: "contacto",
    fecha: new Date().toISOString(),
    leido: false,
  };
  mensajesCache = [...mensajesCache, nuevo];
  persist();
  return nuevo;
};

/**
 * Suscripción simple a cambios (evento personalizado) para que
 * los componentes puedan refrescar su UI.
 */
const EVENT_NAME = "medicus-mensajes-update";

export const notificarCambio = () => {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const suscribirseACambios = (cb: () => void) => {
  window.addEventListener(EVENT_NAME, cb);
  return () => window.removeEventListener(EVENT_NAME, cb);
};