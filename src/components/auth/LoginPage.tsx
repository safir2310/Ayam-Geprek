'use client'

import { useState } from 'react'
import { Store, Lock, User, ArrowLeft, Eye, EyeOff, Phone, MapPin, Mail, Sparkles, KeyRound, UserPlus, LogIn, Loader2 } from 'lucide-react'
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

      const data = await response.json()

      // Check if login was successful
      if (data.success && data.user) {
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
      } else {
        // Show error message from API
        toast({
          title: 'Login Gagal',
          description: data.error || data.message || 'Email atau password salah',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      // Only catch network errors here
      console.error('Login error:', error)
      toast({
        title: 'Login Gagal',
        description: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
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

      const data = await response.json()

      // Check if registration was successful
      if (data.success && data.user) {
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
      } else {
        // Show error message from API
        toast({
          title: 'Registrasi Gagal',
          description: data.error || data.message || 'Terjadi kesalahan saat mendaftar',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      // Only catch network errors here
      console.error('Registration error:', error)
      toast({
        title: 'Registrasi Gagal',
        description: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
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

    try {
      const response = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotForm.email,
        }),
      })

      const data = await response.json()

      // Check if response is successful
      if (data.success) {
        // Show success message
        toast({
          title: 'Link Reset Terkirim',
          description: data.message || 'Link untuk reset password telah dikirim ke email Anda',
        })
        setForgotForm({ email: '' })
        setShowForgotPassword(false)
      } else {
        // Show error message (email not registered or other error)
        toast({
          title: 'Gagal',
          description: data.error || 'Terjadi kesalahan saat memproses permintaan',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      // Only show network errors here
      toast({
        title: 'Gagal',
        description: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-premium flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-32 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-36 h-36 bg-orange-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/4 w-44 h-44 bg-yellow-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header - Premium */}
        <div className="text-center space-y-4 mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl shadow-glow-orange animate-float">
            <Store className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gradient-orange tracking-tight animate-fade-in-up stagger-1">
              {RESTAURANT_INFO.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 tracking-wide animate-fade-in-up stagger-2">
              🍗 Pedasnya Bikin Nangih!!
            </p>
          </div>
        </div>

        {/* Login Card - Premium */}
        <Card className="glass-premium shadow-premium-lg border-0 animate-fade-in-up stagger-3">
          <CardHeader className="text-center pb-6 pt-8">
            <CardTitle className="text-2xl font-bold">
              {showForgotPassword ? 'Lupa Password' : showRegister ? 'Daftar Member' : 'Selamat Datang'}
            </CardTitle>
            <CardDescription className="text-sm">
              {showForgotPassword
                ? 'Masukkan email untuk reset password'
                : showRegister
                ? 'Daftar untuk nikmati keuntungan member'
                : 'Login untuk mengakses akun Anda'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showForgotPassword && !showRegister ? (
              /* Login Form - Premium */
              <>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@contoh.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="pl-12 h-12 border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl glass transition-all duration-300"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-12 pr-12 h-12 border-2 border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-xl glass transition-all duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true)
                          setShowRegister(false)
                        }}
                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                      >
                        Lupa Password?
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-semibold py-3.5 rounded-xl shadow-glow-orange hover:shadow-glow-orange hover-lift transition-all duration-300"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" />
                        Login
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 space-y-4">
                  <div className="relative pt-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-orange-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-muted-foreground font-medium">Atau</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3 font-medium">Belum punya akun?</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRegister(true)
                        setShowForgotPassword(false)
                      }}
                      className="w-full border-2 border-orange-300 text-orange-600 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 font-semibold py-3 rounded-xl transition-all duration-300 hover-lift"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
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
