import { defineStore } from 'pinia'
import { ref } from 'vue'
import { websocketService } from '@/services/websocket'

export const useStocksStore = defineStore('stocks', () => {
  const availableStocks = ref([])
  const priceHistory = ref({})
  const currentDate = ref('')
  const tradingState = ref({
    isTrading: false,
    speed: 5,
  })

  const setStocks = (stocks = []) => {
    if (!Array.isArray(stocks)) {
      availableStocks.value = []
      return
    }

    availableStocks.value = stocks.map((stock) => ({
      ...stock,
      currentPrice: Number(stock.currentPrice),
    }))

    const newHistory = { ...priceHistory.value }

    stocks.forEach((stock) => {
      if (Array.isArray(stock.prices)) {
        newHistory[stock.ticker] = stock.prices.map((point) => ({
          date: point.date,
          price: point.open ?? point.price ?? stock.currentPrice,
        }))
      }
    })

    priceHistory.value = newHistory
  }

  const setCurrentDate = (dateString) => {
    currentDate.value = dateString || ''
  }

  const setTradingState = (statePatch) => {
    tradingState.value = {
      ...tradingState.value,
      ...statePatch,
    }
  }

  const setTradingSpeed = (speed) => {
    tradingState.value.speed = speed || 5
  }

  const getStockPrice = (ticker) => {
    const stock = availableStocks.value.find((item) => item.ticker === ticker)
    return stock?.currentPrice || 0
  }

  const updateStockPrices = (priceUpdates) => {
    const normalized = Array.isArray(priceUpdates)
      ? priceUpdates.reduce((acc, { ticker, price }) => {
          if (ticker && typeof price === 'number') {
            acc[ticker] = price
          }
          return acc
        }, {})
      : priceUpdates || {}

    availableStocks.value = availableStocks.value.map((stock) => {
      if (normalized[stock.ticker] !== undefined) {
        recordPricePoint(stock.ticker, normalized[stock.ticker])
        return {
          ...stock,
          currentPrice: normalized[stock.ticker],
        }
      }
      return stock
    })
  }

  const recordPricePoint = (ticker, price, date = currentDate.value) => {
    if (!priceHistory.value[ticker]) {
      priceHistory.value[ticker] = []
    }
    const existingIndex = priceHistory.value[ticker].findIndex(point => point.date === date)
    
    if (existingIndex !== -1) {
      priceHistory.value[ticker][existingIndex].price = price
    } else {
      priceHistory.value[ticker].push({
        date: date || new Date().toISOString(),
        price,
      })
    }
  }

  const getStockHistory = (ticker) => priceHistory.value[ticker] || []

  const startTrading = (speed = tradingState.value.speed || 5) => {
    setTradingState({ isTrading: true, speed })
    websocketService.startTrading(speed)
  }

  const stopTrading = () => {
    setTradingState({ isTrading: false })
    websocketService.stopTrading()
  }

  const loadTradingSettings = () => {
    websocketService.sendMessage('get_trading_settings', {})
  }

  return {
    availableStocks,
    priceHistory,
    currentDate,
    tradingState,
    setStocks,
    setCurrentDate,
    setTradingState,
    setTradingSpeed,
    getStockPrice,
    updateStockPrices,
    recordPricePoint,
    getStockHistory,
    startTrading,
    stopTrading,
    loadTradingSettings,
  }
})
