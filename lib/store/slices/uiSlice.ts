import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ModalState {
  isOpen: boolean
  type: string | null
  data?: any
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface UIState {
  isLoading: boolean
  modals: {
    receiptUpload: ModalState
    feeDetails: ModalState
    userManagement: ModalState
  }
  notifications: Notification[]
  sidebarOpen: boolean
  theme: 'light' | 'dark'
}

const initialState: UIState = {
  isLoading: false,
  modals: {
    receiptUpload: { isOpen: false, type: null, data: null },
    feeDetails: { isOpen: false, type: null, data: null },
    userManagement: { isOpen: false, type: null, data: null },
  },
  notifications: [],
  sidebarOpen: false,
  theme: 'light',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      const { type, data } = action.payload
      if (type in state.modals) {
        state.modals[type as keyof typeof state.modals] = { isOpen: true, type, data }
      }
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const type = action.payload
      if (type in state.modals) {
        state.modals[type as keyof typeof state.modals] = { isOpen: false, type: null, data: null }
      }
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString()
      state.notifications.push({ ...action.payload, id })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
  },
})

export const { 
  setLoading, 
  openModal, 
  closeModal, 
  addNotification, 
  removeNotification, 
  clearNotifications, 
  toggleSidebar, 
  setTheme 
} = uiSlice.actions
export default uiSlice.reducer
