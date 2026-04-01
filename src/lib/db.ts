import { PrismaClient } from '@prisma/client'

// Prisma Client instance
let db: PrismaClient

if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient()
} else {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
  }
  
  db = globalForPrisma.prisma
}

export { db }
export { PrismaClient }
