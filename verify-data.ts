import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_IUiS3d0nwlhA@ep-ancient-paper-aiifvyrx-pooler.c-4.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require'
    }
  }
})

async function verifyData() {
  console.log('🔍 Verifying Database Data...\n')

  try {
    const categories = await db.category.count()
    const products = await db.product.count()
    const users = await db.user.count()
    const members = await db.member.count()
    const settings = await db.setting.count()

    console.log('📊 Database Summary:')
    console.log('═════════════════════════════════════════')
    console.log(`Categories: ${categories}`)
    console.log(`Products:   ${products}`)
    console.log(`Users:      ${users}`)
    console.log(`Members:    ${members}`)
    console.log(`Settings:   ${settings}`)
    console.log('═════════════════════════════════════════')
    console.log('')

    if (categories > 0 && products > 0) {
      console.log('✅ Database is ready!')
      console.log('✅ Aplikasi seharusnya sudah bisa menampilkan data')
    } else {
      console.log('⚠️  Database masih kosong')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await db.$disconnect()
  }
}

verifyData()
