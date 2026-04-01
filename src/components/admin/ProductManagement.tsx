'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Image as ImageIcon,
  BarChart,
  Tag,
  DollarSign,
  Box,
  MoreHorizontal,
  Power,
  PowerOff,
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  barcode?: string
  sku?: string
  categoryId: string
  categoryName: string
  image?: string
  stock: number
  minStock: number
  isActive: boolean
  createdAt: string
}

// Categories
const CATEGORIES = [
  { id: 'CAT-001', name: 'Makanan' },
  { id: 'CAT-002', name: 'Minuman' },
  { id: 'CAT-003', name: 'Paket Hemat' },
]

// Mock Data
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    name: 'Ayam Geprek Sambal Ijo',
    description: 'Ayam goreng crispy dengan sambal ijo pedas',
    price: 25000,
    cost: 15000,
    barcode: '8991001001001',
    sku: 'AGP-SI-001',
    categoryId: 'CAT-001',
    categoryName: 'Makanan',
    image: '/api/placeholder/80/80',
    stock: 45,
    minStock: 10,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'PRD-002',
    name: 'Ayam Geprek Sambal Merah',
    description: 'Ayam goreng crispy dengan sambal merah',
    price: 25000,
    cost: 15000,
    barcode: '8991001001002',
    sku: 'AGP-SM-001',
    categoryId: 'CAT-001',
    categoryName: 'Makanan',
    image: '/api/placeholder/80/80',
    stock: 32,
    minStock: 10,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'PRD-003',
    name: 'Es Teh Manis',
    description: 'Teh manis dingin segar',
    price: 5000,
    cost: 1000,
    barcode: '8991002001001',
    sku: 'ETM-001',
    categoryId: 'CAT-002',
    categoryName: 'Minuman',
    image: '/api/placeholder/80/80',
    stock: 8,
    minStock: 15,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'PRD-004',
    name: 'Es Jeruk Peras',
    description: 'Jus jeruk segar dengan es',
    price: 8000,
    cost: 2000,
    barcode: '8991002001002',
    sku: 'EJP-001',
    categoryId: 'CAT-002',
    categoryName: 'Minuman',
    image: '/api/placeholder/80/80',
    stock: 25,
    minStock: 10,
    isActive: true,
    createdAt: '2024-01-20',
  },
  {
    id: 'PRD-005',
    name: 'Paket Hemat 1',
    description: 'Ayam Geprek + Es Teh + Nasi',
    price: 30000,
    cost: 18000,
    barcode: '8991003001001',
    sku: 'PH-001',
    categoryId: 'CAT-003',
    categoryName: 'Paket Hemat',
    image: '/api/placeholder/80/80',
    stock: 5,
    minStock: 5,
    isActive: true,
    createdAt: '2024-02-01',
  },
  {
    id: 'PRD-006',
    name: 'Nasi Geprek Telur',
    description: 'Nasi dengan geprek telur mata sapi',
    price: 20000,
    cost: 12000,
    barcode: '8991001001003',
    sku: 'NGT-001',
    categoryId: 'CAT-001',
    categoryName: 'Makanan',
    image: '/api/placeholder/80/80',
    stock: 15,
    minStock: 10,
    isActive: true,
    createdAt: '2024-02-10',
  },
  {
    id: 'PRD-007',
    name: 'Kopi Hitam',
    description: 'Kopi hitam panas',
    price: 8000,
    cost: 2000,
    barcode: '8991002001003',
    sku: 'KH-001',
    categoryId: 'CAT-002',
    categoryName: 'Minuman',
    image: '/api/placeholder/80/80',
    stock: 50,
    minStock: 10,
    isActive: false,
    createdAt: '2024-02-15',
  },
  {
    id: 'PRD-008',
    name: 'Paket Hemat 2',
    description: 'Ayam Geprek + Es Jeruk + Nasi',
    price: 32000,
    cost: 20000,
    barcode: '8991003001002',
    sku: 'PH-002',
    categoryId: 'CAT-003',
    categoryName: 'Paket Hemat',
    image: '/api/placeholder/80/80',
    stock: 12,
    minStock: 5,
    isActive: true,
    createdAt: '2024-02-20',
  },
]

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    barcode: '',
    sku: '',
    categoryId: '',
    image: '',
    stock: '',
    minStock: '',
    isActive: true,
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

  const isLowStock = (product: Product) => {
    return product.stock <= product.minStock
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery)) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  const handleAddProduct = () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: 'Error',
        description: 'Nama, harga, dan kategori wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const category = CATEGORIES.find((c) => c.id === formData.categoryId)

    const newProduct: Product = {
      id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      barcode: formData.barcode || undefined,
      sku: formData.sku || undefined,
      categoryId: formData.categoryId,
      categoryName: category?.name || 'Unknown',
      image: formData.image || undefined,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      minStock: formData.minStock ? parseInt(formData.minStock) : 10,
      isActive: formData.isActive,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setProducts([...products, newProduct])
    setAddModalOpen(false)
    resetForm()

    toast({
      title: 'Berhasil',
      description: `Produk ${newProduct.name} berhasil ditambahkan`,
    })
  }

  const handleEditProduct = () => {
    if (!selectedProduct) return

    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: 'Error',
        description: 'Nama, harga, dan kategori wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const category = CATEGORIES.find((c) => c.id === formData.categoryId)

    const updatedProducts = products.map((product) =>
      product.id === selectedProduct.id
        ? {
            ...product,
            name: formData.name,
            description: formData.description || undefined,
            price: parseFloat(formData.price),
            cost: formData.cost ? parseFloat(formData.cost) : undefined,
            barcode: formData.barcode || undefined,
            sku: formData.sku || undefined,
            categoryId: formData.categoryId,
            categoryName: category?.name || 'Unknown',
            image: formData.image || undefined,
            stock: formData.stock ? parseInt(formData.stock) : 0,
            minStock: formData.minStock ? parseInt(formData.minStock) : 10,
            isActive: formData.isActive,
          }
        : product
    )

    setProducts(updatedProducts)
    setEditModalOpen(false)
    resetForm()
    setSelectedProduct(null)

    toast({
      title: 'Berhasil',
      description: 'Data produk berhasil diperbarui',
    })
  }

  const handleDeleteProduct = () => {
    if (!selectedProduct) return

    const updatedProducts = products.filter((product) => product.id !== selectedProduct.id)
    setProducts(updatedProducts)
    setDeleteDialogOpen(false)
    setSelectedProduct(null)
    setSelectedIds([])

    toast({
      title: 'Berhasil',
      description: 'Produk berhasil dihapus',
    })
  }

  const handleBulkActivate = () => {
    const updatedProducts = products.map((product) =>
      selectedIds.includes(product.id) ? { ...product, isActive: true } : product
    )
    setProducts(updatedProducts)
    setSelectedIds([])
    toast({
      title: 'Berhasil',
      description: `${selectedIds.length} produk berhasil diaktifkan`,
    })
  }

  const handleBulkDeactivate = () => {
    const updatedProducts = products.map((product) =>
      selectedIds.includes(product.id) ? { ...product, isActive: false } : product
    )
    setProducts(updatedProducts)
    setSelectedIds([])
    toast({
      title: 'Berhasil',
      description: `${selectedIds.length} produk berhasil dinonaktifkan`,
    })
  }

  const handleBulkDelete = () => {
    const updatedProducts = products.filter((product) => !selectedIds.includes(product.id))
    setProducts(updatedProducts)
    setSelectedIds([])
    toast({
      title: 'Berhasil',
      description: `${selectedIds.length} produk berhasil dihapus`,
    })
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      barcode: product.barcode || '',
      sku: product.sku || '',
      categoryId: product.categoryId,
      image: product.image || '',
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      isActive: product.isActive,
    })
    setEditModalOpen(true)
  }

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      barcode: '',
      sku: '',
      categoryId: '',
      image: '',
      stock: '',
      minStock: '',
      isActive: true,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Manajemen Produk
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola produk menu restoran
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
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Produk Baru</DialogTitle>
                <DialogDescription>
                  Isi data produk baru untuk ditambahkan ke menu
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="add-name">
                    Nama Produk <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="add-name"
                    placeholder="Masukkan nama produk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="add-description">Deskripsi</Label>
                  <Input
                    id="add-description"
                    placeholder="Deskripsi singkat produk"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-price">
                    Harga Jual <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="add-price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-cost">Harga Modal</Label>
                  <Input
                    id="add-cost"
                    type="number"
                    placeholder="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-category">
                    Kategori <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-stock">Stok</Label>
                  <Input
                    id="add-stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-minStock">Min. Stok</Label>
                  <Input
                    id="add-minStock"
                    type="number"
                    placeholder="10"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-barcode">Barcode</Label>
                  <Input
                    id="add-barcode"
                    placeholder="899xxxxxxxxxx"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-sku">SKU</Label>
                  <Input
                    id="add-sku"
                    placeholder="SKU-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="add-image">URL Gambar</Label>
                  <Input
                    id="add-image"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Checkbox
                    id="add-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  />
                  <Label htmlFor="add-active" className="cursor-pointer">
                    Produk Aktif
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  onClick={handleAddProduct}
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
                <p className="text-sm font-medium text-muted-foreground">Total Produk</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{products.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produk Aktif</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {products.filter((p) => p.isActive).length}
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
                <p className="text-sm font-medium text-muted-foreground">Stok Rendah</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {products.filter((p) => isLowStock(p)).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Nilai Stok</p>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {formatPrice(
                    products.reduce((sum, p) => sum + p.stock * (p.cost || p.price), 0)
                  )}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
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
                placeholder="Cari berdasarkan nama, barcode, atau SKU..."
                className="pl-10 border-orange-200 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] border-orange-200">
                  <Filter className="w-4 h-4 mr-2 text-orange-500" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
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

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-orange-700">
                {selectedIds.length} produk dipilih
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={handleBulkActivate}
                >
                  <Power className="w-4 h-4 mr-2" />
                  Aktifkan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={handleBulkDeactivate}
                >
                  <PowerOff className="w-4 h-4 mr-2" />
                  Nonaktifkan
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus {selectedIds.length} Produk?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Semua produk yang dipilih akan dihapus
                        secara permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card className="border-orange-100">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-50 hover:bg-orange-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredProducts.length > 0 &&
                      selectedIds.length === filteredProducts.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Gambar</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Modal</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-orange-50/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-orange-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                      {product.categoryName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-green-600">{formatPrice(product.price)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-muted-foreground">
                      {product.cost ? formatPrice(product.cost) : '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isLowStock(product) ? 'text-red-600' : ''}`}>
                        {product.stock}
                      </span>
                      {isLowStock(product) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground">{product.barcode || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground">{product.sku || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.isActive ? 'default' : 'secondary'}
                      className={product.isActive ? 'bg-green-500' : 'bg-gray-400'}
                    >
                      {product.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => openEditModal(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog open={deleteDialogOpen && selectedProduct?.id === product.id} onOpenChange={(open) => {
                        if (!open) setSelectedProduct(null)
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus produk "{product.name}"? Tindakan ini
                              tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteProduct}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="border-orange-100">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada produk ditemukan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Coba ubah kata kunci pencarian atau filter, atau tambah produk baru
            </p>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Product Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Produk</DialogTitle>
            <DialogDescription>Perbarui informasi produk</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-name">
                Nama Produk <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Masukkan nama produk"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Input
                id="edit-description"
                placeholder="Deskripsi singkat produk"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">
                Harga Jual <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Harga Modal</Label>
              <Input
                id="edit-cost"
                type="number"
                placeholder="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stok</Label>
              <Input
                id="edit-stock"
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minStock">Min. Stok</Label>
              <Input
                id="edit-minStock"
                type="number"
                placeholder="10"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-barcode">Barcode</Label>
              <Input
                id="edit-barcode"
                placeholder="899xxxxxxxxxx"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                placeholder="SKU-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-image">URL Gambar</Label>
              <Input
                id="edit-image"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Produk Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={handleEditProduct}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
