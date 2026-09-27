// src/hooks/useWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(socketService.isConnectedToSocket());

  useEffect(() => {
    // Conectar si no está conectado
    if (!socketService.isConnectedToSocket()) {
      socketService.connect();
    }

    const unsubscribeConnect = socketService.on('connect', () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnect = socketService.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    return socketService.on(event, callback);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketService.emit(event, data);
  }, []);

  return {
    isConnected,
    on,
    emit,
    socketService
  };
};

export default useWebSocket;