'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  Barcode,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  DollarSign,
  Receipt,
  ArrowLeft,
  LogOut,
  Printer,
  Loader2,
  RefreshCw,
  Shield,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Ticket,
  QrCode,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePOSStore, POSItem } from '@/stores/pos-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/hooks/use-toast'
import POSPaymentMethods from './POSPaymentMethods'

// Restaurant Info
const RESTAURANT_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
  phone: '085260812758',
}

// Types for API responses
type Product = {
  id: string
  name: string
  price: number
  cost?: number
  barcode?: string
  sku?: string
  categoryId?: string
  category?: {
    id: string
    name: string
    icon?: string
  }
  stock: number
  image?: string
  isActive: boolean
}

type Category = {
  id: string
  name: string
  icon?: string
  color?: string
  productCount?: number
  isActive: boolean
}

type Member = {
  id: string
  name: string
  phone: string
  email?: string
  points: number
  tier?: string
}

type Shift = {
  id: string
  cashierId: string
  cashierName: string
  openingBalance: number
  totalSales: number
  cashSales: number
  nonCashSales: number
  status: 'OPEN' | 'CLOSED'
  openedAt: Date
  closedAt?: Date
}

type TransactionReceipt = {
  transactionNo: string
  items: Array<{
    productName: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  discountAmount: number
  total: number
  paymentMethod: string
  cashReceived: number
  change?: number
  member?: {
    name: string
    points: number
  }
  createdAt: Date
  cashierName: string
}

export default function POSInterface() {
  const { user } = useAuthStore()
  const {
    items,
    selectedCategory,
    searchQuery,
    discountAmount,
    taxRate,
    member,
    addItem,
    removeItem,
    updateItemQuantity,
    clearItems,
    setSelectedCategory,
    setSearchQuery,
    setDiscount,
    setMember,
    clearMember,
    getSubtotal,
    getTaxAmount,
    getTotal,
  } = usePOSStore()

  const { setCurrentView } = useUIStore()
  
  // State
  const [showPayment, setShowPayment] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'QRIS' | 'VOUCHER' | 'E_WALLET' | 'CARD' | 'BANK_TRANSFER'>('CASH')
  const [qrisQrCode, setQrisQrCode] = useState<string | null>(null)
  const [isLoadingQris, setIsLoadingQris] = useState(false)
  const [ewalletNumber, setEwalletNumber] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [bankTransferNumber, setBankTransferNumber] = useState('')
  const [bankTransferName, setBankTransferName] = useState('')
  const [showShiftDialog, setShowShiftDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [transactionReceipt, setTransactionReceipt] = useState<TransactionReceipt | null>(null)
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Authorization states
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authAction, setAuthAction] = useState<'closeShift' | 'voidItem' | null>(null)
  const [authPin, setAuthPin] = useState('')
  const [voidItemId, setVoidItemId] = useState<string | null>(null)
  
  // Loading states
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingShift, setIsLoadingShift] = useState(true)
  const [isOpeningShift, setIsOpeningShift] = useState(false)
  const [isClosingShift, setIsClosingShift] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isSearchingMember, setIsSearchingMember] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false)
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false)
  
  // Error states
  const [productsError, setProductsError] = useState<string | null>(null)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [shiftError, setShiftError] = useState<string | null>(null)

  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const productsRef = useRef<Product[]>([])

  // Load products on mount
  useEffect(() => {
    loadProducts()
    loadCategories()
    checkCurrentShift()
  }, [])

  // Focus barcode input when component mounts or shift changes
  useEffect(() => {
    if (barcodeInputRef.current && currentShift) {
      barcodeInputRef.current.focus()
    }
  }, [currentShift])

  // Fetch QRIS code when payment dialog opens
  useEffect(() => {
    if (showPayment) {
      fetchQrisQrCode()
    }
  }, [showPayment])

  // API Functions
  const loadProducts = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setIsLoadingProducts(true)
    } else {
      setIsBackgroundSyncing(true)
    }
    setProductsError(null)
    try {
      const response = await fetch('/api/products?includeInactive=false')

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setProductsError(data.error || 'Gagal memuat produk')
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
        return
      }

      const data = await response.json()

      if (data.success) {
        const newProducts = data.data
        // Only update if data actually changed
        const hasChanged = JSON.stringify(newProducts) !== JSON.stringify(productsRef.current)
        if (hasChanged) {
          productsRef.current = newProducts
          setProducts(newProducts)
        }
      } else {
        setProductsError(data.error || 'Gagal memuat produk')
      }
    } catch (error) {
      setProductsError('Gagal terhubung ke server')
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoadingProducts(false)
      } else {
        setIsBackgroundSyncing(false)
      }
    }
  }

  const loadCategories = async () => {
    setIsLoadingCategories(true)
    setCategoriesError(null)
    try {
      const response = await fetch('/api/categories/active?includeProductCount=true')
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setCategoriesError(data.error || 'Gagal memuat kategori')
        }
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data)
      } else {
        setCategoriesError(data.error || 'Gagal memuat kategori')
      }
    } catch (error) {
      setCategoriesError('Gagal terhubung ke server')
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const checkCurrentShift = async () => {
    setIsLoadingShift(true)
    setShiftError(null)
    try {
      const response = await fetch('/api/shifts/current')
      
      if (!response.ok) {
        setCurrentShift(null)
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setCurrentShift(data.data)
      } else {
        setCurrentShift(null)
      }
    } catch (error) {
      setCurrentShift(null)
    } finally {
      setIsLoadingShift(false)
    }
  }

  const fetchQrisQrCode = async () => {
    setIsLoadingQris(true)
    try {
      const response = await fetch('/api/settings/qris')
      const data = await response.json()

      if (data.success && data.data) {
        setQrisQrCode(data.data)
      }
    } catch (error) {
      console.error('Error fetching QRIS QR code:', error)
    } finally {
      setIsLoadingQris(false)
    }
  }

  const handleOpenShift = async () => {
    const balance = parseFloat(openingBalance)
    if (isNaN(balance) || balance < 0) {
      toast({
        title: 'Error',
        description: 'Modal awal tidak valid',
        variant: 'destructive',
      })
      return
    }

    setIsOpeningShift(true)
    try {
      const response = await fetch('/api/shifts/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openingBalance: balance,
          notes: '',
        }),
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          toast({
            title: 'Error',
            description: data.error || 'Gagal membuka shift',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: `Server error: ${response.status}`,
            variant: 'destructive',
          })
        }
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCurrentShift(data.data)
        setShowShiftDialog(false)
        setOpeningBalance('')
        toast({
          title: 'Shift Dibuka',
          description: `Modal awal: Rp ${balance.toLocaleString('id-ID')}`,
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal membuka shift',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal terhubung ke server',
        variant: 'destructive',
      })
    } finally {
      setIsOpeningShift(false)
    }
  }

  const handleCloseShiftWithAuth = () => {
    setShowAuthDialog(true)
    setAuthAction('closeShift')
    setAuthPin('')
  }

  const handleCloseShift = async () => {
    if (!currentShift) return
    
    setIsClosingShift(true)
    try {
      const response = await fetch(`/api/shifts/${currentShift.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          physicalBalance: currentShift.openingBalance + currentShift.cashSales,
          notes: '',
        }),
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          toast({
            title: 'Error',
            description: data.error || 'Gagal menutup shift',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: `Server error: ${response.status}`,
            variant: 'destructive',
          })
        }
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setCurrentShift(null)
        clearItems()
        clearMember()
        setShowAuthDialog(false)
        toast({
          title: 'Shift Ditutup',
          description: `Total Penjualan: Rp ${data.reconciliation.totalSales.toLocaleString('id-ID')}`,
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal menutup shift',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal terhubung ke server',
        variant: 'destructive',
      })
    } finally {
      setIsClosingShift(false)
    }
  }

  const handleVerifyAuth = async () => {
    // Simple PIN validation (PIN admin: 123456)
    if (authPin === '123456') {
      setIsVerifyingAuth(true)
      
      if (authAction === 'closeShift') {
        await handleCloseShift()
      } else if (authAction === 'voidItem' && voidItemId) {
        removeItem(voidItemId)
        setVoidItemId(null)
        toast({
          title: 'Produk Dihapus',
          description: 'Produk berhasil di-void dengan otorisasi',
        })
      }
      
      setShowAuthDialog(false)
      setAuthPin('')
      setAuthAction(null)
      setIsVerifyingAuth(false)
    } else {
      toast({
        title: 'PIN Salah',
        description: 'PIN otorisasi tidak valid',
        variant: 'destructive',
      })
      setAuthPin('')
    }
  }

  const handleVoidItem = (productId: string) => {
    setVoidItemId(productId)
    setShowAuthDialog(true)
    setAuthAction('voidItem')
    setAuthPin('')
  }

  const handleSearchMember = async (phone: string) => {
    if (!phone || phone.length < 10) {
      toast({
        title: 'Error',
        description: 'Nomor telepon tidak valid',
        variant: 'destructive',
      })
      return
    }

    setIsSearchingMember(true)
    try {
      const response = await fetch(`/api/members/phone/${phone}`)
      
      if (!response.ok) {
        toast({
          title: 'Error',
          description: 'Gagal mencari member',
          variant: 'destructive',
        })
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setMember({
          id: data.data.id,
          name: data.data.name,
          phone: data.data.phone,
          points: data.data.points,
        })
        toast({
          title: 'Member Ditemukan',
          description: `${data.data.name} - ${data.data.points} Poin`,
        })
      } else {
        toast({
          title: 'Member Tidak Ditemukan',
          description: 'Nomor telepon tidak terdaftar',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mencari member',
        variant: 'destructive',
      })
    } finally {
      setIsSearchingMember(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([loadProducts(), loadCategories(), checkCurrentShift()])
    setIsRefreshing(false)
    toast({
      title: 'Data Diperbarui',
      description: 'Produk dan kategori berhasil dimuat ulang',
    })
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !selectedCategory || selectedCategory === 'all' || product.categoryId === selectedCategory
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  const allCategories = useMemo(() => [
    { id: 'all', name: 'Semua', icon: '🍽️', isActive: true },
    ...categories,
  ], [categories])

  const handleBarcodeScan = async (value: string) => {
    const product = products.find(
      (p) => p.barcode === value || p.sku?.toLowerCase() === value.toLowerCase()
    )

    if (product) {
      if (product.stock <= 0) {
        toast({
          title: 'Stok Habis',
          description: `${product.name} sudah habis stok`,
          variant: 'destructive',
        })
        return
      }

      const cartItem = items.find(i => i.productId === product.id)
      const currentQuantity = cartItem?.quantity || 0
      
      if (currentQuantity >= product.stock) {
        toast({
          title: 'Stok Tidak Mencukupi',
          description: `Hanya tersedia ${product.stock} unit`,
          variant: 'destructive',
        })
        return
      }

      addItem({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        cost: product.cost,
        barcode: product.barcode,
        quantity: 1,
      })

      toast({
        title: 'Produk Ditambahkan',
        description: product.name,
      })
    } else {
      toast({
        title: 'Produk Tidak Ditemukan',
        description: `Barcode/SKU: ${value}`,
        variant: 'destructive',
      })
    }

    setSearchQuery('')
  }

  const handleAddProduct = (product: Product) => {
    if (product.stock <= 0) {
      toast({
        title: 'Stok Habis',
        description: `${product.name} sudah habis stok`,
        variant: 'destructive',
      })
      return
    }

    const cartItem = items.find(i => i.productId === product.id)
    const currentQuantity = cartItem?.quantity || 0

    if (currentQuantity >= product.stock) {
      toast({
        title: 'Stok Tidak Mencukupi',
        description: `Hanya tersedia ${product.stock} unit`,
        variant: 'destructive',
      })
      return
    }

    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      price: product.price,
      cost: product.cost,
      barcode: product.barcode,
      quantity: 1,
    })

    // Focus back to barcode input for quick scanning
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  const handleUpdateItemQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId)
    
    if (product && quantity > product.stock) {
      toast({
        title: 'Stok Tidak Mencukupi',
        description: `Hanya tersedia ${product.stock} unit`,
        variant: 'destructive',
      })
      return
    }
    
    updateItemQuantity(productId, quantity)
  }

  const handlePayment = async () => {
    const total = getSubtotal() // No tax, use subtotal directly

    if (total <= 0) {
      toast({
        title: 'Keranjang Kosong',
        description: 'Tambahkan produk sebelum checkout',
        variant: 'destructive',
      })
      return
    }

    // Validate payment based on method
    let cash = 0
    if (selectedPaymentMethod === 'CASH') {
      cash = parseFloat(cashReceived)
      if (isNaN(cash) || cash < total) {
        toast({
          title: 'Pembayaran Kurang',
          description: 'Uang tunai kurang dari total',
          variant: 'destructive',
        })
        return
      }
    } else {
      // For non-cash payments, set cash to total
      cash = total
    }

    // Build payment details for notes
    let paymentDetails = ''
    if (selectedPaymentMethod === 'E_WALLET' && ewalletNumber) {
      paymentDetails = `E-Wallet: ${ewalletNumber}`
    } else if (selectedPaymentMethod === 'VOUCHER' && voucherCode) {
      paymentDetails = `Voucher: ${voucherCode}`
    } else if (selectedPaymentMethod === 'CARD' && cardNumber) {
      paymentDetails = `Kartu: ****${cardNumber.slice(-4)}`
    } else if (selectedPaymentMethod === 'BANK_TRANSFER' && bankTransferName && bankTransferNumber) {
      paymentDetails = `Transfer: ${bankTransferName} - ${bankTransferNumber}`
    }

    if (!currentShift) {
      toast({
        title: 'Error',
        description: 'Tidak ada shift yang aktif',
        variant: 'destructive',
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      const transactionData = {
        cashierId: currentShift.cashierId,
        shiftId: currentShift.id,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: 0,
          cost: item.cost || 0,
        })),
        paymentMethod: selectedPaymentMethod,
        discountAmount,
        taxAmount: 0, // No tax
        cashReceived: cash,
        memberId: member?.id || undefined,
        notes: paymentDetails || '',
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          toast({
            title: 'Error',
            description: data.error || 'Gagal memproses transaksi',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: `Server error: ${response.status}`,
            variant: 'destructive',
          })
        }
        return
      }

      const data = await response.json()

      if (data.success) {
        const subtotal = getSubtotal()
        const total = subtotal - discountAmount
        
        // Store transaction receipt data before clearing cart
        setTransactionReceipt({
          transactionNo: data.data.transactionNo,
          items: items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
          subtotal,
          discountAmount,
          total,
          paymentMethod: selectedPaymentMethod,
          cashReceived,
          change: selectedPaymentMethod === 'CASH' ? (cashReceived - total) : 0,
          member: member ? {
            name: member.name,
            points: member.points,
          } : undefined,
          createdAt: new Date(),
          cashierName: currentShift?.cashierName || user?.name || 'Unknown',
        })
        
        setShowPayment(false)
        setShowReceipt(true)
        clearItems()
        clearMember()
        setCashReceived('')
        setEwalletNumber('')
        setVoucherCode('')
        setCardNumber('')
        setBankTransferNumber('')
        setBankTransferName('')
        
        await loadProducts()
        
        toast({
          title: 'Transaksi Berhasil',
          description: `No. ${data.data.transactionNo}`,
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal memproses transaksi',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal terhubung ke server',
        variant: 'destructive',
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Show shift opening dialog if no shift is open
  if (!currentShift) {
    if (isLoadingShift) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
            <p className="text-muted-foreground">Memeriksa shift aktif...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">BUKA SHIFT KASIR</CardTitle>
            <p className="text-muted-foreground">Masukkan modal awal kas</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Modal Awal (Rp)</label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  autoFocus
                  disabled={isOpeningShift}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600"
                onClick={handleOpenShift}
                disabled={isOpeningShift || !openingBalance}
              >
                {isOpeningShift && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isOpeningShift ? 'Membuka Shift...' : 'Buka Shift'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCurrentView('customer')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Menu Pelanggan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('customer')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                {RESTAURANT_INFO.name}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" />
                Kasir: {currentShift?.cashierName || user?.name || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Shift Aktif
            </Badge>
            {isBackgroundSyncing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Sync
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseShiftWithAuth}
              disabled={isClosingShift}
            >
              {isClosingShift && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <LogOut className="w-4 h-4 mr-2" />
              {isClosingShift ? 'Menutup...' : 'Tutup Shift'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barcode & Search */}
          <div className="p-4 border-b border-orange-100 bg-white">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="SCAN BARCODE / INPUT PLU"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeScan(searchQuery)
                    }
                  }}
                  className="pl-10 font-mono"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => handleBarcodeScan(searchQuery)}
                disabled={!searchQuery}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sticky Categories */}
          <div className="sticky top-0 z-10 bg-white border-b border-orange-100 shadow-sm">
            <div className="p-4 pt-3 pb-3">
              <div className="flex gap-2 overflow-x-auto">
                {isLoadingCategories ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-9 w-24 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                    ))}
                  </div>
                ) : (
                  allCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex-shrink-0 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : ''
                      }`}
                    >
                      <span className="mr-1">{category.icon}</span>
                      {category.name}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <ScrollArea className="flex-1 p-4">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Card key={i} className="border-orange-100">
                    <CardContent className="p-3">
                      <div className="h-24 mb-2 rounded-lg bg-gray-200 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : productsError ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-center py-12">
                <p className="text-red-600">{productsError}</p>
                <Button onClick={loadProducts} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 opacity-50" />
                <p>Tidak ada produk ditemukan</p>
                <p className="text-sm">Coba kategori lain atau ubah kata kunci pencarian</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-orange-100 ${product.stock <= 0 ? 'opacity-50' : ''}`}
                    onClick={() => product.stock > 0 && handleAddProduct(product)}
                  >
                    <CardContent className="p-3">
                      <div className="relative h-24 mb-2 rounded-lg overflow-hidden bg-orange-50">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <Badge className="absolute top-1 right-1 bg-orange-500 text-xs">
                            Stok: {product.stock}
                          </Badge>
                        )}
                        {product.stock === 0 && (
                          <Badge className="absolute top-1 right-1 bg-red-500 text-xs">
                            Habis
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
                      <p className="text-orange-600 font-bold">{formatPrice(product.price)}</p>
                      {product.barcode && (
                        <p className="text-xs text-muted-foreground">{product.barcode}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Cart & Payment */}
        <div className="w-96 border-l border-orange-100 bg-white flex flex-col h-full">
          {/* Member Section */}
          <div className="p-4 border-b border-orange-100 flex-shrink-0">
            {member ? (
              <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">{member.points} Poin</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-red-600"
                    onClick={clearMember}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Masukkan nomor HP member"
                  type="tel"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchMember(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  disabled={isSearchingMember}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const input = document.querySelector('input[type="tel"]') as HTMLInputElement
                    if (input?.value) {
                      handleSearchMember(input.value)
                      input.value = ''
                    }
                  }}
                  disabled={isSearchingMember}
                >
                  {isSearchingMember && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <User className="w-4 h-4 mr-2" />
                  Cari Member
                </Button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Keranjang kosong</p>
                  <p className="text-sm">Scan atau pilih produk</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <Card
                    key={item.productId}
                    className={`p-3 ${index >= 2 ? 'opacity-70' : ''}`}
                  >
                    <div className="flex gap-3">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                        <p className="text-orange-600 font-bold text-sm">
                          {formatPrice(item.price)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleUpdateItemQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleUpdateItemQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 ml-auto"
                            onClick={() => handleVoidItem(item.productId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Payment Panel - Sticky */}
          <div className="p-4 bg-gradient-to-br from-red-600 to-red-500 text-white space-y-3 flex-shrink-0 shadow-lg border-t border-red-400">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-90">Subtotal</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-90">Diskon</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span>{formatPrice(getSubtotal() - discountAmount)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-white text-red-600 hover:bg-orange-50 font-bold text-lg"
              size="lg"
              onClick={() => {
                if (getSubtotal() > 0) {
                  setShowPayment(true)
                } else {
                  toast({
                    title: 'Keranjang Kosong',
                    description: 'Tambahkan produk sebelum checkout',
                    variant: 'destructive',
                  })
                }
              }}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              BAYAR
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog - Modern Two-Column Layout */}
      <Dialog open={showPayment} onOpenChange={(open) => {
        setShowPayment(open)
        if (!open) {
          setSelectedPaymentMethod('CASH')
          setCashReceived('')
          setEwalletNumber('')
          setVoucherCode('')
          setCardNumber('')
          setBankTransferNumber('')
          setBankTransferName('')
        }
      }}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex flex-col h-full">
            {/* Left Panel - Order Summary (40%) */}
            <div className="w-2/5 border-r border-slate-200 bg-slate-50 flex flex-col h-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Ringkasan Pesanan
                </h2>
                <p className="text-sm text-orange-100 mt-1">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <ScrollArea className="flex-1 p-4 space-y-4">
                {/* Order Items Card */}
                <Card className="border-2 border-orange-200 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-3">
                    <div className="flex items-center justify-between text-white">
                      <span className="font-semibold flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Item Pesanan
                      </span>
                      <Badge className="bg-white text-orange-600 font-bold">{items.length}</Badge>
                    </div>
                  </div>
                  <div className="p-3 max-h-64 overflow-y-auto">
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={item.productId} className="flex gap-3 items-center">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-orange-100 border-2 border-orange-200">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-orange-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-800 truncate">{item.productName}</h4>
                            <p className="text-xs text-slate-600">{item.quantity} x {formatPrice(item.price)}</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="font-bold text-orange-600">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Cashier Info Card */}
                <Card className="border-2 border-blue-200 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium">KASIR</p>
                        <p className="font-bold text-slate-800">{currentShift?.cashierName || user?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-600">Shift: {currentShift?.id.slice(-6) || 'Active'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Member Info Card */}
                <Card className={`${member ? 'border-2 border-green-200' : 'border-2 border-slate-200'} shadow-md`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${member ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-slate-300'}`}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium">MEMBER</p>
                        {member ? (
                          <>
                            <p className="font-bold text-slate-800">{member.name}</p>
                            <p className="text-xs text-slate-600">{member.phone} • {member.points} Poin</p>
                          </>
                        ) : (
                          <p className="text-slate-400 text-sm">Tidak ada member</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Breakdown Card */}
                <Card className="border-2 border-slate-200 shadow-md bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-800">{formatPrice(getSubtotal())}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Diskon</span>
                        <span className="font-semibold text-green-600">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <Separator className="bg-slate-200" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-lg">Total</span>
                      <span className="font-bold text-2xl text-orange-600">{formatPrice(getSubtotal() - discountAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </div>

            {/* Right Panel - Payment Processing (60%) */}
            <div className="w-3/5 flex flex-col h-full bg-white">
              {/* Header */}
              <div className="border-b-2 border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      Pembayaran
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Total: <span className="font-bold text-orange-600 text-lg">{formatPrice(getSubtotal() - discountAmount)}</span>
                    </p>
                  </div>
                  {selectedPaymentMethod && (
                    <Badge className="text-xs px-3 py-1">
                      {selectedPaymentMethod === 'CASH' && 'Tunai'}
                      {selectedPaymentMethod === 'QRIS' && 'QRIS'}
                      {selectedPaymentMethod === 'E_WALLET' && 'E-Wallet'}
                      {selectedPaymentMethod === 'VOUCHER' && 'Voucher'}
                      {selectedPaymentMethod === 'CARD' && 'Kartu'}
                      {selectedPaymentMethod === 'BANK_TRANSFER' && 'Transfer Bank'}
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {/* Payment Methods - Scrollable */}
                  <POSPaymentMethods
                    selectedMethod={selectedPaymentMethod}
                    onMethodSelect={setSelectedPaymentMethod}
                    totalAmount={getSubtotal() - discountAmount}
                  />

                  <Separator className="bg-slate-200" />

                  {/* Payment Details by Method */}
                  <div className="space-y-4">
                    {/* Cash Payment */}
                    {selectedPaymentMethod === 'CASH' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 block">Uang Diterima</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-400" />
                            <Input
                              type="number"
                              value={cashReceived}
                              onChange={(e) => setCashReceived(e.target.value)}
                              placeholder="0"
                              autoFocus
                              className="pl-14 text-2xl font-bold h-14 border-2 border-slate-300 focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {[10000, 20000, 50000, 100000].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              className="h-12 font-semibold border-2 border-slate-300 hover:border-green-500 hover:bg-green-50"
                              onClick={() => setCashReceived(amount.toString())}
                            >
                              {formatPrice(amount)}
                            </Button>
                          ))}
                        </div>

                        {cashReceived && parseFloat(cashReceived) >= getSubtotal() - discountAmount && (
                          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-green-800 text-lg">Kembalian</p>
                                    <p className="text-sm text-green-600">Uang kembali</p>
                                  </div>
                                </div>
                                <p className="text-3xl font-bold text-green-700">
                                  {formatPrice(parseFloat(cashReceived) - (getSubtotal() - discountAmount))}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {cashReceived && parseFloat(cashReceived) > 0 && parseFloat(cashReceived) < getSubtotal() - discountAmount && (
                          <Card className="border-2 border-red-500 bg-gradient-to-br from-red-50 to-red-100 shadow-lg">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                  <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-red-800 text-lg">Kurang</p>
                                  <p className="text-sm text-red-600">
                                    {formatPrice((getSubtotal() - discountAmount) - parseFloat(cashReceived))}
                                  </p>
                                  <p className="text-xs text-red-500 mt-1">Uang tunai kurang dari total</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* QRIS Payment */}
                    {selectedPaymentMethod === 'QRIS' && (
                      <div className="space-y-4">
                        {isLoadingQris ? (
                          <div className="flex flex-col items-center justify-center p-12 bg-blue-50 rounded-2xl border-2 border-blue-200">
                            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
                            <p className="text-base font-semibold text-blue-800">Memuat QR Code...</p>
                          </div>
                        ) : qrisQrCode ? (
                          <div className="flex gap-6">
                            <div className="flex-shrink-0">
                              <div className="bg-white border-4 border-blue-500 rounded-2xl p-6 shadow-xl">
                                <img
                                  src={qrisQrCode}
                                  alt="QRIS QR Code"
                                  className="w-56 h-56 object-contain"
                                />
                              </div>
                            </div>
                            <div className="flex-1 space-y-4">
                              <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100">
                                <CardContent className="p-5">
                                  <p className="text-sm font-semibold text-blue-800 mb-2">
                                    Scan QR Code untuk pembayaran:
                                  </p>
                                  <p className="text-4xl font-bold text-blue-900">
                                    {formatPrice(getSubtotal() - discountAmount)}
                                  </p>
                                </CardContent>
                              </Card>

                              <Card className="border border-slate-200">
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-md" />
                                    <span className="text-sm text-slate-700">QR Code aktif dan siap dipindai</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-md" />
                                    <span className="text-sm text-slate-700">QRIS berlaku selama 24 jam</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full shadow-md" />
                                    <span className="text-sm text-slate-700">Dukung semua aplikasi pembayaran QRIS</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        ) : (
                          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                                  <QrCode className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-yellow-800 text-lg mb-1">
                                    QR Code belum diupload
                                  </p>
                                  <p className="text-sm text-yellow-700">
                                    Silakan upload QR Code di menu Admin Settings
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* E-Wallet Payment */}
                    {selectedPaymentMethod === 'E_WALLET' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 block">Nomor E-Wallet</label>
                          <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-400" />
                            <Input
                              type="tel"
                              value={ewalletNumber}
                              onChange={(e) => setEwalletNumber(e.target.value)}
                              placeholder="08xxxxxxxxxx"
                              autoFocus
                              className="pl-14 text-2xl font-bold h-14 border-2 border-slate-300 focus:border-purple-500"
                            />
                          </div>
                        </div>

                        {ewalletNumber && ewalletNumber.length >= 10 && (
                          <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center">
                                    <Smartphone className="w-7 h-7 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-purple-800 text-lg">Pembayaran Siap</p>
                                    <p className="text-sm text-purple-600 font-semibold">{ewalletNumber}</p>
                                  </div>
                                </div>
                                <p className="text-2xl font-bold text-purple-900">
                                  {formatPrice(getSubtotal() - discountAmount)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {ewalletNumber && ewalletNumber.length > 0 && ewalletNumber.length < 10 && (
                          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100">
                            <CardContent className="p-4">
                              <p className="text-sm text-yellow-800 font-medium">
                                Masukkan nomor E-Wallet yang valid (minimal 10 digit)
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Voucher Payment */}
                    {selectedPaymentMethod === 'VOUCHER' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 block">Kode Voucher</label>
                          <div className="relative">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-400" />
                            <Input
                              type="text"
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                              placeholder="VOUCHERXXX"
                              autoFocus
                              maxLength={20}
                              className="pl-14 text-2xl font-bold h-14 border-2 border-slate-300 focus:border-orange-500 uppercase font-mono tracking-wider"
                            />
                          </div>
                        </div>

                        {voucherCode && voucherCode.length >= 6 && (
                          <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg">
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center">
                                    <Ticket className="w-7 h-7 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-orange-800 text-lg">Voucher Valid</p>
                                    <p className="text-sm text-orange-600 font-mono font-bold">{voucherCode}</p>
                                  </div>
                                </div>
                                <p className="text-2xl font-bold text-orange-900">
                                  {formatPrice(getSubtotal() - discountAmount)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {voucherCode && voucherCode.length > 0 && voucherCode.length < 6 && (
                          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100">
                            <CardContent className="p-4">
                              <p className="text-sm text-yellow-800 font-medium">
                                Masukkan kode voucher yang valid (minimal 6 karakter)
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Card Payment */}
                    {selectedPaymentMethod === 'CARD' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 block">Nomor Kartu</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-400" />
                            <Input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                                const formatted = value.replace(/(.{4})/g, '$1 ').trim()
                                setCardNumber(formatted)
                              }}
                              placeholder="XXXX XXXX XXXX XXXX"
                              maxLength={19}
                              autoFocus
                              className="pl-14 text-2xl font-bold h-14 border-2 border-slate-300 focus:border-slate-500 font-mono tracking-wider"
                            />
                          </div>
                        </div>

                        {cardNumber && cardNumber.replace(/\s/g, '').length >= 16 && (
                          <Card className="border-2 border-slate-700 bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg">
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center">
                                    <CreditCard className="w-7 h-7 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-white text-lg">Kartu Valid</p>
                                    <p className="text-sm text-slate-300 font-mono font-bold">****{cardNumber.slice(-4)}</p>
                                  </div>
                                </div>
                                <p className="text-2xl font-bold text-white">
                                  {formatPrice(getSubtotal() - discountAmount)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {cardNumber && cardNumber.replace(/\s/g, '').length > 0 && cardNumber.replace(/\s/g, '').length < 16 && (
                          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100">
                            <CardContent className="p-4">
                              <p className="text-sm text-yellow-800 font-medium">
                                Masukkan nomor kartu yang valid (16 digit)
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Bank Transfer Payment */}
                    {selectedPaymentMethod === 'BANK_TRANSFER' && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 block">Nama Bank</label>
                            <Input
                              value={bankTransferName}
                              onChange={(e) => setBankTransferName(e.target.value)}
                              placeholder="Contoh: BCA, Mandiri, BNI"
                              autoFocus
                              className="text-lg h-12 border-2 border-slate-300 focus:border-orange-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 block">Nomor Rekening</label>
                            <Input
                              value={bankTransferNumber}
                              onChange={(e) => setBankTransferNumber(e.target.value)}
                              placeholder="Contoh: 1234567890"
                              autoFocus
                              className="text-lg h-12 border-2 border-slate-300 focus:border-orange-500 font-mono"
                            />
                          </div>
                        </div>

                        {bankTransferName && bankTransferNumber && bankTransferNumber.length >= 10 && (
                          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                                    <Wallet className="w-7 h-7 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-green-800 text-lg">Transfer Valid</p>
                                    <p className="text-sm text-green-600">
                                      {bankTransferName} - {bankTransferNumber}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-2xl font-bold text-green-700">
                                  {formatPrice(getSubtotal() - discountAmount)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {bankTransferNumber && bankTransferNumber.length > 0 && bankTransferNumber.length < 10 && (
                          <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100">
                            <CardContent className="p-4">
                              <p className="text-sm text-yellow-800 font-medium">
                                Masukkan nomor rekening yang valid (minimal 10 digit)
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="border-t-2 border-slate-200 p-4 bg-slate-50 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPayment(false)}
                  disabled={isProcessingPayment}
                  className="flex-1 h-14 border-2 border-slate-300 font-bold text-base hover:bg-slate-100"
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base shadow-lg"
                  onClick={handlePayment}
                  disabled={isProcessingPayment || (
                    selectedPaymentMethod === 'CASH' && (parseFloat(cashReceived) < getSubtotal() - discountAmount || !cashReceived)
                  ) || (
                    selectedPaymentMethod === 'E_WALLET' && ewalletNumber.length < 10
                  ) || (
                    selectedPaymentMethod === 'VOUCHER' && voucherCode.length < 6
                  ) || (
                    selectedPaymentMethod === 'CARD' && cardNumber.replace(/\s/g, '').length < 16
                  ) || (
                    selectedPaymentMethod === 'BANK_TRANSFER' && (!bankTransferName || !bankTransferNumber || bankTransferNumber.length < 10)
                  )}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-6 h-6 mr-2" />
                      Proses Pembayaran
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Authorization Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              Otorisasi Diperlukan
            </DialogTitle>
            <DialogDescription>
              {authAction === 'closeShift' ? 'Masukkan PIN untuk menutup shift kasir' : 'Masukkan PIN untuk menghapus produk'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">PIN Otorisasi</label>
              <Input
                type="password"
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                placeholder="Masukkan PIN"
                maxLength={6}
                autoFocus
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAuthDialog(false)
              setAuthPin('')
              setAuthAction(null)
              setVoidItemId(null)
            }} disabled={isVerifyingAuth}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-orange-600"
              onClick={handleVerifyAuth}
              disabled={isVerifyingAuth || authPin.length !== 6}
            >
              {isVerifyingAuth && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isVerifyingAuth ? 'Memverifikasi...' : 'Verifikasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Struk Transaksi
            </DialogTitle>
            <DialogDescription>{transactionReceipt?.transactionNo || ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 bg-white border border-gray-200 rounded-lg p-4">
            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-dashed pb-4">
              <h3 className="font-bold text-lg">{RESTAURANT_INFO.name}</h3>
              <p className="text-xs text-muted-foreground">{RESTAURANT_INFO.address}</p>
              <p className="text-xs text-muted-foreground">Telp: {RESTAURANT_INFO.phone}</p>
              <p className="text-xs mt-2">
                {transactionReceipt?.createdAt ? 
                  new Date(transactionReceipt.createdAt).toLocaleString('id-ID') : 
                  new Date().toLocaleString('id-ID')
                }
              </p>
              <p className="font-mono text-sm">No. {transactionReceipt?.transactionNo || ''}</p>
              <p className="text-xs text-muted-foreground">Kasir: {transactionReceipt?.cashierName || ''}</p>
            </div>

            {/* Receipt Body */}
            <div className="space-y-2 text-sm border-b border-dashed pb-4">
              {transactionReceipt?.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} x {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>

            {/* Receipt Footer */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(transactionReceipt?.subtotal || 0)}</span>
              </div>
              {(transactionReceipt?.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon</span>
                  <span>-{formatPrice(transactionReceipt?.discountAmount || 0)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL</span>
                <span>{formatPrice(transactionReceipt?.total || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Metode Pembayaran</span>
                <span className="font-medium">
                  {transactionReceipt?.paymentMethod === 'CASH' && 'Tunai'}
                  {transactionReceipt?.paymentMethod === 'QRIS' && 'QRIS'}
                  {transactionReceipt?.paymentMethod === 'E_WALLET' && 'E-Wallet'}
                  {transactionReceipt?.paymentMethod === 'VOUCHER' && 'Voucher'}
                  {transactionReceipt?.paymentMethod === 'CARD' && 'Kartu'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Uang Diterima</span>
                <span>{formatPrice(transactionReceipt?.cashReceived || 0)}</span>
              </div>
              {(transactionReceipt?.change || 0) > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Kembalian</span>
                  <span>{formatPrice(transactionReceipt?.change || 0)}</span>
                </div>
              )}
              {transactionReceipt?.member && (
                <div className="flex justify-between text-orange-600 text-xs pt-2 border-t">
                  <span>Member: {transactionReceipt.member.name}</span>
                  <span>{transactionReceipt.member.points} Poin</span>
                </div>
              )}
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">Terima kasih atas kunjungan Anda</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600"
              onClick={() => {
                setShowReceipt(false)
                setTransactionReceipt(null)
              }}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
