import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const vehicleId = searchParams.get('vehicleId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.date = {
        gte: startDate,
        lt: endDate,
      }
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (status) {
      where.status = status
    }

    const [shipments, total] = await Promise.all([
      db.shipment.findMany({
        where,
        include: {
          vehicle: true,
          orders: {
            include: { client: true },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.shipment.count({ where }),
    ])

    return NextResponse.json({
      data: shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
    })
  } catch (error) {
    console.error('خطأ في جلب الشحنات:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الشحنات', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, status, description, vehicleId, orders } = body

    if (!date || !vehicleId) {
      return NextResponse.json(
        { message: 'التاريخ والمركبة مطلوبان', success: false },
        { status: 400 }
      )
    }

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { message: 'يجب إضافة طلبية واحدة على الأقل', success: false },
        { status: 400 }
      )
    }

    // Validate each order
    for (const order of orders) {
      if (!order.clientId) {
        return NextResponse.json(
          { message: 'كل طلبية يجب أن تحتوي على زبون', success: false },
          { status: 400 }
        )
      }
      if (!order.packageCount || order.packageCount <= 0) {
        return NextResponse.json(
          { message: 'عدد الطرود مطلوب لكل طلبية', success: false },
          { status: 400 }
        )
      }
    }

    // Generate next number
    const lastShipment = await db.shipment.findFirst({
      orderBy: { number: 'desc' },
    })
    const nextNumber = lastShipment ? lastShipment.number + 1 : 1001

    const shipment = await db.shipment.create({
      data: {
        number: nextNumber,
        date: new Date(date),
        status: status || 'قيد التوصيل',
        description: description || null,
        vehicleId,
        orders: {
          create: orders.map((o: { clientId: string; packageCount: number; price?: number; description?: string }) => ({
            clientId: o.clientId,
            packageCount: o.packageCount,
            price: o.price || null,
            description: o.description || null,
          })),
        },
      },
      include: {
        vehicle: true,
        orders: { include: { client: true } },
      },
    })

    return NextResponse.json({ data: shipment, success: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء شحنة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء الشحنة', success: false },
      { status: 500 }
    )
  }
}
