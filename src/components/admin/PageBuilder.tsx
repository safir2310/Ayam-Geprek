'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Layers,
  LayoutTemplate,
  LayoutGrid,
  Save,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface DynamicTab {
  id: string
  name: string
  label: string
  icon?: string
  order: number
  isActive: boolean
  pages: DynamicPage[]
}

interface DynamicPage {
  id: string
  tabId: string
  name: string
  title: string
  description?: string
  order: number
  layout: string
  isActive: boolean
  features: DynamicFeature[]
}

interface DynamicFeature {
  id: string
  pageId: string
  name: string
  title: string
  type: string
  content: string
  order: number
  isVisible: boolean
}

export default function PageBuilder() {
  const [tabs, setTabs] = useState<DynamicTab[]>([])
  const [selectedTab, setSelectedTab] = useState<DynamicTab | null>(null)
  const [selectedPage, setSelectedPage] = useState<DynamicPage | null>(null)
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())

  // Dialogs
  const [addTabModalOpen, setAddTabModalOpen] = useState(false)
  const [addPageModalOpen, setAddPageModalOpen] = useState(false)
  const [addFeatureModalOpen, setAddFeatureModalOpen] = useState(false)

  // Forms
  const [newTab, setNewTab] = useState({ name: '', label: '', icon: '' })
  const [newPage, setNewPage] = useState({
    name: '',
    title: '',
    description: '',
    layout: 'grid',
  })
  const [newFeature, setNewFeature] = useState({
    name: '',
    title: '',
    type: 'CARD',
    content: '',
  })

  useEffect(() => {
    loadTabs()
  }, [])

  const loadTabs = async () => {
    try {
      const response = await fetch('/api/dynamic/tabs')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTabs(data.data)
        }
      }
    } catch (error) {
      console.error('Error loading tabs:', error)
    }
  }

  const handleAddTab = async () => {
    if (!newTab.name.trim() || !newTab.label.trim()) {
      toast({
        title: 'Error',
        description: 'Nama dan label wajib diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/dynamic/tabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTab),
      })

      if (!response.ok) {
        throw new Error('Gagal membuat tab')
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Tab baru berhasil dibuat',
        })
        setAddTabModalOpen(false)
        setNewTab({ name: '', label: '', icon: '' })
        loadTabs()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat tab baru',
        variant: 'destructive',
      })
    }
  }

  const handleAddPage = async () => {
    if (!selectedTab || !newPage.name.trim() || !newPage.title.trim()) {
      toast({
        title: 'Error',
        description: 'Nama dan judul wajib diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/dynamic/tabs/${selectedTab.id}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage),
      })

      if (!response.ok) {
        throw new Error('Gagal membuat halaman')
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Halaman baru berhasil dibuat',
        })
        setAddPageModalOpen(false)
        setNewPage({ name: '', title: '', description: '', layout: 'grid' })
        loadTabs()
        setSelectedTab(tabs.find((t) => t.id === selectedTab.id) || null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat halaman baru',
        variant: 'destructive',
      })
    }
  }

  const handleAddFeature = async () => {
    if (!selectedPage || !newFeature.name.trim() || !newFeature.title.trim()) {
      toast({
        title: 'Error',
        description: 'Nama dan judul wajib diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/dynamic/pages/${selectedPage.id}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFeature,
          content: newFeature.content ? JSON.parse(newFeature.content) : {},
        }),
      })

      if (!response.ok) {
        throw new Error('Gagal membuat fitur')
      }

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Berhasil',
          description: 'Fitur baru berhasil dibuat',
        })
        setAddFeatureModalOpen(false)
        setNewFeature({ name: '', title: '', type: 'CARD', content: '' })
        loadTabs()
        // Refresh selected tab
        const refreshedTabs = await fetch('/api/dynamic/tabs').then((r) => r.json())
        if (refreshedTabs.success) {
          const refreshedTab = refreshedTabs.data.find((t: DynamicTab) => t.id === selectedTab?.id)
          if (refreshedTab) {
            setSelectedTab(refreshedTab)
            const refreshedPage = refreshedTab.pages.find((p: DynamicPage) => p.id === selectedPage?.id)
            if (refreshedPage) {
              setSelectedPage(refreshedPage)
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat fitur baru',
        variant: 'destructive',
      })
    }
  }

  const togglePageExpand = (pageId: string) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(pageId)) {
        newSet.delete(pageId)
      } else {
        newSet.add(pageId)
      }
      return newSet
    })
  }

  const iconOptions = [
    { value: 'Layout', label: 'Layout' },
    { value: 'FolderOpen', label: 'Folder' },
    { value: 'FileText', label: 'File' },
    { value: 'Layers', label: 'Layers' },
    { value: 'LayoutGrid', label: 'Layout Grid' },
    { value: 'Settings', label: 'Settings' },
    { value: 'Users', label: 'Users' },
    { value: 'Package', label: 'Package' },
    { value: 'BarChart3', label: 'Chart' },
    { value: 'TrendingUp', label: 'Trending' },
  ]

  const featureTypes = [
    { value: 'CARD', label: 'Card' },
    { value: 'STAT', label: 'Statistic' },
    { value: 'CHART', label: 'Chart' },
    { value: 'TABLE', label: 'Table' },
    { value: 'LIST', label: 'List' },
    { value: 'FORM', label: 'Form' },
    { value: 'BUTTON', label: 'Button' },
    { value: 'TEXT', label: 'Text' },
    { value: 'IMAGE', label: 'Image' },
    { value: 'DIVIDER', label: 'Divider' },
  ]

  const layoutOptions = [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
    { value: 'card', label: 'Card' },
    { value: 'table', label: 'Table' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Page Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buat tab, halaman, dan fitur secara dinamis untuk admin panel
          </p>
        </div>
        <Button
          onClick={() => setAddTabModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tab Baru
        </Button>
      </div>

      <Alert>
        <FolderOpen className="h-4 w-4" />
        <AlertDescription>
          Fitur ini memungkinkan Anda membuat tab, halaman, dan komponen secara dinamis tanpa
          mengubah kode. Struktur akan tersimpan di database dan dapat dimodifikasi kapan saja.
        </AlertDescription>
      </Alert>

      {/* Tabs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              Daftar Tab
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tabs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada tab yang dibuat</p>
                <p className="text-sm">Klik "Tambah Tab Baru" untuk memulai</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTab?.id === tab.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {tab.icon && <span className="text-2xl">{tab.icon}</span>}
                        <div>
                          <h3 className="font-semibold">{tab.label}</h3>
                          <p className="text-sm text-muted-foreground">{tab.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{tab.pages.length} halaman</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Pages & Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-orange-600" />
              {selectedTab ? `Halaman di ${selectedTab.label}` : 'Halaman'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedTab ? (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutTemplate className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Pilih tab untuk melihat halaman</p>
              </div>
            ) : selectedTab.pages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-4">
                <FileText className="w-12 h-12 mx-auto opacity-50" />
                <p>Belum ada halaman di tab ini</p>
                <Button onClick={() => setAddPageModalOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Halaman
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => setAddPageModalOpen(true)}
                  className="w-full mb-4"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Halaman
                </Button>

                {selectedTab.pages.map((page) => (
                  <div
                    key={page.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between hover:bg-gray-100"
                      onClick={() => togglePageExpand(page.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedPages.has(page.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <div>
                          <h4 className="font-semibold">{page.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {page.name} • {page.layout}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {page.features.length} fitur
                        </Badge>
                      </div>
                    </div>

                    {expandedPages.has(page.id) && (
                      <div className="p-4 space-y-3">
                        {page.features.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Belum ada fitur
                          </p>
                        ) : (
                          page.features.map((feature) => (
                            <div
                              key={feature.id}
                              className="flex items-center justify-between p-3 bg-white border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <LayoutGrid className="w-4 h-4 text-orange-500" />
                                <div>
                                  <p className="font-medium text-sm">{feature.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {feature.type} • {feature.name}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={feature.isVisible ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {feature.isVisible ? 'Visible' : 'Hidden'}
                              </Badge>
                            </div>
                          ))
                        )}

                        <Button
                          onClick={() => {
                            setSelectedPage(page)
                            setAddFeatureModalOpen(true)
                          }}
                          className="w-full"
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Fitur
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Tab Modal */}
      <Dialog open={addTabModalOpen} onOpenChange={setAddTabModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Tab Baru</DialogTitle>
            <DialogDescription>
              Buat tab baru untuk admin panel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tab-name">
                Nama Tab (ID) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tab-name"
                placeholder="contoh: inventory"
                value={newTab.name}
                onChange={(e) => setNewTab({ ...newTab, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tab-label">
                Label Tampilan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tab-label"
                placeholder="contoh: Inventaris"
                value={newTab.label}
                onChange={(e) => setNewTab({ ...newTab, label: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tab-icon">Icon</Label>
              <Select
                value={newTab.icon}
                onValueChange={(value) => setNewTab({ ...newTab, icon: value })}
              >
                <SelectTrigger id="tab-icon">
                  <SelectValue placeholder="Pilih icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTabModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddTab}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Page Modal */}
      <Dialog open={addPageModalOpen} onOpenChange={setAddPageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Halaman Baru</DialogTitle>
            <DialogDescription>
              Buat halaman baru di tab "{selectedTab?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="page-name">
                Nama Halaman (ID) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="page-name"
                placeholder="contoh: stock-list"
                value={newPage.name}
                onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-title">
                Judul Tampilan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="page-title"
                placeholder="contoh: Daftar Stok"
                value={newPage.title}
                onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-description">Deskripsi</Label>
              <Textarea
                id="page-description"
                placeholder="Deskripsi halaman (opsional)"
                value={newPage.description}
                onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-layout">Layout</Label>
              <Select
                value={newPage.layout}
                onValueChange={(value) => setNewPage({ ...newPage, layout: value })}
              >
                <SelectTrigger id="page-layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {layoutOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPageModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddPage}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Halaman
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Feature Modal */}
      <Dialog open={addFeatureModalOpen} onOpenChange={setAddFeatureModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Fitur Baru</DialogTitle>
            <DialogDescription>
              Buat komponen/fitur di halaman "{selectedPage?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feature-name">
                Nama Fitur (ID) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="feature-name"
                placeholder="contoh: sales-chart"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feature-title">
                Judul Tampilan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="feature-title"
                placeholder="contoh: Grafik Penjualan"
                value={newFeature.title}
                onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feature-type">Tipe Fitur</Label>
              <Select
                value={newFeature.type}
                onValueChange={(value) => setNewFeature({ ...newFeature, type: value })}
              >
                <SelectTrigger id="feature-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {featureTypes.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feature-content">Konfigurasi (JSON)</Label>
              <Textarea
                id="feature-content"
                placeholder='{"title": "Title", "data": []}'
                value={newFeature.content}
                onChange={(e) => setNewFeature({ ...newFeature, content: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Masukkan konfigurasi dalam format JSON (opsional)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFeatureModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAddFeature}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Fitur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
