import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(namespace = '/iot') {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem('accessToken');

    this.socket = io(`${WS_URL}${namespace}`, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket chưa được kết nối. Gọi connect() trước.');
      return;
    }

    this.socket.on(event, callback);

    // Lưu listener để có thể remove sau
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);

      // Remove từ listeners map
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      // Remove tất cả listeners của event
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  emit(event, data) {
    if (!this.socket) {
      console.warn('Socket chưa được kết nối');
      return;
    }

    this.socket.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
