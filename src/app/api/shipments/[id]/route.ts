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
        vehicle: true,
        orders: { include: { client: true } },
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
    const { date, status, description, generator, totalExpected, vehicleId, orders } = body

    const shipment = await db.shipment.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        status,
        description: description || null,
        generator: generator !== undefined ? (generator || null) : undefined,
        totalExpected: totalExpected !== undefined ? (totalExpected || null) : undefined,
        vehicleId,
      },
      include: {
        vehicle: true,
        orders: { include: { client: true } },
      },
    })

    // Handle order updates if provided
    if (orders && Array.isArray(orders)) {
      // Delete existing orders and recreate
      await db.order.deleteMany({ where: { shipmentId: id } })
      for (const o of orders) {
        if (o.clientId && o.packageCount > 0) {
          await db.order.create({
            data: {
              shipmentId: id,
              clientId: o.clientId,
              packageCount: o.packageCount,
              price: o.price || null,
              description: o.description || null,
            },
          })
        }
      }
    }

    // Re-fetch with updated orders
    const updated = await db.shipment.findUnique({
      where: { id },
      include: { vehicle: true, orders: { include: { client: true } } },
    })

    return NextResponse.json({ data: updated, success: true })
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
