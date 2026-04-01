import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Configure Neon for Vercel Postgres
if (process.env.DATABASE_URL) {
  neonConfig.fetchConnectionCache = true
}

// Prisma Client instance with Neon adapter for Vercel Postgres
let db: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Production: Use Neon adapter for connection pooling
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaNeon(pool)
  db = new PrismaClient({ adapter })
} else {
  // Development: Use regular Prisma Client with connection cache
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

  if (!globalForPrisma.prisma) {
    if (process.env.DATABASE_URL) {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL })
      const adapter = new PrismaNeon(pool)
      globalForPrisma.prisma = new PrismaClient({
        adapter,
        log: ['query', 'error', 'warn'],
      })
    } else {
      globalForPrisma.prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      })
    }
  }

  db = globalForPrisma.prisma
}

export { db }
export { PrismaClient }
