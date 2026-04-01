'use client'

import { useState, useEffect } from 'react'
import { QrCode, Upload, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

export default function QRISUpload() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [currentQrCode, setCurrentQrCode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load current QR code on mount
  useEffect(() => {
    loadCurrentQrCode()
  }, [])

  const loadCurrentQrCode = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/qris')
      const data = await response.json()

      if (data.success && data.data) {
        setCurrentQrCode(data.data)
        setQrCodeUrl(data.data)
      }
    } catch (error) {
      console.error('Error loading QR code:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!qrCodeUrl.trim()) {
      toast({
        title: 'Error',
        description: 'URL QR Code tidak boleh kosong',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/qris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCodeUrl: qrCodeUrl.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentQrCode(qrCodeUrl.trim())
        toast({
          title: 'Berhasil',
          description: 'QR Code QRIS berhasil disimpan',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal menyimpan QR Code',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal terhubung ke server',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/qris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCodeUrl: '' }),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentQrCode(null)
        setQrCodeUrl('')
        toast({
          title: 'Berhasil',
          description: 'QR Code QRIS berhasil dihapus',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Gagal menghapus QR Code',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal terhubung ke server',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-6 h-6 text-orange-600" />
          Upload QR Code QRIS
        </CardTitle>
        <CardDescription>
          Upload QR code QRIS untuk pembayaran di POS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current QR Code Preview */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : currentQrCode ? (
          <div className="space-y-4">
            <div className="bg-white border-2 border-green-500 rounded-lg p-6 shadow-sm">
              <div className="flex justify-center">
                <img
                  src={currentQrCode}
                  alt="Current QRIS QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              <Check className="w-4 h-4" />
              <span>QR Code QRIS saat ini aktif</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <QrCode className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-500 text-sm">Belum ada QR Code QRIS</p>
          </div>
        )}

        {/* Upload Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">URL Gambar QR Code</label>
            <div className="flex gap-2">
              <Input
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value)}
                placeholder="https://example.com/qris-qr-code.png"
                className="flex-1"
              />
              <Button
                onClick={handleSave}
                disabled={isSaving || !qrCodeUrl.trim()}
                className="bg-gradient-to-r from-orange-500 to-orange-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Masukkan URL gambar QR Code QRIS Anda. Pastikan gambar dapat diakses publik.
            </p>
          </div>

          {currentQrCode && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSaving}
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Hapus QR Code
            </Button>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 text-sm">Cara Mendapatkan QR Code QRIS:</h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Login ke dashboard payment gateway (Midtrans/Xendit/Tripay)</li>
              <li>Unduh atau dapatkan QR code QRIS Anda</li>
              <li>Upload gambar ke layanan gambar publik (imgur, Cloudinary, dll)</li>
              <li>Copy URL gambar dan paste di kolom di atas</li>
              <li>Klik "Simpan" untuk mengaktifkan</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
