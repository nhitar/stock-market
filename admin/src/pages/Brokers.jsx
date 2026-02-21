import { useSelector, useDispatch } from 'react-redux'
import { setBrokers } from '../store/slices/brokersSlice'
import { websocketService } from '../services/websocketService'
import { useState, useEffect } from 'react'
import BrokerItem from '../components/BrokerItem'
import './Brokers.css'

function Brokers() {
  const brokers = useSelector(state => state.brokers.brokers)
  const dispatch = useDispatch()
  const [newBrokerName, setNewBrokerName] = useState('')
  const [newBrokerBalance, setNewBrokerBalance] = useState(100000)

  useEffect(() => {
    const handleBrokersUpdated = (data) => {
      dispatch(setBrokers(data))
    }

    websocketService.on('brokers_updated', handleBrokersUpdated)

    return () => {
      websocketService.off('brokers_updated', handleBrokersUpdated)
    }
  }, [dispatch])

  const handleAddBroker = () => {
    if (newBrokerName.trim()) {
      websocketService.sendMessage('add_broker', {
        name: newBrokerName,
        balance: newBrokerBalance
      })
      setNewBrokerName('')
    }
  }

  const handleRemoveBroker = (id) => {
    websocketService.sendMessage('delete_broker', { id })
  }

  const handleUpdateBalance = (id, newBalance) => {
    websocketService.sendMessage('update_broker_balance', { id, newBalance })
  }

  return (
    <div className="brokers-container">
      <h1>Управление брокерами</h1>
      
      <div className="add-broker-form">
        <h3>Добавить брокера</h3>
        <input 
          type="text" 
          placeholder="Имя брокера"
          value={newBrokerName}
          onChange={(e) => setNewBrokerName(e.target.value)}
          className="input-field"
        />
        <input 
          type="number" 
          placeholder="Начальный баланс"
          value={newBrokerBalance}
          onChange={(e) => setNewBrokerBalance(Number(e.target.value))}
          className="input-field"
        />
        <button className="add-btn" onClick={handleAddBroker}>Добавить</button>
      </div>

      <div>
        <h3>Список брокеров ({brokers.length})</h3>
        {brokers.map(broker => (
          <BrokerItem 
            key={broker.id}
            broker={broker}
            onUpdateBalance={handleUpdateBalance}
            onRemove={handleRemoveBroker}
          />
        ))}
        
        {brokers.length === 0 && (
          <p>Нет добавленных брокеров</p>
        )}
      </div>
    </div>
  )
}

export default Brokers