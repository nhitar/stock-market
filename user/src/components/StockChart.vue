<template>
  <div class="chart-overlay" @click="$emit('close')">
    <div class="chart-content" @click.stop>
      <div class="chart-header">
        <div>
          <p class="chart-title">{{ stock.companyName }}</p>
          <p class="chart-subtitle">{{ stock.ticker }}</p>
        </div>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="chart-container" v-if="chartData">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <div class="chart-body">
        <table v-if="historyWithChange.length" class="history-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Цена</th>
              <th>Изменение</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(point, index) in historyWithChange" :key="`${point.date}-${index}`">
              <td>{{ point.date }}</td>
              <td>{{ formatCurrency(point.price) }}</td>
              <td :class="{ positive: point.change > 0, negative: point.change < 0 }">
                <span v-if="point.change > 0">+{{ point.change.toFixed(2) }}%</span>
                <span v-else-if="point.change < 0">{{ point.change.toFixed(2) }}%</span>
                <span v-else>0%</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-else class="history-empty">Исторические данные отсутствуют</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'vue-chartjs'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps({
  stock: {
    type: Object,
    required: true,
  },
  priceHistory: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['close'])

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const historyWithChange = computed(() => {
  return props.priceHistory.map((point, index, array) => {
    const prev = array[index - 1]
    const change = prev ? ((point.price - prev.price) / prev.price) * 100 : 0
    return {
      ...point,
      change,
    }
  })
})

const chartData = computed(() => {
  if (!props.priceHistory.length) return null

  const dates = props.priceHistory.map(item => item.date)
  const prices = props.priceHistory.map(item => item.price)

  return {
    labels: dates,
    datasets: [
      {
        label: `Цена ($)`,
        data: prices,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#fff',
        font: {
          size: 12
        }
      }
    },
    title: {
      display: true,
      text: `История цен`,
      color: '#fff',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgb(75, 192, 192)',
      borderWidth: 1,
      callbacks: {
        label: function(context) {
          return `Цена: $${context.parsed.y.toFixed(2)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Цена ($)',
        color: '#fff',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      ticks: {
        color: '#ccc',
        font: {
          size: 11
        },
        callback: function(value) {
          return '$' + value.toFixed(2)
        }
      },
      grid: {
        color: '#404040',
        drawBorder: true
      }
    },
    x: {
      title: {
        display: true,
        text: 'Дата',
        color: '#fff',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      ticks: {
        color: '#ccc',
        font: {
          size: 11
        },
        maxRotation: 45,
        minRotation: 45
      },
      grid: {
        color: '#404040',
        drawBorder: true
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
  elements: {
    line: {
      tension: 0.4
    }
  }
}

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
</script>

<style scoped>
.chart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  backdrop-filter: blur(2px);
  overflow-y: auto;
  padding: 20px 0;
}

.chart-content {
  background: #2d2d2d;
  border-radius: 12px;
  width: min(900px, 95vw);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  border: 1px solid #404040;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  margin: 20px auto;
  min-height: auto;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #404040;
  flex-shrink: 0;
}

.chart-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
}

.chart-subtitle {
  margin: 0;
  color: #ccc;
  font-size: 0.9rem;
}

.close-btn {
  background: #404040;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1rem;
  cursor: pointer;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #555;
  color: #fff;
}

.chart-container {
  height: 400px;
  min-height: 400px;
  margin-bottom: 1.5rem;
  background: #363636;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #404040;
  flex-shrink: 0;
}

.chart-body {
  flex: 1;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #404040;
  border-radius: 8px;
}

.history-table th,
.history-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #404040;
}

.history-table th {
  font-size: 0.85rem;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #363636;
  font-weight: 600;
}

.history-table td {
  color: #fff;
  background: #2d2d2d;
}

.history-table tr:last-child td {
  border-bottom: none;
}

.history-table tr:hover td {
  background: #363636;
}

.positive {
  color: #4ade80 !important;
  font-weight: 600;
}

.negative {
  color: #f87171 !important;
  font-weight: 600;
}

.history-empty {
  text-align: center;
  color: #888;
  margin-top: 2rem;
  font-style: italic;
  padding: 2rem;
}

.chart-overlay::-webkit-scrollbar {
  width: 8px;
}

.chart-overlay::-webkit-scrollbar-track {
  background: transparent;
}

.chart-overlay::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.chart-overlay::-webkit-scrollbar-thumb:hover {
  background: #666;
}

@media (max-width: 768px) {
  .chart-content {
    width: 95vw;
    padding: 1rem;
    margin: 10px auto;
  }
  
  .chart-container {
    height: 300px;
    min-height: 300px;
    padding: 0.5rem;
  }
  
  .history-table {
    font-size: 0.875rem;
  }
  
  .history-table th,
  .history-table td {
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .chart-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .chart-container {
    height: 250px;
    min-height: 250px;
  }
  
  .chart-overlay {
    padding: 10px 0;
  }
}
</style>