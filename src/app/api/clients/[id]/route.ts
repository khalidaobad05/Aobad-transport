import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await db.client.findUnique({
      where: { id },
      include: {
        shipments: { orderBy: { date: 'desc' } },
        invoices: { orderBy: { date: 'desc' } },
      },
    })

    if (!client) {
      return NextResponse.json(
        { message: 'العميل غير موجود', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: client, success: true })
  } catch (error) {
    console.error('خطأ في جلب العميل:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب العميل', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, phone, address, ifu, ice, rc } = body

    const client = await db.client.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        address: address || null,
        ifu: ifu || null,
        ice: ice || null,
        rc: rc || null,
      },
    })

    return NextResponse.json({ data: client, success: true })
  } catch (error) {
    console.error('خطأ في تحديث العميل:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث العميل', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.client.delete({ where: { id } })

    return NextResponse.json(
      { message: 'تم حذف العميل بنجاح', success: true }
    )
  } catch (error) {
    console.error('خطأ في حذف العميل:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء حذف العميل', success: false },
      { status: 500 }
    )
  }
}
