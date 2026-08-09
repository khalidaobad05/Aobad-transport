import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

let _db: any = undefined

function getDb() {
  if (_db) return _db

  if (globalForPrisma.prisma) {
    _db = globalForPrisma.prisma
    return _db
  }

  if (process.env.TURSO_DATABASE_URL) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
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

export const db = new Proxy({} as any, {
  get(_target: any, prop: string | symbol, _receiver: any) {
    const actualDb = getDb()
    const value = Reflect.get(actualDb, prop, actualDb)
    if (typeof value === 'function') {
      return value.bind(actualDb)
    }
    return value
  },
})
