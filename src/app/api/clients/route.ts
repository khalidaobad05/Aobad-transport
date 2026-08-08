import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const clients = await db.client.findMany({
      where: search
        ? {
            name: {
              contains: search,
            },
          }
        : undefined,
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ data: clients, success: true })
  } catch (error) {
    console.error('خطأ في جلب العملاء:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب العملاء', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, address, ifu, ice, rc } = body

    if (!name) {
      return NextResponse.json(
        { message: 'اسم العميل مطلوب', success: false },
        { status: 400 }
      )
    }

    // Generate next code
    const lastClient = await db.client.findFirst({
      orderBy: { code: 'desc' },
    })
    const nextCode = lastClient ? lastClient.code + 1 : 1001

    const client = await db.client.create({
      data: {
        code: nextCode,
        name,
        phone: phone || null,
        address: address || null,
        ifu: ifu || null,
        ice: ice || null,
        rc: rc || null,
      },
    })

    return NextResponse.json({ data: client, success: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء عميل:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء العميل', success: false },
      { status: 500 }
    )
  }
}
