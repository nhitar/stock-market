<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router'
import { websocketService } from '@/services/websocket'
import { useBrokerStore } from '@/stores/brokers'
import { useStocksStore } from '@/stores/stocks'

const brokerStore = useBrokerStore()
const stocksStore = useStocksStore()

const handleInitialData = (payload = {}) => {
  if (payload.brokers) {
    brokerStore.setBrokers(payload.brokers)
  }

  if (payload.stocks) {
    stocksStore.setStocks(payload.stocks)
  }

  if (payload.currentDate) {
    stocksStore.setCurrentDate(payload.currentDate)
  }

  if (typeof payload.tradingStatus === 'boolean') {
    stocksStore.setTradingState({ isTrading: payload.tradingStatus })
  }
}

const handleBrokersUpdated = (payload) => {
  brokerStore.setBrokers(payload || [])
}

const handleStocksUpdated = (payload) => {
  stocksStore.setStocks(payload || [])
}

const handlePriceUpdate = (payload = {}) => {
  if (payload.prices) {
    stocksStore.updateStockPrices(payload.prices)
  }
  if (payload.date) {
    stocksStore.setCurrentDate(payload.date)
  }
}

const handleExchangeSettingsUpdated = (settings) => {
  if (settings.startDate) {
    stocksStore.setCurrentDate(settings.startDate)
  }
  
  if (settings.speed) {
    stocksStore.setTradingSpeed(settings.speed)
  }
}

const handleTradingStarted = (payload = {}) => {
  stocksStore.setTradingState({
    isTrading: true,
    speed: payload.speed ?? stocksStore.tradingState.speed,
  })

  if (payload.date) {
    stocksStore.setCurrentDate(payload.date)
  }
}

const handleTradingStopped = () => {
  stocksStore.setTradingState({ isTrading: false })
}

onMounted(async () => {
  websocketService.on('initial_data', handleInitialData)
  websocketService.on('brokers_updated', handleBrokersUpdated)
  websocketService.on('stocks_updated', handleStocksUpdated)
  websocketService.on('price_update', handlePriceUpdate)
  websocketService.on('exchange_settings_updated', handleExchangeSettingsUpdated)
  websocketService.on('trading_started', handleTradingStarted)
  websocketService.on('trading_stopped', handleTradingStopped)

  try {
    await websocketService.connect()
  } catch (error) {
    console.error('Failed to establish socket connection', error)
  }
})

onBeforeUnmount(() => {
  websocketService.off('initial_data', handleInitialData)
  websocketService.off('brokers_updated', handleBrokersUpdated)
  websocketService.off('stocks_updated', handleStocksUpdated)
  websocketService.off('price_update', handlePriceUpdate)
  websocketService.on('exchange_settings_updated', handleExchangeSettingsUpdated)
  websocketService.off('trading_started', handleTradingStarted)
  websocketService.off('trading_stopped', handleTradingStopped)
})
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

#app {
  height: 100%;
}
</style>
