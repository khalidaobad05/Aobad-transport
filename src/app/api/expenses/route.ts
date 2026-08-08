import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const vehicleId = searchParams.get('vehicleId')
    const type = searchParams.get('type')

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

    if (type) {
      where.type = type
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        vehicle: true,
        shipment: { include: { client: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: expenses, success: true })
  } catch (error) {
    console.error('خطأ في جلب المصروفات:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المصروفات', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, type, amount, notes, shipmentId, vehicleId } = body

    if (!date || !type || !vehicleId) {
      return NextResponse.json(
        { message: 'التاريخ ونوع المصروف والمركبة مطلوبون', success: false },
        { status: 400 }
      )
    }

    // Generate next number
    const lastExpense = await db.expense.findFirst({
      orderBy: { number: 'desc' },
    })
    const lastNum = lastExpense ? parseInt(lastExpense.number.replace('EXP-', '')) : 0
    const nextNumber = `EXP-${String(lastNum + 1).padStart(3, '0')}`

    const expense = await db.expense.create({
      data: {
        number: nextNumber,
        date: new Date(date),
        type,
        amount: amount || 0,
        notes: notes || null,
        shipmentId: shipmentId || null,
        vehicleId,
      },
      include: { vehicle: true },
    })

    return NextResponse.json({ data: expense, success: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء مصروف:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء المصروف', success: false },
      { status: 500 }
    )
  }
}
