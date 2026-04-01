'use client'

import { useState } from 'react'
import { Store, Lock, User, ArrowLeft, Eye, EyeOff, Phone, MapPin, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/hooks/use-toast'

const RESTAURANT_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
  phone: '085260812758',
}

export default function LoginPage() {
  const { setCurrentView } = useUIStore()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  })
  const [forgotForm, setForgotForm] = useState({ email: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      })

      // Check if response is OK
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && (contentType.includes('application/json') || contentType.includes('text/json'))) {
          const data = await response.json()
          throw new Error(data.error || data.message || 'Login gagal')
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Login gagal')
      }

      // Login user
      login(data.user, data.token)

      toast({
        title: 'Login Berhasil',
        description: `Selamat datang, ${data.user.name}!`,
      })

      // Redirect based on role
      if (data.user.role === 'ADMIN' || data.user.role === 'MANAGER') {
        setCurrentView('admin')
      } else if (data.user.role === 'CASHIER') {
        setCurrentView('pos')
      } else {
        // USER role - go to customer view
        setCurrentView('customer')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: 'Login Gagal',
        description: error.message || 'Terjadi kesalahan saat login',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!registerForm.name.trim() || !registerForm.email || !registerForm.phone || !registerForm.password) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Nama, email, nomor telepon, dan password wajib diisi',
        variant: 'destructive',
      })
      return
    }

    if (registerForm.password.length < 6) {
      toast({
        title: 'Password Terlalu Pendek',
        description: 'Password minimal 6 karakter',
        variant: 'destructive',
      })
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: 'Password Tidak Cocok',
        description: 'Password dan konfirmasi password harus sama',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          address: registerForm.address,
          password: registerForm.password,
          role: 'USER',
        }),
      })

      // Check if response is OK
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && (contentType.includes('application/json') || contentType.includes('text/json'))) {
          try {
            const data = await response.json()
            const errorMessage = data.error || data.message || 'Registrasi gagal'
            throw new Error(errorMessage)
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError)
            throw new Error(`Server error: ${response.status}`)
          }
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError)
        throw new Error('Gagal memproses respon server')
      }

      if (!data.success) {
        throw new Error(data.error || data.message || 'Registrasi gagal')
      }

      // Auto login after registration
      login(data.user, data.token)

      toast({
        title: 'Registrasi Berhasil',
        description: `Selamat bergabung, ${data.user.name}!`,
      })

      // Redirect to customer view
      setCurrentView('customer')

      // Reset form
      setRegisterForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!forgotForm.email) {
      toast({
        title: 'Email Diperlukan',
        description: 'Silakan masukkan email Anda',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    // Simulate password reset (will be replaced with API call)
    setTimeout(() => {
      setLoading(false)
      toast({
        title: 'Link Reset Terkirim',
        description: 'Link untuk reset password telah dikirim ke email Anda',
      })
      setForgotForm({ email: '' })
      setShowForgotPassword(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center space-y-4 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              {RESTAURANT_INFO.name}
            </h1>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-orange-100">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">
              {showForgotPassword ? 'Lupa Password' : showRegister ? 'Daftar Member' : 'Selamat Datang'}
            </CardTitle>
            <CardDescription>
              {showForgotPassword
                ? 'Masukkan email untuk reset password'
                : showRegister
                ? 'Daftar untuk nikmati keuntungan member'
                : 'Login untuk mengakses akun Anda'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showForgotPassword && !showRegister ? (
              /* Login Form */
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@contoh.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Login'}
                  </Button>
                </form>

                <div className="mt-4 space-y-3">
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true)
                        setShowRegister(false)
                      }}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Lupa Password?
                    </button>
                  </div>

                  <div className="relative pt-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Atau</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Belum punya akun?</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRegister(true)
                        setShowForgotPassword(false)
                      }}
                      className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      Daftar Member
                    </Button>
                  </div>
                </div>
              </>
            ) : showForgotPassword ? (
              /* Forgot Password Form */
              <>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center py-4">
                    <Lock className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                    <p className="text-muted-foreground">
                      Masukkan email Anda untuk menerima link reset password
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="email@contoh.com"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Kirim Link Reset'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setShowRegister(false)
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    ← Kembali ke Login
                  </button>
                </div>
              </>
            ) : (
              /* Register Form */
              <>
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="email@contoh.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Nomor HP</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        placeholder="08123456789"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-address">Alamat</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                      <textarea
                        id="reg-address"
                        placeholder="Alamat lengkap Anda"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                        rows={2}
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm-password">Konfirmasi Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Daftar Member'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegister(false)
                      setShowForgotPassword(false)
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    ← Kembali ke Login
                  </button>
                </div>
              </>
            )}

            {/* Back Button */}
            <div className="mt-6 pt-6 border-t border-orange-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('customer')}
                className="w-full gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
