// src/pages/Mensajes.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Search,
  Send,
  Minus,
  Users,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getContactos,
  getMensajes,
  enviarMensaje,
  marcarComoLeidos,
  getNoLeidosPorContacto,
  getTotalNoLeidos,
  suscribirseACambios,
  notificarCambio,
  iniciarPolling,
  type Contacto,
  type Mensaje,
} from "@/api/mensajesapi";

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ─────────────────────────────────────────────
   Ventana de chat (estilo Facebook)
   ───────────────────────────────────────────── */
const ChatWindow = ({
  contacto,
  onClose,
  onMinimize,
  minimized,
}: {
  contacto: Contacto;
  onClose: () => void;
  onMinimize: () => void;
  minimized: boolean;
}) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const isAtBottomRef = useRef(true);
  const firstLoadRef = useRef(true);

  const cargar = useCallback(
    async (opts?: { marcarLeidos?: boolean }) => {
      const data = await getMensajes(contacto.id);
      setMensajes(data);
      if (opts?.marcarLeidos !== false) {
        await marcarComoLeidos(contacto.id);
      }
    },
    [contacto.id]
  );

  useEffect(() => {
    firstLoadRef.current = true;
    lastMessageIdRef.current = null;
    isAtBottomRef.current = true;
    cargar().then(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    });
  }, [cargar]);

  useEffect(() => {
    const unsub = suscribirseACambios(() => {
      cargar({ marcarLeidos: !minimized && isAtBottomRef.current });
    });
    return unsub;
  }, [cargar, minimized]);

  useEffect(() => {
    if (mensajes.length === 0) return;
    const last = mensajes[mensajes.length - 1];

    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      lastMessageIdRef.current = last.id;
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
      return;
    }

    if (last.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = last.id;
      if (isAtBottomRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      }
    }
  }, [mensajes]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 40;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = texto.trim();
    if (!trimmed || enviando) return;
    setEnviando(true);
    try {
      await enviarMensaje(contacto.id, trimmed);
      setTexto("");
      isAtBottomRef.current = true;
      await cargar({ marcarLeidos: false });
      notificarCambio();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-t-xl shadow-2xl border border-border/60 bg-background",
        "transition-all duration-300 ease-out",
        "bottom-0 right-4 md:right-24",
        minimized ? "h-12 w-64" : "h-[420px] w-[320px] sm:w-[340px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer select-none",
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
        )}
        onClick={onMinimize}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            "bg-gradient-to-br text-white text-xs font-semibold",
            contacto.avatarColor
          )}
        >
          {getInitials(contacto.nombre)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {contacto.nombre}
          </p>
          <p className="flex items-center gap-1 text-[10px] opacity-90 leading-tight">
            <Circle
              className={cn(
                "h-2 w-2",
                contacto.online
                  ? "fill-emerald-400 text-emerald-400"
                  : "fill-muted-foreground text-muted-foreground"
              )}
            />
            {contacto.online ? "En línea" : "Desconectado"}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          className="rounded-md p-1 hover:bg-white/20 transition-colors"
          aria-label="Minimizar"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded-md p-1 hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      {!minimized && (
        <>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-muted/20"
          >
            {mensajes.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">
                No hay mensajes aún. ¡Escribe el primero!
              </p>
            )}
            {mensajes.map((m) => {
              const esMio = m.emisor === "yo";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    esMio ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      esMio
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-background border border-border rounded-bl-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {m.texto}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[10px] text-right",
                        esMio
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatHora(m.fecha)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <form
            onSubmit={handleEnviar}
            className="flex items-center gap-2 border-t border-border/60 bg-background px-2 py-2"
          >
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="h-9 flex-1 border-0 bg-muted/40 focus-visible:ring-1"
              disabled={enviando}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!texto.trim() || enviando}
              className="h-9 w-9 shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Panel de contactos
   ───────────────────────────────────────────── */
const ContactosPanel = ({
  contactos,
  noLeidos,
  onSelect,
  onClose,
}: {
  contactos: Contacto[];
  noLeidos: Record<number, number>;
  onSelect: (c: Contacto) => void;
  onClose: () => void;
}) => {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = contactos.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalNoLeidos = Object.values(noLeidos).reduce((a, b) => a + b, 0);

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-xl shadow-2xl border border-border/60 bg-background",
        "bottom-24 right-4 md:right-24",
        "w-[300px] sm:w-[340px] max-h-[480px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Contactos</h3>
          {totalNoLeidos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {totalNoLeidos}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Cerrar contactos"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Buscador */}
      <div className="px-3 py-2 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar contacto..."
            className="h-8 pl-8 text-sm bg-muted/40 border-0"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtrados.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Sin resultados
          </p>
        )}
        {filtrados.map((c) => {
          const unread = noLeidos[c.id] || 0;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left",
                "transition-colors hover:bg-accent/60",
                "focus:outline-none focus-visible:bg-accent/60"
              )}
            >
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    "bg-gradient-to-br text-white text-xs font-semibold",
                    c.avatarColor
                  )}
                >
                  {getInitials(c.nombre)}
                </div>
                {c.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {c.nombre}
                </p>
                <p className="truncate text-xs text-muted-foreground leading-tight mt-0.5">
                  {c.rol}
                </p>
              </div>

              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Componente principal
   ───────────────────────────────────────────── */
const Mensajes = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [noLeidos, setNoLeidos] = useState<Record<number, number>>({});
  const [totalNoLeidos, setTotalNoLeidos] = useState(0);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [chatActivo, setChatActivo] = useState<Contacto | null>(null);
  const [chatMinimizado, setChatMinimizado] = useState(false);

  const refrescar = useCallback(async () => {
    try {
      const [cs, nl, total] = await Promise.all([
        getContactos(),
        getNoLeidosPorContacto(),
        getTotalNoLeidos(),
      ]);
      setContactos(cs);
      setNoLeidos(nl);
      setTotalNoLeidos(total);
    } catch (err) {
      console.error("Error al refrescar mensajes:", err);
    }
  }, []);

  useEffect(() => {
    refrescar();
    const unsub = suscribirseACambios(() => refrescar());
    const stopPolling = iniciarPolling(8000); // cada 8s
    return () => {
      unsub();
      stopPolling();
    };
  }, [refrescar]);

  const handleSelectContacto = (c: Contacto) => {
    setChatActivo(c);
    setChatMinimizado(false);
    setPanelAbierto(false);
  };

  const handleCloseChat = () => {
    setChatActivo(null);
    setChatMinimizado(false);
  };

  /**
   * Toggle del panel de contactos.
   * Si hay un chat abierto, se minimiza automáticamente al abrir el panel.
   */
  const handleTogglePanel = () => {
    setPanelAbierto((prev) => {
      const next = !prev;
      if (next && chatActivo) {
        setChatMinimizado(true);
      }
      return next;
    });
  };

  return (
    <>
      {panelAbierto && (
        <ContactosPanel
          contactos={contactos}
          noLeidos={noLeidos}
          onSelect={handleSelectContacto}
          onClose={() => setPanelAbierto(false)}
        />
      )}

      {chatActivo && (
        <ChatWindow
          contacto={chatActivo}
          onClose={handleCloseChat}
          onMinimize={() => setChatMinimizado((v) => !v)}
          minimized={chatMinimizado}
        />
      )}

      <button
        onClick={handleTogglePanel}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
          "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
        aria-label="Mensajes"
      >
        <MessageCircle className="h-6 w-6" />

        {totalNoLeidos > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center",
              "rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground",
              "border-2 border-background",
              "animate-pulse"
            )}
          >
            {totalNoLeidos > 99 ? "99+" : totalNoLeidos}
          </span>
        )}
      </button>
    </>
  );
};

export default Mensajes;