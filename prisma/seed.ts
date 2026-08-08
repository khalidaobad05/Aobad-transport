import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 جاري إدخال بيانات تجريبية...')

  // Clear existing data
  await prisma.expense.deleteMany()
  await prisma.order.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.client.deleteMany()
  await prisma.employee.deleteMany()

  // ========== Employees ==========
  await prisma.employee.create({
    data: {
      fullName: 'المسير',
      accessCode: 'ADMIN',
      role: 'مسير',
      active: true,
    },
  })

  await prisma.employee.create({
    data: {
      fullName: 'موظف تجريبي',
      accessCode: '1234',
      role: 'موظف',
      active: true,
    },
  })

  console.log('✅ تم إنشاء 2 موظفين')

  // ========== Clients ==========
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        code: 1001,
        name: 'شركة الأمل للتجارة',
        phone: '0661234567',
        address: 'الدار البيضاء',
        ifu: '123456789',
        ice: '001234567000012',
        rc: 'RC-12345',
      },
    }),
    prisma.client.create({
      data: {
        code: 1002,
        name: 'مؤسسة النور للتوزيع',
        phone: '0662345678',
        address: 'الرباط',
        ifu: '234567890',
        ice: '002345678000023',
        rc: 'RC-23456',
      },
    }),
    prisma.client.create({
      data: {
        code: 1003,
        name: 'متجر الأناقة الحديثة',
        phone: '0663456789',
        address: 'طنجة',
        ifu: '345678901',
        ice: '003456789000034',
        rc: 'RC-34567',
      },
    }),
    prisma.client.create({
      data: {
        code: 1004,
        name: 'شركة البركة للمواد الغذائية',
        phone: '0664567890',
        address: 'فاس',
        ifu: '456789012',
        ice: '004567890000045',
        rc: 'RC-45678',
      },
    }),
    prisma.client.create({
      data: {
        code: 1005,
        name: 'مؤسسة السعادة للإلكترونيات',
        phone: '0665678901',
        address: 'مراكش',
        ifu: '567890123',
        ice: '005678901000056',
        rc: 'RC-56789',
      },
    }),
    prisma.client.create({
      data: {
        code: 1006,
        name: 'شركة النجاح للأثاث',
        phone: '0666789012',
        address: 'أكادير',
        ifu: '678901234',
        ice: '006789012000067',
        rc: 'RC-67890',
      },
    }),
  ])

  console.log(`✅ تم إنشاء ${clients.length} عملاء`)

  // ========== Vehicles (4 partners + drivers) ==========
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registration: '12345-أ-6',
        driverName: 'أحمد العلمي',
        ownerName: 'أحمد عباد',
        phone: '0661111111',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration: '67890-ب-12',
        driverName: 'ياسين بنجلون',
        ownerName: 'رشيد عباد',
        phone: '0662222222',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration: '13579-ج-8',
        driverName: 'محمد الفاسي',
        ownerName: 'عبد اللطيف عباد',
        phone: '0663333333',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration: '24680-د-15',
        driverName: 'كريم الحسني',
        ownerName: 'عبد المجيد عباد',
        phone: '0664444444',
      },
    }),
  ])

  console.log(`✅ تم إنشاء ${vehicles.length} مركبات`)

  // ========== Shipments with multiple orders each ==========
  // Shipment = trip (vehicle + date), each contains multiple orders for different customers

  const shipmentsData = [
    {
      number: 1001,
      date: new Date('2026-08-01'),
      status: 'تم التسليم',
      description: 'رحلة الدار البيضاء - الرباط',
      vehicleId: vehicles[0].id,
      orders: [
        { clientId: clients[0].id, packageCount: 5, description: 'بضائع تجارية' },
        { clientId: clients[1].id, packageCount: 8, description: 'مواد توزيع' },
        { clientId: clients[3].id, packageCount: 3, description: 'مواد غذائية' },
      ],
    },
    {
      number: 1002,
      date: new Date('2026-08-01'),
      status: 'تم التسليم',
      description: 'رحلة فاس - طنجة',
      vehicleId: vehicles[1].id,
      orders: [
        { clientId: clients[2].id, packageCount: 4, description: 'أقمشة' },
        { clientId: clients[4].id, packageCount: 7, description: 'إلكترونيات' },
      ],
    },
    {
      number: 1003,
      date: new Date('2026-08-02'),
      status: 'تم التسليم',
      description: 'رحلة مراكش',
      vehicleId: vehicles[0].id,
      orders: [
        { clientId: clients[2].id, packageCount: 3, description: 'أقمشة ومستلزمات خياطة' },
        { clientId: clients[5].id, packageCount: 6, description: 'أثاث' },
      ],
    },
    {
      number: 1004,
      date: new Date('2026-08-03'),
      status: 'تم التسليم',
      description: 'رحلة فاس - الدار البيضاء',
      vehicleId: vehicles[2].id,
      orders: [
        { clientId: clients[3].id, packageCount: 8, description: 'مواد غذائية معلبة' },
        { clientId: clients[0].id, packageCount: 4, description: 'بضائع متنوعة' },
        { clientId: clients[1].id, packageCount: 6, description: 'مواد تنظيف' },
      ],
    },
    {
      number: 1005,
      date: new Date('2026-08-04'),
      status: 'ملغاة',
      description: 'رحلة مراكش (ملغاة)',
      vehicleId: vehicles[1].id,
      orders: [
        { clientId: clients[4].id, packageCount: 2, description: 'أجهزة إلكترونية' },
      ],
    },
    {
      number: 1006,
      date: new Date('2026-08-05'),
      status: 'تم التسليم',
      description: 'رحلة أكادير',
      vehicleId: vehicles[3].id,
      orders: [
        { clientId: clients[5].id, packageCount: 10, description: 'قطع أثاث' },
        { clientId: clients[3].id, packageCount: 5, description: 'مواد غذائية طازجة' },
      ],
    },
    {
      number: 1007,
      date: new Date('2026-08-06'),
      status: 'قيد التوصيل',
      description: 'رحلة الدار البيضاء - فاس',
      vehicleId: vehicles[2].id,
      orders: [
        { clientId: clients[0].id, packageCount: 6, description: 'بضائع متنوعة' },
        { clientId: clients[4].id, packageCount: 3, description: 'إلكترونيات منزلية' },
      ],
    },
    {
      number: 1008,
      date: new Date('2026-08-07'),
      status: 'تم التسليم',
      description: 'رحلة الرباط - طنجة',
      vehicleId: vehicles[0].id,
      orders: [
        { clientId: clients[1].id, packageCount: 15, description: 'مواد تنظيف' },
        { clientId: clients[2].id, packageCount: 7, description: 'ملابس جاهزة' },
        { clientId: clients[5].id, packageCount: 4, description: 'قطع أثاث صغيرة' },
      ],
    },
    {
      number: 1009,
      date: new Date('2026-08-08'),
      status: 'تم التسليم',
      description: 'رحلة أكادير - مراكش',
      vehicleId: vehicles[3].id,
      orders: [
        { clientId: clients[2].id, packageCount: 4, description: 'ملابس جاهزة' },
        { clientId: clients[4].id, packageCount: 9, description: 'إلكترونيات' },
        { clientId: clients[3].id, packageCount: 6, description: 'مواد غذائية' },
      ],
    },
    {
      number: 1010,
      date: new Date('2026-08-10'),
      status: 'قيد التوصيل',
      description: 'رحلة فاس - الدار البيضاء',
      vehicleId: vehicles[1].id,
      orders: [
        { clientId: clients[3].id, packageCount: 7, description: 'مواد بناء خفيفة' },
        { clientId: clients[0].id, packageCount: 5, description: 'بضائع تجارية' },
      ],
    },
    {
      number: 1011,
      date: new Date('2026-08-12'),
      status: 'تم التسليم',
      description: 'رحلة مراكش - الرباط',
      vehicleId: vehicles[2].id,
      orders: [
        { clientId: clients[4].id, packageCount: 9, description: 'إلكترونيات منزلية' },
        { clientId: clients[1].id, packageCount: 11, description: 'مواد توزيع متنوعة' },
      ],
    },
    {
      number: 1012,
      date: new Date('2026-08-14'),
      status: 'تم التسليم',
      description: 'رحلة طنجة - الدار البيضاء',
      vehicleId: vehicles[0].id,
      orders: [
        { clientId: clients[5].id, packageCount: 20, description: 'مواد غذائية طازجة' },
        { clientId: clients[3].id, packageCount: 8, description: 'مواد غذائية معلبة' },
        { clientId: clients[0].id, packageCount: 6, description: 'بضائع تجارية' },
      ],
    },
  ]

  const shipments = await Promise.all(
    shipmentsData.map((s) =>
      prisma.shipment.create({
        data: {
          number: s.number,
          date: s.date,
          status: s.status,
          description: s.description,
          vehicleId: s.vehicleId,
          orders: {
            create: s.orders,
          },
        },
        include: { orders: true },
      })
    )
  )

  const totalOrders = shipments.reduce((sum, s) => sum + s.orders.length, 0)
  console.log(`✅ تم إنشاء ${shipments.length} شحنات تحتوي على ${totalOrders} طلبية`)

  // ========== Expenses ==========
  const expensesData = [
    {
      number: 'EXP-001',
      date: new Date('2026-08-01'),
      type: 'وقود',
      amount: 250,
      notes: 'تعبئة بنزين',
      vehicleId: vehicles[0].id,
      shipmentId: shipments[0].id,
    },
    {
      number: 'EXP-002',
      date: new Date('2026-08-01'),
      type: 'رسوم الطريق',
      amount: 80,
      notes: 'رسوم الطريق السيار',
      vehicleId: vehicles[1].id,
      shipmentId: shipments[1].id,
    },
    {
      number: 'EXP-003',
      date: new Date('2026-08-02'),
      type: 'صيانة خفيفة',
      amount: 150,
      notes: 'تغيير زيت المحرك',
      vehicleId: vehicles[0].id,
      shipmentId: shipments[2].id,
    },
    {
      number: 'EXP-004',
      date: new Date('2026-08-03'),
      type: 'وقود',
      amount: 300,
      notes: 'تعبئة غازوال',
      vehicleId: vehicles[2].id,
      shipmentId: shipments[3].id,
    },
    {
      number: 'EXP-005',
      date: new Date('2026-08-05'),
      type: 'رسوم الطريق',
      amount: 120,
      notes: 'رسوم الطريق الوطني',
      vehicleId: vehicles[3].id,
      shipmentId: shipments[5].id,
    },
    {
      number: 'EXP-006',
      date: new Date('2026-08-06'),
      type: 'وقود',
      amount: 200,
      notes: 'تعبئة بنزين',
      vehicleId: vehicles[2].id,
      shipmentId: shipments[6].id,
    },
    {
      number: 'EXP-007',
      date: new Date('2026-08-07'),
      type: 'صيانة ثقيلة',
      amount: 450,
      notes: 'تغيير إطارات',
      vehicleId: vehicles[0].id,
      shipmentId: shipments[7].id,
    },
    {
      number: 'EXP-008',
      date: new Date('2026-08-08'),
      type: 'وقود',
      amount: 280,
      notes: 'تعبئة غازوال',
      vehicleId: vehicles[3].id,
      shipmentId: shipments[8].id,
    },
    {
      number: 'EXP-009',
      date: new Date('2026-08-10'),
      type: 'رسوم الطريق',
      amount: 90,
      notes: 'رسوم الطريق السيار',
      vehicleId: vehicles[1].id,
      shipmentId: shipments[9].id,
    },
  ]

  const expenses = await Promise.all(
    expensesData.map((e) => prisma.expense.create({ data: e }))
  )

  console.log(`✅ تم إنشاء ${expenses.length} مصروفات`)
  console.log('\n🎉 تم إدخال جميع البيانات التجريبية بنجاح!')
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إدخال البيانات:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
