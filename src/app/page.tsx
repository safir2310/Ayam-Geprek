'use client'

// Main page component with customer view, navigation, and member card features
import { useState, useEffect, useRef } from 'react'
import { Menu, ShoppingBag, Phone, MapPin, Store, LayoutDashboard, LogIn, User, Loader2, CheckCircle, XCircle, Gift, Home, UserCheck, History, LogOut, QrCode, Settings, Bell, BellRing, X, ChevronRight, Clock, IdCard, RefreshCw, Copy, ShoppingCart, Plus, Minus, Trash2, CreditCard, Receipt, AlertCircle, Calculator, ChefHat, Camera, ScanLine, Ticket, Crown, Star, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationStore } from '@/stores/notification-store'
import { toast } from '@/hooks/use-toast'
import JsBarcode from 'jsbarcode'
import LoginPage from '@/components/auth/LoginPage'
import AdminDashboard from '@/components/admin/AdminDashboard'
import POSInterface from '@/components/pos/POSInterface'
import ProfilePage from '@/components/profile/ProfilePage'
import { useCartStore } from '@/stores/cart-store'

// Restaurant Info
const RESTAURANT_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
  phone: '085260812758',
}

// Types
type Category = {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  isActive: boolean
  order: number
  productCount?: number
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  categoryId: string
  category?: {
    id: string
    name: string
    icon?: string | null
  }
  stock: number
  isActive: boolean
}

type Member = {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  points: number
  tier: string
  isActive: boolean
}

type Order = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  paymentMethod: string
  status: string
  pointsUsed: number
  pointsEarned: number
  createdAt: Date
  items: any[]
}

// API functions
async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/api/categories?includeProductCount=true')
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch categories')
      }
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success) {
      return data.data
    }
    throw new Error(data.error || 'Failed to fetch categories')
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch('/api/products?status=active')
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch products')
      }
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success) {
      return data.data
    }
    throw new Error(data.error || 'Failed to fetch products')
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

async function lookupMemberByPhone(phone: string): Promise<Member | null> {
  try {
    const response = await fetch(`/api/members/phone/${encodeURIComponent(phone)}`)
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to look up member')
      }
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success && data.data) {
      return data.data
    }
    return null
  } catch (error) {
    console.error('Error looking up member:', error)
    return null
  }
}

async function registerMember(memberData: { name: string; phone: string; email?: string; address?: string }): Promise<Member> {
  try {
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    })
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to register member')
      }
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success) {
      return data.data
    }
    throw new Error(data.error || 'Failed to register member')
  } catch (error) {
    console.error('Error registering member:', error)
    throw error
  }
}

async function createOrder(orderData: any): Promise<Order> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create order')
      }
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success) {
      return data.data
    }
    throw new Error(data.error || 'Failed to create order')
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

async function fetchCustomerOrders(phone: string): Promise<Order[]> {
  try {
    const response = await fetch(`/api/orders/customer/${encodeURIComponent(phone)}`)
    
    // 404 is acceptable for no orders
    if (response.status === 404) {
      return []
    }
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch orders')
      }
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success) {
      return data.data || []
    }
    throw new Error(data.error || 'Failed to fetch orders')
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

async function fetchPaymentMethods(): Promise<any[]> {
  try {
    const response = await fetch('/api/payment-methods')
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch payment methods')
      }
      throw new Error(`Server error: ${response.status}`)
    }
    
    const data = await response.json()
    if (data.success) {
      return data.data || []
    }
    throw new Error(data.error || 'Failed to fetch payment methods')
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    throw error
  }
}

// Default fallback categories
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'Semua', icon: '🍽️', isActive: true, order: 0 },
]


function CustomerView() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const { currentView, setCurrentView } = useUIStore()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotificationStore()

  // Cart states
  const [cartOpen, setCartOpen] = useState(false)
  const { items, add, remove, updateQuantity, clear, getTotal, getTotalItems, setDiscount, setMemberPoints } = useCartStore()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [usePoints, setUsePoints] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  // Data states
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [products, setProducts] = useState<Product[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Active tab state
  const [activeTab, setActiveTab] = useState('menu')

  // Orders states
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Add to cart handler
  const handleAddToCart = (product: Product) => {
    add({
      productId: product.id,
      productName: product.name,
      productImage: product.image || undefined,
      price: product.price,
      quantity: 1,
      category: product.category?.name || 'Menu'
    })
    toast({
      title: 'Berhasil Ditambahkan',
      description: `${product.name} masuk ke keranjang`,
    })
  }

  // Checkout handler
  const handleCheckout = async () => {
    if (!customerName || !customerPhone) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Nama dan nomor telepon wajib diisi',
        variant: 'destructive'
      })
      return
    }

    setCheckoutLoading(true)
    try {
      const total = getTotal()
      const pointsUsed = usePoints && member ? Math.min(member.points, Math.floor(total / 100)) : 0
      const discountAmount = pointsUsed * 100
      setDiscount(discountAmount)

      const orderData = {
        customerName,
        customerPhone,
        customerAddress: customerAddress || '-',
        totalAmount: total,
        paymentMethod,
        pointsUsed,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity
        }))
      }

      const order = await createOrder(orderData)
      clear()
      setCheckoutOpen(false)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerAddress('')
      setUsePoints(false)
      setCartOpen(false)
      toast({
        title: 'Pesanan Berhasil',
        description: `Order #${order.orderNumber} telah dibuat`,
      })
      setActiveTab('orders')
    } catch (err: any) {
      toast({
        title: 'Gagal Membuat Pesanan',
        description: err.message || 'Terjadi kesalahan',
        variant: 'destructive'
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Member states
  const [memberPhone, setMemberPhone] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [memberLoading, setMemberLoading] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberAddress, setNewMemberAddress] = useState('')

  // Member Card states
  const [memberCardOpen, setMemberCardOpen] = useState(false)
  const [memberCardLoading, setMemberCardLoading] = useState(false)
  const [memberCardData, setMemberCardData] = useState<{ qrData: string; memberNumber: string } | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'barcode' | 'qr'>('card') // viewMode: card, barcode, qr
  const barcodeRef = useRef<SVGSVGElement>(null)

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [cats, prods, pms] = await Promise.all([fetchCategories(), fetchProducts(), fetchPaymentMethods()])
        setCategories([...DEFAULT_CATEGORIES, ...cats])
        setProducts(prods)
        setPaymentMethods(pms)
        // Set default payment method to first active method or fallback to CASH
        if (pms.length > 0) {
          setPaymentMethod(pms[0].type)
        }
      } catch (err) {
        setError('Gagal memuat data. Silakan coba lagi.')
        toast({
          title: 'Error',
          description: 'Gagal memuat data menu',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Load orders when tab changes to orders and user is authenticated
  useEffect(() => {
    async function loadOrders() {
      if (activeTab === 'orders' && isAuthenticated && user?.phone) {
        setOrdersLoading(true)
        setOrdersError(null)
        try {
          const customerOrders = await fetchCustomerOrders(user.phone)
          setOrders(customerOrders)
        } catch (err) {
          setOrdersError('Gagal memuat riwayat pesanan')
          toast({
            title: 'Error',
            description: 'Gagal memuat riwayat pesanan',
            variant: 'destructive'
          })
        } finally {
          setOrdersLoading(false)
        }
      }
    }
    loadOrders()
  }, [activeTab, isAuthenticated, user?.phone])

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.categoryId === activeCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStock = product.stock > 0 || !product.isActive
    return matchesCategory && matchesSearch && matchesStock
  })

  // Member lookup handler
  const handleMemberLookup = async () => {
    if (!memberPhone || memberPhone.length < 10) {
      toast({
        title: 'Error',
        description: 'Masukkan nomor telepon yang valid',
        variant: 'destructive'
      })
      return
    }
    
    setMemberLoading(true)
    try {
      const foundMember = await lookupMemberByPhone(memberPhone)
      if (foundMember) {
        setMember(foundMember)
        setShowRegisterForm(false)
        toast({
          title: 'Member Ditemukan',
          description: `Halo, ${foundMember.name}! Anda punya ${foundMember.points} poin`,
        })
      } else {
        setShowRegisterForm(true)
        setMember(null)
        toast({
          title: 'Member Tidak Ditemukan',
          description: 'Nomor ini belum terdaftar. Silakan daftar sebagai member.',
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Gagal mencari member',
        variant: 'destructive'
      })
    } finally {
      setMemberLoading(false)
    }
  }
  
  // Member registration handler
  const handleMemberRegister = async () => {
    if (!newMemberName || !memberPhone) {
      toast({
        title: 'Error',
        description: 'Nama dan nomor telepon wajib diisi',
        variant: 'destructive'
      })
      return
    }
    
    setMemberLoading(true)
    try {
      const registeredMember = await registerMember({
        name: newMemberName,
        phone: memberPhone,
        email: newMemberEmail || undefined,
        address: newMemberAddress || undefined
      })
      setMember(registeredMember)
      setShowRegisterForm(false)
      toast({
        title: 'Pendaftaran Berhasil',
        description: `Selamat bergabung, ${registeredMember.name}!`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Gagal mendaftarkan member',
        variant: 'destructive'
      })
    } finally {
      setMemberLoading(false)
    }
  }

  // Member Card handler
  const handleOpenMemberCard = async () => {
    if (!isAuthenticated || !user?.id) {
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login untuk melihat kartu member',
        variant: 'destructive'
      })
      return
    }

    // Validasi nomor HP
    const phoneNumber = user.phone
    if (!phoneNumber) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Nomor telepon belum diisi. Silakan update profil Anda.',
        variant: 'destructive'
      })
      return
    }

    setMemberCardLoading(true)
    try {
      // Gunakan nomor HP langsung sebagai data QR dan barcode
      const memberNumber = phoneNumber
      setMemberCardData({
        qrData: memberNumber,
        memberNumber: memberNumber
      })
      setMemberCardOpen(true)

      // Generate barcode setelah dialog terbuka
      setTimeout(() => {
        generateBarcode(memberNumber, viewMode)
      }, 100)

      toast({
        title: 'Berhasil',
        description: 'Kartu member berhasil dimuat',
      })
    } catch (error) {
      console.error('Error generating member card:', error)
      toast({
        title: 'Gagal',
        description: 'Gagal membuat kartu member',
        variant: 'destructive',
      })
    } finally {
      setMemberCardLoading(false)
    }
  }

  // Generate barcode function
  const generateBarcode = (memberNumber: string, mode: 'card' | 'barcode' | 'qr') => {
    if (!barcodeRef.current) return

    let config: {
      format: 'CODE128'
      width: number
      height: number
      displayValue: boolean
      fontSize: number
      margin: number
      background: string
      lineColor: string
    }

    if (mode === 'barcode') {
      config = {
        format: 'CODE128',
        width: 2,
        height: 96,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
      }
    } else if (mode === 'card') {
      config = {
        format: 'CODE128',
        width: 1.5,
        height: 48,
        displayValue: true,
        fontSize: 10,
        margin: 5,
        background: '#ffffff',
        lineColor: '#000000',
      }
    } else {
      config = {
        format: 'CODE128',
        width: 1,
        height: 32,
        displayValue: true,
        fontSize: 8,
        margin: 3,
        background: '#ffffff',
        lineColor: '#000000',
      }
    }

    JsBarcode(barcodeRef.current, memberNumber, config)
  }

  // Regenerate barcode when viewMode changes
  useEffect(() => {
    if (memberCardData?.memberNumber) {
      setTimeout(() => {
        generateBarcode(memberCardData.memberNumber, viewMode)
      }, 50)
    }
  }, [viewMode, memberCardData])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }
  
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const pointsUsed = usePoints && member ? Math.min(member.points, Math.floor(subtotal / 100)) : 0
  const discountAmount = pointsUsed * 100
  const finalTotal = Math.max(0, subtotal - discountAmount)

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
        {/* Header - Skeleton during SSR */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-orange-100">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2 rounded-xl">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                    {RESTAURANT_INFO.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">🍗 Pedasnya Bikin Nangih!!</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-orange-500 text-orange-600">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <ChefHat className="w-16 h-16" />
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              AYAM GEPREK SAMBAL IJO
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-6">
              Pedasnya Nampol, Rasanya Juara!
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col" suppressHydrationWarning>
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(251, 146, 60, 0.1);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
            border-radius: 4px;
            border: 1px solid rgba(234, 88, 12, 0.3);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #ea580c 0%, #c2410c 100%);
            border: 1px solid rgba(194, 65, 12, 0.5);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:active {
            background: linear-gradient(180deg, #c2410c 0%, #a31607 100%);
          }
        `
      }} />
      {/* Header - Premium Glassmorphism */}
      <header className="sticky top-0 z-50 glass border-b border-white/50 shadow-premium" suppressHydrationWarning>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 p-2.5 rounded-2xl shadow-glow-orange hover-lift animate-fade-in">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="animate-fade-in-up stagger-1">
                <h1 className="text-xl font-bold text-gradient-orange tracking-tight">
                  {RESTAURANT_INFO.name}
                </h1>
                <p className="text-xs text-muted-foreground tracking-wide">🍗 Pedasnya Bikin Nangih!!</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Profile Photo in Header */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-3">
                  {/* Notification Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative h-9 w-9 p-0 rounded-full"
                      >
                        <BellRing className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">Notifikasi</h3>
                          {unreadCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={markAllAsRead}
                            >
                              Tandai semua terbaca
                            </Button>
                          )}
                        </div>
                        <Separator />
                        {notifications.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            Tidak ada notifikasi
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.slice(0, 10).map((notification) => (
                              <DropdownMenuItem
                                key={notification.id}
                                className={`p-3 cursor-pointer transition-colors ${
                                  notification.read ? 'bg-transparent' : 'bg-orange-50'
                                }`}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="flex gap-3">
                                  <div className={`w-2 h-2 mt-1.5 rounded-full ${
                                    notification.read ? 'bg-gray-300' : 'bg-orange-500'
                                  }`} />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {getTimeAgo(notification.time)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeNotification(notification.id)
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        )}
                        {notifications.length > 0 && (
                          <>
                            <Separator />
                            <DropdownMenuItem
                              className="text-center text-sm text-orange-600 hover:text-orange-700 cursor-pointer"
                              onClick={() => setCurrentView('profile')}
                            >
                              Lihat Semua di Profil
                              <ChevronRight className="w-4 h-4 ml-auto" />
                            </DropdownMenuItem>
                          </>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Profile Avatar */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('profile')}
                    className="flex items-center gap-2 h-auto py-1 px-2 rounded-full hover:bg-orange-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                      {user.name?.split(' ')[0] || 'User'}
                    </span>
                  </Button>
                </div>
              )}

              {/* Admin Button - Only for admin users */}
              {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('admin')}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Premium */}
      <section className="relative overflow-hidden bg-gradient-sunset text-white py-16 md:py-20">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-20 right-20 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-orange-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 right-1/3 w-36 h-36 bg-yellow-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6 animate-fade-in-down">
            <div className="glass-gold p-5 rounded-3xl animate-float shadow-glow-gold">
              <ChefHat className="w-20 h-20 text-amber-300" />
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 animate-fade-in-up stagger-1 text-shadow-premium tracking-tight">
            AYAM GEPREK SAMBAL IJO
          </h2>
          <p className="text-xl md:text-2xl opacity-95 mb-8 animate-fade-in-up stagger-2 font-light tracking-wide">
            Pedasnya Nampol, Rasanya Juara!
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up stagger-3">
            <Button
              onClick={() => {
                const menuSection = document.getElementById('menu-section')
                menuSection?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/30 text-white font-semibold px-8 py-3 rounded-full hover-scale shadow-premium"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Pesan Sekarang
            </Button>
            <Button
              onClick={() => setCurrentView('login')}
              className="bg-gradient-gold hover:opacity-90 text-amber-900 font-semibold px-8 py-3 rounded-full hover-scale shadow-premium-lg"
            >
              <User className="w-5 h-5 mr-2" />
              Daftar Member
            </Button>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-50 to-transparent"></div>
      </section>

      {/* Main Content */}
      <main id="menu-section" className="container mx-auto px-4 py-8 flex-1">
        {activeTab === 'menu' && (
          <div className="space-y-8 animate-fade-in">
            {/* Search and Filter - Premium */}
            <div className="space-y-6">
              <div className="relative max-w-2xl mx-auto animate-fade-in-up stagger-1">
                <Input
                  placeholder="🔍 Cari menu favorit Anda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-6 text-base border-2 border-orange-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 glass shadow-premium transition-all duration-300"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Category Pills - Premium */}
              <div className="flex flex-wrap gap-3 justify-center animate-fade-in-up stagger-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground px-6 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                    <span className="font-medium">Memuat kategori...</span>
                  </div>
                ) : (
                  categories.map((category, index) => (
                    <Button
                      key={category.id}
                      variant={activeCategory === category.id ? 'default' : 'outline'}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 hover-lift animate-fade-in ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white shadow-glow-orange border-0 scale-105'
                          : 'border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-gray-700 bg-white'
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <span className="mr-2 text-lg">{category.icon || '📦'}</span>
                      {category.name}
                      {category.productCount !== undefined && category.productCount > 0 && (
                        <Badge 
                          variant={activeCategory === category.id ? 'secondary' : 'outline'} 
                          className="ml-2 text-xs px-2 py-0.5 rounded-full"
                        >
                          {category.productCount}
                        </Badge>
                      )}
                    </Button>
                  ))
                )}
              </div>
            </div>

            {/* Product Grid - Premium */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
                  <div className="absolute inset-0 bg-orange-500/20 blur-xl animate-pulse"></div>
                </div>
                <p className="text-muted-foreground text-lg mt-6 font-medium">Memuat menu...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                <div className="bg-red-100 p-6 rounded-full mb-4 animate-bounce">
                  <XCircle className="w-16 h-16 text-red-500" />
                </div>
                <p className="text-red-500 text-lg mb-4 font-semibold">{error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full px-8 py-3 hover-lift"
                >
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up stagger-3">
                {filteredProducts.map((product, index) => (
                  <Card
                    key={product.id}
                    className={`premium-card overflow-hidden group ${product.stock === 0 ? 'opacity-50 grayscale' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative h-40 md:h-56 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1606787620819-8bdf0c44c293?w=400&h=300&fit=crop'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Badge className="absolute top-2 right-2 md:top-3 md:right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-0.5 md:px-3 py-1 rounded-full shadow-lg border-2 border-white/30 text-[10px] md:text-xs">
                        {product.category?.name || 'Menu'}
                      </Badge>
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <Badge variant="destructive" className="text-[10px] md:text-sm px-2 py-1 md:px-4 py-1 md:py-2 rounded-full shadow-lg">
                            Stok Habis
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 md:p-5">
                      <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-2 text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[10px] md:text-sm text-muted-foreground mb-2 md:mb-4 line-clamp-2 leading-relaxed hidden sm:block">
                        {product.description || 'Lezat dan nikmat'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-lg md:text-2xl font-black text-gradient-orange">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white px-2 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl font-semibold text-[10px] md:text-sm shadow-glow-orange hover:shadow-glow-orange hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingBag className="w-3 h-3 md:w-4 md:h-4 mr-0.5 md:mr-1" />
                          <span className="hidden md:inline">Tambah</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Tidak ada menu yang ditemukan</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {!isAuthenticated ? (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-8 text-center">
                  <UserCheck className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Login untuk Melihat Riwayat Pesanan</h3>
                  <p className="text-muted-foreground mb-4">
                    Silakan login untuk melihat riwayat pesanan Anda
                  </p>
                  <Button
                    onClick={() => setCurrentView('login')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login Sekarang
                  </Button>
                </CardContent>
              </Card>
            ) : ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-muted-foreground">Memuat riwayat pesanan...</p>
              </div>
            ) : ordersError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-500 mb-4">{ordersError}</p>
                <Button onClick={() => window.location.reload()}>
                  Coba Lagi
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Belum Ada Pesanan</h3>
                  <p className="text-muted-foreground">
                    Anda belum memiliki riwayat pesanan. Mulai pesanan sekarang!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border-orange-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge
                          className={
                            order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : order.status === 'PROCESSING'
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : order.status === 'CONFIRMED'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : order.status === 'DELIVERED'
                              ? 'bg-teal-100 text-teal-700 border-teal-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                          variant="outline"
                        >
                          {order.status === 'COMPLETED'
                            ? 'Selesai'
                            : order.status === 'PROCESSING'
                            ? 'Diproses'
                            : order.status === 'CONFIRMED'
                            ? 'Dikonfirmasi'
                            : order.status === 'PENDING'
                            ? 'Menunggu'
                            : order.status === 'DELIVERED'
                            ? 'Dikirim'
                            : 'Dibatalkan'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                        {order.items?.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.productName} x{item.quantity}</span>
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Metode Pembayaran</span>
                          <span className="font-medium">
                            {order.paymentMethod === 'CASH' ? 'Tunai' : 'QRIS'}
                          </span>
                        </div>
                        {order.pointsUsed > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Poin Digunakan</span>
                            <span>-{order.pointsUsed} poin</span>
                          </div>
                        )}
                        {order.pointsEarned > 0 && (
                          <div className="flex justify-between text-sm text-orange-600">
                            <span>Poin Didapat</span>
                            <span>+{order.pointsEarned} poin</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>Total</span>
                          <span className="text-orange-600">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>


      {/* Bottom Navigation Bar - Premium Glassmorphism */}
      <nav className="sticky bottom-0 z-50 glass border-t border-white/60 shadow-premium-lg" suppressHydrationWarning>
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between py-3">
            {/* Beranda */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('menu')}
              className={`flex flex-col items-center gap-1.5 h-auto py-2.5 px-4 rounded-2xl transition-all duration-300 ${
                activeTab === 'menu' 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-glow-orange scale-105' 
                  : 'text-muted-foreground hover:bg-orange-50/50 hover:text-orange-600'
              }`}
            >
              <Home className="w-5 h-5 transition-transform duration-300" />
              <span className="text-xs font-semibold">Beranda</span>
            </Button>

            {/* Keranjang */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCartOpen(true)}
              className="flex flex-col items-center gap-1.5 h-auto py-2.5 px-4 rounded-2xl text-muted-foreground hover:bg-orange-50/50 hover:text-orange-600 transition-all duration-300"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 transition-transform duration-300" />
                {items.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5.5 w-5.5 flex items-center justify-center p-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold shadow-glow-orange border-2 border-white/30 animate-bounce">
                    {getTotalItems() > 9 ? '9+' : getTotalItems()}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-semibold">Keranjang</span>
            </Button>

            {/* QR Member */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenMemberCard}
              className="flex flex-col items-center gap-1.5 h-auto py-2.5 px-4 rounded-2xl text-muted-foreground hover:bg-orange-50/50 hover:text-orange-600 transition-all duration-300"
            >
              <QrCode className="w-5 h-5 transition-transform duration-300" />
              <span className="text-xs font-semibold">QR Member</span>
            </Button>

            {/* Riwayat Pesanan */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('orders')}
              className={`flex flex-col items-center gap-1.5 h-auto py-2.5 px-4 rounded-2xl transition-all duration-300 ${
                activeTab === 'orders' 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-glow-orange scale-105' 
                  : 'text-muted-foreground hover:bg-orange-50/50 hover:text-orange-600'
              }`}
            >
              <History className="w-5 h-5 transition-transform duration-300" />
              <span className="text-xs font-semibold">Riwayat</span>
            </Button>

            {/* Profile */}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('profile')}
                className="flex flex-col items-center gap-1.5 h-auto py-2.5 px-4 rounded-2xl text-muted-foreground hover:bg-orange-50/50 hover:text-orange-600 transition-all duration-300"
              >
                <User className="w-5 h-5 transition-transform duration-300" />
                <span className="text-xs font-semibold">Profile</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('login')}
                className="flex flex-col items-center gap-1.5 h-auto py-2.5 px-4 rounded-2xl text-muted-foreground hover:bg-orange-50/50 hover:text-orange-600 transition-all duration-300"
              >
                <LogIn className="w-5 h-5 transition-transform duration-300" />
                <span className="text-xs font-semibold">Login</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Member Card Dialog */}
      <Dialog open={memberCardOpen} onOpenChange={setMemberCardOpen}>
        <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3 shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-base">
                  <IdCard className="w-4 h-4 text-orange-600" />
                  Kartu Member
                </DialogTitle>
              </div>
              {/* Mode Selector - Enhanced */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1.5 border border-gray-300 shadow-inner">
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                      viewMode === 'card'
                        ? 'bg-white text-orange-600 shadow-md ring-2 ring-orange-300'
                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Kartu</span>
                    {viewMode === 'card' && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setViewMode('barcode')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                      viewMode === 'barcode'
                        ? 'bg-white text-orange-600 shadow-md ring-2 ring-orange-300'
                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                    }`}
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>Barcode</span>
                    {viewMode === 'barcode' && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setViewMode('qr')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                      viewMode === 'qr'
                        ? 'bg-white text-orange-600 shadow-md ring-2 ring-orange-300'
                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                    {viewMode === 'qr' && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogDescription className="text-xs pt-1">
              {viewMode === 'card' && 'Tampilkan kartu member lengkap dengan QR dan Barcode terpisah'}
              {viewMode === 'barcode' && 'Tampilkan barcode besar untuk memudahkan scan'}
              {viewMode === 'qr' && 'Tampilkan QR Code besar untuk memudahkan scan'}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 pr-2 custom-scrollbar">
            <div className="space-y-4">
              {memberCardLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-600 border-t-transparent" />
                  <p className="mt-4 text-muted-foreground text-sm">Memuat kartu member...</p>
                </div>
              ) : memberCardData ? (
                <>
              {viewMode === 'card' && (
                /* MODE CARD - Kartu Member Premium */
                <div className="space-y-4">
                  {/* Premium Member Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-500 to-red-600 shadow-2xl border-2 border-amber-300/50 text-white">
                    {/* Gold Border Effect */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 opacity-30"></div>
                    <div className="absolute inset-1 rounded-2xl border border-white/10"></div>
                    
                    {/* Decorative Patterns */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-300 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative p-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></div>
                            <p className="text-[10px] font-semibold tracking-widest text-yellow-200 uppercase">Premium Member</p>
                          </div>
                          <h3 className="text-xl font-black tracking-tight drop-shadow-lg">
                            AYAM GEPREK
                          </h3>
                          <p className="text-[10px] text-yellow-200/80 mt-0.5 tracking-wide">SAMBAL IJO</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-2 rounded-xl shadow-lg">
                          <Crown className="w-5 h-5 text-amber-900" />
                        </div>
                      </div>

                      {/* Member Info with Premium Styling */}
                      <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 mb-3 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-3 border-yellow-400 shadow-lg">
                              <AvatarImage
                                src={user?.avatar ? `${user.avatar}?t=${Date.now()}` : undefined}
                                alt={user?.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-900 text-sm font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-amber-600 flex items-center justify-center">
                              <Star className="w-2.5 h-2.5 text-amber-700 fill-current" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-yellow-100">{user?.name || 'Member'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 text-[9px] px-2 py-0.5 font-semibold border border-yellow-300">
                                <Award className="w-2.5 h-2.5 mr-1" />
                                {user?.role === 'ADMIN' ? 'ADMIN' : user?.role === 'CASHIER' ? 'KASIR' : 'VIP MEMBER'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Points Section - Premium */}
                      <div className="bg-gradient-to-r from-black/30 via-black/40 to-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-yellow-200/80 uppercase tracking-wider">Poin Tersedia</p>
                            <p className="text-3xl font-black text-yellow-400 tracking-wider drop-shadow-lg">
                              {(user as any).points || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-yellow-200/60">Rp 10.000</p>
                            <p className="text-[9px] text-yellow-200/60">= 1 Poin</p>
                          </div>
                        </div>
                      </div>

                      {/* Member Number Section */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="w-3 h-3 text-yellow-200" />
                          <p className="text-[10px] font-medium text-yellow-100">Nomor Member</p>
                        </div>
                        <p className="text-base font-bold text-center text-white tracking-wider bg-black/20 rounded py-1.5">
                          {memberCardData?.memberNumber || user?.phone || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="bg-black/30 px-4 py-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[9px] text-yellow-200/70">
                        <span>Member ID: {user?.id?.slice(-8).toUpperCase() || 'N/A'}</span>
                        <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: '2-digit'}) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Card - Separate */}
                  <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-200">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full">
                        <QrCode className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">SCAN QR CODE</span>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-amber-50 p-4 rounded-xl border-2 border-dashed border-amber-300">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(memberCardData?.qrData || '')}`}
                          alt="Member QR Code"
                          className="w-32 h-32 mx-auto"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2">Gunakan QR ini untuk mengumpulkan poin</p>
                    </div>
                  </div>

                  {/* Barcode Card - Separate */}
                  <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-amber-200">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full">
                        <ScanLine className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">SCAN BARCODE</span>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-amber-50 p-4 rounded-xl border-2 border-dashed border-amber-300">
                        <svg ref={barcodeRef} className="w-full h-12" />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2">Nomor HP: {memberCardData?.memberNumber || user?.phone || '-'}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 text-[10px] h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        if (memberCardData?.memberNumber) {
                          navigator.clipboard.writeText(memberCardData.memberNumber)
                          toast({
                            title: 'Berhasil',
                            description: 'Nomor HP disalin ke clipboard',
                          })
                        }
                      }}
                    >
                      <Copy className="w-3 h-3" />
                      Salin No. HP
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-1.5 text-[10px] h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={handleOpenMemberCard}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </Button>
                  </div>
                </div>
              )}

              {viewMode === 'barcode' && (
                /* MODE BARCODE - Barcode Besar */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="bg-white p-6 rounded-2xl shadow-xl mx-auto max-w-full">
                      <svg ref={barcodeRef} className="w-full h-24" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-orange-600">Scan Barcode ini</p>
                      <p className="text-[10px] text-muted-foreground">
                        {memberCardData?.memberNumber || user?.phone || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <ScanLine className="w-3 h-3 text-orange-600" />
                      <p className="text-xs font-medium text-orange-600">Nomor Member</p>
                    </div>
                    <p className="text-lg font-bold text-center text-orange-700 tracking-wider">
                      {memberCardData?.memberNumber || user?.phone || '-'}
                    </p>
                  </div>
                </div>
              )}

              {viewMode === 'qr' && (
                /* MODE QR - QR Code Besar */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="bg-white p-6 rounded-2xl shadow-xl mx-auto max-w-full">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(memberCardData?.qrData || '')}`}
                        alt="Member QR Code - Scan Mode"
                        className="w-56 h-56"
                      />
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-orange-600">Scan QR Code ini</p>
                      <p className="text-[10px] text-muted-foreground">
                        {memberCardData?.memberNumber || user?.phone || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <ScanLine className="w-3 h-3 text-orange-600" />
                      <p className="text-xs font-medium text-orange-600">Nomor Member</p>
                    </div>
                    <p className="text-lg font-bold text-center text-orange-700 tracking-wider">
                      {memberCardData?.memberNumber || user?.phone || '-'}
                    </p>
                  </div>
                </div>
              )}
              </>
              ) : null}
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-3">
            <Button onClick={() => setMemberCardOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      {/* Cart Dialog - Center Popup */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
              Keranjang Belanja
            </DialogTitle>
          </DialogHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">Keranjang kosong</p>
              <p className="text-sm text-muted-foreground mt-2">Tambahkan menu favorit Anda</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1606787620819-8bdf0c44c293?w=100&h=100&fit=crop'}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.productName}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{item.category || 'Menu'}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-600">{formatPrice(item.price)}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Subtotal</span>
                        <span className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      onClick={() => remove(item.productId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="border-t pt-4 space-y-3 shrink-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {member && member.points > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="usePoints"
                          checked={usePoints}
                          onChange={(e) => setUsePoints(e.target.checked)}
                          className="w-4 h-4 accent-orange-600"
                        />
                        <label htmlFor="usePoints" className="text-muted-foreground cursor-pointer">
                          Gunakan {Math.floor(subtotal / 100)} poin
                        </label>
                      </div>
                      <span className="text-green-600 font-medium">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setCheckoutOpen(true)
                    setCartOpen(false)
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  size="lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Checkout
                </Button>

                <Button
                  variant="outline"
                  onClick={() => clear()}
                  className="w-full"
                >
                  Kosongkan Keranjang
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog - Center Popup */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Receipt className="w-6 h-6 text-orange-600" />
              Checkout Pesanan
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
            {/* Customer Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold">Informasi Pelanggan</h3>
              </div>
              <div className="space-y-3 pl-10">
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Masukkan nama lengkap"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={"border-orange-200 focus-visible:ring-orange-500"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="08xxxxxxxxxx"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="border-orange-200 focus-visible:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Alamat</label>
                  <textarea
                    placeholder="Alamat lengkap pengiriman"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={2}
                    className="flex min-h-[60px] w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items Section - Scrollable */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold">Item Pesanan ({items.length})</h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pl-10 pr-2">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1606787620819-8bdf0c44c293?w=100&h=100&fit=crop'}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{item.productName}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{item.category || 'Menu'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                        <span className="font-bold text-orange-600 text-sm">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment Method Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold">Metode Pembayaran</h3>
              </div>
              {paymentMethods.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 pl-10">
                  {paymentMethods.map((pm) => (
                    <Button
                      key={pm.id}
                      type="button"
                      variant={paymentMethod === pm.type ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod(pm.type)}
                      className={
                        paymentMethod === pm.type
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                          : 'border-orange-200 hover:bg-orange-50'
                      }
                    >
                      {pm.logo ? (
                        <img src={pm.logo} alt={pm.name} className="w-4 h-4 mr-2 object-contain" />
                      ) : pm.type === 'CASH' ? (
                        <Receipt className="w-4 h-4 mr-2" />
                      ) : pm.type === 'QRIS' ? (
                        <QrCode className="w-4 h-4 mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {pm.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground pl-10 py-4">
                  Tidak ada metode pembayaran tersedia
                </div>
              )}
            </div>

            <Separator />

            {/* Order Summary Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-semibold">Ringkasan Pembayaran</h3>
              </div>
              <div className="space-y-2 bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 pl-10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Diskon Poin ({pointsUsed} poin)</span>
                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <Separator className="my-2 bg-orange-200" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Bayar</span>
                  <span className="text-orange-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="border-t pt-4 space-y-3 shrink-0">
            <Button
              onClick={handleCheckout}
              disabled={checkoutLoading || !customerName || !customerPhone}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-lg"
              size="lg"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses Pesanan...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Konfirmasi Pesanan • {formatPrice(finalTotal)}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              disabled={checkoutLoading}
              className="w-full"
            >
              Kembali ke Keranjang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function HomePage() {
  const { currentView } = useUIStore()

  // Render different views based on currentView state
  switch (currentView) {
    case 'customer':
      return <CustomerView />
    case 'login':
      return <LoginPage />
    case 'admin':
      return <AdminDashboard />
    case 'pos':
      return <POSInterface />
    case 'profile':
      return <ProfilePage />
    default:
      return <CustomerView />
  }
}
// Cache refresh

