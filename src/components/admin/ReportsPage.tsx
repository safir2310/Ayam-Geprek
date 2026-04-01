'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  FileText,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Filter,
  FileSpreadsheet,
  File,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

// Mock Sales Data
const MOCK_DAILY_SALES = [
  { date: 'Senin', sales: 1200000, orders: 25 },
  { date: 'Selasa', sales: 1450000, orders: 30 },
  { date: 'Rabu', sales: 980000, orders: 22 },
  { date: 'Kamis', sales: 1750000, orders: 38 },
  { date: 'Jumat', sales: 2100000, orders: 45 },
  { date: 'Sabtu', sales: 2850000, orders: 62 },
  { date: 'Minggu', sales: 3200000, orders: 68 },
]

const MOCK_WEEKLY_SALES = [
  { week: 'Minggu 1', sales: 12500000, orders: 290 },
  { week: 'Minggu 2', sales: 14800000, orders: 340 },
  { week: 'Minggu 3', sales: 13200000, orders: 310 },
  { week: 'Minggu 4', sales: 16800000, orders: 380 },
]

const MOCK_MONTHLY_SALES = [
  { month: 'Jan', sales: 52000000, orders: 1200 },
  { month: 'Feb', sales: 48000000, orders: 1150 },
  { month: 'Mar', sales: 55000000, orders: 1280 },
  { month: 'Apr', sales: 62000000, orders: 1420 },
  { month: 'Mei', sales: 58000000, orders: 1350 },
  { month: 'Jun', sales: 65000000, orders: 1480 },
]

const PAYMENT_METHODS_DATA = [
  { name: 'QRIS CPM', value: 45, color: '#f97316' },
  { name: 'E-Wallet', value: 30, color: '#fb923c' },
  { name: 'Tunai', value: 20, color: '#fdba74' },
  { name: 'Transfer Bank', value: 5, color: '#fed7aa' },
]

const BEST_SELLING_PRODUCTS = [
  { id: 1, name: 'Ayam Geprek Sambal Ijo', category: 'Makanan', sold: 456, revenue: 10488000, growth: 12 },
  { id: 2, name: 'Ayam Geprek Keju', category: 'Makanan', sold: 342, revenue: 9234000, growth: 8 },
  { id: 3, name: 'Paket Komplit 2 Orang', category: 'Paket Hemat', sold: 287, revenue: 11480000, growth: 15 },
  { id: 4, name: 'Es Teh Manis', category: 'Minuman', sold: 523, revenue: 2615000, growth: 5 },
  { id: 5, name: 'Ayam Geprek Sambal Merah', category: 'Makanan', sold: 278, revenue: 6116000, growth: -3 },
  { id: 6, name: 'Es Campur', category: 'Minuman', sold: 198, revenue: 2970000, growth: 10 },
  { id: 7, name: 'Paket Nasi + Ayam Geprek', category: 'Paket Hemat', sold: 234, revenue: 5148000, growth: 7 },
  { id: 8, name: 'Ayam Geprek Krispi', category: 'Makanan', sold: 167, revenue: 4014000, growth: -2 },
]

const STOCK_REPORT = [
  { id: 1, name: 'Ayam Geprek Sambal Ijo', category: 'Makanan', stock: 45, minStock: 20, costPerUnit: 15000, stockValue: 675000 },
  { id: 2, name: 'Ayam Geprek Keju', category: 'Makanan', stock: 32, minStock: 15, costPerUnit: 18000, stockValue: 576000 },
  { id: 3, name: 'Paket Komplit 2 Orang', category: 'Paket Hemat', stock: 18, minStock: 10, costPerUnit: 25000, stockValue: 450000 },
  { id: 4, name: 'Es Teh Manis', category: 'Minuman', stock: 120, minStock: 50, costPerUnit: 1000, stockValue: 120000 },
  { id: 5, name: 'Ayam Geprek Sambal Merah', category: 'Makanan', stock: 38, minStock: 20, costPerUnit: 14000, stockValue: 532000 },
  { id: 6, name: 'Es Campur', category: 'Minuman', stock: 52, minStock: 25, costPerUnit: 8000, stockValue: 416000 },
  { id: 7, name: 'Paket Nasi + Ayam Geprek', category: 'Paket Hemat', stock: 25, minStock: 15, costPerUnit: 12000, stockValue: 300000 },
  { id: 8, name: 'Ayam Geprek Krispi', category: 'Makanan', stock: 28, minStock: 15, costPerUnit: 16000, stockValue: 448000 },
]

const PROFIT_REPORT = [
  { period: 'Jan', revenue: 52000000, cogs: 28600000, operating: 12000000, net: 11400000 },
  { period: 'Feb', revenue: 48000000, cogs: 26400000, operating: 11000000, net: 10600000 },
  { period: 'Mar', revenue: 55000000, cogs: 30250000, operating: 12500000, net: 12250000 },
  { period: 'Apr', revenue: 62000000, cogs: 34100000, operating: 14000000, net: 13900000 },
  { period: 'Mei', revenue: 58000000, cogs: 31900000, operating: 13000000, net: 13100000 },
  { period: 'Jun', revenue: 65000000, cogs: 35750000, operating: 14500000, net: 14750000 },
]

type ReportType = 'daily' | 'weekly' | 'monthly' | 'best-selling' | 'stock' | 'profit'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('daily')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Get summary data based on tab
  const getSummaryData = () => {
    switch (activeTab) {
      case 'daily':
        const dailyTotal = MOCK_DAILY_SALES.reduce((acc, item) => acc + item.sales, 0)
        const dailyOrders = MOCK_DAILY_SALES.reduce((acc, item) => acc + item.orders, 0)
        return {
          totalRevenue: dailyTotal,
          totalOrders: dailyOrders,
          avgOrderValue: dailyTotal / dailyOrders,
          profitEstimate: dailyTotal * 0.22,
        }
      case 'weekly':
        const weeklyTotal = MOCK_WEEKLY_SALES.reduce((acc, item) => acc + item.sales, 0)
        const weeklyOrders = MOCK_WEEKLY_SALES.reduce((acc, item) => acc + item.orders, 0)
        return {
          totalRevenue: weeklyTotal,
          totalOrders: weeklyOrders,
          avgOrderValue: weeklyTotal / weeklyOrders,
          profitEstimate: weeklyTotal * 0.22,
        }
      case 'monthly':
        const monthlyTotal = MOCK_MONTHLY_SALES.reduce((acc, item) => acc + item.sales, 0)
        const monthlyOrders = MOCK_MONTHLY_SALES.reduce((acc, item) => acc + item.orders, 0)
        return {
          totalRevenue: monthlyTotal,
          totalOrders: monthlyOrders,
          avgOrderValue: monthlyTotal / monthlyOrders,
          profitEstimate: monthlyTotal * 0.22,
        }
      case 'best-selling':
        const bestSellingTotal = BEST_SELLING_PRODUCTS.reduce((acc, item) => acc + item.revenue, 0)
        const bestSellingOrders = BEST_SELLING_PRODUCTS.reduce((acc, item) => acc + item.sold, 0)
        return {
          totalRevenue: bestSellingTotal,
          totalOrders: bestSellingOrders,
          avgOrderValue: bestSellingTotal / bestSellingOrders,
          profitEstimate: bestSellingTotal * 0.22,
        }
      case 'stock':
        const stockValue = STOCK_REPORT.reduce((acc, item) => acc + item.stockValue, 0)
        return {
          totalRevenue: stockValue,
          totalOrders: STOCK_REPORT.length,
          avgOrderValue: stockValue / STOCK_REPORT.length,
          profitEstimate: 0,
        }
      case 'profit':
        const profitRevenue = PROFIT_REPORT.reduce((acc, item) => acc + item.revenue, 0)
        const profitOrders = PROFIT_REPORT.reduce((acc, item) => acc + item.net, 0)
        return {
          totalRevenue: profitRevenue,
          totalOrders: PROFIT_REPORT.length,
          avgOrderValue: profitRevenue / PROFIT_REPORT.length,
          profitEstimate: profitOrders,
        }
      default:
        return {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          profitEstimate: 0,
        }
    }
  }

  const summaryData = getSummaryData()

  // Pagination
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const totalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage)

  // Export handlers
  const handleExportPDF = () => {
    toast({
      title: 'Export PDF',
      description: 'Laporan sedang diunduh dalam format PDF...',
    })
  }

  const handleExportExcel = () => {
    toast({
      title: 'Export Excel',
      description: 'Laporan sedang diunduh dalam format Excel...',
    })
  }

  // Get chart data based on tab
  const getChartData = () => {
    switch (activeTab) {
      case 'daily':
        return MOCK_DAILY_SALES
      case 'weekly':
        return MOCK_WEEKLY_SALES
      case 'monthly':
        return MOCK_MONTHLY_SALES
      case 'profit':
        return PROFIT_REPORT.map(item => ({
          ...item,
          profitMargin: ((item.net / item.revenue) * 100).toFixed(1)
        }))
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Laporan Penjualan & Analitik
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau performa bisnis dengan laporan yang komprehensif
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {dateFrom && dateTo
                  ? `${format(dateFrom, 'dd/MM/yyyy')} - ${format(dateTo, 'dd/MM/yyyy')}`
                  : 'Pilih Rentang Tanggal'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Tanggal Mulai</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={id}
                    className="rounded-md border"
                  />
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Tanggal Akhir</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={id}
                    className="rounded-md border"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={handleExportPDF} title="Export PDF">
            <File className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportExcel} title="Export Excel">
            <FileSpreadsheet className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(summaryData.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-green-500" />
                  +12% dari periode lalu
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{summaryData.totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-green-500" />
                  +8% dari periode lalu
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{formatPrice(summaryData.avgOrderValue)}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-red-500" />
                  -3% dari periode lalu
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {activeTab === 'stock' ? 'Nilai Stok' : 'Estimasi Laba'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{formatPrice(summaryData.profitEstimate)}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-green-500" />
                  {activeTab === 'stock' ? 'Total nilai inventaris' : '+15% dari periode lalu'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ReportType); setCurrentPage(1) }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-orange-50 p-1 gap-1">
          <TabsTrigger value="daily" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            Harian
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            Mingguan
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            Bulanan
          </TabsTrigger>
          <TabsTrigger value="best-selling" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            Terlaris
          </TabsTrigger>
          <TabsTrigger value="stock" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            Stok
          </TabsTrigger>
          <TabsTrigger value="profit" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            Laba
          </TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Grafik Penjualan Harian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={MOCK_DAILY_SALES}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fdba74" />
                    <XAxis dataKey="date" stroke="#f97316" />
                    <YAxis stroke="#f97316" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff7ed', borderColor: '#f97316' }}
                      formatter={(value: number) => formatPrice(value)}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="Penjualan" fill="#f97316" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Distribusi Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={PAYMENT_METHODS_DATA}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#f97316"
                      dataKey="value"
                    >
                      {PAYMENT_METHODS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Rincian Penjualan Harian</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead>Hari</TableHead>
                    <TableHead className="text-right">Jumlah Pesanan</TableHead>
                    <TableHead className="text-right">Total Penjualan</TableHead>
                    <TableHead className="text-right">Rata-rata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DAILY_SALES.map((item, index) => (
                    <TableRow key={index} className="hover:bg-orange-50/50">
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell className="text-right">{item.orders}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatPrice(item.sales)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPrice(item.sales / item.orders)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Report */}
        <TabsContent value="weekly" className="space-y-6">
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Grafik Penjualan Mingguan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={MOCK_WEEKLY_SALES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fdba74" />
                  <XAxis dataKey="week" stroke="#f97316" />
                  <YAxis stroke="#f97316" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff7ed', borderColor: '#f97316' }}
                    formatter={(value: number) => formatPrice(value)}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Penjualan" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Rincian Penjualan Mingguan</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead>Minggu</TableHead>
                    <TableHead className="text-right">Jumlah Pesanan</TableHead>
                    <TableHead className="text-right">Total Penjualan</TableHead>
                    <TableHead className="text-right">Rata-rata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_WEEKLY_SALES.map((item, index) => (
                    <TableRow key={index} className="hover:bg-orange-50/50">
                      <TableCell className="font-medium">{item.week}</TableCell>
                      <TableCell className="text-right">{item.orders}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatPrice(item.sales)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPrice(item.sales / item.orders)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-6">
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Grafik Penjualan Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={MOCK_MONTHLY_SALES}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fdba74" />
                  <XAxis dataKey="month" stroke="#f97316" />
                  <YAxis stroke="#f97316" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff7ed', borderColor: '#f97316' }}
                    formatter={(value: number) => formatPrice(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sales" name="Penjualan" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Rincian Penjualan Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead>Bulan</TableHead>
                    <TableHead className="text-right">Jumlah Pesanan</TableHead>
                    <TableHead className="text-right">Total Penjualan</TableHead>
                    <TableHead className="text-right">Rata-rata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_MONTHLY_SALES.map((item, index) => (
                    <TableRow key={index} className="hover:bg-orange-50/50">
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell className="text-right">{item.orders}</TableCell>
                      <TableCell className="text-right font-semibold text-orange-600">
                        {formatPrice(item.sales)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPrice(item.sales / item.orders)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Selling Products */}
        <TabsContent value="best-selling" className="space-y-6">
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] rounded-md border border-orange-100">
                <Table>
                  <TableHeader className="sticky top-0 bg-orange-50">
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead className="hidden md:table-cell">Kategori</TableHead>
                      <TableHead className="text-right">Terjual</TableHead>
                      <TableHead className="text-right">Pendapatan</TableHead>
                      <TableHead className="text-right">Pertumbuhan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(BEST_SELLING_PRODUCTS).map((product, index) => (
                      <TableRow key={product.id} className="hover:bg-orange-50/50">
                        <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.sold}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">
                          {formatPrice(product.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              product.growth >= 0
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {product.growth >= 0 ? '+' : ''}
                            {product.growth}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages(BEST_SELLING_PRODUCTS)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ArrowUp className="w-4 h-4 -rotate-90" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages(BEST_SELLING_PRODUCTS), p + 1))}
                    disabled={currentPage === totalPages(BEST_SELLING_PRODUCTS)}
                  >
                    <ArrowDown className="w-4 h-4 -rotate-90" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages(BEST_SELLING_PRODUCTS))}
                    disabled={currentPage === totalPages(BEST_SELLING_PRODUCTS)}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Report */}
        <TabsContent value="stock" className="space-y-6">
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Laporan Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] rounded-md border border-orange-100">
                <Table>
                  <TableHeader className="sticky top-0 bg-orange-50">
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead className="hidden md:table-cell">Kategori</TableHead>
                      <TableHead className="text-right">Stok</TableHead>
                      <TableHead className="text-right">Min. Stok</TableHead>
                      <TableHead className="text-right">Biaya/Satuan</TableHead>
                      <TableHead className="text-right">Nilai Stok</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(STOCK_REPORT).map((product, index) => (
                      <TableRow key={product.id} className="hover:bg-orange-50/50">
                        <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.stock}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{product.minStock}</TableCell>
                        <TableCell className="text-right">{formatPrice(product.costPerUnit)}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">
                          {formatPrice(product.stockValue)}
                        </TableCell>
                        <TableCell>
                          {product.stock <= product.minStock ? (
                            <Badge className="bg-red-500 text-white">Stok Rendah</Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white">Aman</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages(STOCK_REPORT)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ArrowUp className="w-4 h-4 -rotate-90" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages(STOCK_REPORT), p + 1))}
                    disabled={currentPage === totalPages(STOCK_REPORT)}
                  >
                    <ArrowDown className="w-4 h-4 -rotate-90" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages(STOCK_REPORT))}
                    disabled={currentPage === totalPages(STOCK_REPORT)}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Report */}
        <TabsContent value="profit" className="space-y-6">
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Analisis Laba Rugi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={PROFIT_REPORT}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fdba74" />
                  <XAxis dataKey="period" stroke="#f97316" />
                  <YAxis stroke="#f97316" tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff7ed', borderColor: '#f97316' }}
                    formatter={(value: number) => formatPrice(value)}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Pendapatan" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cogs" name="HPP" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="operating" name="Biaya Operasional" fill="#fdba74" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Laba Bersih" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Rincian Laba Rugi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">Biaya Operasional</TableHead>
                    <TableHead className="text-right">Laba Bersih</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PROFIT_REPORT.map((item, index) => (
                    <TableRow key={index} className="hover:bg-orange-50/50">
                      <TableCell className="font-medium">{item.period}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.revenue)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPrice(item.cogs)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatPrice(item.operating)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatPrice(item.net)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            (item.net / item.revenue) * 100 >= 20
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }
                        >
                          {((item.net / item.revenue) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
