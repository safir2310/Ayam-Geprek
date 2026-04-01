import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require'
    }
  }
})

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // ============================================
    // 1. CREATE USERS
    // ============================================
    console.log('\n📝 Creating users...')

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const userPassword = await bcrypt.hash('user123', 10)
    const cashierPassword = await bcrypt.hash('kasir123', 10)

    // Admin User
    const admin = await prisma.user.upsert({
      where: { email: 'admin@ayamgeprek.com' },
      update: { role: UserRole.ADMIN },
      create: {
        email: 'admin@ayamgeprek.com',
        password: hashedPassword,
        name: 'Admin Restaurant',
        role: UserRole.ADMIN,
        phone: '081234567890',
      },
    })
    console.log('✅ Admin created:', admin.email)

    // Manager User
    const manager = await prisma.user.upsert({
      where: { email: 'manager@ayamgeprek.com' },
      update: { role: UserRole.MANAGER },
      create: {
        email: 'manager@ayamgeprek.com',
        password: hashedPassword,
        name: 'Manager Restaurant',
        role: UserRole.MANAGER,
        phone: '081234567891',
      },
    })
    console.log('✅ Manager created:', manager.email)

    // Cashier 1
    const cashier1 = await prisma.user.upsert({
      where: { email: 'kasir1@ayamgeprek.com' },
      update: { role: UserRole.CASHIER },
      create: {
        email: 'kasir1@ayamgeprek.com',
        password: cashierPassword,
        name: 'Siti Kasir',
        role: UserRole.CASHIER,
        phone: '081234567892',
      },
    })
    console.log('✅ Cashier 1 created:', cashier1.email)

    // Cashier 2
    const cashier2 = await prisma.user.upsert({
      where: { email: 'kasir2@ayamgeprek.com' },
      update: { role: UserRole.CASHIER },
      create: {
        email: 'kasir2@ayamgeprek.com',
        password: cashierPassword,
        name: 'Budi Kasir',
        role: UserRole.CASHIER,
        phone: '081234567893',
      },
    })
    console.log('✅ Cashier 2 created:', cashier2.email)

    // Regular User
    const user1 = await prisma.user.upsert({
      where: { email: 'user@gmail.com' },
      update: { role: UserRole.USER },
      create: {
        email: 'user@gmail.com',
        password: userPassword,
        name: 'Ahmad Customer',
        role: UserRole.USER,
        phone: '081234567894',
      },
    })
    console.log('✅ User created:', user1.email)

    // User 2
    const user2 = await prisma.user.upsert({
      where: { email: 'dewi@gmail.com' },
      update: { role: UserRole.USER },
      create: {
        email: 'dewi@gmail.com',
        password: userPassword,
        name: 'Dewi Customer',
        role: UserRole.USER,
        phone: '081234567895',
      },
    })
    console.log('✅ User created:', user2.email)

    // ============================================
    // 2. CREATE CATEGORIES
    // ============================================
    console.log('\n📂 Creating categories...')

    const categories = [
      {
        id: 'cat-ayam-geprek',
        name: 'Ayam Geprek',
        description: 'Menu ayam geprek dengan berbagai tingkat kepedasan',
        icon: '🍗',
        color: '#ef4444',
        order: 1,
      },
      {
        id: 'cat-ayam-bakar',
        name: 'Ayam Bakar',
        description: 'Ayam bakar dengan bumbu spesial',
        icon: '🍖',
        color: '#f97316',
        order: 2,
      },
      {
        id: 'cat-nasi',
        name: 'Nasi',
        description: 'Pilihan nasi untuk melengkapi hidangan',
        icon: '🍚',
        color: '#eab308',
        order: 3,
      },
      {
        id: 'cat-minuman',
        name: 'Minuman',
        description: 'Minuman segar dan dingin',
        icon: '🥤',
        color: '#22c55e',
        order: 4,
      },
      {
        id: 'cat-tambahan',
        name: 'Tambahan',
        description: 'Menu tambahan dan pelengkap',
        icon: '🥗',
        color: '#3b82f6',
        order: 5,
      },
      {
        id: 'cat-dessert',
        name: 'Dessert',
        description: 'Hidangan penutup yang lezat',
        icon: '🍰',
        color: '#ec4899',
        order: 6,
      },
    ]

    const createdCategories: any[] = []
    for (const category of categories) {
      const created = await prisma.category.upsert({
        where: { id: category.id },
        update: {},
        create: category,
      })
      createdCategories.push(created)
      console.log(`✅ Category created: ${created.name}`)
    }

    // ============================================
    // 3. CREATE PRODUCTS/MENU
    // ============================================
    console.log('\n🍽️ Creating products...')

    const products = [
      // Ayam Geprek
      {
        name: 'Ayam Geprek Original',
        description: 'Ayam geprek dengan sambal ijo original, pedas sedang',
        price: 15000,
        categoryId: createdCategories[0].id,
        sku: 'AGP-001',
        stock: 100,
        minStock: 10,
        cost: 8000,
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop',
      },
      {
        name: 'Ayam Geprek Jumbo',
        description: 'Porsi ayam geprek jumbo dengan sambal ijo pedas',
        price: 22000,
        categoryId: createdCategories[0].id,
        sku: 'AGP-002',
        stock: 80,
        minStock: 10,
        cost: 12000,
        image: 'https://images.unsplash.com/photo-1615557960916-5f4791effe9d?w=400&h=400&fit=crop',
      },
      {
        name: 'Ayam Geprek Super Pedas',
        description: 'Ayam geprek dengan sambal ijo super pedas level 5',
        price: 17000,
        categoryId: createdCategories[0].id,
        sku: 'AGP-003',
        stock: 70,
        minStock: 10,
        cost: 9000,
        image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop',
      },
      {
        name: 'Ayam Geprek Keju',
        description: 'Ayam geprek dengan topping keju lumer',
        price: 20000,
        categoryId: createdCategories[0].id,
        sku: 'AGP-004',
        stock: 60,
        minStock: 10,
        cost: 11000,
        image: 'https://images.unsplash.com/photo-1527477396000-64ca9c00173c?w=400&h=400&fit=crop',
      },

      // Ayam Bakar
      {
        name: 'Ayam Bakar Madu',
        description: 'Ayam bakar dengan bumbu madu manis gurih',
        price: 18000,
        categoryId: createdCategories[1].id,
        sku: 'ABK-001',
        stock: 80,
        minStock: 10,
        cost: 10000,
        image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop',
      },
      {
        name: 'Ayam Bakar Bumbu Rujak',
        description: 'Ayam bakar dengan bumbu rujak pedas manis',
        price: 19000,
        categoryId: createdCategories[1].id,
        sku: 'ABK-002',
        stock: 70,
        minStock: 10,
        cost: 10500,
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop',
      },
      {
        name: 'Ayam Bakar Spesial',
        description: 'Ayam bakar pilihan dengan sambal terasi',
        price: 22000,
        categoryId: createdCategories[1].id,
        sku: 'ABK-003',
        stock: 60,
        minStock: 10,
        cost: 12000,
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop',
      },

      // Nasi
      {
        name: 'Nasi Putih',
        description: 'Nasi putih hangat',
        price: 5000,
        categoryId: createdCategories[2].id,
        sku: 'NAS-001',
        stock: 200,
        minStock: 50,
        cost: 2000,
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=400&fit=crop',
      },
      {
        name: 'Nasi Uduk',
        description: 'Nasi uduk dengan bumbu rempah',
        price: 8000,
        categoryId: createdCategories[2].id,
        sku: 'NAS-002',
        stock: 100,
        minStock: 20,
        cost: 3500,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop',
      },
      {
        name: 'Nasi Kuning',
        description: 'Nasi kuning dengan lauk pelengkap',
        price: 12000,
        categoryId: createdCategories[2].id,
        sku: 'NAS-003',
        stock: 80,
        minStock: 15,
        cost: 6000,
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop',
      },

      // Minuman
      {
        name: 'Es Teh Manis',
        description: 'Es teh manis segar',
        price: 5000,
        categoryId: createdCategories[3].id,
        sku: 'MIN-001',
        stock: 300,
        minStock: 50,
        cost: 1000,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
      },
      {
        name: 'Es Jeruk',
        description: 'Es jeruk peras segar',
        price: 7000,
        categoryId: createdCategories[3].id,
        sku: 'MIN-002',
        stock: 200,
        minStock: 30,
        cost: 2000,
        image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop',
      },
      {
        name: 'Es Campur',
        description: 'Es campur dengan buah segar',
        price: 15000,
        categoryId: createdCategories[3].id,
        sku: 'MIN-003',
        stock: 100,
        minStock: 20,
        cost: 7000,
        image: 'https://images.unsplash.com/photo-1513639776629-9269d0522c32?w=400&h=400&fit=crop',
      },
      {
        name: 'Jus Alpukat',
        description: 'Jus alpukat dengan susu coklat',
        price: 18000,
        categoryId: createdCategories[3].id,
        sku: 'MIN-004',
        stock: 80,
        minStock: 15,
        cost: 10000,
        image: 'https://images.unsplash.com/photo-1523049673856-638898058498?w=400&h=400&fit=crop',
      },
      {
        name: 'Kopi Susu',
        description: 'Kopi susu gula aren',
        price: 15000,
        categoryId: createdCategories[3].id,
        sku: 'MIN-005',
        stock: 120,
        minStock: 20,
        cost: 6000,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
      },
      {
        name: 'Air Mineral',
        description: 'Air mineral 600ml',
        price: 5000,
        categoryId: createdCategories[3].id,
        sku: 'MIN-006',
        stock: 300,
        minStock: 50,
        cost: 2000,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop',
      },

      // Tambahan
      {
        name: 'Tempe Goreng',
        description: 'Tempe goreng renyah',
        price: 5000,
        categoryId: createdCategories[4].id,
        sku: 'TAM-001',
        stock: 150,
        minStock: 30,
        cost: 2000,
        image: 'https://images.unsplash.com/photo-1599554473865-4cdda84dc561?w=400&h=400&fit=crop',
      },
      {
        name: 'Tahu Goreng',
        description: 'Tahu goreng renyah',
        price: 5000,
        categoryId: createdCategories[4].id,
        sku: 'TAM-002',
        stock: 150,
        minStock: 30,
        cost: 2000,
        image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=400&fit=crop',
      },
      {
        name: 'Sambal Ijo Extra',
        description: 'Sambal ijo tambahan',
        price: 3000,
        categoryId: createdCategories[4].id,
        sku: 'TAM-003',
        stock: 200,
        minStock: 50,
        cost: 1000,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop',
      },
      {
        name: 'Kerupuk',
        description: 'Kerupuk renyah',
        price: 3000,
        categoryId: createdCategories[4].id,
        sku: 'TAM-004',
        stock: 200,
        minStock: 50,
        cost: 1000,
        image: 'https://images.unsplash.com/photo-1626803775151-61d756612f97?w=400&h=400&fit=crop',
      },
      {
        name: 'Lalapan Sayur',
        description: 'Lalapan sayur segar',
        price: 5000,
        categoryId: createdCategories[4].id,
        sku: 'TAM-005',
        stock: 150,
        minStock: 30,
        cost: 2000,
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop',
      },

      // Dessert
      {
        name: 'Pisang Goreng',
        description: 'Pisang goreng crispy',
        price: 10000,
        categoryId: createdCategories[5].id,
        sku: 'DST-001',
        stock: 100,
        minStock: 20,
        cost: 4000,
        image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop',
      },
      {
        name: 'Pisang Keju Coklat',
        description: 'Pisang goreng dengan topping keju dan coklat',
        price: 15000,
        categoryId: createdCategories[5].id,
        sku: 'DST-002',
        stock: 80,
        minStock: 15,
        cost: 7000,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop',
      },
      {
        name: 'Roti Bakar',
        description: 'Roti bakar dengan selai dan mentega',
        price: 12000,
        categoryId: createdCategories[5].id,
        sku: 'DST-003',
        stock: 80,
        minStock: 15,
        cost: 5000,
        image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=400&fit=crop',
      },
    ]

    for (const product of products) {
      const created = await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      })
      console.log(`✅ Product created: ${created.name} - Rp ${created.price.toLocaleString('id-ID')}`)
    }

    // ============================================
    // 4. CREATE SAMPLE MEMBERS
    // ============================================
    console.log('\n👥 Creating sample members...')

    const members = [
      {
        phone: '081111111111',
        name: 'Rizky Member',
        email: 'rizky@example.com',
        address: 'Jl. Thamrin No. 5, Jakarta',
        points: 150,
      },
      {
        phone: '082222222222',
        name: 'Ani Member',
        email: 'ani@example.com',
        address: 'Jl. Gatot Subroto No. 10, Jakarta',
        points: 80,
      },
      {
        phone: '083333333333',
        name: 'Doni Member',
        email: 'doni@example.com',
        address: 'Jl. Rasuna Said No. 15, Jakarta',
        points: 200,
      },
    ]

    for (const member of members) {
      const created = await prisma.member.upsert({
        where: { phone: member.phone },
        update: {},
        create: member,
      })
      console.log(`✅ Member created: ${created.name} - ${created.points} points`)
    }

    // ============================================
    // 5. CREATE SYSTEM SETTINGS
    // ============================================
    console.log('\n⚙️ Creating system settings...')

    const settings = [
      { key: 'restaurant_name', value: 'AYAM GEPREK SAMBAL IJO', category: 'general' },
      { key: 'restaurant_phone', value: '085260812758', category: 'general' },
      { key: 'restaurant_address', value: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151', category: 'general' },
      { key: 'tax_rate', value: '10', category: 'finance' },
      { key: 'point_per_purchase', value: '1', category: 'loyalty' },
      { key: 'min_purchase_for_point', value: '10000', category: 'loyalty' },
      { key: 'point_value', value: '100', category: 'loyalty' },
      { key: 'currency', value: 'IDR', category: 'general' },
    ]

    for (const setting of settings) {
      const created = await prisma.setting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      })
      console.log(`✅ Setting created: ${created.key}`)
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('═════════════════════════════════════════')
    console.log('Admin:     admin@ayamgeprek.com / admin123')
    console.log('Manager:   manager@ayamgeprek.com / admin123')
    console.log('Kasir 1:   kasir1@ayamgeprek.com / kasir123')
    console.log('Kasir 2:   kasir2@ayamgeprek.com / kasir123')
    console.log('User:      user@gmail.com / user123')
    console.log('User:      dewi@gmail.com / user123')
    console.log('═════════════════════════════════════════')
  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
