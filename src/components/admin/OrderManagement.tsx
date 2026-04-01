'use client'

import { useState, useMemo, useEffect } from 'react'
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
  AlertCircle,
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

// Types
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'DELIVERED'
type PaymentMethod = 'CASH' | 'QRIS_CPM' | 'DEBIT' | 'CREDIT' | 'TRANSFER' | 'E_WALLET' | 'SPLIT'
type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  discount: number
  subtotal: number
  product: {
    id: string
    name: string
    image: string | null
  }
}

interface Member {
  id: string
  name: string
  phone: string
  points: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  status: OrderStatus
  totalAmount: number
  discountAmount: number
  pointsUsed: number
  pointsEarned: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  member: Member | null
}

interface OrderResponse {
  success: boolean
  data: Order[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch orders function
  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/orders?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data: OrderResponse = await response.json()
      
      if (data.success && data.data) {
        setOrders(data.data)
        if (data.pagination) {
          setTotal(data.pagination.total)
          setTotalPages(data.pagination.totalPages)
        }
      } else {
        throw new Error('Failed to fetch orders')
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pesanan')
      toast({
        title: 'Error',
        description: 'Gagal memuat pesanan',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    fetchOrders()
  }, [selectedStatus, searchQuery, page])

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedStatus, searchQuery, page])

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update order status')
      }

      const result = await response.json()
      
      if (result.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
          )
        )
        
        toast({
          title: 'Status Pesanan Diperbarui',
          description: `Pesanan berhasil diubah menjadi ${newStatus}`,
        })

        // Close detail dialog if open
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      } else {
        throw new Error(result.error || 'Failed to update order')
      }
    } catch (err: any) {
      toast({
        title: 'Gagal Update Status',
        description: err.message || 'Terjadi kesalahan',
        variant: 'destructive'
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Filter orders locally (for search)
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders
    
    const lowerQuery = searchQuery.toLowerCase()
    return orders.filter((order) => 
      order.orderNumber.toLowerCase().includes(lowerQuery) ||
      order.customerName.toLowerCase().includes(lowerQuery) ||
      order.customerPhone.includes(lowerQuery)
    )
  }, [orders, searchQuery])

  // Count orders by status
  const statusCounts = useMemo(() => {
    return {
      all: total,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      confirmed: orders.filter((o) => o.status === 'CONFIRMED').length,
      processing: orders.filter((o) => o.status === 'PROCESSING').length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    }
  }, [orders, total])

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
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
      case 'DELIVERED':
        return 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Get status label
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Menunggu'
      case 'CONFIRMED': return 'Dikonfirmasi'
      case 'PROCESSING': return 'Diproses'
      case 'COMPLETED': return 'Selesai'
      case 'CANCELLED': return 'Dibatalkan'
      case 'DELIVERED': return 'Dikirim'
      default: return status
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
      case 'FAILED':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'REFUNDED':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Action buttons based on status
  const getActionButtons = (order: Order) => {
    if (updatingStatus === order.id) {
      return (
        <Button size="sm" disabled>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </Button>
      )
    }

    switch (order.status) {
      case 'PENDING':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
            >
              <Check className="w-4 h-4 mr-1" />
              Terima
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
            >
              <X className="w-4 h-4 mr-1" />
              Tolak
            </Button>
          </div>
        )
      case 'CONFIRMED':
        return (
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Proses
          </Button>
        )
      case 'PROCESSING':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
          >
            <Check className="w-4 h-4 mr-1" />
            Selesai
          </Button>
        )
      case 'COMPLETED':
        return (
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
          >
            <Package className="w-4 h-4 mr-1" />
            Dikirim
          </Button>
        )
      case 'DELIVERED':
        return (
          <Badge className="bg-teal-100 text-teal-700 border-teal-200">
            <Check className="w-3 h-3 mr-1" />
            Selesai Dikirim
          </Badge>
        )
      case 'CANCELLED':
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
    { value: 'PENDING', label: 'Menunggu', icon: Clock },
    { value: 'CONFIRMED', label: 'Dikonfirmasi', icon: Check },
    { value: 'PROCESSING', label: 'Diproses', icon: RefreshCw },
    { value: 'COMPLETED', label: 'Selesai', icon: Check },
    { value: 'DELIVERED', label: 'Dikirim', icon: Package },
    { value: 'CANCELLED', label: 'Dibatalkan', icon: X },
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchOrders()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
              placeholder="Cari berdasarkan nomor pesanan, nama, atau nomor telepon pelanggan..."
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
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => fetchOrders()}>Coba Lagi</Button>
            </div>
          ) : loading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mb-3" />
              <p className="text-muted-foreground">Memuat pesanan...</p>
            </div>
          ) : (
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
                              {order.items.map((item) => `${item.product.name} x${item.quantity}`).join(', ')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-orange-600">
                          {formatPrice(order.totalAmount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
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
                            {getStatusLabel(order.status)}
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
          )}
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
                    {getStatusLabel(selectedOrder.status)}
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
                      {selectedOrder.member && (
                        <>
                          <Separator className="bg-orange-200" />
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium">{selectedOrder.member.name} - {selectedOrder.member.points} Poin</p>
                              <p className="text-sm text-muted-foreground">Member</p>
                            </div>
                          </div>
                        </>
                      )}
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
                            <TableRow key={item.id || index}>
                              <TableCell className="font-medium">{item.product.name}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatPrice(item.subtotal)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {selectedOrder.discountAmount > 0 && (
                            <TableRow className="bg-red-50">
                              <TableCell colSpan={3} className="text-right font-medium text-red-700">
                                Diskon
                              </TableCell>
                              <TableCell className="text-right font-semibold text-red-700">
                                -{formatPrice(selectedOrder.discountAmount)}
                              </TableCell>
                            </TableRow>
                          )}
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
                      {selectedOrder.pointsUsed > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-700">
                            <span className="font-semibold">{selectedOrder.pointsUsed} poin</span> digunakan (Rp {selectedOrder.pointsUsed * 100})
                          </p>
                        </div>
                      )}
                      {selectedOrder.pointsEarned > 0 && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">
                            <span className="font-semibold">+{selectedOrder.pointsEarned} poin</span> didapat dari pesanan ini
                          </p>
                        </div>
                      )}
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
                      <Separator className="bg-orange-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Update Terakhir</span>
                        <span className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleString('id-ID')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedOrder.notes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Catatan
                    </h3>
                    <Card className="bg-yellow-50/50 border-yellow-100">
                      <CardContent className="pt-6">
                        <p className="text-sm text-yellow-800">{selectedOrder.notes}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

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
