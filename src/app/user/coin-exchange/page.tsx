'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Coins, ArrowLeft, ShoppingBag, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import Link from 'next/link';
import Image from 'next/image';

interface CoinExchangeProduct {
  id: string;
  name: string;
  description: string | null;
  coinsNeeded: number;
  photo: string | null;
}

interface CoinExchange {
  id: string;
  productId: string;
  productName: string;
  coinsSpent: number;
  exchangedAt: string;
}

export default function CoinExchangePage() {
  const { user } = useAppStore();
  const [products, setProducts] = useState<CoinExchangeProduct[]>([]);
  const [exchanges, setExchanges] = useState<CoinExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'history'>('products');

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [productsRes, exchangesRes] = await Promise.all([
        fetch('/api/coin-exchange/products'),
        fetch(`/api/coin-exchange?userId=${user.id}`),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (exchangesRes.ok) {
        const exchangesData = await exchangesRes.json();
        setExchanges(exchangesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async (product: CoinExchangeProduct) => {
    if (!user) return;

    if (user.coins < product.coinsNeeded) {
      alert('Koin tidak mencukupi!');
      return;
    }

    if (!confirm(`Tukar ${product.coinsNeeded} koin untuk ${product.name}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/coin-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          productName: product.name,
          coinsSpent: product.coinsNeeded,
        }),
      });

      if (res.ok) {
        alert('Penukaran koin berhasil!');
        fetchData();
        // Refresh user data
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Penukaran gagal. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error exchanging coins:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-orange-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Silakan login terlebih dahulu</p>
            <Link href="/auth/login">
              <Button className="bg-orange-600 hover:bg-orange-700">Login</Button>
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
            <Link href="/user/dashboard" className="flex items-center gap-2 text-white hover:text-orange-200 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Kembali</span>
            </Link>

            <h1 className="text-xl font-bold text-white tracking-wide uppercase">
              Tukar Koin
            </h1>

            <Badge className="bg-yellow-500 text-white flex items-center gap-1 text-base px-3 py-1">
              <Coins className="h-5 w-5" />
              {user.coins} Koin
            </Badge>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Coin Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-8 text-center">
              <Coins className="h-16 w-16 mx-auto mb-4 opacity-80" />
              <p className="text-orange-100 mb-2">Total Koin Tersedia</p>
              <div className="text-5xl font-bold mb-2">{user.coins}</div>
              <p className="text-orange-100">Koin yang dapat ditukar untuk hadiah</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8"
        >
          <Button
            variant={activeTab === 'products' ? 'default' : 'outline'}
            onClick={() => setActiveTab('products')}
            className={
              activeTab === 'products'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'border-orange-600 text-orange-600 hover:bg-orange-50'
            }
          >
            <Gift className="h-4 w-4 mr-2" />
            Hadiah Tersedia
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className={
              activeTab === 'history'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'border-orange-600 text-orange-600 hover:bg-orange-50'
            }
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Riwayat Penukaran
          </Button>
        </motion.div>

        {/* Content */}
        {activeTab === 'products' ? (
          loading ? (
            <div className="text-center py-12">
              <p className="text-orange-600">Memuat hadiah...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 mx-auto mb-4 text-orange-300" />
              <p className="text-gray-600 text-lg">Tidak ada hadiah tersedia saat ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative aspect-square bg-orange-50">
                        {product.photo ? (
                          <Image
                            src={product.photo}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-orange-300">
                            <Gift className="h-20 w-20" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {product.coinsNeeded} Koin
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-orange-600 font-bold">
                            <Coins className="h-5 w-5" />
                            <span className="text-lg">{product.coinsNeeded} Koin</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleExchange(product)}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          disabled={user.coins < product.coinsNeeded}
                        >
                          {user.coins >= product.coinsNeeded ? 'Tukar Sekarang' : 'Koin Tidak Cukup'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {exchanges.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Belum ada riwayat penukaran</p>
                </CardContent>
              </Card>
            ) : (
              exchanges.map((exchange, index) => (
                <motion.div
                  key={exchange.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-1">{exchange.productName}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(exchange.exchangedAt).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <div className="flex items-center gap-2 text-orange-600 font-semibold">
                            <Coins className="h-4 w-4" />
                            <span>-{exchange.coinsSpent} Koin</span>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white">Berhasil</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-orange-600 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="border-t border-orange-500 pt-4 text-center text-orange-100 text-sm">
          <p>&copy; {new Date().getFullYear()} Ayam Geprek Sambal Ijo. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
