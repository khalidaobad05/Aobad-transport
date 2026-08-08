import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { clientId, packageCount, description } = body

    const order = await db.order.update({
      where: { id },
      data: {
        clientId,
        packageCount,
        description: description || null,
      },
      include: { client: true, shipment: { include: { vehicle: true } } },
    })

    return NextResponse.json({ data: order, success: true })
  } catch (error) {
    console.error('خطأ في تحديث الطلبية:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث الطلبية', success: false },
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
    await db.order.delete({ where: { id } })

    return NextResponse.json(
      { message: 'تم حذف الطلبية بنجاح', success: true }
    )
  } catch (error) {
    console.error('خطأ في حذف الطلبية:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء حذف الطلبية', success: false },
      { status: 500 }
    )
  }
}
