import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { client: true },
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'الفاتورة غير موجودة', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: invoice, success: true })
  } catch (error) {
    console.error('خطأ في جلب الفاتورة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الفاتورة', success: false },
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
    const {
      date,
      paymentMethod,
      htAmount,
      tvaRate,
      tvaAmount,
      taxeProfRate,
      taxeProfAmount,
      ttcAmount,
      timbreFiscal,
      status,
      notes,
      clientId,
    } = body

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        paymentMethod,
        htAmount,
        tvaRate,
        tvaAmount,
        taxeProfRate,
        taxeProfAmount,
        ttcAmount,
        timbreFiscal,
        status,
        notes: notes || null,
        clientId,
      },
      include: { client: true },
    })

    return NextResponse.json({ data: invoice, success: true })
  } catch (error) {
    console.error('خطأ في تحديث الفاتورة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث الفاتورة', success: false },
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
    await db.invoice.delete({ where: { id } })

    return NextResponse.json(
      { message: 'تم حذف الفاتورة بنجاح', success: true }
    )
  } catch (error) {
    console.error('خطأ في حذف الفاتورة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء حذف الفاتورة', success: false },
      { status: 500 }
    )
  }
}
