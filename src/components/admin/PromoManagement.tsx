'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  Calendar,
  Percent,
  Package,
  Gift,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'

type PromoType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_1_GET_1' | 'BUNDLE'

interface PromoProduct {
  id: string
  name: string
}

interface Promo {
  id: string
  name: string
  description?: string
  type: PromoType
  value: number
  startDate: string
  endDate?: string
  minPurchase?: number
  maxDiscount?: number
  isActive: boolean
  products: PromoProduct[]
  createdAt: string
}

// Mock Products for linking
const MOCK_PRODUCTS = [
  { id: 'PRD-001', name: 'Ayam Geprek Sambal Ijo' },
  { id: 'PRD-002', name: 'Ayam Geprek Sambal Merah' },
  { id: 'PRD-003', name: 'Es Teh Manis' },
  { id: 'PRD-004', name: 'Es Jeruk Peras' },
  { id: 'PRD-005', name: 'Paket Hemat 1' },
  { id: 'PRD-006', name: 'Nasi Geprek Telur' },
  { id: 'PRD-007', name: 'Kopi Hitam' },
  { id: 'PRD-008', name: 'Paket Hemat 2' },
]

// Mock Data
const MOCK_PROMOS: Promo[] = [
  {
    id: 'PRM-001',
    name: 'Diskon 20% Akhir Pekan',
    description: 'Diskon 20% untuk semua menu setiap akhir pekan',
    type: 'PERCENTAGE',
    value: 20,
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    minPurchase: 50000,
    maxDiscount: 50000,
    isActive: true,
    products: [
      { id: 'PRD-001', name: 'Ayam Geprek Sambal Ijo' },
      { id: 'PRD-002', name: 'Ayam Geprek Sambal Merah' },
      { id: 'PRD-005', name: 'Paket Hemat 1' },
    ],
    createdAt: '2024-02-25',
  },
  {
    id: 'PRM-002',
    name: 'Diskon Rp 10.000 Minat Belanja',
    description: 'Diskon Rp 10.000 dengan minimal belanja Rp 50.000',
    type: 'FIXED_AMOUNT',
    value: 10000,
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    minPurchase: 50000,
    isActive: true,
    products: MOCK_PRODUCTS.slice(0, 5),
    createdAt: '2024-02-28',
  },
  {
    id: 'PRM-003',
    name: 'Beli 1 Gratis 1 Es Teh',
    description: 'Beli 1 Es Teh Manis gratis 1 untuk pembelian menu apapun',
    type: 'BUY_1_GET_1',
    value: 0,
    startDate: '2024-03-01',
    endDate: '2024-04-30',
    products: [{ id: 'PRD-003', name: 'Es Teh Manis' }],
    createdAt: '2024-03-01',
  },
  {
    id: 'PRM-004',
    name: 'Paket Combo Hemat',
    description: 'Paket Ayam Geprek + Es Teh dengan harga spesial',
    type: 'BUNDLE',
    value: 30000,
    startDate: '2024-02-15',
    endDate: '2024-03-31',
    minPurchase: 30000,
    isActive: true,
    products: [
      { id: 'PRD-001', name: 'Ayam Geprek Sambal Ijo' },
      { id: 'PRD-003', name: 'Es Teh Manis' },
    ],
    createdAt: '2024-02-10',
  },
  {
    id: 'PRM-005',
    name: 'Diskon 50% Pembelian Kedua',
    description: 'Diskon 50% untuk pembelian menu kedua',
    type: 'PERCENTAGE',
    value: 50,
    startDate: '2024-01-01',
    endDate: '2024-02-28',
    minPurchase: 30000,
    maxDiscount: 25000,
    isActive: false,
    products: MOCK_PRODUCTS.slice(0, 4),
    createdAt: '2023-12-20',
  },
  {
    id: 'PRM-006',
    name: 'Happy Hour 25% Off',
    description: 'Diskon 25% jam 14:00 - 17:00 hari kerja',
    type: 'PERCENTAGE',
    value: 25,
    startDate: '2024-03-01',
    minPurchase: 30000,
    maxDiscount: 30000,
    isActive: true,
    products: MOCK_PRODUCTS.slice(2, 6),
    createdAt: '2024-02-28',
  },
]

const PROMO_TYPE_LABELS: Record<PromoType, string> = {
  PERCENTAGE: 'Persentase',
  FIXED_AMOUNT: 'Nominal Tetap',
  BUY_1_GET_1: 'Beli 1 Gratis 1',
  BUNDLE: 'Paket',
}

const PROMO_TYPE_COLORS: Record<PromoType, string> = {
  PERCENTAGE: 'bg-blue-500',
  FIXED_AMOUNT: 'bg-green-500',
  BUY_1_GET_1: 'bg-purple-500',
  BUNDLE: 'bg-orange-500',
}

const PROMO_TYPE_ICONS: Record<PromoType, any> = {
  PERCENTAGE: Percent,
  FIXED_AMOUNT: DollarSign,
  BUY_1_GET_1: Gift,
  BUNDLE: Package,
}

export default function PromoManagement() {
  const [promos, setPromos] = useState<Promo[]>(MOCK_PROMOS)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PERCENTAGE' as PromoType,
    value: '',
    startDate: '',
    endDate: '',
    minPurchase: '',
    maxDiscount: '',
    isActive: true,
    selectedProducts: [] as string[],
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPromoTypeIcon = (type: PromoType) => {
    return PROMO_TYPE_ICONS[type]
  }

  const isPromoExpired = (promo: Promo) => {
    if (!promo.endDate) return false
    return new Date(promo.endDate) < new Date()
  }

  const filteredPromos = promos.filter((promo) => {
    const matchesSearch = promo.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || promo.type === typeFilter

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && promo.isActive && !isPromoExpired(promo)) ||
      (statusFilter === 'inactive' && (!promo.isActive || isPromoExpired(promo)))

    return matchesSearch && matchesType && matchesStatus
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleAddPromo = () => {
    if (!formData.name || !formData.type) {
      toast({
        title: 'Error',
        description: 'Nama dan tipe promo wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const selectedProductsList = MOCK_PRODUCTS.filter((p) =>
      formData.selectedProducts.includes(p.id)
    )

    const newPromo: Promo = {
      id: `PRM-${String(promos.length + 1).padStart(3, '0')}`,
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      value: formData.value ? parseFloat(formData.value) : 0,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || undefined,
      minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      isActive: formData.isActive,
      products: selectedProductsList,
      createdAt: new Date().toISOString(),
    }

    setPromos([...promos, newPromo])
    setAddModalOpen(false)
    resetForm()

    toast({
      title: 'Berhasil',
      description: `Promo ${newPromo.name} berhasil ditambahkan`,
    })
  }

  const handleEditPromo = () => {
    if (!selectedPromo) return

    if (!formData.name || !formData.type) {
      toast({
        title: 'Error',
        description: 'Nama dan tipe promo wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const selectedProductsList = MOCK_PRODUCTS.filter((p) =>
      formData.selectedProducts.includes(p.id)
    )

    const updatedPromos = promos.map((promo) =>
      promo.id === selectedPromo.id
        ? {
            ...promo,
            name: formData.name,
            description: formData.description || undefined,
            type: formData.type,
            value: formData.value ? parseFloat(formData.value) : 0,
            startDate: formData.startDate || promo.startDate,
            endDate: formData.endDate || undefined,
            minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : undefined,
            maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
            isActive: formData.isActive,
            products: selectedProductsList,
          }
        : promo
    )

    setPromos(updatedPromos)
    setEditModalOpen(false)
    resetForm()
    setSelectedPromo(null)

    toast({
      title: 'Berhasil',
      description: 'Data promo berhasil diperbarui',
    })
  }

  const handleDeletePromo = () => {
    if (!selectedPromo) return

    const updatedPromos = promos.filter((promo) => promo.id !== selectedPromo.id)
    setPromos(updatedPromos)
    setDeleteDialogOpen(false)
    setSelectedPromo(null)

    toast({
      title: 'Berhasil',
      description: 'Promo berhasil dihapus',
    })
  }

  const openEditModal = (promo: Promo) => {
    setSelectedPromo(promo)
    setFormData({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      value: promo.value.toString(),
      startDate: promo.startDate,
      endDate: promo.endDate || '',
      minPurchase: promo.minPurchase?.toString() || '',
      maxDiscount: promo.maxDiscount?.toString() || '',
      isActive: promo.isActive,
      selectedProducts: promo.products.map((p) => p.id),
    })
    setEditModalOpen(true)
  }

  const openDeleteDialog = (promo: Promo) => {
    setSelectedPromo(promo)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: '',
      startDate: '',
      endDate: '',
      minPurchase: '',
      maxDiscount: '',
      isActive: true,
      selectedProducts: [],
    })
  }

  const toggleProductSelection = (productId: string) => {
    if (formData.selectedProducts.includes(productId)) {
      setFormData({
        ...formData,
        selectedProducts: formData.selectedProducts.filter((id) => id !== productId),
      })
    } else {
      setFormData({
        ...formData,
        selectedProducts: [...formData.selectedProducts, productId],
      })
    }
  }

  const getPromoValueDisplay = (promo: Promo) => {
    switch (promo.type) {
      case 'PERCENTAGE':
        return `${promo.value}%`
      case 'FIXED_AMOUNT':
        return formatPrice(promo.value)
      case 'BUY_1_GET_1':
        return 'Beli 1 Gratis 1'
      case 'BUNDLE':
        return formatPrice(promo.value)
      default:
        return '-'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Manajemen Promo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola promo dan diskon untuk pelanggan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Promo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Promo Baru</DialogTitle>
                <DialogDescription>
                  Isi data promo baru untuk ditambahkan ke sistem
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">
                    Nama Promo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="add-name"
                    placeholder="Contoh: Diskon 20% Akhir Pekan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-description">Deskripsi</Label>
                  <Input
                    id="add-description"
                    placeholder="Deskripsi promo"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-type">
                    Tipe Promo <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: PromoType) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe promo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Nominal Tetap (Rp)</SelectItem>
                      <SelectItem value="BUY_1_GET_1">Beli 1 Gratis 1</SelectItem>
                      <SelectItem value="BUNDLE">Paket Hemat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.type !== 'BUY_1_GET_1' && (
                  <div className="space-y-2">
                    <Label htmlFor="add-value">
                      {formData.type === 'PERCENTAGE' ? 'Persentase Diskon' : 'Nilai Promo'}{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="add-value"
                      type="number"
                      placeholder={formData.type === 'PERCENTAGE' ? '20' : '10000'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-startDate">Tanggal Mulai</Label>
                    <Input
                      id="add-startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-endDate">Tanggal Berakhir</Label>
                    <Input
                      id="add-endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-minPurchase">Min. Belanja</Label>
                    <Input
                      id="add-minPurchase"
                      type="number"
                      placeholder="0"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    />
                  </div>
                  {formData.type === 'PERCENTAGE' && (
                    <div className="space-y-2">
                      <Label htmlFor="add-maxDiscount">Maks. Diskon</Label>
                      <Input
                        id="add-maxDiscount"
                        type="number"
                        placeholder="0"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Produk yang Berlaku</Label>
                  <ScrollArea className="h-40 border rounded-lg p-3">
                    <div className="space-y-2">
                      {MOCK_PRODUCTS.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={formData.selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                          <Label
                            htmlFor={`product-${product.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {product.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  />
                  <Label htmlFor="add-active" className="cursor-pointer">
                    Promo Aktif
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  onClick={handleAddPromo}
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Promo</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{promos.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Promo Aktif</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {promos.filter((p) => p.isActive && !isPromoExpired(p)).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Promo Kadaluarsa</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {promos.filter((p) => isPromoExpired(p)).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jenis Promo</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {new Set(promos.map((p) => p.type)).size}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-orange-100">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama promo..."
                className="pl-10 border-orange-200 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px] border-orange-200">
                  <Filter className="w-4 h-4 mr-2 text-orange-500" />
                  <SelectValue placeholder="Tipe Promo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="PERCENTAGE">Persentase</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Nominal Tetap</SelectItem>
                  <SelectItem value="BUY_1_GET_1">Beli 1 Gratis 1</SelectItem>
                  <SelectItem value="BUNDLE">Paket</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] border-orange-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPromos.map((promo) => {
          const TypeIcon = getPromoTypeIcon(promo.type)
          const expired = isPromoExpired(promo)

          return (
            <Card key={promo.id} className="border-orange-100 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                        PROMO_TYPE_COLORS[promo.type]
                      }`}
                    >
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg truncate">{promo.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${PROMO_TYPE_COLORS[promo.type]} text-white text-xs`}
                        >
                          {PROMO_TYPE_LABELS[promo.type]}
                        </Badge>
                        {expired ? (
                          <Badge variant="destructive" className="text-xs">
                            Kadaluarsa
                          </Badge>
                        ) : !promo.isActive ? (
                          <Badge variant="secondary" className="text-xs">
                            Nonaktif
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500 text-white text-xs">Aktif</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{getPromoValueDisplay(promo)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {promo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{promo.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>
                    {formatDate(promo.startDate)}
                    {promo.endDate && ` - ${formatDate(promo.endDate)}`}
                  </span>
                </div>

                <Separator className="bg-orange-100" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Min. Belanja:</span>
                    <span className="font-medium">
                      {promo.minPurchase ? formatPrice(promo.minPurchase) : '-'}
                    </span>
                  </div>
                  {promo.type === 'PERCENTAGE' && promo.maxDiscount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Maks. Diskon:</span>
                      <span className="font-medium">{formatPrice(promo.maxDiscount)}</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-orange-100" />

                <div>
                  <p className="text-sm font-medium mb-2">Produk ({promo.products.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {promo.products.slice(0, 3).map((product) => (
                      <Badge
                        key={product.id}
                        variant="outline"
                        className="text-xs border-orange-200 text-orange-600"
                      >
                        {product.name}
                      </Badge>
                    ))}
                    {promo.products.length > 3 && (
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
                        +{promo.products.length - 3} lainnya
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Dibuat: {formatDateTime(promo.createdAt)}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                    onClick={() => openEditModal(promo)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog open={deleteDialogOpen && selectedPromo?.id === promo.id} onOpenChange={(open) => {
                    if (!open) setSelectedPromo(null)
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => openDeleteDialog(promo)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Promo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus promo "{promo.name}"? Tindakan ini
                          tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeletePromo}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredPromos.length === 0 && (
        <Card className="border-orange-100">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada promo ditemukan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Coba ubah kata kunci pencarian atau filter, atau tambah promo baru
            </p>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Promo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Promo Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Promo</DialogTitle>
            <DialogDescription>Perbarui informasi promo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Nama Promo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Contoh: Diskon 20% Akhir Pekan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Input
                id="edit-description"
                placeholder="Deskripsi promo"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">
                Tipe Promo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: PromoType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe promo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Nominal Tetap (Rp)</SelectItem>
                  <SelectItem value="BUY_1_GET_1">Beli 1 Gratis 1</SelectItem>
                  <SelectItem value="BUNDLE">Paket Hemat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type !== 'BUY_1_GET_1' && (
              <div className="space-y-2">
                <Label htmlFor="edit-value">
                  {formData.type === 'PERCENTAGE' ? 'Persentase Diskon' : 'Nilai Promo'}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-value"
                  type="number"
                  placeholder={formData.type === 'PERCENTAGE' ? '20' : '10000'}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Tanggal Mulai</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Tanggal Berakhir</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minPurchase">Min. Belanja</Label>
                <Input
                  id="edit-minPurchase"
                  type="number"
                  placeholder="0"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                />
              </div>
              {formData.type === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-maxDiscount">Maks. Diskon</Label>
                  <Input
                    id="edit-maxDiscount"
                    type="number"
                    placeholder="0"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Produk yang Berlaku</Label>
              <ScrollArea className="h-40 border rounded-lg p-3">
                <div className="space-y-2">
                  {MOCK_PRODUCTS.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-product-${product.id}`}
                        checked={formData.selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <Label
                        htmlFor={`edit-product-${product.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {product.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Promo Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={handleEditPromo}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
