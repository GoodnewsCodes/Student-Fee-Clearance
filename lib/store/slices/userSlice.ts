import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  fullName: string
  role: 'student' | 'admin' | 'ict_admin'
  department?: string
  matricNumber?: string
  phoneNumber?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface UserState {
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
  }
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchUsersSuccess: (state, action: PayloadAction<{ users: User[]; total: number }>) => {
      state.isLoading = false
      state.users = action.payload.users
      state.pagination.total = action.payload.total
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.unshift(action.payload)
      state.pagination.total += 1
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
      if (state.currentUser?.id === action.payload.id) {
        state.currentUser = action.payload
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload)
      state.pagination.total -= 1
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.page = action.payload.page
      state.pagination.limit = action.payload.limit
    },
    clearUsers: (state) => {
      state.users = []
      state.currentUser = null
      state.error = null
    },
  },
})

export const { 
  fetchUsersStart, 
  fetchUsersSuccess, 
  fetchUsersFailure, 
  setCurrentUser, 
  addUser, 
  updateUser, 
  deleteUser, 
  setPagination, 
  clearUsers 
} = userSlice.actions
export default userSlice.reducer
