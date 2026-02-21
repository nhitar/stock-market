import { useState } from 'react'

function BrokerItem({ broker, onUpdateBalance, onRemove }) {
  const [balanceInput, setBalanceInput] = useState(broker.initialBalance)
  
  return (
    <div className="broker-item">
      <div className="broker-info">
        <strong>{broker.name}</strong>
        <br />
        Баланс: {broker.currentBalance} $
      </div>
      <div className="broker-actions">
        <input 
          type="number"
          placeholder='Новый баланс'
          className="input-field"
          onChange={(e) => setBalanceInput(Number(e.target.value))}
          value={balanceInput}
        />
        <button
          onClick={() => onUpdateBalance(broker.id, balanceInput)}
          className="add-btn"
        >
          Обновить
        </button>
        <button 
          onClick={() => onRemove(broker.id)}
          className="delete-btn"
        >
          Удалить
        </button>
      </div>
    </div>
  )
}

export default BrokerItem