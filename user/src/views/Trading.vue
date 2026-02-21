<template>
  <div class="trading-container">
    <header class="trading-header">
      <h1>Торговая площадка</h1>
      <div class="broker-info">
        <span class="broker-name">Трейдер: {{ brokerStore.currentBroker?.name }}</span>
        <span class="connection-status" :class="websocketService.isConnected.value ? 'connected' : 'disconnected'">
          {{ connectionStatus }}
        </span>
        <div class="trading-controls">
          <button 
            @click="startTrading" 
            :disabled="!websocketService.isConnected.value || stocksStore.tradingState.isTrading"
            class="control-btn start-btn"
          >
            Старт торгов
          </button>
          <button 
            @click="stopTrading" 
            :disabled="!websocketService.isConnected.value || !stocksStore.tradingState.isTrading"
            class="control-btn stop-btn"
          >
            Стоп торгов
          </button>
        </div>
        <button @click="goToAdmin" class="admin-btn">Админ-панель</button>
        <button @click="handleLogout" class="logout-btn">Выйти</button>
      </div>
    </header>

    <div class="trading-content">
      <div class="info-panel">
        <div class="info-card">
          <h3>Текущая дата</h3>
          <p class="current-date">{{ stocksStore.currentDate || currentDate }}</p>
        </div>

        <div class="info-card">
          <h3>Финансы</h3>
          <p>Денежные средства: <strong>{{ formatCurrency(brokerStore.currentBroker?.currentBalance) }}</strong></p>
          <p>Общая стоимость: <strong>{{ formatCurrency(totalPortfolioValue) }}</strong></p>
        </div>

        <div class="info-card">
          <h3>Мои акции</h3>
          <div v-if="Object.keys(brokerStore.currentBroker?.stocks || {}).length === 0" class="empty-state">
            Нет купленных акций
          </div>
          <div v-else class="stocks-list">
            <div v-for="(data, ticker) in brokerStore.currentBroker?.stocks" :key="ticker" class="stock-item">
              <span class="ticker">{{ ticker }}</span>
              <span class="quantity">{{ data.quantity }} шт.</span>
              <span class="invested">{{ formatCurrency(data.totalInvested) }}</span>
              <span class="profit" :class="getStockProfit(ticker) >= 0 ? 'positive' : 'negative'">
                {{ getStockProfit(ticker) >= 0 ? '+' : '' }}{{ formatCurrency(getStockProfit(ticker)) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="trading-panel">
        <div class="prices-card">
          <h3>Рыночные цены</h3>
          <div class="prices-list">
            <div v-for="stock in stocksStore.availableStocks" :key="stock.ticker" class="price-item">
              <div class="stock-info">
                <span class="ticker">{{ stock.ticker }}</span>
                <span class="company">{{ stock.companyName }}</span>
                <span class="status" :class="stock.isActive ? 'active' : 'inactive'">
                  {{ stock.isActive ? '● Активна' : '○ Неактивна' }}
                </span>
              </div>
              <div class="price-actions">
                <span class="price">{{ formatCurrency(stock.currentPrice) }}</span>
                <button 
                  @click="openTradeDialog(stock.ticker, 'buy')" 
                  class="trade-btn buy-btn"
                  :disabled="!websocketService.isConnected.value || !stock.isActive || !stocksStore.tradingState.isTrading || !canBuy(stock)"
                >
                  Купить
                </button>
                <button 
                  @click="openTradeDialog(stock.ticker, 'sell')" 
                  class="trade-btn sell-btn"
                  :disabled="!websocketService.isConnected.value || !hasStock(stock.ticker) || !stock.isActive || !stocksStore.tradingState.isTrading"
                >
                  Продать
                </button>
                <button 
                  @click="openChart(stock)" 
                  class="chart-btn"
                >
                  График
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TradeDialog
      v-if="showTradeDialog"
      :stockTicker="selectedStock"
      :tradeType="tradeType"
      :currentPrice="getCurrentPrice(selectedStock)"
      :maxQuantity="getMaxQuantity(selectedStock, tradeType)"
      @confirm="closeTradeDialog"
      @cancel="closeTradeDialog"
    />

    <StockChart
      v-if="showChart"
      :stock="selectedStockForChart"
      :priceHistory="stocksStore.getStockHistory(selectedStockForChart?.ticker)"
      @close="closeChart"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBrokerStore } from '@/stores/brokers'
import { useStocksStore } from '@/stores/stocks'
import { websocketService } from '@/services/websocket'
import TradeDialog from '@/components/TradeDialog.vue'
import StockChart from '@/components/StockChart.vue'

const router = useRouter()
const brokerStore = useBrokerStore()
const stocksStore = useStocksStore()

const currentDate = ref(new Date().toISOString().split('T')[0])
const showTradeDialog = ref(false)
const showChart = ref(false)
const selectedStock = ref('')
const tradeType = ref('buy')
const selectedStockForChart = ref(null)

if (!brokerStore.currentBroker) {
  router.push('/login')
}

const goToAdmin = () => {
  router.push('/admin');
};

onMounted(() => {
  stocksStore.loadTradingSettings()
})

const totalPortfolioValue = computed(() => {
  const broker = brokerStore.currentBroker
  if (!broker) return 0
  
  let total = broker.currentBalance || 0
  Object.entries(broker.stocks || {}).forEach(([ticker, data]) => {
    const price = stocksStore.getStockPrice(ticker)
    total += price * data.quantity
  })
  return total
})

const connectionStatus = computed(() => {
  return websocketService.isConnected.value ? 'Подключено' : 'Отключено'
})

const handleLogout = () => {
  brokerStore.logout()
  router.push('/login')
}

const startTrading = () => {
  stocksStore.startTrading()
}

const stopTrading = () => {
  stocksStore.stopTrading()
}

const openTradeDialog = (ticker, type) => {
  selectedStock.value = ticker
  tradeType.value = type
  showTradeDialog.value = true
}

const closeTradeDialog = () => {
  showTradeDialog.value = false
  selectedStock.value = ''
}

const openChart = (stock) => {
  selectedStockForChart.value = stock
  showChart.value = true
}

const closeChart = () => {
  showChart.value = false
  selectedStockForChart.value = null
}

const canBuy = (stock) => {
  return brokerStore.currentBroker?.currentBalance >= stock.currentPrice;
}

const hasStock = (ticker) => {
  return brokerStore.currentBroker?.stocks?.[ticker]?.quantity > 0
}

const getCurrentPrice = (ticker) => {
  return stocksStore.getStockPrice(ticker)
}

const getMaxQuantity = (ticker, type) => {
  if (type === 'buy') {
    const price = getCurrentPrice(ticker)
    return price > 0 ? Math.floor((brokerStore.currentBroker?.currentBalance || 0) / price) : 0
  } else {
    return brokerStore.currentBroker?.stocks?.[ticker]?.quantity || 0
  }
}

const getStockProfit = (ticker) => {
  const data = brokerStore.currentBroker?.stocks?.[ticker]
  if (!data) return 0
  
  const currentPrice = stocksStore.getStockPrice(ticker)
  const currentValue = data.quantity * currentPrice
  return currentValue - data.totalInvested
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0)
}
</script>

<style scoped>
.trading-container {
  min-height: 100vh;
  background: #1a1a1a;
  color: #fff;
}

.trading-header {
  background: #2d2d2d;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #404040;
  position: sticky;
  top: 0;
  z-index: 100;
}

.trading-header h1 {
  color: #fff;
  margin: 0;
  font-size: 1.5rem;
}

.broker-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.broker-name {
  color: #ccc;
}

.connection-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.connection-status.connected {
  background: #1a3a1a;
  color: #4ade80;
}

.connection-status.disconnected {
  background: #3a1a1a;
  color: #f87171;
}

.trading-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn {
  background: #15803d;
  color: white;
}

.start-btn:not(:disabled):hover {
  background: #166534;
}

.stop-btn {
  background: #dc2626;
  color: white;
}

.stop-btn:not(:disabled):hover {
  background: #b91c1c;
}

.admin-btn {
  background: #ea580c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;
}

.admin-btn:hover {
  background: #c2410c;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #b91c1c;
}

.trading-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: #2d2d2d;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #404040;
}

.info-card h3 {
  margin: 0 0 1rem 0;
  color: #fff;
  font-size: 1.1rem;
}

.current-date {
  font-size: 1.2rem;
  font-weight: bold;
  color: #60a5fa;
}

.empty-state {
  color: #888;
  text-align: center;
  padding: 1rem;
  font-style: italic;
}

.stocks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stock-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  background: #363636;
  border-radius: 6px;
  border: 1px solid #404040;
}

.ticker {
  font-weight: bold;
  color: #fff;
}

.quantity, .invested {
  color: #ccc;
  font-size: 0.875rem;
}

.profit.positive {
  color: #4ade80;
  font-weight: bold;
}

.profit.negative {
  color: #f87171;
  font-weight: bold;
}

.prices-card {
  background: #2d2d2d;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #404040;
}

.prices-card h3 {
  margin: 0 0 1.5rem 0;
  color: #fff;
  font-size: 1.1rem;
}

.prices-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #363636;
  border-radius: 8px;
  border: 1px solid #404040;
  transition: border-color 0.2s;
}

.price-item:hover {
  border-color: #555;
}

.stock-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;
}

.ticker {
  font-weight: bold;
  font-size: 1.1rem;
  color: #fff;
}

.company {
  color: #ccc;
  font-size: 0.875rem;
}

.status {
  font-size: 0.75rem;
  font-weight: 500;
}

.status.active {
  color: #4ade80;
}

.status.inactive {
  color: #f87171;
}

.price-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.price {
  font-weight: bold;
  font-size: 1.1rem;
  color: #fff;
  min-width: 100px;
  text-align: right;
}

.trade-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.trade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.buy-btn {
  background: #15803d;
  color: white;
}

.buy-btn:not(:disabled):hover {
  background: #166534;
}

.sell-btn {
  background: #dc2626;
  color: white;
}

.sell-btn:not(:disabled):hover {
  background: #b91c1c;
}

.chart-btn {
  padding: 0.5rem;
  background: #1d4ed8;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;
}

.chart-btn:hover {
  background: #1e40af;
}

@media (max-width: 1024px) {
  .trading-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .trading-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .broker-info {
    justify-content: center;
    text-align: center;
  }
  
  .price-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .price-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .stock-item {
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .trading-content {
    padding: 1rem;
  }
  
  .price-actions {
    flex-wrap: wrap;
  }
  
  .trade-btn, .chart-btn {
    flex: 1;
    min-width: 80px;
  }
}
</style>