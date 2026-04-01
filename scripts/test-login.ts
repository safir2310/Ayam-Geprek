import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  try {
    const testEmail = 'admin@ayamgeprek.com'
    const testPassword = 'admin123'

    console.log('🔐 Testing login...\n')
    console.log(`Email: ${testEmail}`)
    console.log(`Password: ${testPassword}\n`)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('✅ User found:')
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)

    // Verify password
    console.log('\n🔍 Verifying password...')
    const isValidPassword = await bcrypt.compare(testPassword, user.password)

    if (isValidPassword) {
      console.log('✅ Password is correct!')
      console.log('\n🎉 Login should work!')
    } else {
      console.log('❌ Password is incorrect!')
      console.log('\n⚠️ Login will fail!')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
