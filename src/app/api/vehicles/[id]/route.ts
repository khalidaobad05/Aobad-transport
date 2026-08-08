import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const vehicle = await db.vehicle.findUnique({
      where: { id },
      include: {
        shipments: {
          orderBy: { date: 'desc' },
          include: { client: true },
        },
        expenses: { orderBy: { date: 'desc' } },
      },
    })

    if (!vehicle) {
      return NextResponse.json(
        { message: 'المركبة غير موجودة', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: vehicle, success: true })
  } catch (error) {
    console.error('خطأ في جلب المركبة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المركبة', success: false },
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
    const { registration, driverName, ownerName, phone } = body

    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        registration,
        driverName,
        ownerName: ownerName || undefined,
        phone: phone || null,
      },
    })

    return NextResponse.json({ data: vehicle, success: true })
  } catch (error) {
    console.error('خطأ في تحديث المركبة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث المركبة', success: false },
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
    await db.vehicle.delete({ where: { id } })

    return NextResponse.json(
      { message: 'تم حذف المركبة بنجاح', success: true }
    )
  } catch (error) {
    console.error('خطأ في حذف المركبة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء حذف المركبة', success: false },
      { status: 500 }
    )
  }
}
