'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Power,
  PowerOff,
  Tag,
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
import { toast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  order: number
  isActive: boolean
  productCount: number
  createdAt: string
}

// Default Categories
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'CAT-001',
    name: 'Makanan',
    description: 'Berbagai macam ayam geprek dan menu makanan',
    icon: '🍗',
    color: '#f97316',
    order: 1,
    isActive: true,
    productCount: 12,
    createdAt: '2024-01-15',
  },
  {
    id: 'CAT-002',
    name: 'Minuman',
    description: 'Es teh, jus, dan minuman segar lainnya',
    icon: '🥤',
    color: '#3b82f6',
    order: 2,
    isActive: true,
    productCount: 8,
    createdAt: '2024-01-15',
  },
  {
    id: 'CAT-003',
    name: 'Paket Hemat',
    description: 'Paket makan lengkap dengan harga spesial',
    icon: '🎁',
    color: '#22c55e',
    order: 3,
    isActive: true,
    productCount: 5,
    createdAt: '2024-02-01',
  },
]

// Color options for categories
const COLOR_OPTIONS = [
  { name: 'Orange', value: '#f97316' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Teal', value: '#14b8a6' },
]

// Icon options
const ICON_OPTIONS = ['🍗', '🥤', '🎁', '🍔', '🍕', '🍜', '🍱', '🥘', '🍛', '🍲', '☕', '🧃', '🥗', '🥪', '🌮', '🌯']

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🍗',
    color: '#f97316',
    isActive: true,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filteredCategories = categories
    .filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.isActive) ||
        (statusFilter === 'inactive' && !category.isActive)

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => a.order - b.order)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleAddCategory = () => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Nama kategori wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const maxOrder = Math.max(...categories.map((c) => c.order), 0)

    const newCategory: Category = {
      id: `CAT-${String(categories.length + 1).padStart(3, '0')}`,
      name: formData.name,
      description: formData.description || undefined,
      icon: formData.icon,
      color: formData.color,
      order: maxOrder + 1,
      isActive: formData.isActive,
      productCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setCategories([...categories, newCategory])
    setAddModalOpen(false)
    resetForm()

    toast({
      title: 'Berhasil',
      description: `Kategori ${newCategory.name} berhasil ditambahkan`,
    })
  }

  const handleEditCategory = () => {
    if (!selectedCategory) return

    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Nama kategori wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const updatedCategories = categories.map((category) =>
      category.id === selectedCategory.id
        ? {
            ...category,
            name: formData.name,
            description: formData.description || undefined,
            icon: formData.icon,
            color: formData.color,
            isActive: formData.isActive,
          }
        : category
    )

    setCategories(updatedCategories)
    setEditModalOpen(false)
    resetForm()
    setSelectedCategory(null)

    toast({
      title: 'Berhasil',
      description: 'Data kategori berhasil diperbarui',
    })
  }

  const handleDeleteCategory = () => {
    if (!selectedCategory) return

    if (selectedCategory.productCount > 0) {
      toast({
        title: 'Peringatan',
        description: `Kategori ini memiliki ${selectedCategory.productCount} produk. Hapus atau pindahkan produk terlebih dahulu.`,
        variant: 'destructive',
      })
      return
    }

    const updatedCategories = categories.filter((category) => category.id !== selectedCategory.id)
    // Reorder remaining categories
    const reorderedCategories = updatedCategories.map((cat, index) => ({
      ...cat,
      order: index + 1,
    }))

    setCategories(reorderedCategories)
    setDeleteDialogOpen(false)
    setSelectedCategory(null)

    toast({
      title: 'Berhasil',
      description: 'Kategori berhasil dihapus',
    })
  }

  const handleToggleStatus = (category: Category) => {
    const updatedCategories = categories.map((cat) =>
      cat.id === category.id ? { ...cat, isActive: !cat.isActive } : cat
    )
    setCategories(updatedCategories)

    toast({
      title: 'Berhasil',
      description: `Kategori ${category.name} ${!category.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
    })
  }

  const handleMoveUp = (category: Category) => {
    const currentOrder = category.order
    if (currentOrder <= 1) return

    const categoryAbove = categories.find((c) => c.order === currentOrder - 1)
    if (!categoryAbove) return

    const updatedCategories = categories.map((cat) => {
      if (cat.id === category.id) return { ...cat, order: currentOrder - 1 }
      if (cat.id === categoryAbove.id) return { ...cat, order: currentOrder }
      return cat
    })

    setCategories(updatedCategories)
  }

  const handleMoveDown = (category: Category) => {
    const maxOrder = categories.length
    const currentOrder = category.order
    if (currentOrder >= maxOrder) return

    const categoryBelow = categories.find((c) => c.order === currentOrder + 1)
    if (!categoryBelow) return

    const updatedCategories = categories.map((cat) => {
      if (cat.id === category.id) return { ...cat, order: currentOrder + 1 }
      if (cat.id === categoryBelow.id) return { ...cat, order: currentOrder }
      return cat
    })

    setCategories(updatedCategories)
  }

  const openEditModal = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '🍗',
      color: category.color || '#f97316',
      isActive: category.isActive,
    })
    setEditModalOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🍗',
      color: '#f97316',
      isActive: true,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Manajemen Kategori
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola kategori produk menu restoran
          </p>
        </div>
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Kategori Baru</DialogTitle>
              <DialogDescription>
                Isi data kategori baru untuk menambahkan ke menu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">
                  Nama Kategori <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-name"
                  placeholder="Masukkan nama kategori"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-description">Deskripsi</Label>
                <Input
                  id="add-description"
                  placeholder="Deskripsi singkat kategori"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-icon">Ikon</Label>
                <div className="grid grid-cols-8 gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant="outline"
                      className={`h-12 text-xl p-0 ${formData.icon === icon ? 'border-orange-500 bg-orange-50' : ''}`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-color">Warna</Label>
                <div className="flex flex-wrap gap-3">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        formData.color === color.value ? 'border-orange-600 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="add-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="add-active" className="cursor-pointer">
                  Kategori Aktif
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                Batal
              </Button>
              <Button
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                onClick={handleAddCategory}
              >
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Kategori</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{categories.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Kategori Aktif</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {categories.filter((c) => c.isActive).length}
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
                <p className="text-sm font-medium text-muted-foreground">Total Produk</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {categories.reduce((sum, c) => sum + c.productCount, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
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
                placeholder="Cari berdasarkan nama atau deskripsi..."
                className="pl-10 border-orange-200 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-orange-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.map((category, index) => (
          <Card
            key={category.id}
            className="border-orange-100 hover:shadow-lg transition-shadow"
            style={{
              borderLeft: `4px solid ${category.color || '#f97316'}`,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Drag Handle & Order */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <span className="text-xs text-muted-foreground font-medium">#{category.order}</span>
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveUp(category)}
                      disabled={category.order === 1}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveDown(category)}
                      disabled={category.order === categories.length}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon || '📦'}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <Badge
                          variant={category.isActive ? 'default' : 'secondary'}
                          className={category.isActive ? 'bg-green-500' : 'bg-gray-400'}
                        >
                          {category.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{category.productCount} Produk</span>
                        <span>•</span>
                        <span>Dibuat {formatDate(category.createdAt)}</span>
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={category.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}
                        onClick={() => handleToggleStatus(category)}
                        title={category.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {category.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => openEditModal(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog
                        open={deleteDialogOpen && selectedCategory?.id === category.id}
                        onOpenChange={(open) => {
                          if (!open) setSelectedCategory(null)
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {category.productCount > 0 ? (
                                <>
                                  Kategori ini memiliki <strong>{category.productCount} produk</strong>.{' '}
                                  Anda harus memindahkan atau menghapus produk terlebih dahulu sebelum menghapus
                                  kategori ini.
                                </>
                              ) : (
                                <>
                                  Apakah Anda yakin ingin menghapus kategori "{category.name}"? Tindakan ini
                                  tidak dapat dibatalkan.
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteCategory}
                              disabled={category.productCount > 0}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <Card className="border-orange-100">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada kategori ditemukan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Coba ubah kata kunci pencarian atau filter, atau tambah kategori baru
            </p>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Kategori</DialogTitle>
            <DialogDescription>Perbarui informasi kategori</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Nama Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Masukkan nama kategori"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Input
                id="edit-description"
                placeholder="Deskripsi singkat kategori"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Ikon</Label>
              <div className="grid grid-cols-8 gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant="outline"
                    className={`h-12 text-xl p-0 ${formData.icon === icon ? 'border-orange-500 bg-orange-50' : ''}`}
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Warna</Label>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      formData.color === color.value ? 'border-orange-600 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Kategori Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={handleEditCategory}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
