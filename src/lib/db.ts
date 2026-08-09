import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN

let _db: PrismaClient | undefined

function getDb(): PrismaClient {
  if (_db) return _db
  if (globalForPrisma.prisma) {
    _db = globalForPrisma.prisma
    return _db
  }

  if (tursoUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')

    const libsql = createClient({ url: tursoUrl, authToken: tursoAuthToken })
    const adapter = new PrismaLibSQL(libsql)
    _db = new PrismaClient({ adapter })
  } else {
    _db = new PrismaClient()
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = _db
  }

  return _db
}

// Lazy proxy — PrismaClient is only created on first actual query
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const actualDb = getDb()
    const value = Reflect.get(actualDb, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(actualDb)
    }
    return value
  },
})
