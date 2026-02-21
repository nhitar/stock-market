import { useSelector, useDispatch } from 'react-redux'
import { setTradingStatus, setCurrentDate, setTradingSpeed } from '../store/slices/exchangeSlice'
import { updateStockPrices } from '../store/slices/stocksSlice'
import { setExchangeSettings } from '../store/slices/exchangeSlice'
import { websocketService } from '../services/websocketService'
import { useState, useEffect } from 'react'
import './Exchange.css'

function Exchange() {
  const isTrading = useSelector(state => state.exchange.isTrading)
  const currentDate = useSelector(state => state.exchange.currentDate)
  const speed = useSelector(state => state.exchange.speed)
  const stocks = useSelector(state => state.stocks.availableStocks)
  const dispatch = useDispatch()
  
  const [startDate, setStartDate] = useState(currentDate)
  const [tradingSpeed, setTradingSpeedLocal] = useState(speed)

  useEffect(() => {
    const handleTradingStarted = (data) => {
      dispatch(setTradingStatus(true))
      if (data.date) {
        dispatch(setCurrentDate(data.date))
      }
    }

    const handleTradingStopped = () => {
      dispatch(setTradingStatus(false))
    }

    const handlePriceUpdate = (data) => {
      if (data.prices) {
        dispatch(updateStockPrices(data.prices))
      }
      if (data.date) {
        dispatch(setCurrentDate(data.date))
      }
    }

    const handleExchangeSettingsUpdated = (settings) => {
      dispatch(setExchangeSettings(settings))
    }

    websocketService.on('trading_started', handleTradingStarted)
    websocketService.on('trading_stopped', handleTradingStopped)
    websocketService.on('price_update', handlePriceUpdate)
    websocketService.on('exchange_settings_updated', handleExchangeSettingsUpdated)

    return () => {
      websocketService.off('trading_started', handleTradingStarted)
      websocketService.off('trading_stopped', handleTradingStopped)
      websocketService.off('price_update', handlePriceUpdate)
      websocketService.off('exchange_settings_updated', handleExchangeSettingsUpdated)
    }
  }, [dispatch])

  const handleUpdateSettings = () => {
    websocketService.sendMessage('update_exchange_settings', {
      startDate: startDate,
      speed: tradingSpeed
    })
    dispatch(setTradingSpeed(tradingSpeed))
  }

  const handleStartTrading = () => {
    websocketService.startTrading(tradingSpeed)
  }

  const handleStopTrading = () => {
    websocketService.stopTrading()
  }

  return (
    <div className="exchange-container">
      <h1>Настройки биржи</h1>

      <div className="settings-section">
        <h3>Настройки торгов</h3>
        
        <div className="setting-field">
          <label>Дата начала: </label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
        </div>
        
        <div className="setting-field">
          <label>Скорость (секунд на день): </label>
          <input 
            type="number" 
            value={tradingSpeed}
            onChange={(e) => setTradingSpeedLocal(Number(e.target.value))}
            min="1"
            max="60"
            className="number-input"
          />
        </div>
        
        <button className="save-settings-btn" onClick={handleUpdateSettings}>
          Сохранить настройки
        </button>
      </div>

      <div className="trading-section">
        <h3>Управление торгами</h3>
        
        <div className="status-info">
          Статус: <strong>{isTrading ? '🟢 Торги идут' : '🔴 Торги остановлены'}</strong>
        </div>
        
        <div className="status-info">
          Текущая дата: <strong>{currentDate}</strong>
        </div>

        <div className="status-info">
          Скорость: <strong>{speed} сек/день</strong>
        </div>
        
        {!isTrading ? (
          <button 
            onClick={handleStartTrading}
            className="start-trading-btn"
          >
            Начать торги
          </button>
        ) : (
          <button 
            onClick={handleStopTrading}
            className="stop-trading-btn"
          >
            Остановить торги
          </button>
        )}
      </div>

      <div className="prices-section">
        <h3>Текущие цены акций</h3>
        <div className="prices-grid">
          {stocks.filter(stock => stock.isActive).map(stock => (
            <div key={stock.ticker} className="price-item">
              <span>{stock.ticker}:</span>
              <span><strong>{stock.currentPrice.toFixed(2)} $</strong></span>
            </div>
          ))}
        </div>
        
        {stocks.filter(stock => stock.isActive).length === 0 && (
          <p>Нет активных акций для торгов</p>
        )}
      </div>
    </div>
  )
}

export default Exchange