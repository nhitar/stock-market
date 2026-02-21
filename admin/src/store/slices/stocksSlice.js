import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  availableStocks: [],
  selectedStocks: [],
  historicalData: {}
}

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    setStocks: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.availableStocks = action.payload
        
        action.payload.forEach(stock => {
          if (stock.prices && Array.isArray(stock.prices)) {
            state.historicalData[stock.ticker] = stock.prices
          }
        })
        
        state.selectedStocks = action.payload
          .filter(stock => stock.isActive)
          .map(stock => stock.ticker)
      } else {
        console.error('setStocks: payload is not an array', action.payload)
      }
    },

    toggleStockSelection: (state, action) => {
      const ticker = action.payload
      const index = state.selectedStocks.indexOf(ticker)
      
      if (index > -1) {
        state.selectedStocks.splice(index, 1)
        const stock = state.availableStocks.find(s => s.ticker === ticker)
        if (stock) stock.isActive = false
      } else {
        state.selectedStocks.push(ticker)
        const stock = state.availableStocks.find(s => s.ticker === ticker)
        if (stock) stock.isActive = true
      }
    },

    updateStockPrices: (state, action) => {
      action.payload.forEach(priceUpdate => {
        const stock = state.availableStocks.find(s => s.ticker === priceUpdate.ticker)
        if (stock) {
          stock.currentPrice = priceUpdate.price
        }
      })
    },

    setHistoricalData: (state, action) => {
      state.historicalData = { ...state.historicalData, ...action.payload }
    }
  }
})

export const {
  setStocks,
  toggleStockSelection,
  updateStockPrices,
  setHistoricalData,
} = stocksSlice.actions

export default stocksSlice.reducer