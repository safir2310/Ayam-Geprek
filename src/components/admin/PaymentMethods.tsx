'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CreditCard, Plus, Pencil, Trash2, CheckCircle, XCircle, QrCode, Wallet, DollarSign, Upload, X, Loader2, CreditCard as CardIcon } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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

type PaymentMethod = {
  id: string
  name: string
  type: 'CASH' | 'QRIS' | 'E_WALLET' | 'BANK_TRANSFER' | 'CARD' | 'TRANSFER'
  isActive: boolean
  qrCode?: string | null
  logo?: string | null
  fee: number
  minAmount: number
  maxAmount?: number | null
  description?: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as PaymentMethod['type'],
    fee: '0',
    minAmount: '0',
    maxAmount: '',
    description: '',
    order: '0',
    isActive: true,
  })

  // File upload states
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploadingQrCode, setIsUploadingQrCode] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Load payment methods
  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (!response.ok) throw new Error('Failed to fetch payment methods')

      const data = await response.json()
      if (data.success) {
        setPaymentMethods(data.data)
      } else {
        throw new Error(data.error || 'Failed to load payment methods')
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat metode pembayaran',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'QRIS':
        return <QrCode className="w-8 h-8" />
      case 'E_WALLET':
      case 'BANK_TRANSFER':
        return <Wallet className="w-8 h-8" />
      case 'CASH':
        return <DollarSign className="w-8 h-8" />
      case 'CARD':
        return <CardIcon className="w-8 h-8" />
      default:
        return <CreditCard className="w-8 h-8" />
    }
  }

  const getTypeColor = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'CASH':
        return 'bg-green-500'
      case 'QRIS':
        return 'bg-purple-500'
      case 'E_WALLET':
        return 'bg-blue-500'
      case 'BANK_TRANSFER':
        return 'bg-orange-500'
      case 'CARD':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTypeLabel = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'CASH':
        return 'Tunai'
      case 'QRIS':
        return 'QRIS'
      case 'E_WALLET':
        return 'E-Wallet'
      case 'BANK_TRANSFER':
        return 'Transfer Bank'
      case 'CARD':
        return 'Kartu'
      default:
        return type
    }
  }

  const handleAdd = () => {
    setEditingMethod(null)
    setFormData({
      name: '',
      type: 'CASH',
      fee: '0',
      minAmount: '0',
      maxAmount: '',
      description: '',
      order: '0',
      isActive: true,
    })
    setQrCodePreview(null)
    setLogoPreview(null)
    setDialogOpen(true)
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      type: method.type,
      fee: method.fee.toString(),
      minAmount: method.minAmount.toString(),
      maxAmount: method.maxAmount?.toString() || '',
      description: method.description || '',
      order: method.order.toString(),
      isActive: method.isActive,
    })
    setQrCodePreview(method.qrCode || null)
    setLogoPreview(method.logo || null)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete payment method')
      }

      setPaymentMethods(paymentMethods.filter(m => m.id !== id))
      toast({
        title: 'Berhasil',
        description: 'Metode pembayaran berhasil dihapus',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus metode pembayaran',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment method')
      }

      setPaymentMethods(paymentMethods.map(m =>
        m.id === id ? { ...m, isActive } : m
      ))
      toast({
        title: 'Berhasil',
        description: `Metode pembayaran ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengupdate status',
        variant: 'destructive'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type) {
      toast({
        title: 'Error',
        description: 'Nama dan tipe metode pembayaran wajib diisi',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const url = editingMethod
        ? `/api/admin/payment-methods/${editingMethod.id}`
        : '/api/admin/payment-methods'

      const method = editingMethod ? 'PUT' : 'POST'

      const body = {
        ...formData,
        fee: parseFloat(formData.fee) || 0,
        minAmount: parseFloat(formData.minAmount) || 0,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        order: parseInt(formData.order) || 0,
        qrCode: qrCodePreview,
        logo: logoPreview,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save payment method')
      }

      const data = await response.json()
      toast({
        title: 'Berhasil',
        description: editingMethod
          ? 'Metode pembayaran berhasil diperbarui'
          : 'Metode pembayaran berhasil ditambahkan',
      })

      setDialogOpen(false)
      loadPaymentMethods()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan metode pembayaran',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingQrCode(true)
    try {
      const base64 = await fileToBase64(file)
      setQrCodePreview(base64)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses gambar QR Code',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingQrCode(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingLogo(true)
    try {
      const base64 = await fileToBase64(file)
      setLogoPreview(base64)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses logo',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Metode Pembayaran
          </h2>
          <p className="text-muted-foreground mt-1">
            Kelola metode pembayaran yang tersedia untuk pelanggan
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Metode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
              </DialogTitle>
              <DialogDescription>
                {editingMethod ? 'Edit detail metode pembayaran yang ada' : 'Tambah metode pembayaran baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Nama Metode *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: GoPay, OVO, QRIS"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipe Metode *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethod['type'] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="CASH">Tunai</option>
                    <option value="QRIS">QRIS</option>
                    <option value="E_WALLET">E-Wallet</option>
                    <option value="BANK_TRANSFER">Transfer Bank</option>
                    <option value="CARD">Kartu Debit/Kredit</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fee">Biaya Admin (Rp)</Label>
                    <Input
                      id="fee"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minAmount">Min. Transaksi (Rp)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="maxAmount">Max. Transaksi (Rp)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    placeholder="Kosongkan untuk tanpa batas"
                  />
                </div>
                <div>
                  <Label htmlFor="order">Urutan Tampilan</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat metode pembayaran"
                    className="min-h-[80px]"
                  />
                </div>

                {/* QR Code Upload */}
                {formData.type === 'QRIS' && (
                  <div>
                    <Label>QR Code</Label>
                    <div className="mt-2">
                      {qrCodePreview ? (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                          <img
                            src={qrCodePreview}
                            alt="QR Code Preview"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setQrCodePreview(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-6">
                          <input
                            id="qrcode-upload"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleQrCodeUpload}
                            disabled={isUploadingQrCode}
                            className="hidden"
                          />
                          <Label
                            htmlFor="qrcode-upload"
                            className="flex flex-col items-center justify-center cursor-pointer"
                          >
                            {isUploadingQrCode ? (
                              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                            ) : (
                              <QrCode className="w-8 h-8 text-orange-500 mb-2" />
                            )}
                            <p className="text-sm text-muted-foreground text-center">
                              {isUploadingQrCode ? 'Mengupload...' : 'Klik untuk upload QR Code'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (maks. 5MB)</p>
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Logo Upload */}
                <div>
                  <Label>Logo</Label>
                  <div className="mt-2">
                    {logoPreview ? (
                      <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-white">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setLogoPreview(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6">
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                        <Label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          {isUploadingLogo ? (
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                          ) : (
                            <Upload className="w-8 h-8 text-orange-500 mb-2" />
                          )}
                          <p className="text-sm text-muted-foreground text-center">
                            {isUploadingLogo ? 'Mengupload...' : 'Klik untuk upload logo'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (maks. 5MB)</p>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Aktif
                  </Label>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingMethod ? 'Simpan Perubahan' : 'Tambah Metode'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Cari metode pembayaran..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Payment Methods List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
            <p className="mt-2 text-muted-foreground">Memuat metode pembayaran...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredMethods.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">Tidak ada metode pembayaran ditemukan</p>
            </div>
          ) : (
            filteredMethods.map((method) => (
              <Card key={method.id} className={`hover:shadow-md transition-shadow ${!method.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {method.logo ? (
                        <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${getTypeColor(method.type)} text-white`}>
                          {getIcon(method.type)}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {getTypeLabel(method.type)}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={method.isActive}
                      onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {method.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {method.description}
                    </p>
                  )}

                  {method.qrCode && (
                    <div className="flex justify-center py-2">
                      <img
                        src={method.qrCode}
                        alt="QR Code"
                        className="w-32 h-32 object-contain border rounded"
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biaya Admin:</span>
                      <span className={method.fee > 0 ? 'font-semibold text-orange-600' : 'text-green-600'}>
                        {method.fee > 0 ? formatCurrency(method.fee) : 'Gratis'}
                      </span>
                    </div>
                    {method.minAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min. Transaksi:</span>
                        <span className="font-medium">{formatCurrency(method.minAmount)}</span>
                      </div>
                    )}
                    {method.maxAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max. Transaksi:</span>
                        <span className="font-medium">{formatCurrency(method.maxAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(method)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(method.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                      Hapus
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    {method.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span>Non-aktif</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}
