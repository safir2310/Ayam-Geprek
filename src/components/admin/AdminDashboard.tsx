'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Store,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Package,
  AlertCircle,
  LogOut,
  Menu,
  X,
  Home,
  Package as ProductIcon,
  Tag,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  QrCode,
  Layers,
  LayoutTemplate,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useUIStore } from '@/stores/ui-store'
import { toast } from '@/hooks/use-toast'
import OrderManagement from './OrderManagement'
import MemberManagement from './MemberManagement'
import ProductManagement from './ProductManagement'
import PromoManagement from './PromoManagement'
import ReportsPage from './ReportsPage'
import ShiftManagement from './ShiftManagement'
import CategoryManagement from './CategoryManagement'
import QRISUpload from './QRISUpload'
import PaymentMethods from './PaymentMethods'
import PageBuilder from './PageBuilder'
import DynamicPageViewer from './DynamicPageViewer'

const RESTAURANT_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
  phone: '085260812758',
}

// Mock Statistics
const STATISTICS = {
  todaySales: 2450000,
  todayOrders: 45,
  totalMembers: 328,
  lowStockProducts: 3,
  weekSales: 15700000,
  monthSales: 68500000,
  pendingOrders: 5,
}

// Mock Recent Orders
const RECENT_ORDERS = [
  {
    id: 'ORD-2024-001',
    customer: 'Budi Santoso',
    items: 'Ayam Geprek Sambal Ijo x2, Es Teh x2',
    total: 46000,
    status: 'pending',
    time: '2 menit lalu',
  },
  {
    id: 'ORD-2024-002',
    customer: 'Siti Rahayu',
    items: 'Paket Komplit 2 Orang',
    total: 40000,
    status: 'confirmed',
    time: '5 menit lalu',
  },
  {
    id: 'ORD-2024-003',
    customer: 'Ahmad Dani',
    items: 'Ayam Geprek Keju, Es Campur',
    total: 32000,
    status: 'processing',
    time: '10 menit lalu',
  },
  {
    id: 'ORD-2024-004',
    customer: 'Dewi Sartika',
    items: 'Ayam Geprek Sambal Merah x3',
    total: 54000,
    status: 'completed',
    time: '15 menit lalu',
  },
  {
    id: 'ORD-2024-005',
    customer: 'Rudi Hartono',
    items: 'Paket Nasi + Ayam Geprek + Es Teh',
    total: 22000,
    status: 'completed',
    time: '20 menit lalu',
  },
]

// Mock Low Stock Products
const LOW_STOCK_PRODUCTS = [
  { name: 'Ayam Geprek Keju', stock: 3, minStock: 5 },
  { name: 'Es Campur', stock: 4, minStock: 10 },
  { name: 'Paket Komplit 2 Orang', stock: 2, minStock: 5 },
]

interface DynamicTab {
  id: string
  name: string
  label: string
  icon?: string
  order: number
  isActive: boolean
  pages: any[]
}

type AdminView = 'dashboard' | 'products' | 'categories' | 'orders' | 'members' | 'promos' | 'reports' | 'shifts' | 'payment-methods' | 'qris' | 'page-builder' | string

export default function AdminDashboard() {
  const { setCurrentView } = useUIStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState<AdminView>('dashboard')
  const [dynamicTabs, setDynamicTabs] = useState<DynamicTab[]>([])
  const [selectedDynamicPage, setSelectedDynamicPage] = useState<any>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'processing':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Load dynamic tabs on mount
  useEffect(() => {
    let isMounted = true
    const loadDynamicTabs = async () => {
      try {
        const response = await fetch('/api/dynamic/tabs')
        if (response.ok && isMounted) {
          const data = await response.json()
          if (data.success && isMounted) {
            setDynamicTabs(data.data)
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading dynamic tabs:', error)
        }
      }
    }

    loadDynamicTabs()

    return () => {
      isMounted = false
    }
  }, [])

  const sidebarItems = [
    { id: 'dashboard' as AdminView, icon: Home, label: 'Dashboard' },
    { id: 'orders' as AdminView, icon: ShoppingCart, label: 'Pesanan' },
    { id: 'products' as AdminView, icon: ProductIcon, label: 'Produk' },
    { id: 'categories' as AdminView, icon: Package, label: 'Kategori' },
    { id: 'members' as AdminView, icon: UserCheck, label: 'Member' },
    { id: 'promos' as AdminView, icon: Tag, label: 'Promo' },
    { id: 'shifts' as AdminView, icon: Users, label: 'Shift Kasir' },
    { id: 'reports' as AdminView, icon: FileText, label: 'Laporan' },
    { id: 'payment-methods' as AdminView, icon: CreditCard, label: 'Metode Pembayaran' },
    { id: 'qris' as AdminView, icon: QrCode, label: 'QRIS' },
    { id: 'page-builder' as AdminView, icon: LayoutTemplate, label: 'Page Builder' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-orange-600 to-orange-800 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm truncate">{RESTAURANT_INFO.name}</h1>
                <p className="text-xs opacity-75">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start ${
                  activeView === item.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => {
                  setActiveView(item.id)
                  setSelectedDynamicPage(null)
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </Button>
            ))}

            {/* Dynamic Tabs */}
            {dynamicTabs.length > 0 && <Separator className="my-4 bg-white/20" />}

            {dynamicTabs.map((tab) => (
              <div key={tab.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    activeView === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => {
                    setActiveView(tab.id)
                    setSelectedDynamicPage(null)
                  }}
                >
                  <Layers className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="ml-3">{tab.label}</span>}
                </Button>

                {/* Dynamic Pages in this tab */}
                {sidebarOpen && activeView === tab.id && tab.pages.length > 0 && (
                  <div className="ml-8 mt-1 space-y-1">
                    {tab.pages.map((page: any) => (
                      <Button
                        key={page.id}
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start text-sm ${
                          selectedDynamicPage?.id === page.id
                            ? 'bg-white/20 text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedDynamicPage(page)}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="ml-2">{page.title}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Button
            variant="ghost"
            className={`w-full justify-start text-white/80 hover:text-white hover:bg-white/10`}
            onClick={() => setCurrentView('customer')}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="ml-3">Keluar</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-orange-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  {sidebarItems.find((i) => i.id === activeView)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {STATISTICS.pendingOrders > 0 && (
                <Badge className="bg-orange-500 hover:bg-orange-600 cursor-pointer">
                  {STATISTICS.pendingOrders} Pesanan Baru
                </Badge>
              )}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <span className="hidden md:inline">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-orange-100 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Penjualan Hari Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{formatPrice(STATISTICS.todaySales)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          +12% dari kemarin
                        </p>
                      </div>
                      <DollarSign className="w-10 h-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-100 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pesanan Hari Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{STATISTICS.todayOrders}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          +8% dari kemarin
                        </p>
                      </div>
                      <ShoppingCart className="w-10 h-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-100 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Member</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{STATISTICS.totalMembers}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          +5 minggu ini
                        </p>
                      </div>
                      <Users className="w-10 h-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-100 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stok Menipis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-red-600">{STATISTICS.lowStockProducts}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Produk perlu restock
                        </p>
                      </div>
                      <AlertCircle className="w-10 h-10 text-red-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section - Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-orange-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      Grafik Penjualan Mingguan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-16 h-16 mx-auto opacity-50" />
                        <p>Grafik penjualan akan ditampilkan di sini</p>
                        <p className="text-sm">Total Minggu Ini: {formatPrice(STATISTICS.weekSales)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      Grafik Penjualan Bulanan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-16 h-16 mx-auto opacity-50" />
                        <p>Grafik penjualan akan ditampilkan di sini</p>
                        <p className="text-sm">Total Bulan Ini: {formatPrice(STATISTICS.monthSales)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders & Low Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-orange-100">
                  <CardHeader>
                    <CardTitle>Pesanan Terbaru</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {RECENT_ORDERS.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{order.customer}</p>
                              <Badge className={getStatusColor(order.status)} variant="outline">
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{order.items}</p>
                            <p className="text-xs text-orange-600 font-medium mt-1">
                              {formatPrice(order.total)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{order.time}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      Produk Stok Menipis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {LOW_STOCK_PRODUCTS.map((product) => (
                        <div
                          key={product.name}
                          className="flex items-center justify-between p-3 rounded-lg bg-red-50"
                        >
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Min: {product.minStock} | Saat ini: {product.stock}
                            </p>
                          </div>
                          <Badge className="bg-red-500 text-white">{product.stock} sisa</Badge>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setActiveView('products')}
                    >
                      Kelola Stok
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Dynamic view rendering */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard content... */}
            </div>
          )}
          {activeView === 'orders' && <OrderManagement />}
          {activeView === 'products' && <ProductManagement />}
          {activeView === 'members' && <MemberManagement />}
          {activeView === 'promos' && <PromoManagement />}
          {activeView === 'shifts' && <ShiftManagement />}
          {activeView === 'reports' && <ReportsPage />}
          {activeView === 'categories' && <CategoryManagement />}
          {activeView === 'payment-methods' && <PaymentMethods />}
          {activeView === 'qris' && (
            <div className="max-w-2xl">
              <QRISUpload />
            </div>
          )}
          {activeView === 'page-builder' && <PageBuilder />}

          {/* Dynamic Pages */}
          {dynamicTabs.find((t) => t.id === activeView) && !selectedDynamicPage && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-orange-600">
                {dynamicTabs.find((t) => t.id === activeView)?.label}
              </h2>
              <Card className="border-orange-100">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Pilih halaman dari sidebar untuk melihat konten</p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedDynamicPage && <DynamicPageViewer page={selectedDynamicPage} />}
        </ScrollArea>
      </main>
    </div>
  )
}
