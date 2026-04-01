import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type?: 'order' | 'promotion' | 'system' | 'reward'
  link?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          time: new Date().toISOString(),
          read: false,
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50 notifications
          unreadCount: state.unreadCount + 1,
        }))

        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/icon-192.png',
          })
        }
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
          const unreadCount = updatedNotifications.filter((n) => !n.read).length
          return {
            notifications: updatedNotifications,
            unreadCount,
          }
        })
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      removeNotification: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter((n) => n.id !== id)
          const unreadCount = updatedNotifications.filter((n) => !n.read).length
          return {
            notifications: updatedNotifications,
            unreadCount,
          }
        })
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
      },
    }),
    {
      name: 'notification-storage',
    }
  )
)

// Request notification permission on mount
if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}
