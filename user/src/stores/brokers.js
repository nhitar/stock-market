import { defineStore } from 'pinia'
import { ref } from 'vue'
import { websocketService } from '@/services/websocket'

const DEFAULT_BALANCE = 100000

export const useBrokerStore = defineStore('brokers', () => {
  const brokers = ref([])
  const currentBroker = ref(null)
  const pendingBrokerName = ref('')

  const normalizeBroker = (broker) => ({
    ...broker,
    stocks: normalizeStocks(broker.stocks),
    currentBalance: broker.currentBalance ?? broker.initialBalance ?? DEFAULT_BALANCE,
    initialBalance: broker.initialBalance ?? broker.currentBalance ?? DEFAULT_BALANCE,
  })

  const normalizeStocks = (stocks) => {
    if (!stocks) return {}
    
    if (Array.isArray(stocks)) {
      return {}
    }
    
    const normalized = {}
    Object.entries(stocks).forEach(([ticker, stockData]) => {
      if (typeof stockData === 'number') {
        normalized[ticker] = {
          quantity: stockData,
          totalInvested: 0
        }
      } else {
        normalized[ticker] = {
          quantity: stockData.quantity || 0,
          totalInvested: stockData.totalInvested || 0
        }
      }
    })
    
    return normalized
  }

  const setBrokers = (brokerList = []) => {
    brokers.value = Array.isArray(brokerList)
      ? brokerList.map((broker) => normalizeBroker(broker))
      : []

    if (pendingBrokerName.value) {
      const normalized = pendingBrokerName.value.toLowerCase()
      const createdBroker = brokers.value.find(
        (broker) => broker.name.toLowerCase() === normalized
      )

      if (createdBroker) {
        currentBroker.value = normalizeBroker(createdBroker)
        pendingBrokerName.value = ''
        return
      }
    }

    if (currentBroker.value) {
      const updated = brokers.value.find((broker) => broker.id === currentBroker.value.id)
      if (updated) {
        currentBroker.value = normalizeBroker({
          ...updated,
          stocks: currentBroker.value.stocks
        })
      }
    }
  }

  const login = async (brokerName) => {
    const name = brokerName?.trim()
    if (!name) return false

    const existing = brokers.value.find(
      (broker) => broker.name.toLowerCase() === name.toLowerCase()
    )

    if (existing) {
      currentBroker.value = normalizeBroker(existing)
      pendingBrokerName.value = ''
      return true
    }

    pendingBrokerName.value = name
    currentBroker.value = {
      id: `local-${Date.now()}`,
      name,
      initialBalance: DEFAULT_BALANCE,
      currentBalance: DEFAULT_BALANCE,
      createdAt: new Date().toISOString(),
      stocks: {},
    }

    websocketService.addBroker(name, DEFAULT_BALANCE)
    return true
  }

  const logout = () => {
    currentBroker.value = null
    pendingBrokerName.value = ''
  }

  const updateBalance = (amount) => {
    if (currentBroker.value) {
      currentBroker.value.currentBalance += amount
    }
  }

  const ensureStockBag = (ticker) => {
    if (!currentBroker.value.stocks) {
      currentBroker.value.stocks = {}
    }
    if (!currentBroker.value.stocks[ticker]) {
      currentBroker.value.stocks[ticker] = {
        quantity: 0,
        totalInvested: 0
      }
    }
  }

  const buyStock = (ticker, quantity, price) => {
    if (!currentBroker.value || !quantity || !price) return false
    const totalCost = quantity * price

    if (currentBroker.value.currentBalance < totalCost) {
      return false
    }

    ensureStockBag(ticker)
    currentBroker.value.currentBalance -= totalCost
    currentBroker.value.stocks[ticker].quantity += quantity
    currentBroker.value.stocks[ticker].totalInvested += totalCost

    websocketService.buyStock({
      ticker,
      quantity,
      brokerId: currentBroker.value.id,
    })

    return true
  }

  const sellStock = (ticker, quantity, price) => {
    if (!currentBroker.value || !price) return false
    ensureStockBag(ticker)

    const currentHolding = currentBroker.value.stocks[ticker]
    if (!currentHolding || currentHolding.quantity < quantity) {
      return false
    }

    const revenue = quantity * price
    const averagePrice = currentHolding.totalInvested / currentHolding.quantity
    const soldInvestment = averagePrice * quantity

    currentBroker.value.stocks[ticker].quantity -= quantity
    currentBroker.value.stocks[ticker].totalInvested -= soldInvestment
    currentBroker.value.currentBalance += revenue

    if (currentBroker.value.stocks[ticker].quantity === 0) {
      delete currentBroker.value.stocks[ticker]
    }

    websocketService.sellStock({
      ticker,
      quantity,
      brokerId: currentBroker.value.id,
    })

    return true
  }

  const getStockProfit = (ticker, currentPrice) => {
    if (!currentBroker.value?.stocks?.[ticker] || !currentPrice) return 0
    
    const stock = currentBroker.value.stocks[ticker]
    const currentValue = stock.quantity * currentPrice
    return currentValue - stock.totalInvested
  }

  const getStockQuantity = (ticker) => {
    return currentBroker.value?.stocks?.[ticker]?.quantity || 0
  }

  return {
    brokers,
    currentBroker,
    setBrokers,
    login,
    logout,
    updateBalance,
    buyStock,
    sellStock,
    getStockProfit,
    getStockQuantity
  }
})