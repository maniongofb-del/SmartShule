import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DATABASE_URL || 'file:./db/custom.db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

if (typeof window === 'undefined') {
  try {
    const dbDir = path.dirname(dbPath.replace('file:', ''))
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
  } catch (e) {}
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
