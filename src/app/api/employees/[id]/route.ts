import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { fullName, accessCode, role, active } = body

    // Check if code is taken by another employee
    if (accessCode) {
      const existing = await db.employee.findFirst({
        where: { accessCode, id: { not: id } },
      })
      if (existing) {
        return NextResponse.json(
          { message: 'هذا الكود مستخدم بالفعل', success: false },
          { status: 400 }
        )
      }
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        accessCode: accessCode ? accessCode.trim() : undefined,
        role,
        active,
      },
    })

    return NextResponse.json({ data: employee, success: true })
  } catch (error) {
    console.error('خطأ في تحديث الموظف:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء تحديث الموظف', success: false },
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
    await db.employee.delete({ where: { id } })
    return NextResponse.json(
      { message: 'تم حذف الموظف بنجاح', success: true }
    )
  } catch (error) {
    console.error('خطأ في حذف الموظف:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء حذف الموظف', success: false },
      { status: 500 }
    )
  }
}
