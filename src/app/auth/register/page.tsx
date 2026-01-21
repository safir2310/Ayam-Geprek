'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, User, Lock, Mail, Phone, Calendar, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User form state
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    email: '',
    phoneNumber: '',
  });

  // Admin form state
  const [adminData, setAdminData] = useState({
    username: '',
    password: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    verificationCode: '',
  });

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          ...userData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registrasi gagal');
        return;
      }

      setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin',
          ...adminData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registrasi gagal');
        return;
      }

      setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Link href="/" className="inline-flex items-center text-white hover:text-orange-200 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Beranda
        </Link>

        <Card className="shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <motion.div
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center"
            >
              <ChefHat className="h-8 w-8 text-orange-600" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-orange-600">
              Register
            </CardTitle>
            <CardDescription>
              Buat akun baru di Ayam Geprek Sambal Ijo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">User</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="user">
                <form onSubmit={handleUserRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="user-username"
                      type="text"
                      placeholder="Masukkan username"
                      value={userData.username}
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="user-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={userData.password}
                      onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="Masukkan email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      No HP
                    </Label>
                    <Input
                      id="user-phone"
                      type="tel"
                      placeholder="Masukkan nomor HP"
                      value={userData.phoneNumber}
                      onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-sm"
                      >
                        {error}
                      </motion.p>
                    )}
                    {success && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-green-600 text-sm flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        {success}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Register sebagai User'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="Masukkan username"
                      value={adminData.username}
                      onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Masukkan password"
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="Masukkan email"
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      No HP
                    </Label>
                    <Input
                      id="admin-phone"
                      type="tel"
                      placeholder="Masukkan nomor HP"
                      value={adminData.phoneNumber}
                      onChange={(e) => setAdminData({ ...adminData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-dob" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Tanggal Lahir
                    </Label>
                    <Input
                      id="admin-dob"
                      type="date"
                      value={adminData.dateOfBirth}
                      onChange={(e) => setAdminData({ ...adminData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-verification" className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Kode verifikasi
                    </Label>
                    <Input
                      id="admin-verification"
                      type="text"
                      placeholder="DDMMYY (contoh: 010100)"
                      value={adminData.verificationCode}
                      onChange={(e) => setAdminData({ ...adminData, verificationCode: e.target.value })}
                      required
                      maxLength={6}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-sm"
                      >
                        {error}
                      </motion.p>
                    )}
                    {success && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-green-600 text-sm flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        {success}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Register sebagai Admin'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="text-center text-sm text-gray-600 mt-4">
              Sudah punya akun?{' '}
              <Link href="/auth/login" className="text-orange-600 hover:underline font-semibold">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
