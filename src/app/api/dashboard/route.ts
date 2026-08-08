import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()

    // Start of today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    // End of today
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Start of week (Monday)
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - diffToMonday)
    weekStart.setHours(0, 0, 0, 0)

    // Parallel queries for dashboard stats
    const [
      shipmentsToday,
      ordersToday,
      packagesToday,
      shipmentsWeek,
      ordersWeek,
      packagesWeek,
      clientsCount,
      vehiclesCount,
      recentShipments,
      last7DaysShipments,
    ] = await Promise.all([
      // Shipments today
      db.shipment.count({
        where: { date: { gte: todayStart, lt: todayEnd } },
      }),
      // Orders today
      db.order.count({
        where: { shipment: { date: { gte: todayStart, lt: todayEnd } } },
      }),
      // Packages today
      db.order.aggregate({
        where: { shipment: { date: { gte: todayStart, lt: todayEnd } } },
        _sum: { packageCount: true },
      }),
      // Shipments this week
      db.shipment.count({
        where: { date: { gte: weekStart } },
      }),
      // Orders this week
      db.order.count({
        where: { shipment: { date: { gte: weekStart } } },
      }),
      // Packages this week
      db.order.aggregate({
        where: { shipment: { date: { gte: weekStart } } },
        _sum: { packageCount: true },
      }),
      // Total clients
      db.client.count(),
      // Total vehicles
      db.vehicle.count(),
      // Recent shipments (last 10)
      db.shipment.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: {
          vehicle: true,
          orders: { include: { client: true } },
        },
      }),
      // Shipments for last 7 days for chart
      db.shipment.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
          },
        },
        include: { orders: true },
      }),
    ])

    // Orders/packages by day (last 7 days)
    const ordersByDay: { date: string; orders: number; packages: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const dayShipments = last7DaysShipments.filter(
        (s) => s.date.toISOString().split('T')[0] === dStr
      )
      const dayOrders = dayShipments.reduce((sum, s) => sum + s.orders.length, 0)
      const dayPackages = dayShipments.reduce(
        (sum, s) => sum + s.orders.reduce((ss, o) => ss + o.packageCount, 0),
        0
      )
      ordersByDay.push({ date: dStr, orders: dayOrders, packages: dayPackages })
    }

    return NextResponse.json({
      data: {
        shipmentsToday,
        ordersToday,
        packagesToday: packagesToday._sum.packageCount || 0,
        shipmentsWeek,
        ordersWeek,
        packagesWeek: packagesWeek._sum.packageCount || 0,
        clientsCount,
        vehiclesCount,
        recentShipments,
        ordersByDay,
      },
      success: true,
    })
  } catch (error) {
    console.error('خطأ في جلب إحصائيات لوحة القيادة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الإحصائيات', success: false },
      { status: 500 }
    )
  }
}
