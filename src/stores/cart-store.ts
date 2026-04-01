import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  productName: string
  productImage?: string
  price: number
  quantity: number
  category?: string
}

interface CartState {
  items: CartItem[]
  memberPoints: number
  discountAmount: number
  add: (item: CartItem) => void
  remove: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clear: () => void
  setMemberPoints: (points: number) => void
  setDiscount: (amount: number) => void
  getTotal: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      memberPoints: 0,
      discountAmount: 0,

      add: (item) => {
        const items = get().items
        const existingItem = items.find((i) => i.productId === item.productId)

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...items, item] })
        }
      },

      remove: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().remove(productId)
        } else {
          set({
            items: get().items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          })
        }
      },

      clear: () => {
        set({ items: [], discountAmount: 0, memberPoints: 0 })
      },

      setMemberPoints: (points) => {
        set({ memberPoints: points })
      },

      setDiscount: (amount) => {
        set({ discountAmount: amount })
      },

      getTotal: () => {
        const { items, discountAmount } = get()
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        return Math.max(0, subtotal - discountAmount)
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
