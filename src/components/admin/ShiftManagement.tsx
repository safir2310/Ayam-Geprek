'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Calendar,
  Download,
  User,
  DollarSign,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  Eye,
  X,
  CreditCard,
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Shift {
  id: string
  cashierId: string
  cashierName: string
  openingBalance: number
  closingBalance?: number
  totalSales: number
  cashSales: number
  nonCashSales: number
  systemBalance: number
  physicalBalance?: number
  difference?: number
  status: 'OPEN' | 'CLOSED'
  openedAt: string
  closedAt?: string
}

// Mock Data - Cashiers
const CASHIERS = [
  { id: 'CSH-001', name: 'Andi Pratama' },
  { id: 'CSH-002', name: 'Siti Aminah' },
  { id: 'CSH-003', name: 'Budi Santoso' },
]

// Mock Data - Shifts
const MOCK_SHIFTS: Shift[] = [
  {
    id: 'SHF-001',
    cashierId: 'CSH-001',
    cashierName: 'Andi Pratama',
    openingBalance: 500000,
    totalSales: 3250000,
    cashSales: 2800000,
    nonCashSales: 450000,
    systemBalance: 3300000,
    status: 'OPEN',
    openedAt: '2024-03-15T08:00:00',
  },
  {
    id: 'SHF-002',
    cashierId: 'CSH-002',
    cashierName: 'Siti Aminah',
    openingBalance: 500000,
    closingBalance: 2800000,
    totalSales: 2300000,
    cashSales: 1950000,
    nonCashSales: 350000,
    systemBalance: 2450000,
    physicalBalance: 2450000,
    difference: 0,
    status: 'CLOSED',
    openedAt: '2024-03-14T08:00:00',
    closedAt: '2024-03-14T16:00:00',
  },
  {
    id: 'SHF-003',
    cashierId: 'CSH-003',
    cashierName: 'Budi Santoso',
    openingBalance: 500000,
    closingBalance: 2750000,
    totalSales: 2250000,
    cashSales: 1900000,
    nonCashSales: 350000,
    systemBalance: 2400000,
    physicalBalance: 2425000,
    difference: 25000,
    status: 'CLOSED',
    openedAt: '2024-03-14T16:00:00',
    closedAt: '2024-03-15T00:00:00',
  },
  {
    id: 'SHF-004',
    cashierId: 'CSH-001',
    cashierName: 'Andi Pratama',
    openingBalance: 500000,
    closingBalance: 2100000,
    totalSales: 1600000,
    cashSales: 1400000,
    nonCashSales: 200000,
    systemBalance: 1900000,
    physicalBalance: 1875000,
    difference: -25000,
    status: 'CLOSED',
    openedAt: '2024-03-14T00:00:00',
    closedAt: '2024-03-14T08:00:00',
  },
]

export default function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [cashierFilter, setCashierFilter] = useState<string>('all')
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false)
  const [viewShiftModalOpen, setViewShiftModalOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [physicalBalance, setPhysicalBalance] = useState('')

  // Simulate real-time updates for open shifts
  useEffect(() => {
    const interval = setInterval(() => {
      setShifts((prevShifts) =>
        prevShifts.map((shift) => {
          if (shift.status === 'OPEN') {
            // Simulate sales increasing
            const additionalSales = Math.floor(Math.random() * 50000)
            const newTotalSales = shift.totalSales + additionalSales
            const newCashSales = shift.cashSales + Math.floor(additionalSales * 0.85)
            const newNonCashSales = shift.nonCashSales + Math.floor(additionalSales * 0.15)
            const newSystemBalance = shift.openingBalance + newCashSales

            return {
              ...shift,
              totalSales: newTotalSales,
              cashSales: newCashSales,
              nonCashSales: newNonCashSales,
              systemBalance: newSystemBalance,
            }
          }
          return shift
        })
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getCurrentOpenShift = () => {
    return shifts.find((shift) => shift.status === 'OPEN')
  }

  const getClosedShifts = () => {
    return shifts.filter((shift) => shift.status === 'CLOSED')
  }

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch =
      shift.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCashier = cashierFilter === 'all' || shift.cashierId === cashierFilter

    let matchesDate = true
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      matchesDate = shift.openedAt.startsWith(today)
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(shift.openedAt) >= weekAgo
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(shift.openedAt) >= monthAgo
    }

    return matchesSearch && matchesCashier && matchesDate
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleCloseShiftModal = (shift: Shift) => {
    setSelectedShift(shift)
    setPhysicalBalance('')
    setCloseShiftModalOpen(true)
  }

  const handleViewShiftModal = (shift: Shift) => {
    setSelectedShift(shift)
    setViewShiftModalOpen(true)
  }

  const handleCloseShift = () => {
    if (!selectedShift) return

    const physicalBalanceValue = parseFloat(physicalBalance)
    if (isNaN(physicalBalanceValue) || physicalBalanceValue < 0) {
      toast({
        title: 'Error',
        description: 'Saldo fisik tidak valid',
        variant: 'destructive',
      })
      return
    }

    const difference = physicalBalanceValue - selectedShift.systemBalance

    const updatedShifts = shifts.map((shift) =>
      shift.id === selectedShift.id
        ? {
            ...shift,
            status: 'CLOSED' as const,
            closingBalance: physicalBalanceValue,
            physicalBalance: physicalBalanceValue,
            difference,
            closedAt: new Date().toISOString(),
          }
        : shift
    )

    setShifts(updatedShifts)
    setCloseShiftModalOpen(false)
    setPhysicalBalance('')
    setSelectedShift(null)

    const diffMessage = difference === 0 ? 'Sesuai' : `Selisih ${formatPrice(Math.abs(difference))}`
    toast({
      title: 'Berhasil',
      description: `Shift berhasil ditutup. ${diffMessage}`,
    })
  }

  const handleExport = () => {
    toast({
      title: 'Export Berhasil',
      description: 'Laporan shift berhasil diekspor',
    })
  }

  const calculateStats = () => {
    const closedShifts = getClosedShifts()
    const totalSales = closedShifts.reduce((sum, s) => sum + s.totalSales, 0)
    const totalCashSales = closedShifts.reduce((sum, s) => sum + s.cashSales, 0)
    const totalNonCashSales = closedShifts.reduce((sum, s) => sum + s.nonCashSales, 0)
    const totalShifts = closedShifts.length
    const avgSales = totalShifts > 0 ? totalSales / totalShifts : 0

    return { totalSales, totalCashSales, totalNonCashSales, totalShifts, avgSales }
  }

  const stats = calculateStats()
  const openShift = getCurrentOpenShift()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Manajemen Shift Kasir
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola shift kasir, buka/tutup shift, dan pantau penjualan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Open Shift Card */}
      {openShift && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Shift Sedang Berjalan
              </CardTitle>
              <Badge className="bg-green-500 text-white">OPEN</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">ID Shift</p>
                <p className="font-bold text-orange-700">{openShift.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kasir</p>
                <p className="font-bold text-orange-700">{openShift.cashierName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mulai</p>
                <p className="font-bold text-orange-700">{formatDateTime(openShift.openedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Awal</p>
                <p className="font-bold text-orange-700">{formatPrice(openShift.openingBalance)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-orange-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Penjualan</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {formatPrice(openShift.totalSales)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Penjualan Tunai</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formatPrice(openShift.cashSales)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Non-Tunai</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {formatPrice(openShift.nonCashSales)}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                onClick={() => handleCloseShiftModal(openShift)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Tutup Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Penjualan</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatPrice(stats.totalSales)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rata-rata Penjualan</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatPrice(stats.avgSales)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shift</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalShifts}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Persentase Tunai</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.totalSales > 0
                    ? ((stats.totalCashSales / stats.totalSales) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
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
                placeholder="Cari berdasarkan ID shift atau nama kasir..."
                className="pl-10 border-orange-200 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px] border-orange-200">
                  <Filter className="w-4 h-4 mr-2 text-orange-500" />
                  <SelectValue placeholder="Tanggal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">7 Hari Terakhir</SelectItem>
                  <SelectItem value="month">30 Hari Terakhir</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cashierFilter} onValueChange={setCashierFilter}>
                <SelectTrigger className="w-[180px] border-orange-200">
                  <SelectValue placeholder="Kasir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kasir</SelectItem>
                  {CASHIERS.map((cashier) => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      {cashier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts Table */}
      <Card className="border-orange-100">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-50 hover:bg-orange-50">
                <TableHead>ID Shift</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Saldo Awal</TableHead>
                <TableHead>Total Penjualan</TableHead>
                <TableHead>Tunai</TableHead>
                <TableHead>Non-Tunai</TableHead>
                <TableHead>Saldo Sistem</TableHead>
                <TableHead>Saldo Fisik</TableHead>
                <TableHead>Selisih</TableHead>
                <TableHead>Waktu Buka</TableHead>
                <TableHead>Waktu Tutup</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.map((shift) => (
                <TableRow key={shift.id} className="hover:bg-orange-50/50">
                  <TableCell className="font-medium">{shift.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                        {shift.cashierName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{shift.cashierName}</p>
                        <p className="text-xs text-muted-foreground">{shift.cashierId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={shift.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-400'}
                      variant="secondary"
                    >
                      {shift.status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(shift.openingBalance)}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatPrice(shift.totalSales)}
                  </TableCell>
                  <TableCell>{formatPrice(shift.cashSales)}</TableCell>
                  <TableCell>{formatPrice(shift.nonCashSales)}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(shift.systemBalance)}</TableCell>
                  <TableCell>
                    {shift.physicalBalance !== undefined ? (
                      <span className="font-medium">{formatPrice(shift.physicalBalance)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {shift.difference !== undefined ? (
                      <span
                        className={`font-bold ${
                          shift.difference === 0
                            ? 'text-green-600'
                            : shift.difference > 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {shift.difference === 0 ? '-' : shift.difference > 0 ? '+' : ''}
                        {formatPrice(shift.difference)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-orange-500" />
                      {formatDateTime(shift.openedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {shift.closedAt ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3 text-orange-500" />
                        {formatDateTime(shift.closedAt)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => handleViewShiftModal(shift)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredShifts.length === 0 && (
        <Card className="border-orange-100">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada shift ditemukan</h3>
            <p className="text-sm text-muted-foreground">
              Coba ubah kata kunci pencarian atau filter
            </p>
          </CardContent>
        </Card>
      )}

      {/* Close Shift Modal */}
      <Dialog open={closeShiftModalOpen} onOpenChange={setCloseShiftModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift</DialogTitle>
            <DialogDescription>
              Masukkan saldo fisik untuk menutup shift dan menghitung selisih
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Pastikan untuk menghitung uang tunai di laci kasir dengan teliti sebelum
                  menutup shift.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Awal</p>
                  <p className="font-bold text-orange-700">{formatPrice(selectedShift.openingBalance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Penjualan Tunai</p>
                  <p className="font-bold text-green-700">{formatPrice(selectedShift.cashSales)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Total Saldo Sistem</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {formatPrice(selectedShift.systemBalance)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="physical-balance">
                  Saldo Fisik <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="physical-balance"
                  type="number"
                  placeholder="Masukkan jumlah uang fisik"
                  value={physicalBalance}
                  onChange={(e) => setPhysicalBalance(e.target.value)}
                />
              </div>

              {physicalBalance && parseFloat(physicalBalance) >= 0 && selectedShift && (
                <div
                  className={`p-4 rounded-lg ${
                    parseFloat(physicalBalance) - selectedShift.systemBalance === 0
                      ? 'bg-green-50 border border-green-200'
                      : parseFloat(physicalBalance) - selectedShift.systemBalance > 0
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p className="text-sm text-muted-foreground mb-1">Selisih:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">
                      {formatPrice(parseFloat(physicalBalance) - selectedShift.systemBalance)}
                    </p>
                    {parseFloat(physicalBalance) - selectedShift.systemBalance === 0 ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : parseFloat(physicalBalance) - selectedShift.systemBalance > 0 ? (
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseShiftModalOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={handleCloseShift}
            >
              Tutup Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Shift Details Modal */}
      <Dialog open={viewShiftModalOpen} onOpenChange={setViewShiftModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Shift</DialogTitle>
            <DialogDescription>
              {selectedShift && `Shift ${selectedShift.id} - ${selectedShift.cashierName}`}
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-orange-100">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">Informasi Shift</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">ID Shift:</span>
                        <span className="font-medium">{selectedShift.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Kasir:</span>
                        <span className="font-medium">{selectedShift.cashierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Status:</span>
                        <Badge
                          className={selectedShift.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-400'}
                          variant="secondary"
                        >
                          {selectedShift.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-100">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">Waktu Shift</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Buka:</span>
                        <span className="font-medium">{formatDateTime(selectedShift.openedAt)}</span>
                      </div>
                      {selectedShift.closedAt && (
                        <div className="flex justify-between">
                          <span className="text-sm">Tutup:</span>
                          <span className="font-medium">{formatDateTime(selectedShift.closedAt)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-orange-100">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">Ringkasan Penjualan</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Total Penjualan</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatPrice(selectedShift.totalSales)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Tunai</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatPrice(selectedShift.cashSales)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Non-Tunai</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(selectedShift.nonCashSales)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">Rekonsiliasi Kas</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Saldo Awal</span>
                      <span className="font-medium">{formatPrice(selectedShift.openingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Penjualan Tunai</span>
                      <span className="font-medium">+ {formatPrice(selectedShift.cashSales)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Saldo Sistem</span>
                      <span className="text-orange-600">{formatPrice(selectedShift.systemBalance)}</span>
                    </div>
                    {selectedShift.physicalBalance !== undefined && (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Saldo Fisik</span>
                          <span className="text-blue-600">
                            {formatPrice(selectedShift.physicalBalance)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Selisih</span>
                          <span
                            className={
                              selectedShift.difference === 0
                                ? 'text-green-600'
                                : selectedShift.difference! > 0
                                ? 'text-blue-600'
                                : 'text-red-600'
                            }
                          >
                            {selectedShift.difference === 0
                              ? 'Sesuai'
                              : selectedShift.difference! > 0
                              ? `+ ${formatPrice(selectedShift.difference)}`
                              : formatPrice(selectedShift.difference!)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewShiftModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
