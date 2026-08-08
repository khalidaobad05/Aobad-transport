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
      revenueToday,
      shipmentsWeek,
      revenueWeek,
      clientsCount,
      vehiclesCount,
      recentShipments,
      last7DaysShipments,
    ] = await Promise.all([
      // Shipments today
      db.shipment.count({
        where: { date: { gte: todayStart, lt: todayEnd } },
      }),
      // Revenue today
      db.shipment.aggregate({
        where: { date: { gte: todayStart, lt: todayEnd } },
        _sum: { totalAmount: true },
      }),
      // Shipments this week
      db.shipment.count({
        where: { date: { gte: weekStart } },
      }),
      // Revenue this week
      db.shipment.aggregate({
        where: { date: { gte: weekStart } },
        _sum: { totalAmount: true },
      }),
      // Total clients
      db.client.count(),
      // Total vehicles
      db.vehicle.count(),
      // Recent shipments (last 10)
      db.shipment.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: { client: true, vehicle: true },
      }),
      // Shipments for last 7 days for chart
      db.shipment.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
          },
        },
        select: { date: true, totalAmount: true },
      }),
    ])

    // Revenue by day (last 7 days)
    const revenueByDay: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const dayRevenue = last7DaysShipments
        .filter((s) => s.date.toISOString().split('T')[0] === dStr)
        .reduce((sum, s) => sum + s.totalAmount, 0)
      revenueByDay.push({ date: dStr, revenue: dayRevenue })
    }

    return NextResponse.json({
      data: {
        shipmentsToday,
        revenueToday: revenueToday._sum.totalAmount || 0,
        shipmentsWeek,
        revenueWeek: revenueWeek._sum.totalAmount || 0,
        clientsCount,
        vehiclesCount,
        recentShipments,
        revenueByDay,
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
