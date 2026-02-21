import { useSelector, useDispatch } from 'react-redux'
import { setStocks, updateStockPrices, toggleStockSelection } from '../store/slices/stocksSlice'
import { websocketService } from '../services/websocketService'
import { useState, useEffect } from 'react'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
import { Line } from 'react-chartjs-2'
import './Stocks.css'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement)

function Stocks() {
  const stocks = useSelector(state => state.stocks.availableStocks)
  const selectedStocks = useSelector(state => state.stocks.selectedStocks)
  const historicalData = useSelector(state => state.stocks.historicalData)
  const dispatch = useDispatch()
  
  const [selectedStock, setSelectedStock] = useState(null)
  const [showChart, setShowChart] = useState(false)

  useEffect(() => {
    const handleStocksUpdated = (updatedStocks) => {
      console.log('Stocks updated from server:', updatedStocks)
      dispatch(setStocks(updatedStocks))
    }

    const handleStocksData = (data) => {
      dispatch(setStocks(data))
    }

    const handlePriceUpdate = (data) => {
      if (data.prices) {
        dispatch(updateStockPrices(data.prices))
      }
    }

    console.log('Subscribing to stocks_updated event')
    websocketService.on('stocks_updated', handleStocksUpdated)
    websocketService.on('stocks_data', handleStocksData)
    websocketService.on('price_update', handlePriceUpdate)

    return () => {
      websocketService.off('stocks_updated', handleStocksUpdated)
      websocketService.off('stocks_data', handleStocksData)
      websocketService.off('price_update', handlePriceUpdate)
    }
  }, [dispatch])

  const handleToggleStock = (ticker) => {
    dispatch(toggleStockSelection(ticker))
    const updatedSelectedStocks = selectedStocks.includes(ticker) 
      ? selectedStocks.filter(t => t !== ticker)
      : [...selectedStocks, ticker]
    
    websocketService.sendMessage('update_stock_selection', {
      selectedStocks: updatedSelectedStocks
    })
  }

  const handleShowChart = (stock) => {
    setSelectedStock(stock)
    setShowChart(true)
  }

  const handleCloseChart = () => {
    setShowChart(false)
    setSelectedStock(null)
  }

  const getChartData = () => {
    if (!selectedStock || !historicalData[selectedStock.ticker]) {
      return null
    }

    const stockData = historicalData[selectedStock.ticker]
    const dates = stockData.map(item => item.date)
    const prices = stockData.map(item => item.open)

    return {
      labels: dates,
      datasets: [
        {
          label: `Цена акций ${selectedStock.ticker}`,
          data: prices,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Исторические данные: ${selectedStock?.companyName}`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Цена ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Дата'
        }
      }
    },
  }

  const chartData = getChartData()

  return (
    <div className="stocks-container">
      <h1>Управление акциями</h1>
      <div className="stocks-grid">
        {stocks.map(stock => (
          <div key={stock.ticker} className={`stock-item ${stock.isActive ? 'stock-item-active' : 'stock-item-inactive'}`}>
            <div className="stock-header">
              <div className="stock-details">
                <h3>{stock.companyName} ({stock.ticker})</h3>
                <p>Текущая цена: <strong>{stock.currentPrice.toFixed(2)} $</strong></p>
                <p className={`status ${stock.isActive ? 'active' : 'inactive'}`}>
                  Статус: {stock.isActive ? '● активно' : '○ неактивно'}
                </p>
                {historicalData[stock.ticker] && (
                  <button 
                    className="show-chart-btn"
                    onClick={() => handleShowChart(stock)}
                  >
                    Показать график
                  </button>
                )}
              </div>
              
              <button 
                onClick={() => handleToggleStock(stock.ticker)}
                className={`toggle-btn ${stock.isActive ? 'toggle-btn-active' : 'toggle-btn-inactive'}`}
              >
                {stock.isActive ? 'Убрать из торгов' : 'Добавить в торги'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="selected-stocks-info">
        <h4>Выбранные для торгов акции:</h4>
        <p>{selectedStocks.join(', ') || 'Нет выбранных акций'}</p>
      </div>

      {showChart && selectedStock && (
        <div className="modal-overlay" onClick={handleCloseChart}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Исторические данные: {selectedStock.companyName} ({selectedStock.ticker})</h2>
              <button className="close-btn" onClick={handleCloseChart}>
                ✕ Закрыть
              </button>
            </div>

            {chartData && (
              <div className="chart-container">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}

            {historicalData[selectedStock.ticker] && (
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Цена открытия ($)</th>
                    <th>Изменение</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData[selectedStock.ticker].map((data, index, array) => {
                    const change = index > 0 
                      ? ((data.open - array[index - 1].open) / array[index - 1].open * 100).toFixed(2)
                      : 0
                    
                    return (
                      <tr key={index}>
                        <td>{data.date}</td>
                        <td>{data.open} $</td>
                        <td style={{ 
                          color: change > 0 ? 'green' : change < 0 ? 'red' : 'black' 
                        }}>
                          {change > 0 ? '+' : ''}{change}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Stocks