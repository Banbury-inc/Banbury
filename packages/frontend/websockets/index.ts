import { CONFIG } from "../config/config";

class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly url: string;
  private messageHandlers: ((event: MessageEvent) => void)[] = [];

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.socket = new WebSocket(this.url);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
          console.log('WebSocket Connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.messageHandlers.forEach(handler => handler(event));
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket Error:', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('WebSocket Disconnected');
        };
      } else if (this.socket.readyState === WebSocket.OPEN) {
        resolve();
      } else {
        reject(new Error('WebSocket connection failed'));
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  addEventListener(type: 'message', handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      this.messageHandlers.push(handler);
    }
  }

  removeEventListener(type: 'message', handler: (event: MessageEvent) => void): void {
    if (type === 'message') {
      const index = this.messageHandlers.indexOf(handler);
      if (index !== -1) {
        this.messageHandlers.splice(index, 1);
      }
    }
  }
}

export const webSocketService = new WebSocketService(CONFIG.url_ws);

export default WebSocketService;

