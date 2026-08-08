import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      orderBy: { driverName: 'asc' },
    })

    return NextResponse.json({ data: vehicles, success: true })
  } catch (error) {
    console.error('خطأ في جلب المركبات:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المركبات', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registration, driverName, phone } = body

    if (!registration || !driverName) {
      return NextResponse.json(
        { message: 'رقم التسجيل واسم السائق مطلوبان', success: false },
        { status: 400 }
      )
    }

    const vehicle = await db.vehicle.create({
      data: {
        registration,
        driverName,
        phone: phone || null,
      },
    })

    return NextResponse.json({ data: vehicle, success: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء مركبة:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء المركبة', success: false },
      { status: 500 }
    )
  }
}
