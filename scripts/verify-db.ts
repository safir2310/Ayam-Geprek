import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database...\n')

    // Count users
    const userCount = await prisma.user.count()
    console.log(`👥 Total Users: ${userCount}`)

    // Show users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    })
    console.log('   Users:', users.map(u => `${u.name} (${u.role})`).join(', '))

    // Count categories
    const categoryCount = await prisma.category.count()
    console.log(`\n📂 Total Categories: ${categoryCount}`)

    // Show categories
    const categories = await prisma.category.findMany()
    console.log('   Categories:', categories.map(c => c.name).join(', '))

    // Count products
    const productCount = await prisma.product.count()
    console.log(`\n🍽️ Total Products: ${productCount}`)

    // Count members
    const memberCount = await prisma.member.count()
    console.log(`\n💳 Total Members: ${memberCount}`)

    // Count settings
    const settingCount = await prisma.setting.count()
    console.log(`\n⚙️ Total Settings: ${settingCount}`)

    console.log('\n✅ Database verification completed successfully!')
  } catch (error: any) {
    console.error('❌ Error verifying database:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()
