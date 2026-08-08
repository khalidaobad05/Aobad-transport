import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      include: { client: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: invoices, success: true })
  } catch (error) {
    console.error('خطأ في جلب الفواتير:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الفواتير', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date,
      paymentMethod,
      shipmentIds,
      htAmount: bodyHtAmount,
      tvaRate,
      tvaAmount: bodyTvaAmount,
      taxeProfRate,
      taxeProfAmount: bodyTaxeProfAmount,
      ttcAmount: bodyTtcAmount,
      timbreFiscal,
      status,
      notes,
      clientId,
    } = body

    if (!date || !clientId) {
      return NextResponse.json(
        { message: 'التاريخ ومعرف العميل مطلوبان', success: false },
        { status: 400 }
      )
    }

    // Calculate htAmount from shipments or use manual value
    let htAmount = bodyHtAmount || 0
    if (shipmentIds && shipmentIds.length > 0) {
      const shipments = await db.shipment.findMany({
        where: { id: { in: shipmentIds } },
      })
      htAmount = shipments.reduce((sum, s) => sum + s.totalAmount, 0)
    }

    const tvRate = tvaRate || 20
    const tpRate = taxeProfRate || 0
    const tf = timbreFiscal || 0

    const tvaAmount = htAmount * (tvRate / 100)
    const taxeProfAmount = htAmount * (tpRate / 100)
    const ttcAmount = htAmount + tvaAmount + taxeProfAmount + tf

    // Generate next number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { number: 'desc' },
    })
    const lastNum = lastInvoice
      ? parseInt(lastInvoice.number.replace('FAC-', ''))
      : 0
    const nextNumber = `FAC-${String(lastNum + 1).padStart(4, '0')}`

    const invoice = await db.invoice.create({
      data: {
        number: nextNumber,
        date: new Date(date),
        paymentMethod: paymentMethod || 'نقدي',
        htAmount,
        tvaRate: tvRate,
        tvaAmount,
        taxeProfRate: tpRate,
        taxeProfAmount,
        ttcAmount,
        timbreFiscal: tf,
        status: status || 'غير مدفوعة',
        notes: notes || null,
        clientId,
      },
      include: { client: true },
    })

    return NextResponse.json({ data: invoice, success: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء فاتورة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء الفاتورة', success: false },
      { status: 500 }
    )
  }
}
