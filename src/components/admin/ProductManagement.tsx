'use client'

import { useState, useEffect } from 'react'
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
  Upload,
  X,
  Loader2,
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

// Helper function to convert file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// Validate file
const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'File harus berupa gambar (JPG, PNG, WebP)' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file maksimal 5MB' }
  }

  return { valid: true }
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

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

  // Load data on mount
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/products?includeInactive=true')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data.map((p: any) => ({
          ...p,
          categoryName: p.category?.name || 'Unknown'
        })))
      }
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat produk',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

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

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: 'Error',
        description: 'Nama, harga, dan kategori wajib diisi',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          barcode: formData.barcode || undefined,
          sku: formData.sku || undefined,
          categoryId: formData.categoryId,
          image: formData.image || undefined,
          stock: formData.stock ? parseInt(formData.stock) : 0,
          minStock: formData.minStock ? parseInt(formData.minStock) : 10,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }

      const data = await response.json()
      toast({
        title: 'Berhasil',
        description: `Produk ${data.data.name} berhasil ditambahkan`,
      })

      setAddModalOpen(false)
      resetForm()
      loadProducts()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan produk',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditProduct = async () => {
    if (!selectedProduct) return

    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: 'Error',
        description: 'Nama, harga, dan kategori wajib diisi',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          barcode: formData.barcode || undefined,
          sku: formData.sku || undefined,
          categoryId: formData.categoryId,
          image: formData.image || undefined,
          stock: formData.stock ? parseInt(formData.stock) : 0,
          minStock: formData.minStock ? parseInt(formData.minStock) : 10,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }

      const data = await response.json()
      toast({
        title: 'Berhasil',
        description: 'Data produk berhasil diperbarui',
      })

      setEditModalOpen(false)
      resetForm()
      setSelectedProduct(null)
      loadProducts()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui produk',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      toast({
        title: 'Berhasil',
        description: 'Produk berhasil dihapus',
      })

      setDeleteDialogOpen(false)
      setSelectedProduct(null)
      setSelectedIds([])
      loadProducts()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus produk',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
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
    setImagePreview(product.image || null)
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
    setImagePreview(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast({
        title: 'Error',
        description: validation.error,
        variant: 'destructive',
      })
      return
    }

    setIsUploadingImage(true)
    try {
      const base64 = await fileToBase64(file)
      setFormData({ ...formData, image: base64 })
      setImagePreview(base64)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses gambar',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' })
    setImagePreview(null)
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
                      <SelectItem value="">Pilih kategori</SelectItem>
                      {categories.map((category) => (
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
                  <Label htmlFor="add-image">Gambar Produk</Label>
                  <div className="space-y-2">
                    {imagePreview ? (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6">
                        <input
                          id="add-image"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                        <Label
                          htmlFor="add-image"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          {isUploadingImage ? (
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                          ) : (
                            <Upload className="w-8 h-8 text-orange-500 mb-2" />
                          )}
                          <p className="text-sm text-muted-foreground text-center">
                            {isUploadingImage
                              ? 'Mengupload gambar...'
                              : 'Klik untuk upload gambar'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WebP (maks. 5MB)
                          </p>
                        </Label>
                      </div>
                    )}
                  </div>
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
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                  {categories.map((category) => (
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
                      onClick={handleBulkDelete}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
            <p className="mt-2 text-muted-foreground">Memuat produk...</p>
          </div>
        </div>
      ) : (
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
                              disabled={isDeleting}
                            >
                              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
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
                  <SelectItem value="">Pilih kategori</SelectItem>
                  {categories.map((category) => (
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
              <Label htmlFor="edit-image">Gambar Produk</Label>
              <div className="space-y-2">
                {imagePreview ? (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6">
                    <input
                      id="edit-image"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                    <Label
                      htmlFor="edit-image"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 text-orange-500 mb-2" />
                      )}
                      <p className="text-sm text-muted-foreground text-center">
                        {isUploadingImage
                          ? 'Mengupload gambar...'
                          : 'Klik untuk upload gambar'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WebP (maks. 5MB)
                      </p>
                    </Label>
                  </div>
                )}
              </div>
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
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
