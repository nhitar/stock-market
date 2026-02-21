import { ref } from 'vue'
import { io } from 'socket.io-client'

class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = ref(false)
    this.messageHandlers = new Map()
    this.pendingConnection = null
  }

  connect() {
    if (this.isConnected.value && this.socket) {
      return Promise.resolve()
    }

    if (this.pendingConnection) {
      return this.pendingConnection
    }

    this.pendingConnection = new Promise((resolve, reject) => {
      try {
        this.socket = io('http://localhost:3000', {
          transports: ['websocket'],
          autoConnect: true,
        })

        this.socket.onAny((event, ...args) => {
          console.log(`[WS] ${event}`, args[0])
        })

        this.socket.on('connect', () => {
          this.isConnected.value = true
          resolve()
          this.notifyHandlers('connected')
        })

        this.socket.on('disconnect', () => {
          this.isConnected.value = false
          this.notifyHandlers('disconnected')
        })

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error)
          reject(error)
        })

        this.forwardEvent('initial_data')
        this.forwardEvent('price_update')
        this.forwardEvent('brokers_updated')
        this.forwardEvent('stocks_updated')
        this.forwardEvent('trading_started')
        this.forwardEvent('trading_stopped')
        this.forwardEvent('exchange_settings_updated')

      } catch (error) {
        reject(error)
      }
    }).finally(() => {
      this.pendingConnection = null
    })

    return this.pendingConnection
  }

  forwardEvent(eventName) {
    if (!this.socket) return
    this.socket.on(eventName, (payload) => {
      this.notifyHandlers(eventName, payload)
    })
  }

  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, [])
    }
    this.messageHandlers.get(eventType).push(handler)
  }

  once(eventType, handler) {
    const wrapper = (data) => {
      this.off(eventType, wrapper)
      handler(data)
    }
    this.on(eventType, wrapper)
  }

  off(eventType, handler) {
    const handlers = this.messageHandlers.get(eventType)
    if (!handlers) return
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)
    }
  }

  notifyHandlers(eventType, payload) {
    const handlers = this.messageHandlers.get(eventType) || []
    handlers.forEach((handler) => handler(payload))
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected.value = false
    }
  }

  sendMessage(eventName, payload) {
    if (this.socket && this.isConnected.value) {
      this.socket.emit(eventName, payload)
    } else {
      console.warn('Socket.IO is not connected. Message skipped:', eventName)
    }
  }

  startTrading(speed) {
    this.sendMessage('start_trading', { speed })
  }

  stopTrading() {
    this.sendMessage('stop_trading', {})
  }

  addBroker(name, balance) {
    this.sendMessage('add_broker', { name, balance })
  }

  buyStock({ ticker, quantity, brokerId }) {
    this.sendMessage('buy_stock', { ticker, quantity, brokerId })
  }

  sellStock({ ticker, quantity, brokerId }) {
    this.sendMessage('sell_stock', { ticker, quantity, brokerId })
  }
}

export const websocketService = new WebSocketService()
