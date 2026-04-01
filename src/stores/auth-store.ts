import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  avatar?: string | null
  address?: string | null
  points?: number
  pointHistory?: any[]
  createdAt?: Date
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateProfile: (user: User) => void
  getRedirectPath: () => 'admin' | 'pos' | 'customer'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateProfile: (user) => {
        console.log('[Auth Store] Updating profile:', user)
        set((state) => ({
          user: { ...state.user, ...user }
        }))
      },

      getRedirectPath: () => {
        const { user } = get()
        if (!user) return 'customer'

        // Auto-redirect based on role
        const role = user.role.toUpperCase()
        if (role === 'ADMIN' || role === 'MANAGER') {
          return 'admin'
        } else if (role === 'CASHIER') {
          return 'pos'
        } else if (role === 'STAFF' || role === 'USER') {
          return 'customer'
        } else {
          return 'customer'
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
