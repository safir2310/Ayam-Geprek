'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreditCard, QrCode, Wallet, DollarSign, Smartphone, Ticket, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'

type PaymentMethod = {
  id: string
  name: string
  type: 'CASH' | 'QRIS' | 'E_WALLET' | 'BANK_TRANSFER' | 'CARD' | 'VOUCHER'
  isActive: boolean
  fee?: number
  minAmount?: number
  maxAmount?: number
  icon?: string
  description?: string
}

interface POSPaymentMethodsProps {
  selectedMethod: string
  onMethodSelect: (method: string) => void
  totalAmount: number
}

export default function POSPaymentMethods({ selectedMethod, onMethodSelect, totalAmount }: POSPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payment-methods')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPaymentMethods(data.data.filter((m: PaymentMethod) => m.isActive))
        }
      } else {
        // Use default payment methods if API fails
        setPaymentMethods(getDefaultPaymentMethods())
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      setPaymentMethods(getDefaultPaymentMethods())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultPaymentMethods = (): PaymentMethod[] => [
    {
      id: '1',
      name: 'Tunai',
      type: 'CASH',
      isActive: true,
      icon: 'DollarSign',
      description: 'Pembayaran dengan uang tunai',
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
    },
    {
      id: '3',
      name: 'GoPay',
      type: 'E_WALLET',
      isActive: true,
      fee: 0,
      minAmount: 1000,
      maxAmount: 5000000,
      icon: 'Smartphone',
      description: 'Pembayaran via GoPay',
    },
    {
      id: '4',
      name: 'OVO',
      type: 'E_WALLET',
      isActive: true,
      fee: 0,
      minAmount: 1000,
      maxAmount: 5000000,
      icon: 'Smartphone',
      description: 'Pembayaran via OVO',
    },
    {
      id: '5',
      name: 'DANA',
      type: 'E_WALLET',
      isActive: true,
      fee: 0,
      minAmount: 1000,
      maxAmount: 5000000,
      icon: 'Smartphone',
      description: 'Pembayaran via DANA',
    },
    {
      id: '6',
      name: 'Kartu Debit/Kredit',
      type: 'CARD',
      isActive: true,
      fee: 1500,
      minAmount: 10000,
      maxAmount: 20000000,
      icon: 'CreditCard',
      description: 'Pembayaran dengan kartu debit/kredit',
    },
    {
      id: '7',
      name: 'Voucher',
      type: 'VOUCHER',
      isActive: true,
      fee: 0,
      minAmount: 5000,
      maxAmount: 1000000,
      icon: 'Ticket',
      description: 'Gunakan kode voucher',
    },
    {
      id: '8',
      name: 'Transfer Bank BCA',
      type: 'BANK_TRANSFER',
      isActive: true,
      fee: 0,
      minAmount: 10000,
      maxAmount: 50000000,
      icon: 'Wallet',
      description: 'Transfer ke rekening BCA',
    },
    {
      id: '9',
      name: 'Transfer Bank Mandiri',
      type: 'BANK_TRANSFER',
      isActive: true,
      fee: 0,
      minAmount: 10000,
      maxAmount: 50000000,
      icon: 'Wallet',
      description: 'Transfer ke rekening Mandiri',
    },
  ]

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'QrCode':
        return <QrCode className="w-6 h-6" />
      case 'Smartphone':
        return <Smartphone className="w-6 h-6" />
      case 'Wallet':
        return <Wallet className="w-6 h-6" />
      case 'DollarSign':
        return <DollarSign className="w-6 h-6" />
      case 'Ticket':
        return <Ticket className="w-6 h-6" />
      default:
        return <CreditCard className="w-6 h-6" />
    }
  }

  const getTypeColor = (type: PaymentMethod['type'], isSelected: boolean) => {
    const baseStyle = isSelected ? 'text-white' : ''
    const colors = {
      CASH: isSelected ? 'bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-700' : 'border-2 border-slate-200 hover:border-green-300 text-slate-700',
      QRIS: isSelected ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-700' : 'border-2 border-slate-200 hover:border-blue-300 text-slate-700',
      E_WALLET: isSelected ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-2 border-purple-700' : 'border-2 border-slate-200 hover:border-purple-300 text-slate-700',
      BANK_TRANSFER: isSelected ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-2 border-orange-700' : 'border-2 border-slate-200 hover:border-orange-300 text-slate-700',
      CARD: isSelected ? 'bg-gradient-to-r from-slate-700 to-slate-800 border-2 border-slate-900' : 'border-2 border-slate-200 hover:border-slate-300 text-slate-700',
      VOUCHER: isSelected ? 'bg-gradient-to-r from-pink-500 to-pink-600 border-2 border-pink-700' : 'border-2 border-slate-200 hover:border-pink-300 text-slate-700',
    }
    return colors[type] || colors.CASH
  }

  const isMethodAvailable = (method: PaymentMethod) => {
    if (method.minAmount && totalAmount < method.minAmount) return false
    if (method.maxAmount && totalAmount > method.maxAmount) return false
    return true
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        Metode Pembayaran
      </label>
      
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <ScrollArea className="max-h-[400px] pr-2">
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.type
              const isAvailable = isMethodAvailable(method)
              const iconColor = isSelected ? 'text-white' : 
                              method.type === 'CASH' ? 'text-green-600' :
                              method.type === 'QRIS' ? 'text-blue-600' :
                              method.type === 'E_WALLET' ? 'text-purple-600' :
                              method.type === 'BANK_TRANSFER' ? 'text-orange-600' :
                              method.type === 'VOUCHER' ? 'text-pink-600' :
                              'text-slate-600'

              return (
                <div key={method.id} className="relative">
                  <Button
                    className={`h-auto p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                      getTypeColor(method.type, isSelected)
                    } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-lg'}`}
                    onClick={() => isAvailable && onMethodSelect(method.type)}
                    disabled={!isAvailable}
                  >
                    <div className={`flex items-center justify-center gap-1 ${iconColor}`}>
                      {getIcon(method.icon)}
                      {isSelected && <CheckCircle className="w-4 h-4 ml-1" />}
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">
                      {method.name}
                    </span>
                    {method.fee && method.fee > 0 && (
                      <Badge className="text-[10px] px-1 py-0 h-auto">
                        +{formatCurrency(method.fee)}
                      </Badge>
                    )}
                  </Button>
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <span className="text-xs text-white font-semibold">
                        {method.minAmount && totalAmount < method.minAmount && `Min. ${formatCurrency(method.minAmount)}`}
                        {method.maxAmount && totalAmount > method.maxAmount && `Max. ${formatCurrency(method.maxAmount)}`}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Selected Method Details */}
      {selectedMethod && (
        <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                {getIcon(
                  paymentMethods.find(m => m.type === selectedMethod)?.icon
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  {paymentMethods.find(m => m.type === selectedMethod)?.name}
                </p>
                <p className="text-xs text-slate-600">
                  {paymentMethods.find(m => m.type === selectedMethod)?.description}
                </p>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">
              Dipilih
            </Badge>
          </div>
          
          {paymentMethods.find(m => m.type === selectedMethod)?.fee && 
           paymentMethods.find(m => m.type === selectedMethod)!.fee! > 0 && (
            <div className="mt-2 pt-2 border-t border-orange-200 flex justify-between text-sm">
              <span className="text-slate-600">Biaya Admin:</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(paymentMethods.find(m => m.type === selectedMethod)!.fee!)}
              </span>
            </div>
          )}
          
          {paymentMethods.find(m => m.type === selectedMethod)?.minAmount && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Min. Transaksi:</span>
              <span>{formatCurrency(paymentMethods.find(m => m.type === selectedMethod)!.minAmount!)}</span>
            </div>
          )}
          
          {paymentMethods.find(m => m.type === selectedMethod)?.maxAmount && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Max. Transaksi:</span>
              <span>{formatCurrency(paymentMethods.find(m => m.type === selectedMethod)!.maxAmount!)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
