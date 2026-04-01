'use client'

import { useState } from 'react'
import { User, Mail, Lock, Phone, MapPin, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/hooks/use-toast'

const RESTAURANT_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
}

export default function RegisterPage() {
  const { setCurrentView } = useUIStore()
  const { login, getRedirectPath } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama harus diisi'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama minimal 3 karakter'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = 'Email harus diisi'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!formData.phone) {
      newErrors.phone = 'Nomor telepon harus diisi'
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Nomor telepon minimal 10 digit'
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'USER',
        }),
      })

      // Check if response is OK
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && (contentType.includes('application/json') || contentType.includes('text/json'))) {
          const data = await response.json()
          throw new Error(data.error || data.message || 'Registrasi gagal')
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Registrasi gagal')
      }

      // Auto login after registration
      login(data.user, data.token)

      const redirectPath = getRedirectPath()
      setCurrentView(redirectPath)

      toast({
        title: 'Registrasi Berhasil',
        description: `Selamat bergabung, ${data.user.name}!`,
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      toast({
        title: 'Registrasi Gagal',
        description: error.message || 'Terjadi kesalahan saat mendaftar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama harus diisi'
    }
    if (!formData.email) {
      newErrors.email = 'Email harus diisi'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100/50 to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-transparent to-white/50" />

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left - Info */}
          <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-3xl shadow-2xl shadow-orange-500/30">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
                Daftar Member
              </h1>
              <p className="text-lg text-muted-foreground">
                Bergabung dengan {RESTAURANT_INFO.name} dan nikmati keuntungan eksklusif!
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <span className="text-gray-700">Kumpulkan poin dari setiap pesanan</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <span className="text-gray-700">Dapatkan promo dan diskon khusus</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm">
                <CheckCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <span className="text-gray-700">Lihat riwayat pesanan dengan mudah</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => setCurrentView('login')}
              className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 group"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Sudah punya akun? Login
            </Button>
          </div>

          {/* Right - Register Form */}
          <div className="order-1 lg:order-2">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 p-8 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Buat Akun</h2>
                <p className="text-white/80">Daftar sebagai member {RESTAURANT_INFO.name}</p>
              </div>

              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {step === 1 ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 font-medium">Nama Lengkap</Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`pl-12 h-12 border-2 focus:border-orange-500 transition-all duration-300 text-base ${errors.name ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="nama@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`pl-12 h-12 border-2 focus:border-orange-500 transition-all duration-300 text-base ${errors.email ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>

                      <Button
                        type="button"
                        onClick={handleNext}
                        className="w-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 text-base font-semibold shadow-lg shadow-orange-500/30 transition-all duration-300 group"
                      >
                        Lanjut
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-medium">Nomor HP</Label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="08123456789"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={`pl-12 h-12 border-2 focus:border-orange-500 transition-all duration-300 text-base ${errors.phone ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-gray-700 font-medium">Alamat Lengkap <span className="text-gray-400 font-normal">(Opsional)</span></Label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                          <textarea
                            id="address"
                            placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                            className="pl-12 pr-4 py-3 min-h-[100px] w-full rounded-md border-2 border-gray-200 focus:border-orange-500 transition-all duration-300 text-base resize-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={`pl-12 pr-12 h-12 border-2 focus:border-orange-500 transition-all duration-300 text-base ${errors.password ? 'border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Konfirmasi Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`pl-12 pr-12 h-12 border-2 focus:border-orange-500 transition-all duration-300 text-base ${errors.confirmPassword ? 'border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          className="flex-1 h-14 text-base font-semibold border-2 border-gray-200 hover:bg-gray-50 transition-all duration-300"
                        >
                          Kembali
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 text-base font-semibold shadow-lg shadow-orange-500/30 transition-all duration-300"
                          disabled={loading}
                        >
                          {loading ? 'Memproses...' : 'Daftar'}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
