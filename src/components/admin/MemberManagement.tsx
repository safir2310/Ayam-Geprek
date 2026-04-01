'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Edit,
  Eye,
  Gift,
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  User,
  Award,
  Star,
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'

type PointHistoryType = 'EARNED' | 'REDEEMED'

interface PointHistory {
  type: PointHistoryType
  points: number
  date: string
  reference?: string
}

interface Member {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  points: number
  joinDate: string
  pointHistory: PointHistory[]
}

// Mock Data
const MOCK_MEMBERS: Member[] = [
  {
    id: 'MEM-001',
    name: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi.santoso@email.com',
    address: 'Jl. Merdeka No. 123, Jakarta',
    points: 250,
    joinDate: '2024-01-15',
    pointHistory: [
      { type: 'EARNED', points: 10, date: '2024-01-15', reference: 'Pendaftaran Member' },
      { type: 'EARNED', points: 25, date: '2024-02-10', reference: 'ORD-2024-0056' },
      { type: 'REDEEMED', points: 50, date: '2024-02-20', reference: 'Diskon 50 Poin' },
      { type: 'EARNED', points: 30, date: '2024-03-05', reference: 'ORD-2024-0098' },
      { type: 'EARNED', points: 35, date: '2024-03-12', reference: 'ORD-2024-0102' },
    ],
  },
  {
    id: 'MEM-002',
    name: 'Siti Rahayu',
    phone: '085678901234',
    email: 'siti.rahayu@email.com',
    address: 'Jl. Sudirman No. 45, Bandung',
    points: 180,
    joinDate: '2024-02-01',
    pointHistory: [
      { type: 'EARNED', points: 10, date: '2024-02-01', reference: 'Pendaftaran Member' },
      { type: 'EARNED', points: 20, date: '2024-02-15', reference: 'ORD-2024-0078' },
      { type: 'EARNED', points: 40, date: '2024-03-01', reference: 'ORD-2024-0089' },
      { type: 'EARNED', points: 45, date: '2024-03-10', reference: 'ORD-2024-0095' },
    ],
  },
  {
    id: 'MEM-003',
    name: 'Ahmad Dani',
    phone: '089012345678',
    email: 'ahmad.dani@email.com',
    address: 'Jl. Gatot Subroto No. 78, Surabaya',
    points: 500,
    joinDate: '2023-12-10',
    pointHistory: [
      { type: 'EARNED', points: 10, date: '2023-12-10', reference: 'Pendaftaran Member' },
      { type: 'EARNED', points: 35, date: '2023-12-25', reference: 'ORD-2023-0045' },
      { type: 'EARNED', points: 50, date: '2024-01-05', reference: 'ORD-2024-0012' },
      { type: 'REDEEMED', points: 100, date: '2024-01-20', reference: 'Menu Gratis 100 Poin' },
      { type: 'EARNED', points: 45, date: '2024-02-10', reference: 'ORD-2024-0065' },
      { type: 'EARNED', points: 60, date: '2024-02-28', reference: 'ORD-2024-0080' },
      { type: 'EARNED', points: 55, date: '2024-03-08', reference: 'ORD-2024-0092' },
    ],
  },
  {
    id: 'MEM-004',
    name: 'Dewi Sartika',
    phone: '082345678901',
    address: 'Jl. Pahlawan No. 12, Medan',
    points: 75,
    joinDate: '2024-02-20',
    pointHistory: [
      { type: 'EARNED', points: 10, date: '2024-02-20', reference: 'Pendaftaran Member' },
      { type: 'EARNED', points: 15, date: '2024-03-01', reference: 'ORD-2024-0085' },
      { type: 'EARNED', points: 20, date: '2024-03-11', reference: 'ORD-2024-0096' },
    ],
  },
  {
    id: 'MEM-005',
    name: 'Rudi Hartono',
    phone: '087890123456',
    email: 'rudi.hartono@email.com',
    address: 'Jl. Ahmad Yani No. 34, Semarang',
    points: 320,
    joinDate: '2024-01-05',
    pointHistory: [
      { type: 'EARNED', points: 10, date: '2024-01-05', reference: 'Pendaftaran Member' },
      { type: 'EARNED', points: 40, date: '2024-01-20', reference: 'ORD-2024-0025' },
      { type: 'EARNED', points: 50, date: '2024-02-05', reference: 'ORD-2024-0048' },
      { type: 'REDEEMED', points: 30, date: '2024-02-15', reference: 'Diskon 30 Poin' },
      { type: 'EARNED', points: 55, date: '2024-03-02', reference: 'ORD-2024-0087' },
      { type: 'EARNED', points: 45, date: '2024-03-09', reference: 'ORD-2024-0094' },
    ],
  },
]

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [redeemModalOpen, setRedeemModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  const [redeemPoints, setRedeemPoints] = useState('')
  const [redeemReason, setRedeemReason] = useState('')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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

  const getMemberTier = (points: number) => {
    if (points >= 500) return { tier: 'Platinum', color: 'bg-purple-500', icon: Star }
    if (points >= 300) return { tier: 'Gold', color: 'bg-yellow-500', icon: Award }
    if (points >= 100) return { tier: 'Silver', color: 'bg-gray-400', icon: Award }
    return { tier: 'Bronze', color: 'bg-orange-600', icon: Award }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery)
  )

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleAddMember = () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: 'Error',
        description: 'Nama dan nomor telepon wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const newMember: Member = {
      id: `MEM-${String(members.length + 1).padStart(3, '0')}`,
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      address: formData.address || undefined,
      points: 10, // Bonus points for new member
      joinDate: new Date().toISOString().split('T')[0],
      pointHistory: [
        {
          type: 'EARNED',
          points: 10,
          date: new Date().toISOString(),
          reference: 'Pendaftaran Member',
        },
      ],
    }

    setMembers([...members, newMember])
    setAddModalOpen(false)
    setFormData({ name: '', phone: '', email: '', address: '' })

    toast({
      title: 'Berhasil',
      description: `Member ${newMember.name} berhasil ditambahkan`,
    })
  }

  const handleEditMember = () => {
    if (!selectedMember) return

    const updatedMembers = members.map((member) =>
      member.id === selectedMember.id
        ? {
            ...member,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || undefined,
            address: formData.address || undefined,
          }
        : member
    )

    setMembers(updatedMembers)
    setEditModalOpen(false)
    setFormData({ name: '', phone: '', email: '', address: '' })
    setSelectedMember(null)

    toast({
      title: 'Berhasil',
      description: 'Data member berhasil diperbarui',
    })
  }

  const handleRedeemPoints = () => {
    if (!selectedMember) return

    const pointsToRedeem = parseInt(redeemPoints)
    if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
      toast({
        title: 'Error',
        description: 'Jumlah poin tidak valid',
        variant: 'destructive',
      })
      return
    }

    if (pointsToRedeem > selectedMember.points) {
      toast({
        title: 'Error',
        description: 'Poin tidak mencukupi',
        variant: 'destructive',
      })
      return
    }

    if (!redeemReason) {
      toast({
        title: 'Error',
        description: 'Alasan penukaran wajib diisi',
        variant: 'destructive',
      })
      return
    }

    const updatedMembers = members.map((member) =>
      member.id === selectedMember.id
        ? {
            ...member,
            points: member.points - pointsToRedeem,
            pointHistory: [
              ...member.pointHistory,
              {
                type: 'REDEEMED',
                points: pointsToRedeem,
                date: new Date().toISOString(),
                reference: redeemReason,
              },
            ],
          }
        : member
    )

    setMembers(updatedMembers)
    setRedeemModalOpen(false)
    setRedeemPoints('')
    setRedeemReason('')
    setSelectedMember(null)

    toast({
      title: 'Berhasil',
      description: `${pointsToRedeem} poin berhasil ditukarkan`,
    })
  }

  const openEditModal = (member: Member) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email || '',
      address: member.address || '',
    })
    setEditModalOpen(true)
  }

  const openHistoryModal = (member: Member) => {
    setSelectedMember(member)
    setHistoryModalOpen(true)
  }

  const openRedeemModal = (member: Member) => {
    setSelectedMember(member)
    setRedeemModalOpen(true)
  }

  const calculateTotalEarned = (member: Member) => {
    return member.pointHistory
      .filter((h) => h.type === 'EARNED')
      .reduce((sum, h) => sum + h.points, 0)
  }

  const calculateTotalRedeemed = (member: Member) => {
    return member.pointHistory
      .filter((h) => h.type === 'REDEEMED')
      .reduce((sum, h) => sum + h.points, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Manajemen Member
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data member dan sistem poin loyalitas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Member Baru</DialogTitle>
                <DialogDescription>
                  Isi data member baru untuk mendaftarkan ke sistem
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="add-name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-phone">
                    No. Telepon <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="add-phone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-address">Alamat</Label>
                  <Input
                    id="add-address"
                    placeholder="Alamat lengkap"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  onClick={handleAddMember}
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Member</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{members.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Poin</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {members.reduce((sum, m) => sum + m.points, 0)}
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
                <p className="text-sm font-medium text-muted-foreground">Member Aktif</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {members.filter((m) => m.pointHistory.length > 1).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Poin Ditukar</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {members.reduce(
                    (sum, m) =>
                      sum + m.pointHistory.filter((h) => h.type === 'REDEEMED').length,
                    0
                  )}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
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
                placeholder="Cari berdasarkan nama atau nomor telepon..."
                className="pl-10 border-orange-200 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-orange-200">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMembers.map((member) => {
          const tier = getMemberTier(member.points)
          const TierIcon = tier.icon

          return (
            <Card key={member.id} className="border-orange-100 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${tier.color}`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <Badge className={`${tier.color} text-white text-xs`}>
                          {tier.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{member.points}</p>
                    <p className="text-xs text-muted-foreground">Poin</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 text-orange-500" />
                    <span>{member.phone}</span>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 text-orange-500" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                </div>

                {member.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{member.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Bergabung: {formatDate(member.joinDate)}</span>
                </div>

                <Separator className="bg-orange-100" />

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Didapat</p>
                    <p className="font-semibold text-green-600">
                      +{calculateTotalEarned(member)} poin
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Total Ditukar</p>
                    <p className="font-semibold text-red-600">
                      -{calculateTotalRedeemed(member)} poin
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                    onClick={() => openHistoryModal(member)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Riwayat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                    onClick={() => openEditModal(member)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                    onClick={() => openRedeemModal(member)}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Tukar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card className="border-orange-100">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak ada member ditemukan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Coba ubah kata kunci pencarian atau tambah member baru
            </p>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Member
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Member Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Member</DialogTitle>
            <DialogDescription>Perbarui informasi member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">
                No. Telepon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-phone"
                placeholder="08xxxxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Alamat</Label>
              <Input
                id="edit-address"
                placeholder="Alamat lengkap"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={handleEditMember}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Point History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riwayat Poin</DialogTitle>
            <DialogDescription>
              {selectedMember && `Riwayat poin untuk ${selectedMember.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Poin Saat Ini</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedMember.points}</p>
                </div>
                <div className="text-center border-x border-orange-200">
                  <p className="text-sm text-muted-foreground">Total Didapat</p>
                  <p className="text-xl font-bold text-green-600">
                    +{calculateTotalEarned(selectedMember)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Ditukar</p>
                  <p className="text-xl font-bold text-red-600">
                    -{calculateTotalRedeemed(selectedMember)}
                  </p>
                </div>
              </div>

              <ScrollArea className="h-64 pr-4">
                <div className="space-y-3">
                  {selectedMember.pointHistory.map((history, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        history.type === 'EARNED' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          history.type === 'EARNED' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {history.type === 'EARNED' ? (
                          <TrendingUp className="w-4 h-4 text-white" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{history.reference}</p>
                          <Badge
                            className={
                              history.type === 'EARNED'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }
                            variant="secondary"
                          >
                            {history.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(history.date)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-bold ${
                            history.type === 'EARNED' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {history.type === 'EARNED' ? '+' : '-'}
                          {history.points}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Redeem Points Modal */}
      <Dialog open={redeemModalOpen} onOpenChange={setRedeemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tukar Poin Member</DialogTitle>
            <DialogDescription>
              {selectedMember && `Penukaran poin untuk ${selectedMember.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Poin Tersedia</p>
                <p className="text-3xl font-bold text-orange-600">{selectedMember.points}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Setara dengan {formatPrice(selectedMember.points * 10000)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redeem-points">
                  Jumlah Poin <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="redeem-points"
                  type="number"
                  placeholder="Masukkan jumlah poin"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Rp10.000 = 1 poin (Min: 10 poin)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redeem-reason">
                  Alasan Penukaran <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="redeem-reason"
                  placeholder="Contoh: Diskon Rp50.000, Menu Gratis, dll"
                  value={redeemReason}
                  onChange={(e) => setRedeemReason(e.target.value)}
                />
              </div>

              {redeemPoints && parseInt(redeemPoints) > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Nilai Tukar:</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatPrice(parseInt(redeemPoints) * 10000)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemModalOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={handleRedeemPoints}
            >
              Tukar Poin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
