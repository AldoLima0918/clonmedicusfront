// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Conecta al servidor WebSocket
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket ya está conectado');
      return;
    }

    // ✅ CLAVES REALES DE TU CLÍNICA
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');

    let userId = '';
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id || '';
      }
    } catch (e) {}

    const SOCKET_URL =
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupListeners();
  }

  /**
   * Configura los listeners base del socket
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitLocal('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`🔌 WebSocket desconectado: ${reason}`);
      this.isConnected = false;
      this.emitLocal('disconnect', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('⚠️ Máximos intentos de reconexión alcanzados');
        this.emitLocal('connect_error', { error, fatal: true });
      }
    });

    // ============================================
    // EVENTOS DE CLÍNICA
    // ============================================
    this.socket.on('nueva-cita', (data) => {
      this.emitLocal('nueva-cita', data);
    });

    this.socket.on('cita-estado-actualizado', (data) => {
      this.emitLocal('cita-estado-actualizado', data);
    });

    this.socket.on('cita-cancelada', (data) => {
      this.emitLocal('cita-cancelada', data);
    });

    this.socket.on('citas-reordenadas', (data) => {
      this.emitLocal('citas-reordenadas', data);
    });

    this.socket.on('pago-procesado', (data) => {
      this.emitLocal('pago-procesado', data);
    });

    // ============================================
    // EVENTOS GENÉRICOS
    // ============================================
    this.socket.on('cliente-actualizado', (data) => {
      this.emitLocal('cliente-actualizado', data);
    });

    this.socket.on('pago-pendiente-actualizado', (data) => {
      this.emitLocal('pago-pendiente-actualizado', data);
    });

    this.socket.on('caja-actualizada', (data) => {
      this.emitLocal('caja-actualizada', data);
    });

    this.socket.on('refresh', (data) => {
      this.emitLocal('refresh', data);
    });
  }

  private emitLocal(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener ${event}:`, error);
        }
      });
    }
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.off(event, callback);
    };
  }

  off(event: string, callback?: EventCallback): void {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      this.listeners.delete(event);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  isConnectedToSocket(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ No se puede emitir ${event}: socket no conectado`);
    }
  }
}

export const socketService = SocketService.getInstance();

export const useSocket = () => {
  return socketService;
};

export default socketService;