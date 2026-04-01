'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Check,
  X,
  Clock,
  ChevronRight,
  Phone,
  MapPin,
  CreditCard,
  Package,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'

// Mock Data
const MOCK_ORDERS = [
  {
    id: 'ORD-2024-001',
    orderNumber: 'ORD-2024-001',
    customerName: 'Budi Santoso',
    customerPhone: '081234567890',
    customerAddress: 'Jl. Merdeka No. 123, Banda Aceh',
    items: [
      { name: 'Ayam Geprek Sambal Ijo', quantity: 2, price: 23000 },
      { name: 'Es Teh Manis', quantity: 2, price: 5000 },
    ],
    totalAmount: 56000,
    status: 'pending' as const,
    paymentMethod: 'QRIS_CPM' as const,
    paymentStatus: 'PAID' as const,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-002',
    orderNumber: 'ORD-2024-002',
    customerName: 'Siti Rahayu',
    customerPhone: '082345678901',
    customerAddress: 'Jl. Sudirman No. 45, Banda Aceh',
    items: [
      { name: 'Paket Komplit 2 Orang', quantity: 1, price: 40000 },
    ],
    totalAmount: 40000,
    status: 'confirmed' as const,
    paymentMethod: 'E_WALLET' as const,
    paymentStatus: 'PAID' as const,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-003',
    orderNumber: 'ORD-2024-003',
    customerName: 'Ahmad Dani',
    customerPhone: '083456789012',
    customerAddress: 'Jl. Gatot Subroto No. 78, Banda Aceh',
    items: [
      { name: 'Ayam Geprek Keju', quantity: 1, price: 27000 },
      { name: 'Es Campur', quantity: 1, price: 15000 },
    ],
    totalAmount: 42000,
    status: 'processing' as const,
    paymentMethod: 'CASH' as const,
    paymentStatus: 'PENDING' as const,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-004',
    orderNumber: 'ORD-2024-004',
    customerName: 'Dewi Sartika',
    customerPhone: '084567890123',
    customerAddress: 'Jl. Diponegoro No. 23, Banda Aceh',
    items: [
      { name: 'Ayam Geprek Sambal Merah', quantity: 3, price: 22000 },
    ],
    totalAmount: 66000,
    status: 'completed' as const,
    paymentMethod: 'QRIS_CPM' as const,
    paymentStatus: 'PAID' as const,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-005',
    orderNumber: 'ORD-2024-005',
    customerName: 'Rudi Hartono',
    customerPhone: '085678901234',
    customerAddress: 'Jl. Teuku Umar No. 56, Banda Aceh',
    items: [
      { name: 'Paket Nasi + Ayam Geprek', quantity: 1, price: 22000 },
      { name: 'Es Teh Manis', quantity: 1, price: 5000 },
    ],
    totalAmount: 27000,
    status: 'completed' as const,
    paymentMethod: 'E_WALLET' as const,
    paymentStatus: 'PAID' as const,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-2024-006',
    orderNumber: 'ORD-2024-006',
    customerName: 'Maya Sari',
    customerPhone: '086789012345',
    customerAddress: 'Jl. Imam Bonjol No. 89, Banda Aceh',
    items: [
      { name: 'Ayam Geprek Sambal Ijo', quantity: 1, price: 23000 },
    ],
    totalAmount: 23000,
    status: 'cancelled' as const,
    paymentMethod: 'QRIS_CPM' as const,
    paymentStatus: 'EXPIRED' as const,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
]

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
type PaymentMethod = 'CASH' | 'QRIS_CPM' | 'E_WALLET'
type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  createdAt: string
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
      const matchesSearch =
        searchQuery === '' ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [orders, selectedStatus, searchQuery])

  // Count orders by status
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders])

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam lalu`
    return date.toLocaleDateString('id-ID')
  }

  // Get status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
      case 'processing':
        return 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Get payment status color
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'EXPIRED':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Update order status
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
    toast({
      title: 'Status Pesanan Diperbarui',
      description: `Pesanan ${orderId} sekarang ${newStatus}`,
    })
  }

  // Action buttons based on status
  const getActionButtons = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => updateOrderStatus(order.id, 'confirmed')}
            >
              <Check className="w-4 h-4 mr-1" />
              Terima
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateOrderStatus(order.id, 'cancelled')}
            >
              <X className="w-4 h-4 mr-1" />
              Tolak
            </Button>
          </div>
        )
      case 'confirmed':
        return (
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => updateOrderStatus(order.id, 'processing')}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Proses
          </Button>
        )
      case 'processing':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => updateOrderStatus(order.id, 'completed')}
          >
            <Check className="w-4 h-4 mr-1" />
            Selesai
          </Button>
        )
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            Selesai
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <X className="w-3 h-3 mr-1" />
            Dibatalkan
          </Badge>
        )
      default:
        return null
    }
  }

  // Status filter buttons
  const statusFilters: Array<{ value: OrderStatus | 'all'; label: string; icon: any }> = [
    { value: 'all', label: 'Semua', icon: Package },
    { value: 'pending', label: 'Menunggu', icon: Clock },
    { value: 'confirmed', label: 'Dikonfirmasi', icon: Check },
    { value: 'processing', label: 'Diproses', icon: RefreshCw },
    { value: 'completed', label: 'Selesai', icon: Check },
    { value: 'cancelled', label: 'Dibatalkan', icon: X },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Manajemen Pesanan Online
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola semua pesanan yang masuk dari aplikasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      <Card className="border-orange-100">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const Icon = filter.icon
              const isActive = selectedStatus === filter.value
              const count = statusCounts[filter.value as keyof typeof statusCounts]

              return (
                <Button
                  key={filter.value}
                  variant={isActive ? 'default' : 'outline'}
                  className={`${
                    isActive
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'hover:bg-orange-50 hover:border-orange-300'
                  }`}
                  onClick={() => setSelectedStatus(filter.value)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {filter.label}
                  <Badge
                    className={`ml-2 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                    }`}
                    variant="secondary"
                  >
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card className="border-orange-100">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nomor pesanan atau nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-orange-200 focus:border-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Pesanan</span>
            <Badge variant="outline" className="border-orange-200 text-orange-700">
              {filteredOrders.length} Pesanan
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] rounded-md border border-orange-100">
            <Table>
              <TableHeader className="bg-orange-50">
                <TableRow>
                  <TableHead className="w-[140px]">Nomor Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="hidden md:table-cell">Item</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden sm:table-cell">Pembayaran</TableHead>
                  <TableHead className="hidden lg:table-cell">Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Tidak ada pesanan ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-orange-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="font-medium text-orange-700">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">
                            {order.customerPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-[200px]">
                          <p className="text-sm truncate">
                            {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatPrice(order.totalAmount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {order.paymentMethod}
                          </Badge>
                          <br />
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPaymentStatusColor(order.paymentStatus)}`}
                          >
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {formatTime(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)} variant="outline">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {getActionButtons(order)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="text-xl font-bold">{selectedOrder.orderNumber}</span>
                  <Badge className={getStatusColor(selectedOrder.status)} variant="outline">
                    {selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    Informasi Pelanggan
                  </h3>
                  <Card className="bg-orange-50/50 border-orange-100">
                    <CardContent className="pt-6 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedOrder.customerName}</p>
                          <p className="text-sm text-muted-foreground">Nama Pelanggan</p>
                        </div>
                      </div>
                      <Separator className="bg-orange-200" />
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedOrder.customerPhone}</p>
                          <p className="text-sm text-muted-foreground">Nomor Telepon</p>
                        </div>
                      </div>
                      <Separator className="bg-orange-200" />
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedOrder.customerAddress}</p>
                          <p className="text-sm text-muted-foreground">Alamat Pengiriman</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    Detail Pesanan
                  </h3>
                  <Card className="border-orange-100">
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Harga</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatPrice(item.quantity * item.price)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-orange-50">
                            <TableCell colSpan={3} className="text-right font-bold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-bold text-orange-600 text-lg">
                              {formatPrice(selectedOrder.totalAmount)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    Informasi Pembayaran
                  </h3>
                  <Card className="bg-orange-50/50 border-orange-100">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Metode Pembayaran</span>
                        <Badge variant="outline">{selectedOrder.paymentMethod}</Badge>
                      </div>
                      <Separator className="bg-orange-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status Pembayaran</span>
                        <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)} variant="outline">
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                      <Separator className="bg-orange-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Waktu Pesanan</span>
                        <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('id-ID')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Tutup
                  </Button>
                  <div className="flex gap-2">
                    {getActionButtons(selectedOrder)}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
