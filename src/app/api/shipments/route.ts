import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const clientId = searchParams.get('clientId')
    const vehicleId = searchParams.get('vehicleId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    if (clientId) {
      where.clientId = clientId
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
          client: true,
          vehicle: true,
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
    const {
      date,
      status,
      packageCount,
      unitPrice,
      description,
      clientId,
      vehicleId,
    } = body

    if (!date || !clientId || !vehicleId) {
      return NextResponse.json(
        { message: 'التاريخ ومعرف العميل والمركبة مطلوبون', success: false },
        { status: 400 }
      )
    }

    const totalAmount = (packageCount || 0) * (unitPrice || 0)

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
        packageCount: packageCount || 0,
        unitPrice: unitPrice || 0,
        totalAmount,
        description: description || null,
        clientId,
        vehicleId,
      },
      include: { client: true, vehicle: true },
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
