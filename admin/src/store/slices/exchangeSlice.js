import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isTrading: false,
  currentDate: new Date().toISOString().split('T')[0],
  speed: 5
}

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    setTradingStatus: (state, action) => {
      state.isTrading = action.payload
    },
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload
    },
    setTradingSpeed: (state, action) => {
      state.speed = action.payload
    },
    setExchangeSettings: (state, action) => {
      state.speed = action.payload.speed
      state.currentDate = action.payload.startDate
      state.isTrading = action.payload.isTrading
    }
  }
})

export const { setTradingStatus, setCurrentDate, setTradingSpeed, setExchangeSettings } = exchangeSlice.actions
export default exchangeSlice.reducer