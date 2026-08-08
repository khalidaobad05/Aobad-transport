import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const clientId = searchParams.get('clientId')

    if (!date || !clientId) {
      return NextResponse.json(
        {
          message: 'التاريخ ومعرف العميل مطلوبان لإنشاء وصل التسليم',
          success: false,
        },
        { status: 400 }
      )
    }

    // Get client info
    const client = await db.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { message: 'العميل غير موجود', success: false },
        { status: 404 }
      )
    }

    // Get all orders for this client on this date (across all shipments)
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    const orders = await db.order.findMany({
      where: {
        clientId,
        shipment: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
      include: {
        shipment: {
          include: { vehicle: true },
        },
      },
    })

    const totalPackages = orders.reduce((sum, o) => sum + o.packageCount, 0)

    return NextResponse.json({
      data: {
        date,
        client: {
          id: client.id,
          name: client.name,
        },
        totalPackages,
        orderCount: orders.length,
      },
      success: true,
    })
  } catch (error) {
    console.error('خطأ في إنشاء وصل التسليم:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء وصل التسليم', success: false },
      { status: 500 }
    )
  }
}
