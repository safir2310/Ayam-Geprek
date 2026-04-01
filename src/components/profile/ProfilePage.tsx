'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Phone, MapPin, Camera,
  Lock, LogOut, History, Gift,
  Edit3, Save, X, Eye, EyeOff, XCircle,
  Shield, Bell, Settings, ChevronRight,
  BellRing, Upload, QrCode, Download, Copy, Check,
  CreditCard, IdCard, RefreshCw, Sparkles,
  Percent, Tag, Calendar, Star, TrendingUp, ChefHat
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { toast } from '@/hooks/use-toast'
import JsBarcode from 'jsbarcode'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

type Order = {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  createdAt: Date
  items: any[]
}

type PointHistory = {
  id: string
  type: string
  points: number
  date: string
  reference: string
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout, updateProfile } = useAuthStore()
  const { setCurrentView } = useUIStore()
  
  // States
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Notifications
  const [notifications] = useState([
    { id: 1, title: 'Pesanan Selesai', message: 'Pesanan #ORD-001 telah selesai', time: '5 menit lalu', read: false },
    { id: 2, title: 'Poin Bertambah', message: 'Anda mendapatkan 10 poin dari pesanan', time: '1 jam lalu', read: true },
  ])
  
  // Edit Profile Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    email: user?.email || '',
  })
  
  // Change Password Dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  // Settings
  const [notificationSettings, setNotificationSettings] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  
  // QR Code Dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrData, setQrData] = useState<string>('')
  const [qrLoading, setQrLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Member Card Dialog
  const [memberCardOpen, setMemberCardOpen] = useState(false)
  const barcodeRef = useRef<SVGSVGElement>(null)
  const [memberCardData, setMemberCardData] = useState<{ qrData: string; memberNumber: string } | null>(null)

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('login')
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login untuk mengakses profil',
        variant: 'destructive',
      })
    }
  }, [isAuthenticated, setCurrentView])
  
  // Load orders when component mounts
  useEffect(() => {
    if (isAuthenticated && user?.phone) {
      loadOrders()
      loadPointHistory()
    }
  }, [isAuthenticated, user?.phone])
  
  const loadOrders = async () => {
    if (!user?.phone) {
      console.log('[Profile Page] No phone number available for loading orders')
      return
    }

    setOrdersLoading(true)
    setOrdersError(null)
    try {
      console.log('[Profile Page] Loading orders for phone:', user.phone)
      const response = await fetch(`/api/orders/customer/${encodeURIComponent(user.phone)}`)

      if (response.status === 404) {
        console.log('[Profile Page] No orders found for phone:', user.phone)
        setOrders([])
        return
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          console.error('[Profile Page] Error loading orders:', data.error)
          setOrdersError(data.error || 'Gagal memuat riwayat pesanan')
          toast({
            title: 'Error',
            description: data.error || 'Gagal memuat riwayat pesanan',
            variant: 'destructive',
          })
        }
        return
      }

      const data = await response.json()
      console.log('[Profile Page] Orders loaded:', data.count, 'orders')
      if (data.success) {
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('[Profile Page] Error loading orders:', error)
      setOrdersError('Gagal memuat riwayat pesanan')
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat pesanan',
        variant: 'destructive',
      })
    } finally {
      setOrdersLoading(false)
    }
  }
  
  const loadPointHistory = async () => {
    if (!user?.phone) return
    
    try {
      const response = await fetch(`/api/members/phone/${encodeURIComponent(user.phone)}`)
      
      if (!response.ok) return
      
      const data = await response.json()
      if (data.success && data.data?.pointHistory) {
        setPointHistory(data.data.pointHistory)
      }
    } catch (error) {
      console.error('Error loading point history:', error)
    }
  }
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    console.log('[Profile Page] File selected:', file.name, file.size, file.type)
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('[Profile Page] Invalid file type:', file.type)
      toast({
        title: 'Format Tidak Didukung',
        description: 'Hanya JPEG, PNG, GIF, dan WebP yang diizinkan',
        variant: 'destructive',
      })
      return
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.log('[Profile Page] File too large:', file.size)
      toast({
        title: 'Ukuran File Terlalu Besar',
        description: 'Maksimal ukuran file adalah 5MB',
        variant: 'destructive',
      })
      return
    }
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('[Profile Page] Uploading file to server...')
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      })
      
      console.log('[Profile Page] Upload response status:', response.status)
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          console.log('[Profile Page] Upload error response:', data)
          throw new Error(data.error || 'Gagal mengupload foto')
        }
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[Profile Page] Upload response data:', data)
      
      if (data.success && data.data?.user) {
        console.log('[Profile Page] Updating profile with new avatar:', data.data.user.avatar)
        updateProfile(data.data.user)
        toast({
          title: 'Foto Berhasil Diupload',
          description: 'Foto profil Anda telah diperbarui',
        })
      } else {
        console.log('[Profile Page] Upload failed:', data)
        throw new Error(data.error || 'Gagal mengupload foto')
      }
    } catch (error: any) {
      console.error('[Profile Page] Upload error:', error)
      toast({
        title: 'Gagal Mengupload Foto',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          throw new Error(data.error || 'Gagal mengupdate profil')
        }
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        updateProfile(data.data)
        toast({
          title: 'Profil Berhasil Diupdate',
          description: 'Perubahan profil Anda telah disimpan',
        })
        setEditDialogOpen(false)
      }
    } catch (error: any) {
      toast({
        title: 'Gagal Mengupdate Profil',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Password Tidak Cocok',
        description: 'Password baru dan konfirmasi harus sama',
        variant: 'destructive',
      })
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Password Terlalu Pendek',
        description: 'Password minimal 6 karakter',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          throw new Error(data.error || 'Gagal mengubah password')
        }
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Password Berhasil Diubah',
          description: 'Password Anda telah diperbarui',
        })
        setPasswordDialogOpen(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Gagal Mengubah Password',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = () => {
    logout()
    setCurrentView('customer')
    toast({
      title: 'Logout Berhasil',
      description: 'Sampai jumpa kembali!',
    })
  }
  
  const getFirstName = (name: string) => {
    return name.split(' ')[0]
  }
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  // QR Code functions
  const handleOpenQrDialog = async () => {
    if (!user?.id) return

    setQrLoading(true)
    try {
      // Use query parameter instead of dynamic route
      const response = await fetch(`/api/members/qr?memberId=${encodeURIComponent(user.id)}`)
      const data = await response.json()

      if (data.success) {
        setQrData(data.data.qrData)
        setQrDialogOpen(true)
      } else {
        toast({
          title: 'Gagal',
          description: data.error || 'Gagal membuat QR code',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast({
        title: 'Gagal',
        description: 'Gagal membuat QR code',
        variant: 'destructive',
      })
    } finally {
      setQrLoading(false)
    }
  }

  // Member Card functions (for profile page)
  const handleOpenMemberCard = async () => {
    if (!user?.id) return

    setQrLoading(true)
    try {
      // Use query parameter instead of dynamic route
      const response = await fetch(`/api/members/qr?memberId=${encodeURIComponent(user.id)}`)
      const data = await response.json()

      if (data.success) {
        const memberNumber = user.phone || `MBR-${user.id.slice(-8).toUpperCase()}`
        setMemberCardData({
          qrData: data.data.qrData,
          memberNumber: memberNumber
        })
        setMemberCardOpen(true)

        // Generate barcode after dialog opens
        setTimeout(() => {
          if (barcodeRef.current) {
            JsBarcode(barcodeRef.current, memberNumber, {
              format: 'CODE128',
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 14,
              margin: 10,
              background: '#ffffff',
              lineColor: '#000000',
            })
          }
        }, 100)
      } else {
        toast({
          title: 'Gagal',
          description: data.error || 'Gagal membuat kartu member',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error generating member card:', error)
      toast({
        title: 'Gagal',
        description: 'Gagal membuat kartu member',
        variant: 'destructive',
      })
    } finally {
      setQrLoading(false)
    }
  }
  
  const handleCopyQrData = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData)
      setCopied(true)
      toast({
        title: 'Berhasil',
        description: 'Data QR code disalin ke clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleDownloadQr = () => {
    if (!qrData) return
    
    // Create QR code image using a QR code library or service
    // For now, we'll create a simple text file
    const element = document.createElement('a')
    const file = new Blob([`QR Code Data for ${user.name}:\n${qrData}`], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `member-qr-${user.name}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    toast({
      title: 'Berhasil',
      description: 'Data QR code diunduh',
    })
  }
  
  if (!isAuthenticated || !user) {
    return null
  }
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white pt-12 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentView('customer')}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
              <h1 className="text-2xl font-bold">Profil</h1>
            </div>
            
            {/* Notification Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-white hover:bg-white/20"
              >
                <BellRing className="w-6 h-6" />
              </Button>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar 
                key={user.avatar || 'default'}
                className="w-20 h-20 border-4 border-white/30 cursor-pointer" 
                onClick={handleAvatarClick}
              >
                <AvatarImage 
                  src={user.avatar ? `${user.avatar}?t=${Date.now()}` : undefined} 
                  alt={user.name} 
                />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 bg-white text-orange-600 rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-600 border-t-transparent" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold">{getFirstName(user.name)}</h2>
              <p className="text-white/80 flex items-center gap-2 text-sm">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
              <div className="mt-2 flex gap-2">
                {user.role === 'USER' && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    Member
                  </Badge>
                )}
                {user.role === 'ADMIN' && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    Admin
                  </Badge>
                )}
                {user.role === 'CASHIER' && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    Kasir
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <Card className="absolute top-20 right-4 w-80 shadow-xl z-50 max-h-96 overflow-y-auto">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Notifikasi</h3>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Tandai Semua Terbaca
                  </Button>
                </div>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        notification.read ? 'bg-gray-50' : 'bg-orange-50'
                      }`}
                    >
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-16">
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
            <TabsTrigger value="info" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              Pesanan
            </TabsTrigger>
            <TabsTrigger value="features" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Fitur Terbaru
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan
            </TabsTrigger>
          </TabsList>
          
          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            {/* Info Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informasi Pribadi</CardTitle>
                    <CardDescription>Kelola informasi profil Anda</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditForm({
                        name: user.name,
                        phone: user.phone || '',
                        address: (user as any).address || '',
                        email: user.email,
                      })
                      setEditDialogOpen(true)
                    }}
                    size="sm"
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                  <div className="bg-orange-500 p-2 rounded-lg text-white">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                    <p className="font-semibold">{user.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                  <div className="bg-orange-500 p-2 rounded-lg text-white">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                  <div className="bg-orange-500 p-2 rounded-lg text-white">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Nomor HP</p>
                    <p className="font-semibold">{user.phone || 'Belum diisi'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                  <div className="bg-orange-500 p-2 rounded-lg text-white">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Alamat</p>
                    <p className="font-semibold">{(user as any).address || 'Belum diisi'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Points Card (if USER role) */}
            {user.role === 'USER' && (
              <Card className="shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Poin Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">{(user as any).points || 0} Poin</div>
                  <p className="text-white/80 text-sm">
                    Setiap Rp 10.000 pembelian = 1 poin
                  </p>
                  <Separator className="my-4 bg-white/20" />
                  
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Riwayat Poin Terbaru</p>
                    {pointHistory.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {pointHistory.slice(0, 5).map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm bg-white/10 p-2 rounded">
                            <div>
                              <p className="font-medium">{item.reference}</p>
                              <p className="text-white/70 text-xs">
                                {new Date(item.date).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <span className={`font-bold ${item.points > 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {item.points > 0 ? '+' : ''}{item.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/70 text-sm">Belum ada riwayat poin</p>
                    )}
                  </div>
                  
                  <Separator className="my-4 bg-white/20" />

                  <Button
                    variant="secondary"
                    className="w-full gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={handleOpenMemberCard}
                    disabled={qrLoading}
                  >
                    {qrLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Memuat...
                      </>
                    ) : (
                      <>
                        <IdCard className="w-4 h-4" />
                        Lihat Kartu Member
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Security Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Keamanan
                </CardTitle>
                <CardDescription>Kelola keamanan akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  <Lock className="w-4 h-4" />
                  Ubah Password
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
            
            {/* Logout Button */}
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </TabsContent>
          
          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Riwayat Pesanan</CardTitle>
                    <CardDescription>Pesanan yang pernah Anda buat</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadOrders}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Memuat pesanan...</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-8">
                    <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <p className="text-red-500 mb-2">{ordersError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadOrders}
                      className="mt-2"
                    >
                      Coba Lagi
                    </Button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Belum ada pesanan</p>
                    <p className="text-xs text-muted-foreground">Mulai pesanan menu favorit Anda sekarang!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {orders.map((order) => (
                      <Card key={order.id} className="border-orange-100 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          {/* Order Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-base">{order.orderNumber}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </p>
                              {order.paymentMethod && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Metode: {order.paymentMethod === 'CASH' ? 'Tunai' : order.paymentMethod}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'COMPLETED' || order.status === 'DELIVERED'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'PROCESSING' || order.status === 'PREPARING'
                                  ? 'bg-orange-100 text-orange-700'
                                  : order.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {order.status === 'COMPLETED' || order.status === 'DELIVERED'
                                ? 'Selesai'
                                : order.status === 'PROCESSING' || order.status === 'PREPARING'
                                ? 'Diproses'
                                : order.status === 'PENDING'
                                ? 'Menunggu'
                                : order.status}
                            </span>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-3 mb-3">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                  {item.product?.image ? (
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                                      <ChefHat className="w-6 h-6 text-orange-600" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{item.product?.name || 'Produk'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.quantity} x {formatPrice(item.price)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-sm">
                                      {formatPrice(item.price * item.quantity)}
                                    </p>
                                    {item.discount > 0 && (
                                      <p className="text-xs text-green-600">
                                        -{formatPrice(item.discount)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Tidak ada item</p>
                            )}
                          </div>

                          {/* Points Info */}
                          {(order.pointsUsed > 0 || order.pointsEarned > 0) && (
                            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg mb-3">
                              <Gift className="w-4 h-4 text-orange-600" />
                              <div className="flex-1 text-sm">
                                {order.pointsUsed > 0 && (
                                  <span className="text-red-600">
                                    {order.pointsUsed} poin digunakan
                                  </span>
                                )}
                                {order.pointsUsed > 0 && order.pointsEarned > 0 && (
                                  <span className="mx-1">•</span>
                                )}
                                {order.pointsEarned > 0 && (
                                  <span className="text-green-600">
                                    +{order.pointsEarned} poin didapat
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <Separator className="my-3" />

                          {/* Order Total */}
                          <div className="space-y-2">
                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Diskon</span>
                                <span className="text-green-600">-{formatPrice(order.discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total</span>
                              <span className="text-orange-600">{formatPrice(order.totalAmount)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab - Fitur Terbaru */}
          <TabsContent value="features" className="space-y-4">
            {/* Promo Card */}
            <Card className="shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Promo Spesial Hari Ini
                </CardTitle>
                <CardDescription className="text-white/80">
                  Jangan lewatkan promo menarik khusus untuk Anda!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-white text-orange-600 rounded-lg p-2">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Diskon 20% untuk Pesanan Pertama</h4>
                      <p className="text-sm text-white/90 mt-1">
                        Nikmati diskon spesial 20% untuk pesanan pertama Anda hari ini!
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="bg-white text-orange-600">
                          Kode: NEW20
                        </Badge>
                        <span className="text-xs text-white/80">Berlaku hingga 31 Maret 2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Benefits Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  Keuntungan Member
                </CardTitle>
                <CardDescription>
                  Semakin sering belanja, semakin banyak keuntungan!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <div className="bg-orange-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-sm">Poin Member</p>
                    <p className="text-xs text-muted-foreground">1 poin per Rp 10.000</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-sm">Tingkat Member</p>
                    <p className="text-xs text-muted-foreground">Bronze → Silver → Gold</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Percent className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-sm">Diskon Poin</p>
                    <p className="text-xs text-muted-foreground">1 poin = Rp 10.000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Features Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  Fitur Baru
                </CardTitle>
                <CardDescription>
                  Update terbaru dari AYAM GEPREK SAMBAL IJO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="bg-blue-500 text-white rounded-lg p-2">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Kartu Member Digital</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Akses kartu member Anda dengan QR Code dan Barcode. Klik tombol QR Member di navigasi bawah!
                    </p>
                    <Badge className="mt-2 bg-blue-500">BARU</Badge>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="bg-green-500 text-white rounded-lg p-2">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Riwayat Pesanan</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pantau semua riwayat pesanan Anda dengan mudah di tab Pesanan
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                  <div className="bg-purple-500 text-white rounded-lg p-2">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Notifikasi Real-time</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dapatkan update status pesanan dan promo terbaru langsung di notifikasi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Card */}
            <Card className="shadow-lg border-dashed border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  Segera Hadir
                </CardTitle>
                <CardDescription>
                  Fitur yang sedang kami kembangkan untuk Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-medium">Loyalty Program Multi-level</p>
                    <p className="text-xs text-muted-foreground">Tingkat member dengan benefit berbeda</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-medium">Pre-order & Reservation</p>
                    <p className="text-xs text-muted-foreground">Pesan dan reservasi meja dari rumah</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-medium">Referral Program</p>
                    <p className="text-xs text-muted-foreground">Dapat poin tambahan dengan mengajak teman</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifikasi
                </CardTitle>
                <CardDescription>Kelola preferensi notifikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifikasi Pesanan</p>
                    <p className="text-sm text-muted-foreground">
                      Terima update status pesanan
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings}
                    onCheckedChange={setNotificationSettings}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Update Email</p>
                    <p className="text-sm text-muted-foreground">
                      Terima promo dan info terbaru via email
                    </p>
                  </div>
                  <Switch
                    checked={emailUpdates}
                    onCheckedChange={setEmailUpdates}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Aplikasi</CardTitle>
                <CardDescription>Informasi tentang aplikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Versi</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Restaurant</span>
                  <span className="font-medium">AYAM GEPREK SAMBAL IJO</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
            <DialogDescription>
              Update informasi profil Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Email tidak dapat diubah
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="08123456789"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <textarea
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Alamat lengkap Anda"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>
              Masukkan password lama dan password baru Anda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Mengubah...' : 'Ubah Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-600" />
              QR Code Member
            </DialogTitle>
            <DialogDescription>
              Scan QR code ini untuk poin member Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-lg">
                {qrData ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
                    alt="Member QR Code"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-600 border-t-transparent" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.phone}</p>
              <p className="text-xs text-muted-foreground">
                Poin: {(user as any).points || 0}
              </p>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyQrData}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Disalin' : 'Salin'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleDownloadQr}
              >
                <Download className="w-4 h-4" />
                Unduh
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setQrDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Card Dialog */}
      <Dialog open={memberCardOpen} onOpenChange={setMemberCardOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IdCard className="w-5 h-5 text-orange-600" />
              Kartu Member
            </DialogTitle>
            <DialogDescription>
              Scan QR code atau barcode ini untuk mengumpulkan poin
            </DialogDescription>
          </DialogHeader>

          {qrLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent" />
              <p className="mt-4 text-muted-foreground">Memuat kartu member...</p>
            </div>
          ) : memberCardData ? (
            <div className="space-y-6 py-4">
              {/* Member Card Design */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white">
                {/* Card Pattern Background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="relative p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">KARTU MEMBER</p>
                      <h3 className="text-2xl font-bold mt-1">AYAM GEPREK SAMBAL IJO</h3>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <Gift className="w-6 h-6" />
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  {/* Member Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-3 border-white/50">
                      <AvatarImage
                        src={user?.avatar ? `${user.avatar}?t=${Date.now()}` : undefined}
                        alt={user?.name}
                      />
                      <AvatarFallback className="bg-white/30 text-white text-xl font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{user?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={
                            user?.role === 'ADMIN'
                              ? 'bg-purple-500'
                              : user?.role === 'CASHIER'
                              ? 'bg-blue-500'
                              : 'bg-yellow-500 text-black'
                          }
                        >
                          {user?.role === 'ADMIN' ? 'ADMIN' : user?.role === 'CASHIER' ? 'KASIR' : 'MEMBER'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-orange-100 text-sm">Poin Tersedia</p>
                    <p className="text-3xl font-bold mt-1">{(user as any).points || 0} Poin</p>
                    <p className="text-orange-100 text-xs mt-1">Setiap Rp 10.000 = 1 poin</p>
                  </div>

                  {/* Barcode */}
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex justify-center">
                      <svg ref={barcodeRef} className="w-full" />
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(memberCardData.qrData)}`}
                        alt="Member QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-orange-100">
                    <p>Terdaftar: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : 'N/A'}</p>
                    <p>{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (memberCardData?.memberNumber) {
                      navigator.clipboard.writeText(memberCardData.memberNumber)
                      toast({
                        title: 'Berhasil',
                        description: 'Nomor member disalin ke clipboard',
                      })
                    }
                  }}
                >
                  <Copy className="w-4 h-4" />
                  Salin No. Member
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleOpenMemberCard}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setMemberCardOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
