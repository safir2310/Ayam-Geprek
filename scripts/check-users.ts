import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    })

    console.log(`📊 Total Users: ${users.length}\n`)

    users.forEach((user) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`Name:    ${user.name}`)
      console.log(`Email:   ${user.email}`)
      console.log(`Role:    ${user.role}`)
      console.log(`Phone:   ${user.phone || 'N/A'}`)
      console.log(`ID:      ${user.id}`)
    })

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log('\n✅ User check completed!')
  } catch (error: any) {
    console.error('❌ Error checking users:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
