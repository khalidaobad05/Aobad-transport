import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, accessCode } = body

    if (!fullName || !accessCode) {
      return NextResponse.json(
        { message: 'الاسم والكود مطلوبان', success: false },
        { status: 400 }
      )
    }

    const employee = await db.employee.findFirst({
      where: {
        fullName,
        accessCode,
        active: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { message: 'الاسم أو الكود غير صحيح', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      data: {
        id: employee.id,
        fullName: employee.fullName,
        role: employee.role,
      },
      success: true,
    })
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تسجيل الدخول', success: false },
      { status: 500 }
    )
  }
}
