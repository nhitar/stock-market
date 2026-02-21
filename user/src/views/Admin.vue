<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1>Панель администратора</h1>
      <button @click="goToTrading" class="back-btn">← Назад к торгам</button>
    </header>

    <main class="admin-content">
      <section class="brokers-section">
        <h2>Участники торгов</h2>
        <div class="brokers-list">
          <div 
            v-for="broker in brokerStore.brokers" 
            :key="broker.id" 
            class="broker-card"
          >
            <div class="broker-header">
              <h3>{{ broker.name }}</h3>
              <span class="broker-id">ID: {{ broker.id }}</span>
            </div>
            
            <div class="broker-finance">
              <div class="balance-info">
                <p>Начальный баланс: <strong>{{ formatCurrency(broker.initialBalance) }}</strong></p>
                <p>Текущий баланс: <strong>{{ formatCurrency(broker.currentBalance) }}</strong></p>
                <p>Общая стоимость портфеля: <strong>{{ formatCurrency(getBrokerPortfolioValue(broker)) }}</strong></p>
                <p class="total-profit" :class="getTotalProfitLoss(broker) >= 0 ? 'positive' : 'negative'">
                  Общая прибыль/убыток: 
                  <strong>{{ getTotalProfitLoss(broker) >= 0 ? '+' : '' }}{{ formatCurrency(getTotalProfitLoss(broker)) }}</strong>
                  ({{ getTotalProfitLossPercent(broker) >= 0 ? '+' : '' }}{{ getTotalProfitLossPercent(broker).toFixed(2) }}%)
                </p>
              </div>
            </div>

            <div class="broker-stocks" v-if="Object.keys(broker.stocks || {}).length > 0">
              <h4>Портфель акций:</h4>
              <div class="stocks-grid">
                <div 
                  v-for="(holding, ticker) in broker.stocks" 
                  :key="ticker" 
                  class="stock-item"
                >
                  <div class="stock-header">
                    <span class="ticker">{{ ticker }}</span>
                    <span class="company">{{ getStockCompanyName(ticker) }}</span>
                  </div>
                  <div class="stock-details">
                    <div class="quantity">Количество: {{ holding.quantity }} шт.</div>
                    <div class="avg-price">Средняя цена: {{ formatCurrency(holding.averagePrice || 0) }}</div>
                    <div class="invested">Инвестировано: {{ formatCurrency(holding.totalInvested || 0) }}</div>
                    <div class="current-value">
                      Текущая стоимость: {{ formatCurrency(getStockCurrentValue(ticker, holding.quantity)) }}
                    </div>
                    <div 
                      class="profit-loss" 
                      :class="getStockProfitLoss(ticker, holding) >= 0 ? 'positive' : 'negative'"
                    >
                      Прибыль/убыток: 
                      {{ getStockProfitLoss(ticker, holding) >= 0 ? '+' : '' }}{{ formatCurrency(getStockProfitLoss(ticker, holding)) }}
                      ({{ getStockProfitLossPercent(ticker, holding) >= 0 ? '+' : '' }}{{ getStockProfitLossPercent(ticker, holding).toFixed(2) }}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="no-stocks">
              <p>У участника нет акций</p>
            </div>
          </div>
        </div>
      </section>

      <section class="market-section">
        <h2>Рыночные данные</h2>
        <div class="market-prices">
          <div 
            v-for="stock in stocksStore.availableStocks" 
            :key="stock.ticker" 
            class="market-stock"
          >
            <div class="stock-info">
              <span class="ticker">{{ stock.ticker }}</span>
              <span class="company">{{ stock.companyName }}</span>
              <span class="price">{{ formatCurrency(stock.currentPrice) }}</span>
              <span class="status" :class="stock.isActive ? 'active' : 'inactive'">
                {{ stock.isActive ? 'Активна' : 'Неактивна' }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBrokerStore } from '@/stores/brokers'
import { useStocksStore } from '@/stores/stocks'
import { websocketService } from '@/services/websocket'

const router = useRouter()
const brokerStore = useBrokerStore()
const stocksStore = useStocksStore()

const goToTrading = () => {
  router.push('/trading')
}

const getStockCompanyName = (ticker) => {
  const stock = stocksStore.availableStocks.find(s => s.ticker === ticker)
  return stock?.companyName || 'N/A'
}

const getStockCurrentPrice = (ticker) => {
  return stocksStore.getStockPrice(ticker)
}

const getStockCurrentValue = (ticker, quantity) => {
  return getStockCurrentPrice(ticker) * quantity
}

const getStockProfitLoss = (ticker, holding) => {
  const currentValue = getStockCurrentValue(ticker, holding.quantity)
  const invested = holding.totalInvested || 0
  return currentValue - invested
}

const getStockProfitLossPercent = (ticker, holding) => {
  const invested = holding.totalInvested || 0
  if (invested === 0) return 0
  return (getStockProfitLoss(ticker, holding) / invested) * 100
}

const getBrokerPortfolioValue = (broker) => {
  let total = broker.currentBalance || 0
  Object.entries(broker.stocks || {}).forEach(([ticker, holding]) => {
    total += getStockCurrentValue(ticker, holding.quantity)
  })
  return total
}

const getTotalProfitLoss = (broker) => {
  const portfolioValue = getBrokerPortfolioValue(broker)
  const initialBalance = broker.initialBalance || 0
  return portfolioValue - initialBalance
}

const getTotalProfitLossPercent = (broker) => {
  const initialBalance = broker.initialBalance || 0
  if (initialBalance === 0) return 0
  return (getTotalProfitLoss(broker) / initialBalance) * 100
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0)
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #1a1a1a;
  color: #fff;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  position: sticky;
  top: 0;
  z-index: 100;
}

.admin-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #5a6268;
}

.admin-content {
  padding: 2rem;
}

.brokers-section,
.market-section {
  margin-bottom: 3rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.brokers-section h2,
.market-section h2 {
  margin-bottom: 1.5rem;
  color: #fff;
}

.brokers-list {
  display: grid;
  gap: 1.5rem;
}

.broker-card {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 1.5rem;
}

.broker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #404040;
}

.broker-header h3 {
  margin: 0;
  color: #fff;
}

.broker-id {
  color: #888;
  font-size: 0.875rem;
}

.broker-finance {
  margin-bottom: 1.5rem;
}

.balance-info p {
  margin: 0.5rem 0;
  color: #ccc;
}

.total-profit.positive {
  color: #4ade80;
}

.total-profit.negative {
  color: #f87171;
}

.broker-stocks h4 {
  margin-bottom: 1rem;
  color: #fff;
}

.stocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.stock-item {
  background: #363636;
  border: 1px solid #404040;
  border-radius: 6px;
  padding: 1rem;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.ticker {
  font-weight: bold;
  color: #fff;
}

.company {
  color: #888;
  font-size: 0.875rem;
}

.stock-details {
  font-size: 0.875rem;
  color: #ccc;
}

.stock-details > div {
  margin: 0.25rem 0;
}

.profit-loss.positive {
  color: #4ade80;
  font-weight: bold;
}

.profit-loss.negative {
  color: #f87171;
  font-weight: bold;
}

.no-stocks {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 1rem;
}

.market-prices {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.market-stock {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 6px;
  padding: 1rem;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status.active {
  color: #4ade80;
  font-weight: bold;
}

.status.inactive {
  color: #f87171;
  font-weight: bold;
}

@media (min-width: 1200px) {
  .admin-content {
    padding: 2rem 3rem;
  }
  
  .stocks-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  .market-prices {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (min-width: 1600px) {
  .admin-content {
    padding: 2rem 4rem;
  }
  
  .stocks-grid {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  }
  
  .market-prices {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .admin-content {
    padding: 1rem;
  }
  
  .stocks-grid {
    grid-template-columns: 1fr;
  }
  
  .market-prices {
    grid-template-columns: 1fr;
  }
  
  .stock-info {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .admin-content {
    padding: 0.5rem;
  }
  
  .broker-card {
    padding: 1rem;
  }
  
  .broker-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>