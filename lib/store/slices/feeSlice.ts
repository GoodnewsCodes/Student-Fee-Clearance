import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface FeeItem {
  id: string
  name: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  dueDate: string
  paidDate?: string
  receiptUrl?: string
}

interface FeeState {
  fees: FeeItem[]
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  isLoading: boolean
  error: string | null
}

const initialState: FeeState = {
  fees: [],
  totalAmount: 0,
  paidAmount: 0,
  pendingAmount: 0,
  isLoading: false,
  error: null,
}

const feeSlice = createSlice({
  name: 'fee',
  initialState,
  reducers: {
    fetchFeesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchFeesSuccess: (state, action: PayloadAction<FeeItem[]>) => {
      state.isLoading = false
      state.fees = action.payload
      state.totalAmount = action.payload.reduce((sum, fee) => sum + fee.amount, 0)
      state.paidAmount = action.payload
        .filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + fee.amount, 0)
      state.pendingAmount = action.payload
        .filter(fee => fee.status === 'pending')
        .reduce((sum, fee) => sum + fee.amount, 0)
    },
    fetchFeesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    updateFeeStatus: (state, action: PayloadAction<{ id: string; status: 'paid' | 'pending'; paidDate?: string; receiptUrl?: string }>) => {
      const fee = state.fees.find(f => f.id === action.payload.id)
      if (fee) {
        fee.status = action.payload.status
        fee.paidDate = action.payload.paidDate
        fee.receiptUrl = action.payload.receiptUrl
        
        // Recalculate amounts
        state.paidAmount = state.fees
          .filter(f => f.status === 'paid')
          .reduce((sum, fee) => sum + fee.amount, 0)
        state.pendingAmount = state.fees
          .filter(f => f.status === 'pending')
          .reduce((sum, fee) => sum + fee.amount, 0)
      }
    },
    clearFees: (state) => {
      state.fees = []
      state.totalAmount = 0
      state.paidAmount = 0
      state.pendingAmount = 0
      state.error = null
    },
  },
})

export const { fetchFeesStart, fetchFeesSuccess, fetchFeesFailure, updateFeeStatus, clearFees } = feeSlice.actions
export default feeSlice.reducer
