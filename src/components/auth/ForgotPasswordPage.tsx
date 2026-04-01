'use client'

import { useState } from 'react'
import { ArrowLeft, Mail, CheckCircle, ArrowRight, Lock, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/stores/ui-store'
import { toast } from '@/hooks/use-toast'

const RESTAURANT_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  phone: '085260812758',
}

export default function ForgotPasswordPage() {
  const { setCurrentView } = useUIStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: 'Email Diperlukan',
        description: 'Masukkan email Anda',
        variant: 'destructive',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email Tidak Valid',
        description: 'Format email tidak valid',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Simulated password reset - in production, this would send an email
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSuccess(true)
      toast({
        title: 'Email Terkirim',
        description: 'Link reset password telah dikirim ke email Anda',
      })
    } catch (error) {
      console.error('Password reset error:', error)
      toast({
        title: 'Gagal',
        description: 'Gagal mengirim email reset password',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100/50 to-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-transparent to-white/50" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center space-y-8 mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-3xl shadow-2xl shadow-orange-500/30">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
              Lupa Password?
            </h1>
            <p className="text-muted-foreground">
              Masukkan email Anda dan kami akan mengirim link reset password
            </p>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-8">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 border-2 focus:border-orange-500 transition-all duration-300"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-14 text-base font-semibold shadow-lg shadow-orange-500/30 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Email Terkirim!
                </h3>
                <p className="text-gray-600 mb-6">
                  Kami telah mengirim link reset password ke:
                </p>
                <p className="text-sm font-semibold text-orange-600 mb-6 bg-orange-50 p-3 rounded-lg inline-block">
                  {email}
                </p>
                <p className="text-sm text-gray-500">
                  Silakan cek email Anda dan ikuti instruksi untuk reset password
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => setCurrentView('login')}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali ke Login
                  </Button>
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Kirim Ulang
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!success && (
          <div className="text-center mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Ingat password Anda?
            </p>
            <Button
              variant="link"
              onClick={() => setCurrentView('login')}
              className="text-orange-600 hover:text-orange-700 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Login
            </Button>
          </div>
        )}

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Butuh bantuan?</p>
          <a
            href={`tel:${RESTAURANT_INFO.phone}`}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Hubungi Kami: {RESTAURANT_INFO.phone}
          </a>
        </div>
      </div>
    </div>
  )
}
