'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ShoppingCart, User, LogOut, Facebook, Instagram, Phone, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAppStore, CartItem } from '@/store/app-store';
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

export default function Home() {
  const { cart, addToCart, updateCartQuantity, removeFromCart, clearCart, user, logout, getCartTotal, getCartItemCount } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'promotions' | 'discounts' | 'latest'>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    const cartItem: CartItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      productPhoto: product.photo,
      price: product.price,
      discount: product.discount,
      quantity: 1,
    };
    addToCart(cartItem);
  };

  const filteredProducts = products.filter((product) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'promotions') return product.isPromotion;
    if (activeTab === 'discounts') return product.discount > 0;
    if (activeTab === 'latest') return product.isNewest;
    return true;
  });

  return (
    <div className="min-h-screen bg-orange-100">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-orange-600 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Store Name */}
            <Link href="/" className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-white" />
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase">
                AYAM GEPREK SAMBAL IJO
              </h1>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2 md:gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-white hover:bg-orange-700">
                    <ShoppingCart className="h-6 w-6" />
                    {getCartItemCount() > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center p-0">
                        {getCartItemCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Keranjang Belanja</SheetTitle>
                  </SheetHeader>
                  <CartContent
                    cart={cart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    clearCart={clearCart}
                    user={user}
                  />
                </SheetContent>
              </Sheet>

              {user ? (
                <div className="flex items-center gap-2">
                  {user.role === 'admin' ? (
                    <Link href="/admin/dashboard">
                      <Button variant="ghost" className="text-white hover:bg-orange-700">
                        <ChefHat className="h-5 w-5 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/user/dashboard">
                      <Button variant="ghost" className="text-white hover:bg-orange-700">
                        {user.photo ? (
                          <Image
                            src={user.photo}
                            alt={user.username}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5 mr-2" />
                        )}
                        <span className="hidden md:inline">{user.username}</span>
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-white hover:bg-orange-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="hidden md:block">
                    <Button className="bg-white text-orange-600 hover:bg-orange-50">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-8 overflow-x-auto pb-2"
        >
          {[
            { id: 'all', label: 'Semua Menu' },
            { id: 'promotions', label: 'Promosi' },
            { id: 'discounts', label: 'Diskon' },
            { id: 'latest', label: 'Terbaru' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id as any)}
              className={
                activeTab === tab.id
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'border-orange-600 text-orange-600 hover:bg-orange-50'
              }
            >
              {tab.label}
            </Button>
          ))}
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-orange-600">Memuat produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-orange-600 text-lg">Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function ProductCard({ product, onAddToCart, index }: { product: Product; onAddToCart: (product: Product) => void; index: number }) {
  return (
    <motion.div
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
                <ChefHat className="h-20 w-20" />
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
            <h3 className="font-bold text-lg mb-1 text-gray-800">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
            )}
            <div className="flex items-center justify-between mb-3">
              <div>
                {product.discount > 0 ? (
                  <div>
                    <p className="text-sm text-gray-500 line-through">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      Rp {Math.round(product.price * (1 - product.discount / 100)).toLocaleString('id-ID')}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-orange-600">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => onAddToCart(product)}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Tambah ke Keranjang
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CartContent({
  cart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  user,
}: {
  cart: CartItem[];
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  user: useAppStore['user'];
}) {
  const { getCartTotal } = useAppStore();
  const total = getCartTotal();

  const handleWhatsAppCheckout = () => {
    if (!user) {
      alert('Silakan login terlebih dahulu');
      return;
    }

    const orderDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let message = `Tanggal Pesanan : ${orderDate}\n\n`;
    message += `Nama            : ${user.username}\n`;
    message += `No HP           : ${user.phoneNumber}\n\n`;
    message += `Pesanan :\n`;

    cart.forEach((item) => {
      const finalPrice = item.price - item.price * (item.discount / 100);
      message += `- ${item.productName} x ${item.quantity}\n`;
    });

    message += `\nTotal Harga     : Rp ${total.toLocaleString('id-ID')}\n`;
    message += `\nTerima kasih telah memesan di Ayam Geprek Sambal Ijo 🙏`;

    const whatsappNumber = '6285260812758';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="mt-6">
      {cart.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Keranjang kosong</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                {item.productPhoto && (
                  <Image
                    src={item.productPhoto}
                    alt={item.productName}
                    width={60}
                    height={60}
                    className="rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.productName}</h4>
                  {item.discount > 0 ? (
                    <p className="text-xs text-gray-500">
                      <span className="line-through">Rp {item.price.toLocaleString('id-ID')}</span>
                      {' '}
                      Rp {Math.round(item.price * (1 - item.discount / 100)).toLocaleString('id-ID')}
                    </p>
                  ) : (
                    <p className="text-xs text-orange-600">Rp {item.price.toLocaleString('id-ID')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-orange-600">Rp {total.toLocaleString('id-ID')}</span>
            </div>

            <Button
              onClick={handleWhatsAppCheckout}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!user}
            >
              <Phone className="h-4 w-4 mr-2" />
              Checkout WhatsApp
            </Button>

            <Button
              onClick={clearCart}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-50"
            >
              Kosongkan Keranjang
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-orange-600 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">AYAM GEPREK SAMBAL IJO</h3>
            <p className="text-orange-100 mb-2">Makanan khas dengan sambal ijo yang nikmat</p>
            <div className="flex items-center gap-2 text-sm mt-4">
              <Phone className="h-4 w-4" />
              <span>085260812758</span>
            </div>
            <div className="text-sm mt-2">
              Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, Kec. Pidie, Kab. Pidie, 24151
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Ikuti Kami</h3>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-orange-200 transition-colors"
              >
                <Instagram className="h-6 w-6" />
                <span>Instagram</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-orange-200 transition-colors"
              >
                <Facebook className="h-6 w-6" />
                <span>Facebook</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Tautan Cepat</h3>
            <ul className="space-y-2 text-orange-100">
              <li>
                <a href="/" className="hover:text-white transition-colors">Beranda</a>
              </li>
              <li>
                <a href="/auth/login" className="hover:text-white transition-colors">Login</a>
              </li>
              <li>
                <a href="/auth/register" className="hover:text-white transition-colors">Register</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-orange-500 mt-8 pt-4 text-center text-orange-100 text-sm">
          <p>&copy; {new Date().getFullYear()} Ayam Geprek Sambal Ijo. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
