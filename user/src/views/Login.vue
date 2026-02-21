<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Вход в систему трейдера</h1>
      <p class="connection-status">{{ connectionStatus }}</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="brokerName">Имя трейдера:</label>
          <input
            id="brokerName"
            v-model="brokerName"
            type="text"
            placeholder="Введите ваше имя"
            required
            class="input-field"
          />
        </div>

        <button 
          type="submit" 
          :disabled="!brokerName.trim()"
          class="login-btn"
        >
          Войти в систему
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="availableBrokers.length" class="brokers-section">
        <h3>Существующие трейдеры:</h3>
        <div class="brokers-list">
          <div 
            v-for="broker in availableBrokers" 
            :key="broker.id" 
            class="broker-item"
            @click="selectBroker(broker)"
          >
            <div class="broker-info">
              <span class="broker-name">{{ broker.name }}</span>
              <span class="broker-balance">Баланс: {{ formatCurrency(broker.currentBalance) }}</span>
            </div>
            <div v-if="Object.keys(broker.stocks || {}).length > 0" class="broker-stocks">
              <span class="stocks-label">Акции:</span>
              <span 
                v-for="(stockData, ticker) in broker.stocks" 
                :key="ticker"
                class="stock-tag"
              >
                {{ ticker }}: {{ stockData.quantity }} шт.
              </span>
            </div>
            <div v-else class="no-stocks">
              Нет акций
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBrokerStore } from '@/stores/brokers'
import { websocketService } from '@/services/websocket'

const brokerName = ref('')
const error = ref('')
const router = useRouter()
const brokerStore = useBrokerStore()

const availableBrokers = computed(() => brokerStore.brokers || [])
const connectionStatus = computed(() =>
  websocketService.isConnected.value ? '🟢 Сервер доступен' : '🔴 Нет подключения'
)

// onMounted(() => {
//   websocketService.sendMessage('get_brokers', {})
// })

const handleLogin = async () => {
  try {
    error.value = ''
    
    const success = await brokerStore.login(brokerName.value)
    
    if (success) {
      router.push('/trading')
    } else {
      error.value = 'Ошибка входа. Попробуйте снова.'
    }
  } catch (err) {
    error.value = 'Произошла ошибка при входе'
    console.error('Login error:', err)
  }
}

const selectBroker = (broker) => {
  brokerName.value = broker.name
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0)
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
  background: #1a1a1a;
}

.login-card {
  background: #2d2d2d;
  padding: 2rem;
  border-radius: 10px;
  border: 1px solid #404040;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  width: 100%;
  max-width: 500px;
}

.login-card h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #fff;
  font-size: 1.5rem;
}

.connection-status {
  text-align: center;
  margin-bottom: 1.5rem;
  font-weight: 500;
  font-size: 0.9rem;
  color: #ccc;
}

.login-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #ccc;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  background: #363636;
  border: 1px solid #404040;
  border-radius: 5px;
  font-size: 1rem;
  color: #fff;
  transition: border-color 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
}

.input-field::placeholder {
  color: #888;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.login-btn:hover:not(:disabled) {
  background: #5a6fd8;
}

.login-btn:disabled {
  background: #404040;
  color: #888;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #362626;
  border: 1px solid #5c3a3a;
  border-radius: 5px;
  color: #f87171;
  text-align: center;
}

.brokers-section {
  margin-top: 2rem;
  border-top: 1px solid #404040;
  padding-top: 1.5rem;
}

.brokers-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #ccc;
  text-align: center;
}

.brokers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.broker-item {
  padding: 1rem;
  background: #363636;
  border: 1px solid #404040;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.broker-item:hover {
  background: #404040;
  border-color: #667eea;
  transform: translateY(-1px);
}

.broker-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.broker-name {
  font-weight: 600;
  color: #fff;
}

.broker-balance {
  font-size: 0.9rem;
  color: #ccc;
}

.broker-stocks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.stocks-label {
  font-size: 0.8rem;
  color: #888;
  margin-right: 0.5rem;
}

.stock-tag {
  background: #2d3748;
  color: #90cdf4;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #4a5568;
}

.no-stocks {
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}

@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-card {
    padding: 1.5rem;
  }
  
  .broker-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1rem;
  }
  
  .broker-stocks {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stocks-label {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}
</style>