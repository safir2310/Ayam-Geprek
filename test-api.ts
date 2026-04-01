import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require'
    }
  }
})

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n')

  try {
    // Test connection
    const result = await db.$queryRaw`SELECT NOW() as now`
    console.log('✅ Database connected!')
    console.log('   Current time:', result[0]?.now)
    console.log('')

    // Test categories
    console.log('📦 Checking Categories...')
    const categories = await db.category.findMany({
      take: 5,
      orderBy: { order: 'asc' }
    })
    console.log(`   Total categories: ${categories.length}`)
    if (categories.length === 0) {
      console.log('   ⚠️  No categories found - need to seed data!')
    } else {
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.isActive ? 'Active' : 'Inactive'})`)
      })
    }
    console.log('')

    // Test products
    console.log('🍗 Checking Products...')
    const products = await db.product.findMany({
      take: 5,
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`   Total products: ${products.length}`)
    if (products.length === 0) {
      console.log('   ⚠️  No products found - need to seed data!')
    } else {
      products.forEach(prod => {
        console.log(`   - ${prod.name} - Rp${prod.price?.toLocaleString()} (${prod.isActive ? 'Active' : 'Inactive'})`)
      })
    }
    console.log('')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('   Code:', error.code)
    throw error
  } finally {
    await db.$disconnect()
  }
}

testDatabase()
