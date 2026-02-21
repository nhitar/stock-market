import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
  }

  connect() {
    try {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket']
      });
      
      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.isConnected = true;
        this.notifyHandlers('connected', {});
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        this.isConnected = false;
        this.notifyHandlers('disconnected', {});
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      this.socket.on('initial_data', (data) => {
        this.notifyHandlers('initial_data', data);
      });

      this.socket.on('price_update', (data) => {
        this.notifyHandlers('price_update', data);
      });

      this.socket.on('trading_started', (data) => {
        this.notifyHandlers('trading_started', data);
      });

      this.socket.on('trading_stopped', (data) => {
        this.notifyHandlers('trading_stopped', data);
      });

      this.socket.on('brokers_updated', (data) => {
        this.notifyHandlers('brokers_updated', data)
      });

      this.socket.on('stocks_updated', (data) => {
        this.notifyHandlers('stocks_updated', data);
      });

      this.socket.on('exchange_settings_updated', (data) => {
        this.notifyHandlers('exchange_settings_updated', data)
      })

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
    }
  }

  sendMessage(type, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(type, data);
    }
  }

  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
  }

  off(eventType, handler) {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  notifyHandlers(eventType, data) {
    const handlers = this.messageHandlers.get(eventType) || []
    handlers.forEach(handler => {
      handler(data)
    })
  }

  startTrading(speed = 5) {
    this.sendMessage('start_trading', { speed });
  }

  stopTrading() {
    this.sendMessage('stop_trading', {});
  }
}

export const websocketService = new WebSocketService();