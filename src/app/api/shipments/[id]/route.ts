import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shipment = await db.shipment.findUnique({
      where: { id },
      include: {
        client: true,
        vehicle: true,
        expenses: true,
      },
    })

    if (!shipment) {
      return NextResponse.json(
        { message: 'الشحنة غير موجودة', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: shipment, success: true })
  } catch (error) {
    console.error('خطأ في جلب الشحنة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الشحنة', success: false },
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
    const {
      date,
      status,
      packageCount,
      unitPrice,
      description,
      clientId,
      vehicleId,
    } = body

    const totalAmount = (packageCount || 0) * (unitPrice || 0)

    const shipment = await db.shipment.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        status,
        packageCount,
        unitPrice,
        totalAmount,
        description: description || null,
        clientId,
        vehicleId,
      },
      include: { client: true, vehicle: true },
    })

    return NextResponse.json({ data: shipment, success: true })
  } catch (error) {
    console.error('خطأ في تحديث الشحنة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث الشحنة', success: false },
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
    await db.shipment.delete({ where: { id } })

    return NextResponse.json(
      { message: 'تم حذف الشحنة بنجاح', success: true }
    )
  } catch (error) {
    console.error('خطأ في حذف الشحنة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء حذف الشحنة', success: false },
      { status: 500 }
    )
  }
}
