import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expense = await db.expense.findUnique({
      where: { id },
      include: {
        vehicle: true,
        shipment: { include: { client: true } },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { message: 'المصروف غير موجود', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: expense, success: true })
  } catch (error) {
    console.error('خطأ في جلب المصروف:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المصروف', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { date, type, amount, notes, shipmentId, vehicleId } = body

    const expense = await db.expense.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        type,
        amount,
        notes: notes || null,
        shipmentId: shipmentId || null,
        vehicleId,
      },
      include: { vehicle: true },
    })

    return NextResponse.json({ data: expense, success: true })
  } catch (error) {
    console.error('خطأ في تحديث المصروف:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث المصروف', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.expense.delete({ where: { id } })

    return NextResponse.json(
      { message: 'تم حذف المصروف بنجاح', success: true }
    )
  } catch (error) {
    console.error('خطأ في حذف المصروف:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء حذف المصروف', success: false },
      { status: 500 }
    )
  }
}
