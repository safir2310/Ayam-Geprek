import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPasswords() {
  try {
    console.log('🔐 Resetting passwords...\n')

    const hashedAdminPassword = await bcrypt.hash('admin123', 10)
    const hashedUserPassword = await bcrypt.hash('user123', 10)
    const hashedKasirPassword = await bcrypt.hash('kasir123', 10)

    // Reset admin password
    const admin = await prisma.user.update({
      where: { email: 'admin@ayamgeprek.com' },
      data: { password: hashedAdminPassword },
    })
    console.log(`✅ Admin password reset: ${admin.email}`)

    // Reset manager password
    const manager = await prisma.user.update({
      where: { email: 'manager@ayamgeprek.com' },
      data: { password: hashedAdminPassword },
    })
    console.log(`✅ Manager password reset: ${manager.email}`)

    // Reset cashier passwords
    const kasir1 = await prisma.user.update({
      where: { email: 'kasir1@ayamgeprek.com' },
      data: { password: hashedKasirPassword },
    })
    console.log(`✅ Cashier 1 password reset: ${kasir1.email}`)

    const kasir2 = await prisma.user.update({
      where: { email: 'kasir2@ayamgeprek.com' },
      data: { password: hashedKasirPassword },
    })
    console.log(`✅ Cashier 2 password reset: ${kasir2.email}`)

    // Reset user passwords
    const user1 = await prisma.user.update({
      where: { email: 'user@gmail.com' },
      data: { password: hashedUserPassword },
    })
    console.log(`✅ User password reset: ${user1.email}`)

    const user2 = await prisma.user.update({
      where: { email: 'dewi@gmail.com' },
      data: { password: hashedUserPassword },
    })
    console.log(`✅ User password reset: ${user2.email}`)

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📋 Login Credentials:')
    console.log('═════════════════════════════════════════')
    console.log('Admin:     admin@ayamgeprek.com / admin123')
    console.log('Manager:   manager@ayamgeprek.com / admin123')
    console.log('Kasir 1:   kasir1@ayamgeprek.com / kasir123')
    console.log('Kasir 2:   kasir2@ayamgeprek.com / kasir123')
    console.log('User:      user@gmail.com / user123')
    console.log('User:      dewi@gmail.com / user123')
    console.log('═════════════════════════════════════════')
    console.log('\n✅ Password reset completed successfully!')
  } catch (error: any) {
    console.error('❌ Error resetting passwords:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPasswords()
