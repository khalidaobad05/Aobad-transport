import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/delivery-note?date=...&clientId=...  (single client)
// GET /api/delivery-note?date=...&allClients=true   (all clients for the day)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const clientId = searchParams.get('clientId')
    const allClients = searchParams.get('allClients')

    if (!date) {
      return NextResponse.json(
        { message: 'التاريخ مطلوب لإنشاء وصل التسليم', success: false },
        { status: 400 }
      )
    }

    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    // Mode 1: All clients for the day
    if (allClients === 'true') {
      const orders = await db.order.findMany({
        where: {
          shipment: {
            date: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
        include: {
          client: true,
          shipment: {
            include: { vehicle: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Group by client
      const clientMap = new Map<string, {
        client: { id: string; name: string };
        totalPackages: number;
        orderCount: number;
        shipments: string[];
      }>()

      for (const order of orders) {
        const key = order.clientId
        const existing = clientMap.get(key)
        const shipLabel = `${order.shipment.vehicle.registration} (#${order.shipment.number})`
        if (existing) {
          existing.totalPackages += order.packageCount
          existing.orderCount += 1
          if (!existing.shipments.includes(shipLabel)) {
            existing.shipments.push(shipLabel)
          }
        } else {
          clientMap.set(key, {
            client: { id: order.client.id, name: order.client.name },
            totalPackages: order.packageCount,
            orderCount: 1,
            shipments: [shipLabel],
          })
        }
      }

      const notes = Array.from(clientMap.values())

      return NextResponse.json({
        data: {
          date,
          mode: 'all',
          notes,
          totalClients: notes.length,
          totalPackages: notes.reduce((s, n) => s + n.totalPackages, 0),
        },
        success: true,
      })
    }

    // Mode 2: Single client
    if (!clientId) {
      return NextResponse.json(
        { message: 'معرف العميل مطلوب', success: false },
        { status: 400 }
      )
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { message: 'العميل غير موجود', success: false },
        { status: 404 }
      )
    }

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
