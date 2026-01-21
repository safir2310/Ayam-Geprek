import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPhoto: string | null;
  price: number;
  discount: number;
  quantity: number;
}

export interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  photo: string | null;
  coins: number;
}

interface AppState {
  // Cart state
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;

  // Auth state
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;

  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Real-time updates
  lastUpdate: string;
  triggerUpdate: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Cart
      cart: [],
      addToCart: (item) => {
        const cart = get().cart;
        const existingItem = cart.find(
          (i) => i.productId === item.productId
        );
        if (existingItem) {
          set({
            cart: cart.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ cart: [...cart, item] });
        }
      },
      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((i) => i.productId !== productId) });
      },
      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
        } else {
          set({
            cart: get().cart.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        const cart = get().cart;
        return cart.reduce(
          (total, item) =>
            total + (item.price - item.price * (item.discount / 100)) * item.quantity,
          0
        );
      },
      getCartItemCount: () => {
        const cart = get().cart;
        return cart.reduce((count, item) => count + item.quantity, 0);
      },

      // Auth
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, cart: [] }),
      isAuthenticated: () => !!get().user,
      isAdmin: () => get().user?.role === 'admin',

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // Real-time updates
      lastUpdate: new Date().toISOString(),
      triggerUpdate: () => set({ lastUpdate: new Date().toISOString() }),
    }),
    {
      name: 'ayam-geprek-storage',
      partialize: (state) => ({
        cart: state.cart,
        user: state.user,
        theme: state.theme,
      }),
    }
  )
);
