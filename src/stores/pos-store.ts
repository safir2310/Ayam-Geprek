import { create } from 'zustand'

export interface POSItem {
  productId: string
  productName: string
  productImage?: string
  price: number
  quantity: number
  cost?: number
  barcode?: string
}

interface POSState {
  items: POSItem[]
  selectedCategory: string | null
  searchQuery: string
  discountAmount: number
  taxRate: number
  member: {
    id?: string
    name?: string
    phone?: string
    points?: number
  } | null

  addItem: (item: POSItem) => void
  removeItem: (productId: string) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  clearItems: () => void
  setSelectedCategory: (categoryId: string | null) => void
  setSearchQuery: (query: string) => void
  setDiscount: (amount: number) => void
  setTaxRate: (rate: number) => void
  setMember: (member: POSState['member']) => void
  clearMember: () => void
  getSubtotal: () => number
  getTaxAmount: () => number
  getTotal: () => number
}

export const usePOSStore = create<POSState>((set, get) => ({
  items: [],
  selectedCategory: null,
  searchQuery: '',
  discountAmount: 0,
  taxRate: 0.11, // 11% tax
  member: null,

  addItem: (item) => {
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

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) })
  },

  updateItemQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
    } else {
      set({
        items: get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        ),
      })
    }
  },

  clearItems: () => {
    set({ items: [], discountAmount: 0 })
  },

  setSelectedCategory: (categoryId) => {
    set({ selectedCategory: categoryId })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setDiscount: (amount) => {
    set({ discountAmount: amount })
  },

  setTaxRate: (rate) => {
    set({ taxRate: rate })
  },

  setMember: (member) => {
    set({ member })
  },

  clearMember: () => {
    set({ member: null })
  },

  getSubtotal: () => {
    const { items, discountAmount } = get()
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return Math.max(0, subtotal - discountAmount)
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal()
    return subtotal * get().taxRate
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTaxAmount()
  },
}))
