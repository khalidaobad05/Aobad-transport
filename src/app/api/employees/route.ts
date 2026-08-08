import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const employees = await db.employee.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: employees, success: true })
  } catch (error) {
    console.error('خطأ في جلب الموظفين:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب الموظفين', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, accessCode, role } = body

    if (!fullName?.trim() || !accessCode?.trim()) {
      return NextResponse.json(
        { message: 'الاسم والكود مطلوبان', success: false },
        { status: 400 }
      )
    }

    const existing = await db.employee.findFirst({
      where: { accessCode: accessCode.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { message: 'هذا الكود مستخدم بالفعل', success: false },
        { status: 400 }
      )
    }

    const employee = await db.employee.create({
      data: {
        fullName: fullName.trim(),
        accessCode: accessCode.trim(),
        role: role || 'موظف',
      },
    })

    return NextResponse.json({ data: employee, success: true }, { status: 201 })
  } catch (error) {
    console.error('خطأ في إنشاء موظف:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء الموظف', success: false },
      { status: 500 }
    )
  }
}
