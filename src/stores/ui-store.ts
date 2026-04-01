import { create } from 'zustand'

type ViewType = 'customer' | 'pos' | 'admin' | 'login' | 'profile' | 'orders'

interface UIState {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'customer',
  sidebarOpen: false,
  cartOpen: false,

  setCurrentView: (view) => set({ currentView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCartOpen: (open) => set({ cartOpen: open }),
}))
