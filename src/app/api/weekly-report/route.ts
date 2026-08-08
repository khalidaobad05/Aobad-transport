import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { message: 'تاريخ البداية وتاريخ النهاية مطلوبان', success: false },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    endDate.setDate(endDate.getDate() + 1)

    // Get all vehicles
    const vehicles = await db.vehicle.findMany({
      orderBy: { ownerName: 'asc' },
    })

    // Get all shipments in the date range
    const shipments = await db.shipment.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
      },
      include: {
        vehicle: true,
        orders: { include: { client: true } },
      },
    })

    // Get all expenses in the date range
    const expenses = await db.expense.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
      },
      include: { vehicle: true },
    })

    // Group by owner (partner)
    const PARTNER_NAMES = [
      'أحمد عباد',
      'رشيد عباد',
      'عبد اللطيف عباد',
      'عبد المجيد عباد',
    ]

    const partnerMap = new Map<string, {
      ownerName: string
      vehicles: { id: string; registration: string; driverName: string }[]
      shipmentCount: number
      orderCount: number
      totalPackages: number
      totalExpenses: number
    }>()

    // Initialize all 4 partners
    for (const name of PARTNER_NAMES) {
      partnerMap.set(name, {
        ownerName: name,
        vehicles: [],
        shipmentCount: 0,
        orderCount: 0,
        totalPackages: 0,
        totalExpenses: 0,
      })
    }

    // Map vehicles to partners
    for (const vehicle of vehicles) {
      const owner = vehicle.ownerName
      const entry = partnerMap.get(owner)
      if (entry) {
        entry.vehicles.push({
          id: vehicle.id,
          registration: vehicle.registration,
          driverName: vehicle.driverName,
        })
      }
    }

    // Accumulate shipments and orders per partner
    for (const shipment of shipments) {
      const owner = shipment.vehicle.ownerName
      const entry = partnerMap.get(owner)
      if (entry) {
        entry.shipmentCount++
        entry.orderCount += shipment.orders.length
        entry.totalPackages += shipment.orders.reduce((s, o) => s + o.packageCount, 0)
      }
    }

    // Accumulate expenses per partner
    for (const expense of expenses) {
      const owner = expense.vehicle.ownerName
      const entry = partnerMap.get(owner)
      if (entry) {
        entry.totalExpenses += expense.amount
      }
    }

    const partnerReports = Array.from(partnerMap.values()).map((entry) => ({
      ownerName: entry.ownerName,
      vehicles: entry.vehicles,
      shipmentCount: entry.shipmentCount,
      orderCount: entry.orderCount,
      totalPackages: entry.totalPackages,
      totalExpenses: entry.totalExpenses,
    }))

    // Totals
    const totalShipments = shipments.length
    const totalOrders = shipments.reduce((s, sh) => s + sh.orders.length, 0)
    const totalPackages = shipments.reduce((s, sh) => s + sh.orders.reduce((ss, o) => ss + o.packageCount, 0), 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    return NextResponse.json({
      data: {
        startDate: startDateStr,
        endDate: endDateStr,
        partnerReports,
        summary: {
          totalShipments,
          totalOrders,
          totalPackages,
          totalExpensesCount: expenses.length,
          totalExpenses,
        },
      },
      success: true,
    })
  } catch (error) {
    console.error('خطأ في جلب التقرير الأسبوعي:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب التقرير الأسبوعي', success: false },
      { status: 500 }
    )
  }
}
