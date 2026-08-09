const globalForPrisma = globalThis as unknown as {
  prisma: any
}

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN

function getDb(): any {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client')

  let client: any
  if (tursoUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    const libsql = createClient({ url: tursoUrl, authToken: tursoAuthToken })
    const adapter = new PrismaLibSQL(libsql)
    client = new PrismaClient({ adapter })
  } else {
    client = new PrismaClient()
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
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
