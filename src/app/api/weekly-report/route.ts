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
      include: { vehicle: true, client: true },
    })

    // Get all expenses in the date range
    const expenses = await db.expense.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
      },
      include: { vehicle: true },
    })

    // Group by owner (partner)
    const ownerMap = new Map<string, {
      ownerName: string
      vehicles: { id: string; registration: string; driverName: string }[]
      shipmentCount: number
      totalIncome: number
      totalExpenses: number
    }>()

    for (const vehicle of vehicles) {
      const owner = vehicle.ownerName || vehicle.driverName
      if (!ownerMap.has(owner)) {
        ownerMap.set(owner, {
          ownerName: owner,
          vehicles: [],
          shipmentCount: 0,
          totalIncome: 0,
          totalExpenses: 0,
        })
      }
      const entry = ownerMap.get(owner)!
      entry.vehicles.push({
        id: vehicle.id,
        registration: vehicle.registration,
        driverName: vehicle.driverName,
      })
    }

    // Accumulate shipments per owner
    for (const shipment of shipments) {
      const vehicle = vehicles.find((v) => v.id === shipment.vehicleId)
      if (!vehicle) continue
      const owner = vehicle.ownerName || vehicle.driverName
      const entry = ownerMap.get(owner)
      if (entry) {
        entry.shipmentCount++
        entry.totalIncome += shipment.totalAmount
      }
    }

    // Accumulate expenses per owner
    for (const expense of expenses) {
      const vehicle = vehicles.find((v) => v.id === expense.vehicleId)
      if (!vehicle) continue
      const owner = vehicle.ownerName || vehicle.driverName
      const entry = ownerMap.get(owner)
      if (entry) {
        entry.totalExpenses += expense.amount
      }
    }

    // Build partner reports
    const partnerReports = Array.from(ownerMap.values()).map((entry) => ({
      ownerName: entry.ownerName,
      vehicles: entry.vehicles,
      shipmentCount: entry.shipmentCount,
      totalIncome: entry.totalIncome,
      totalExpenses: entry.totalExpenses,
      netProfit: entry.totalIncome - entry.totalExpenses,
    }))

    // Totals
    const totalIncome = shipments.reduce((sum, s) => sum + s.totalAmount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalNetProfit = totalIncome - totalExpenses

    return NextResponse.json({
      data: {
        startDate: startDateStr,
        endDate: endDateStr,
        partnerReports,
        summary: {
          totalShipments: shipments.length,
          totalExpensesCount: expenses.length,
          totalIncome,
          totalExpenses,
          totalNetProfit,
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
