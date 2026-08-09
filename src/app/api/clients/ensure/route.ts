import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Find existing client by name or create a new one with just the name
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { message: 'اسم الزبون مطلوب', success: false },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Try to find existing client (exact match)
    const existing = await db.client.findFirst({
      where: {
        name: { equals: trimmedName },
      },
    })

    if (existing) {
      return NextResponse.json({ data: existing, success: true, created: false })
    }

    // Generate next code
    const lastClient = await db.client.findFirst({
      orderBy: { code: 'desc' },
    })
    const nextCode = lastClient ? lastClient.code + 1 : 1001

    // Create new client with name only
    const client = await db.client.create({
      data: {
        code: nextCode,
        name: trimmedName,
      },
    })

    return NextResponse.json({ data: client, success: true, created: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في البحث/إنشاء الزبون:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء البحث عن الزبون', success: false },
      { status: 500 }
    )
  }
}
