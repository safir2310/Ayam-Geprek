import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null;

// Function to get Prisma client (works both locally and on Netlify)
export const getPrisma = () => {
  if (prisma) {
    return prisma;
  }

  // Check database URL from environment
  const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_PROD || 'file:./db/custom.db';

  console.log('Database URL:', databaseUrl);
  console.log('Node environment:', process.env.NODE_ENV);

  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  return prisma;
};

export const db = getPrisma();
