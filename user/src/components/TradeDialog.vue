<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <h3>{{ tradeType === 'buy' ? 'Покупка' : 'Продажа' }} акций {{ stockTicker }}</h3>
      
      <div class="dialog-content">
        <p>Текущая цена: <strong>{{ formatCurrency(currentPrice) }}</strong></p>
        
        <div class="form-group">
          <label for="quantity">Количество:</label>
          <input
            id="quantity"
            v-model.number="quantity"
            type="number"
            :min="1"
            :max="maxQuantity"
            class="input-field"
          />
          <span class="hint">Макс: {{ maxQuantity }}</span>
        </div>
        
        <div class="summary">
          <p>Общая стоимость: <strong>{{ formatCurrency(totalCost) }}</strong></p>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="handleConfirm" class="btn confirm-btn" :disabled="!isValid">
          Подтвердить
        </button>
        <button @click="$emit('cancel')" class="btn cancel-btn">
          Отмена
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBrokerStore } from '@/stores/brokers'
import { websocketService } from '@/services/websocket'

const props = defineProps({
  stockTicker: String,
  tradeType: String,
  currentPrice: Number,
  maxQuantity: Number
})

const emit = defineEmits(['confirm', 'cancel'])

const brokerStore = useBrokerStore()
const quantity = ref(1)

const totalCost = computed(() => {
  return quantity.value * props.currentPrice
})

const isValid = computed(() => {
  return quantity.value > 0 && quantity.value <= props.maxQuantity
})

const handleConfirm = () => {
  const brokerId = brokerStore.currentBroker?.id
  
  if (props.tradeType === 'buy') {
    websocketService.buyStock({
      ticker: props.stockTicker,
      quantity: quantity.value,
      brokerId: brokerId
    })
  } else {
    websocketService.sellStock({
      ticker: props.stockTicker,
      quantity: quantity.value,
      brokerId: brokerId
    })
  }
  
  emit('confirm', {
    ticker: props.stockTicker,
    quantity: quantity.value,
    type: props.tradeType,
    totalCost: totalCost.value
  })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0)
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog {
  background: #2d2d2d;
  padding: 2rem;
  border-radius: 10px;
  min-width: 400px;
  border: 1px solid #404040;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.dialog h3 {
  color: #fff;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  text-align: center;
}

.dialog-content p {
  color: #ccc;
  margin-bottom: 1rem;
}

.form-group {
  margin: 1.5rem 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #ccc;
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  background: #363636;
  border: 1px solid #404040;
  border-radius: 5px;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.input-field::placeholder {
  color: #888;
}

.hint {
  font-size: 0.8rem;
  color: #888;
  margin-left: 0.5rem;
  display: block;
  margin-top: 0.5rem;
}

.summary {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #363636;
  border-radius: 5px;
  border-left: 4px solid #667eea;
}

.summary p {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.cancel-btn {
  background: #dc2626;
  color: white;
}

.cancel-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.confirm-btn {
  background: #15803d;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #166534;
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  background: #404040;
  color: #888;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 480px) {
  .dialog {
    min-width: unset;
    width: 90vw;
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>