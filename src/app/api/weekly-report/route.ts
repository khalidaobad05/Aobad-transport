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

    const vehicles = await db.vehicle.findMany({ orderBy: { ownerName: 'asc' } })

    const shipments = await db.shipment.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      include: { vehicle: true, orders: { include: { client: true } } },
    })

    const expenses = await db.expense.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      include: { vehicle: true },
    })

    const PARTNER_NAMES = ['أحمد عباد', 'رشيد عباد', 'عبد اللطيف عباد', 'عبد المجيد عباد']

    interface ShipmentDetail {
      number: number
      date: string
      description: string | null
      status: string
      vehicleRegistration: string
      driverName: string
      orders: { clientName: string; packageCount: number; description: string | null }[]
      totalPackages: number
    }

    interface ExpenseDetail {
      number: string
      date: string
      type: string
      amount: number
      notes: string | null
      vehicleRegistration: string
    }

    const partnerMap = new Map<string, {
      ownerName: string
      vehicles: { id: string; registration: string; driverName: string }[]
      shipmentCount: number
      orderCount: number
      totalPackages: number
      totalExpenses: number
      shipments: ShipmentDetail[]
      expenseDetails: ExpenseDetail[]
    }>()

    for (const name of PARTNER_NAMES) {
      partnerMap.set(name, {
        ownerName: name,
        vehicles: [],
        shipmentCount: 0,
        orderCount: 0,
        totalPackages: 0,
        totalExpenses: 0,
        shipments: [],
        expenseDetails: [],
      })
    }

    for (const vehicle of vehicles) {
      const entry = partnerMap.get(vehicle.ownerName)
      if (entry) {
        entry.vehicles.push({
          id: vehicle.id,
          registration: vehicle.registration,
          driverName: vehicle.driverName,
        })
      }
    }

    for (const shipment of shipments) {
      const owner = shipment.vehicle.ownerName
      const entry = partnerMap.get(owner)
      if (entry) {
        entry.shipmentCount++
        const orderDetails = shipment.orders.map((o) => ({
          clientName: o.client.name,
          packageCount: o.packageCount,
          description: o.description,
        }))
        const pkgTotal = orderDetails.reduce((s, o) => s + o.packageCount, 0)
        entry.orderCount += shipment.orders.length
        entry.totalPackages += pkgTotal
        entry.shipments.push({
          number: shipment.number,
          date: shipment.date.toISOString().split('T')[0],
          description: shipment.description,
          status: shipment.status,
          vehicleRegistration: shipment.vehicle.registration,
          driverName: shipment.vehicle.driverName,
          orders: orderDetails,
          totalPackages: pkgTotal,
        })
      }
    }

    for (const expense of expenses) {
      const owner = expense.vehicle.ownerName
      const entry = partnerMap.get(owner)
      if (entry) {
        entry.totalExpenses += expense.amount
        entry.expenseDetails.push({
          number: expense.number,
          date: expense.date.toISOString().split('T')[0],
          type: expense.type,
          amount: expense.amount,
          notes: expense.notes,
          vehicleRegistration: expense.vehicle.registration,
        })
      }
    }

    const partnerReports = Array.from(partnerMap.values())

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
