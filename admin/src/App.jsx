import './App.css'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Routes, Route, Navigate } from 'react-router-dom'
import { setBrokers } from './store/slices/brokersSlice'
import { setStocks } from './store/slices/stocksSlice'
import { setTradingStatus, setCurrentDate, setExchangeSettings } from './store/slices/exchangeSlice'
import Brokers from './pages/Brokers'
import Exchange from './pages/Exchange'
import Stocks from './pages/Stocks'
import Navigation from './components/Navigation.jsx'
import { websocketService } from './services/websocketService'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    websocketService.connect()

    const handleInitialData = (data) => {
      if (data.brokers) dispatch(setBrokers(data.brokers))
      if (data.stocks) dispatch(setStocks(data.stocks))
      if (data.tradingStatus) dispatch(setTradingStatus(data.tradingStatus))
      if (data.currentDate) dispatch(setCurrentDate(data.currentDate))
      if (data.exchangeSettings) dispatch(setExchangeSettings(data.exchangeSettings))
    }

    websocketService.on('initial_data', handleInitialData)

    return () => {
      websocketService.off('initial_data', handleInitialData)
    }
  }, [dispatch])

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/brokers" replace />} />
        <Route path="/brokers" element={<Brokers />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/exchange" element={<Exchange />} />
      </Routes>
    </>
  )
}

export default App