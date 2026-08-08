import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const clientId = searchParams.get('clientId')

    if (!date || !clientId) {
      return NextResponse.json(
        {
          message: 'التاريخ ومعرف العميل مطلوبان لإنشاء وصل التسليم',
          success: false,
        },
        { status: 400 }
      )
    }

    // Get client info
    const client = await db.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { message: 'العميل غير موجود', success: false },
        { status: 404 }
      )
    }

    // Get all shipments for this client on this date
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    const shipments = await db.shipment.findMany({
      where: {
        clientId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        vehicle: true,
      },
      orderBy: { number: 'asc' },
    })

    // Group shipments by vehicle
    const groupedByVehicle: Record<
      string,
      {
        vehicle: typeof shipments[0]['vehicle']
        shipments: (typeof shipments)[0][]
        totalPackages: number
        totalAmount: number
      }
    > = {}

    let totalPackages = 0
    let totalAmount = 0

    for (const shipment of shipments) {
      const vid = shipment.vehicleId

      if (!groupedByVehicle[vid]) {
        groupedByVehicle[vid] = {
          vehicle: shipment.vehicle,
          shipments: [],
          totalPackages: 0,
          totalAmount: 0,
        }
      }

      groupedByVehicle[vid].shipments.push(shipment)
      groupedByVehicle[vid].totalPackages += shipment.packageCount
      groupedByVehicle[vid].totalAmount += shipment.totalAmount

      totalPackages += shipment.packageCount
      totalAmount += shipment.totalAmount
    }

    const vehicleGroups = Object.values(groupedByVehicle)

    return NextResponse.json({
      data: {
        date,
        client: {
          id: client.id,
          name: client.name,
          phone: client.phone,
          address: client.address,
          ifu: client.ifu,
          ice: client.ice,
          rc: client.rc,
        },
        vehicleGroups,
        totalPackages,
        totalAmount,
        shipmentCount: shipments.length,
      },
      success: true,
    })
  } catch (error) {
    console.error('خطأ في إنشاء وصل التسليم:', error)
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إنشاء وصل التسليم', success: false },
      { status: 500 }
    )
  }
}
