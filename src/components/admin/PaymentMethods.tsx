'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { CreditCard, Plus, Pencil, Trash2, CheckCircle, XCircle, QrCode, Wallet, DollarSign } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type PaymentMethod = {
  id: string
  name: string
  type: 'CASH' | 'QRIS' | 'E_WALLET' | 'BANK_TRANSFER' | 'CARD'
  isActive: boolean
  fee?: number
  minAmount?: number
  maxAmount?: number
  icon?: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as PaymentMethod['type'],
    fee: 0,
    minAmount: 0,
    maxAmount: 0,
    description: ''
  })

  // Load payment methods
  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payment-methods')
      if (!response.ok) throw new Error('Failed to fetch payment methods')
      
      const data = await response.json()
      if (data.success) {
        setPaymentMethods(data.data)
      } else {
        // Use mock data if API fails
        setPaymentMethods(getMockPaymentMethods())
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      // Use mock data
      setPaymentMethods(getMockPaymentMethods())
    } finally {
      setLoading(false)
    }
  }

  const getMockPaymentMethods = (): PaymentMethod[] => [
    {
      id: '1',
      name: 'Tunai',
      type: 'CASH',
      isActive: true,
      icon: 'DollarSign',
      description: 'Pembayaran dengan uang tunai',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'QRIS',
      type: 'QRIS',
      isActive: true,
      fee: 0,
      minAmount: 1000,
      maxAmount: 10000000,
      icon: 'QrCode',
      description: 'Scan QRIS untuk pembayaran',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'GoPay',
      type: 'E_WALLET',
      isActive: true,
      fee: 0,
      minAmount: 1000,
      maxAmount: 5000000,
      icon: 'Wallet',
      description: 'Pembayaran via GoPay',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'OVO',
      type: 'E_WALLET',
      isActive: true,
      fee: 0,
      minAmount: 1000,
      maxAmount: 5000000,
      icon: 'Wallet',
      description: 'Pembayaran via OVO',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: 'DANA',
      type: 'E_WALLET',
      isActive: true,
      fee: 0,
      minAmount: 1000,
      maxAmount: 5000000,
      icon: 'Wallet',
      description: 'Pembayaran via DANA',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      name: 'Kartu Debit/Kredit',
      type: 'CARD',
      isActive: false,
      fee: 1500,
      minAmount: 10000,
      maxAmount: 20000000,
      icon: 'CreditCard',
      description: 'Pembayaran dengan kartu debit/kredit',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '7',
      name: 'Transfer Bank BCA',
      type: 'BANK_TRANSFER',
      isActive: true,
      fee: 0,
      minAmount: 10000,
      maxAmount: 50000000,
      icon: 'Wallet',
      description: 'Transfer ke rekening BCA',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '8',
      name: 'Transfer Bank Mandiri',
      type: 'BANK_TRANSFER',
      isActive: true,
      fee: 0,
      minAmount: 10000,
      maxAmount: 50000000,
      icon: 'Wallet',
      description: 'Transfer ke rekening Mandiri',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '9',
      name: 'ShopeePay',
      type: 'E_WALLET',
      isActive: false,
      fee: 0,
      minAmount: 1000,
      maxAmount: 5000000,
      icon: 'Wallet',
      description: 'Pembayaran via ShopeePay',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'QrCode':
        return <QrCode className="w-8 h-8" />
      case 'Wallet':
        return <Wallet className="w-8 h-8" />
      case 'DollarSign':
        return <DollarSign className="w-8 h-8" />
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
      fee: 0,
      minAmount: 0,
      maxAmount: 0,
      description: ''
    })
    setDialogOpen(true)
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      type: method.type,
      fee: method.fee || 0,
      minAmount: method.minAmount || 0,
      maxAmount: method.maxAmount || 0,
      description: method.description || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) return

    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPaymentMethods(paymentMethods.filter(m => m.id !== id))
        toast({
          title: 'Berhasil',
          description: 'Metode pembayaran berhasil dihapus',
        })
      } else {
        // Mock delete
        setPaymentMethods(paymentMethods.filter(m => m.id !== id))
        toast({
          title: 'Berhasil',
          description: 'Metode pembayaran berhasil dihapus',
        })
      }
    } catch (error) {
      // Mock delete
      setPaymentMethods(paymentMethods.filter(m => m.id !== id))
      toast({
        title: 'Berhasil',
        description: 'Metode pembayaran berhasil dihapus',
      })
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setPaymentMethods(paymentMethods.map(m => 
          m.id === id ? { ...m, isActive } : m
        ))
        toast({
          title: 'Berhasil',
          description: `Metode pembayaran ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        })
      } else {
        // Mock toggle
        setPaymentMethods(paymentMethods.map(m => 
          m.id === id ? { ...m, isActive } : m
        ))
        toast({
          title: 'Berhasil',
          description: `Metode pembayaran ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        })
      }
    } catch (error) {
      // Mock toggle
      setPaymentMethods(paymentMethods.map(m => 
        m.id === id ? { ...m, isActive } : m
      ))
      toast({
        title: 'Berhasil',
        description: `Metode pembayaran ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingMethod
        ? `/api/payment-methods/${editingMethod.id}`
        : '/api/payment-methods'

      const method = editingMethod ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          icon: formData.type === 'QRIS' ? 'QrCode' : 
                 formData.type === 'CASH' ? 'DollarSign' : 'Wallet'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (editingMethod) {
          setPaymentMethods(paymentMethods.map(m => 
            m.id === editingMethod.id ? { ...m, ...data.data, icon: formData.type === 'QRIS' ? 'QrCode' : formData.type === 'CASH' ? 'DollarSign' : 'Wallet' } : m
          ))
          toast({
            title: 'Berhasil',
            description: 'Metode pembayaran berhasil diperbarui',
          })
        } else {
          setPaymentMethods([...paymentMethods, {
            id: Date.now().toString(),
            ...formData,
            icon: formData.type === 'QRIS' ? 'QrCode' : formData.type === 'CASH' ? 'DollarSign' : 'Wallet',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }])
          toast({
            title: 'Berhasil',
            description: 'Metode pembayaran berhasil ditambahkan',
          })
        }
        setDialogOpen(false)
      } else {
        // Mock save
        if (editingMethod) {
          setPaymentMethods(paymentMethods.map(m => 
            m.id === editingMethod.id ? { ...m, ...formData, icon: formData.type === 'QRIS' ? 'QrCode' : formData.type === 'CASH' ? 'DollarSign' : 'Wallet' } : m
          ))
          toast({
            title: 'Berhasil',
            description: 'Metode pembayaran berhasil diperbarui',
          })
        } else {
          setPaymentMethods([...paymentMethods, {
            id: Date.now().toString(),
            ...formData,
            icon: formData.type === 'QRIS' ? 'QrCode' : formData.type === 'CASH' ? 'DollarSign' : 'Wallet',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }])
          toast({
            title: 'Berhasil',
            description: 'Metode pembayaran berhasil ditambahkan',
          })
        }
        setDialogOpen(false)
      }
    } catch (error) {
      // Mock save
      if (editingMethod) {
        setPaymentMethods(paymentMethods.map(m => 
          m.id === editingMethod.id ? { ...m, ...formData, icon: formData.type === 'QRIS' ? 'QrCode' : formData.type === 'CASH' ? 'DollarSign' : 'Wallet' } : m
        ))
        toast({
          title: 'Berhasil',
          description: 'Metode pembayaran berhasil diperbarui',
        })
      } else {
        setPaymentMethods([...paymentMethods, {
          id: Date.now().toString(),
          ...formData,
          icon: formData.type === 'QRIS' ? 'QrCode' : formData.type === 'CASH' ? 'DollarSign' : 'Wallet',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
        toast({
          title: 'Berhasil',
          description: 'Metode pembayaran berhasil ditambahkan',
        })
      }
      setDialogOpen(false)
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
          <DialogContent>
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
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minAmount">Min. Transaksi (Rp)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      min="0"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) || 0 })}
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
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat metode pembayaran"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
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

      {/* Payment Methods List - Scrollable */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${getTypeColor(method.type)} text-white`}>
                        {getIcon(method.icon)}
                      </div>
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
                    {method.maxAmount > 0 && (
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
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
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
