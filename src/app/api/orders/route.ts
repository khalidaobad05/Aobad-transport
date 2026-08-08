import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/orders?clientId=xxx&date=yyyy-mm-dd
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}

    if (clientId) {
      where.clientId = clientId
    }

    if (date) {
      where.shipment = {
        date: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 86400000),
        },
      }
    }

    const orders = await db.order.findMany({
      where,
      include: {
        client: true,
        shipment: { include: { vehicle: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: orders, success: true })
  } catch (error) {
    console.error('خطأ في جلب الطلبيات:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الطلبيات', success: false },
      { status: 500 }
    )
  }
}

// POST /api/orders — add an order to an existing shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shipmentId, clientId, packageCount, description } = body

    if (!shipmentId || !clientId || !packageCount) {
      return NextResponse.json(
        { message: 'الشحنة والزبون وعدد الطرود مطلوبون', success: false },
        { status: 400 }
      )
    }

    const order = await db.order.create({
      data: {
        shipmentId,
        clientId,
        packageCount,
        description: description || null,
      },
      include: { client: true, shipment: { include: { vehicle: true } } },
    })

    return NextResponse.json({ data: order, success: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء طلبية:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء الطلبية', success: false },
      { status: 500 }
    )
  }
}
