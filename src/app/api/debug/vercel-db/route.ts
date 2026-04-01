import { NextResponse } from 'next/server'

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      hasDirectUrl: !!process.env.DIRECT_URL,
      directUrlLength: process.env.DIRECT_URL?.length || 0,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
    },
    envKeys: Object.keys(process.env).filter(key =>
      key.includes('DATABASE') ||
      key.includes('POSTGRES') ||
      key.includes('DIRECT')
    ).sort()
  }

  // Mask sensitive info
  if (process.env.DATABASE_URL) {
    debugInfo.database.databaseUrlPreview = process.env.DATABASE_URL.substring(0, 30) + '...'
  }
  if (process.env.DIRECT_URL) {
    debugInfo.database.directUrlPreview = process.env.DIRECT_URL.substring(0, 30) + '...'
  }
  if (process.env.POSTGRES_PRISMA_URL) {
    debugInfo.database.postgresPrismaUrlPreview = process.env.POSTGRES_PRISMA_URL.substring(0, 30) + '...'
  }

  return NextResponse.json(debugInfo)
}
