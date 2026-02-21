import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  brokers: []
}

const brokersSlice = createSlice({
  name: 'brokers',
  initialState,
  reducers: {
    addBroker: (state, action) => {
      const newBroker = {
        id: Date.now().toString(),
        name: action.payload.name,
        initialBalance: action.payload.balance,
        currentBalance: action.payload.balance,
        createdAt: new Date().toISOString(),
        stocks: {}
      }
      state.brokers.push(newBroker)
    },

    removeBroker: (state, action) => {
      state.brokers = state.brokers.filter(broker => broker.id !== action.payload)
    },

    updateBrokerBalance: (state, action) => {
      const { id, newBalance } = action.payload
      const broker = state.brokers.find(broker => broker.id === id)
      if (broker) {
        broker.initialBalance = newBalance
        broker.currentBalance = newBalance
      }
    },

    setBrokers: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.brokers = action.payload;
      }
    }
  }
})

export const { 
  addBroker, 
  removeBroker, 
  updateBrokerBalance,
  setBrokers
} = brokersSlice.actions

export default brokersSlice.reducer