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
      orderBy: { driverName: 'asc' },
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

    // Build report per vehicle
    const vehicleReports = vehicles.map((vehicle) => {
      const vehicleShipments = shipments.filter(
        (s) => s.vehicleId === vehicle.id
      )
      const vehicleExpenses = expenses.filter(
        (e) => e.vehicleId === vehicle.id
      )

      const totalIncome = vehicleShipments.reduce(
        (sum, s) => sum + s.totalAmount,
        0
      )
      const totalExpenses = vehicleExpenses.reduce(
        (sum, e) => sum + e.amount,
        0
      )
      const netProfit = totalIncome - totalExpenses

      return {
        vehicle: {
          id: vehicle.id,
          registration: vehicle.registration,
          driverName: vehicle.driverName,
        },
        shipmentCount: vehicleShipments.length,
        expenseCount: vehicleExpenses.length,
        totalIncome,
        totalExpenses,
        netProfit,
      }
    })

    // Totals
    const totalIncome = shipments.reduce((sum, s) => sum + s.totalAmount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalNetProfit = totalIncome - totalExpenses

    return NextResponse.json({
      data: {
        startDate: startDateStr,
        endDate: endDateStr,
        vehicleReports,
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
