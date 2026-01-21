'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, LogOut, Package, Users, ShoppingCart, Gift, Plus, Edit, Trash2, Check, X, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/app-store';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount: number;
  category: string;
  photo: string | null;
  isPromotion: boolean;
  isNewest: boolean;
}

interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  coins: number;
  address: string | null;
}

interface Transaction {
  id: string;
  receiptId: string;
  totalAmount: number;
  coinsEarned: number;
  status: string;
  orderDate: string;
  completedAt: string | null;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
  }[];
}

interface CoinExchangeProduct {
  id: string;
  name: string;
  description: string | null;
  coinsNeeded: number;
  photo: string | null;
}

export default function AdminDashboard() {
  const { user, logout } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coinProducts, setCoinProducts] = useState<CoinExchangeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    discount: '',
    category: 'makanan',
    photo: '',
    isPromotion: false,
    isNewest: false,
  });

  // User form state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    id: '',
    password: '',
  });

  // Coin product form state
  const [coinProductDialogOpen, setCoinProductDialogOpen] = useState(false);
  const [coinProductForm, setCoinProductForm] = useState({
    id: '',
    name: '',
    description: '',
    coinsNeeded: '',
    photo: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, usersRes, transactionsRes, coinProductsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/admin/users'),
        fetch('/api/transactions'),
        fetch('/api/coin-exchange/products'),
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (coinProductsRes.ok) setCoinProducts(await coinProductsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'product');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setProductForm({ ...productForm, photo: data.url });
      } else {
        alert('Gagal upload foto');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleCoinProductFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'product');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setCoinProductForm({ ...coinProductForm, photo: data.url });
      } else {
        alert('Gagal upload foto');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: productForm.name,
        description: productForm.description,
        price: parseInt(productForm.price),
        discount: parseInt(productForm.discount) || 0,
        category: productForm.category,
        photo: productForm.photo || null,
        isPromotion: productForm.isPromotion,
        isNewest: productForm.isNewest,
      };

      const res = await fetch(
        productForm.id ? `/api/products/${productForm.id}` : '/api/products',
        {
          method: productForm.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (res.ok) {
        alert('Produk berhasil disimpan!');
        setProductDialogOpen(false);
        setProductForm({
          id: '',
          name: '',
          description: '',
          price: '',
          discount: '',
          category: 'makanan',
          photo: '',
          isPromotion: false,
          isNewest: false,
        });
        fetchData();
      } else {
        alert('Gagal menyimpan produk');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Produk berhasil dihapus!');
        fetchData();
      } else {
        alert('Gagal menghapus produk');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleEditProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discount: product.discount.toString(),
      category: product.category,
      photo: product.photo || '',
      isPromotion: product.isPromotion,
      isNewest: product.isNewest,
    });
    setProductDialogOpen(true);
  };

  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userForm.id,
          password: userForm.password,
        }),
      });

      if (res.ok) {
        alert('Password berhasil diubah!');
        setUserDialogOpen(false);
        setUserForm({ id: '', password: '' });
      } else {
        alert('Gagal mengubah password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('User berhasil dihapus!');
        fetchData();
      } else {
        alert('Gagal menghapus user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleUpdateTransactionStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        alert('Status berhasil diubah!');
        fetchData();
      } else {
        alert('Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleSaveCoinProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: coinProductForm.name,
        description: coinProductForm.description,
        coinsNeeded: parseInt(coinProductForm.coinsNeeded),
        photo: coinProductForm.photo || null,
      };

      const res = await fetch('/api/coin-exchange/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert('Produk tukar koin berhasil ditambahkan!');
        setCoinProductDialogOpen(false);
        setCoinProductForm({
          id: '',
          name: '',
          description: '',
          coinsNeeded: '',
          photo: '',
        });
        fetchData();
      } else {
        alert('Gagal menambah produk tukar koin');
      }
    } catch (error) {
      console.error('Error saving coin product:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const handleDeleteCoinProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk tukar koin ini?')) return;

    try {
      const res = await fetch(`/api/coin-exchange/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Produk tukar koin berhasil dihapus!');
        fetchData();
      } else {
        alert('Gagal menghapus produk tukar koin');
      }
    } catch (error) {
      console.error('Error deleting coin product:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Menunggu Persetujuan';
      case 'approved': return 'Disetujui';
      case 'processing': return 'Sedang Diproses';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-orange-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Akses ditolak. Halaman ini hanya untuk admin.</p>
            <Link href="/">
              <Button className="bg-orange-600 hover:bg-orange-700">Kembali ke Beranda</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-100 pb-20">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-orange-600 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide uppercase">
                  AYAM GEPREK SAMBAL IJO
                </h1>
                <p className="text-orange-100 text-sm">Dashboard Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-orange-700 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden md:inline">Ke Beranda</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-white hover:bg-orange-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <StatCard title="Total Produk" value={products.length} icon={<Package className="h-6 w-6" />} color="bg-blue-500" />
          <StatCard title="Total User" value={users.length} icon={<Users className="h-6 w-6" />} color="bg-green-500" />
          <StatCard title="Total Transaksi" value={transactions.length} icon={<ShoppingCart className="h-6 w-6" />} color="bg-purple-500" />
          <StatCard title="Produk Tukar Koin" value={coinProducts.length} icon={<Gift className="h-6 w-6" />} color="bg-yellow-500" />
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="users">User</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="coins">Tukar Koin</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Kelola Produk</h2>
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Produk
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{productForm.id ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
                    <DialogDescription>
                      {productForm.id ? 'Update informasi produk' : 'Tambah produk baru ke menu'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-name">Nama Produk</Label>
                        <Input
                          id="product-name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-category">Kategori</Label>
                        <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="makanan">Makanan</SelectItem>
                            <SelectItem value="minuman">Minuman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-price">Harga</Label>
                        <Input
                          id="product-price"
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-discount">Diskon (%)</Label>
                        <Input
                          id="product-discount"
                          type="number"
                          value={productForm.discount}
                          onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-description">Deskripsi</Label>
                      <Textarea
                        id="product-description"
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Foto Produk</Label>
                      <Input type="file" accept="image/*" onChange={handleFileUpload} />
                      {productForm.photo && (
                        <div className="relative w-full h-40 mt-2">
                          <Image src={productForm.photo} alt="Product" fill className="object-cover rounded" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="is-promotion"
                          checked={productForm.isPromotion}
                          onCheckedChange={(checked) => setProductForm({ ...productForm, isPromotion: checked })}
                        />
                        <Label htmlFor="is-promotion">Promosi</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="is-newest"
                          checked={productForm.isNewest}
                          onCheckedChange={(checked) => setProductForm({ ...productForm, isNewest: checked })}
                        />
                        <Label htmlFor="is-newest">Produk Terbaru</Label>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      Simpan Produk
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Kelola User</h2>
            </div>

            <div className="grid gap-4">
              {users.map((userItem) => (
                <UserCard
                  key={userItem.id}
                  user={userItem}
                  onEditPassword={(id) => {
                    setUserForm({ id, password: '' });
                    setUserDialogOpen(true);
                  }}
                  onDelete={handleDeleteUser}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Kelola Transaksi</h2>
            </div>

            <div className="grid gap-4">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  onUpdateStatus={handleUpdateTransactionStatus}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="coins">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Kelola Produk Tukar Koin</h2>
              <Dialog open={coinProductDialogOpen} onOpenChange={setCoinProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Produk
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Produk Tukar Koin</DialogTitle>
                    <DialogDescription>Tambah produk baru untuk penukaran koin</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveCoinProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="coin-product-name">Nama Produk</Label>
                      <Input
                        id="coin-product-name"
                        value={coinProductForm.name}
                        onChange={(e) => setCoinProductForm({ ...coinProductForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coin-product-coins">Jumlah Koin</Label>
                      <Input
                        id="coin-product-coins"
                        type="number"
                        value={coinProductForm.coinsNeeded}
                        onChange={(e) => setCoinProductForm({ ...coinProductForm, coinsNeeded: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coin-product-description">Deskripsi</Label>
                      <Textarea
                        id="coin-product-description"
                        value={coinProductForm.description}
                        onChange={(e) => setCoinProductForm({ ...coinProductForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Foto Produk</Label>
                      <Input type="file" accept="image/*" onChange={handleCoinProductFileUpload} />
                      {coinProductForm.photo && (
                        <div className="relative w-full h-40 mt-2">
                          <Image src={coinProductForm.photo} alt="Product" fill className="object-cover rounded" />
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      Simpan Produk
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coinProducts.map((product) => (
                <CoinProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteCoinProduct}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Password Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password User</DialogTitle>
            <DialogDescription>Set password baru untuk user</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUserPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
              Simpan Password
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{title}</p>
              <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${color}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProductCard({ product, onEdit, onDelete }: { product: Product; onEdit: (product: Product) => void; onDelete: (id: string) => void }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-orange-50">
          {product.photo ? (
            <Image src={product.photo} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-orange-300">
              <Package className="h-20 w-20" />
            </div>
          )}
          {product.discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              -{product.discount}%
            </Badge>
          )}
          {product.isPromotion && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              Promosi
            </Badge>
          )}
          {product.isNewest && (
            <Badge className="absolute top-8 left-2 bg-green-500 text-white">
              Terbaru
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
          <p className="text-lg font-bold text-orange-600">
            Rp {product.price.toLocaleString('id-ID')}
          </p>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => onEdit(product)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(product.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCard({ user, onEditPassword, onDelete }: { user: User; onEditPassword: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg">{user.username}</h3>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">ID: {user.userId}</p>
            <p className="text-sm text-gray-600 mb-1">{user.email}</p>
            <p className="text-sm text-gray-600 mb-1">{user.phoneNumber}</p>
            {user.address && (
              <p className="text-sm text-gray-600">{user.address}</p>
            )}
            <div className="flex items-center gap-2 text-orange-600 font-semibold mt-2">
              <Gift className="h-4 w-4" />
              <span>{user.coins} Koin</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEditPassword(user.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            {user.role !== 'admin' && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(user.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionCard({
  transaction,
  getStatusColor,
  getStatusText,
  onUpdateStatus,
}: {
  transaction: Transaction;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">ID Struk: {transaction.receiptId}</h3>
            <p className="text-sm text-gray-600">
              {new Date(transaction.orderDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-600">
              User: {transaction.userName} (ID: {transaction.userId})
            </p>
            <p className="text-sm text-gray-600">
              No HP: {transaction.userPhoneNumber}
            </p>
          </div>
          <Badge className={getStatusColor(transaction.status)}>
            {getStatusText(transaction.status)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {transaction.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>
                {item.productName} x {item.quantity}
              </span>
              <span className="font-semibold">
                Rp {item.subtotal.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Total Harga</p>
            <p className="text-xl font-bold text-orange-600">
              Rp {transaction.totalAmount.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-green-600">
              Koin diperoleh: +{transaction.coinsEarned}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/transactions/${transaction.id}/receipt`, '_blank')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Lihat Struk
            </Button>
            <Select
              value={transaction.status}
              onValueChange={(value) => onUpdateStatus(transaction.id, value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waiting">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="processing">Diproses</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Batal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CoinProductCard({ product, onDelete }: { product: CoinExchangeProduct; onDelete: (id: string) => void }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-orange-50">
          {product.photo ? (
            <Image src={product.photo} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-orange-300">
              <Gift className="h-20 w-20" />
            </div>
          )}
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-white flex items-center gap-1">
            <Gift className="h-3 w-3" />
            {product.coinsNeeded} Koin
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-600 font-bold">
              <Gift className="h-5 w-5" />
              <span>{product.coinsNeeded} Koin</span>
            </div>
            <Button variant="destructive" size="sm" onClick={() => onDelete(product.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Footer() {
  return (
    <footer className="bg-orange-600 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="border-t border-orange-500 pt-4 text-center text-orange-100 text-sm">
          <p>© {new Date().getFullYear()} Ayam Geprek Sambal Ijo. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
