import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 جاري بيانات تجريبية...')

  // Clear existing data
  await prisma.expense.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.client.deleteMany()

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

  // ========== Vehicles ==========
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registration: '12345-أ-6',
        driverName: 'أحمد العلمي',
        phone: '0661111111',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration: '67890-ب-12',
        driverName: 'ياسين بنجلون',
        phone: '0662222222',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration: '13579-ج-8',
        driverName: 'محمد الفاسي',
        phone: '0663333333',
      },
    }),
    prisma.vehicle.create({
      data: {
        registration: '24680-د-15',
        driverName: 'كريم الحسني',
        phone: '0664444444',
      },
    }),
  ])

  console.log(`✅ تم إنشاء ${vehicles.length} مركبات`)

  // ========== Shipments ==========
  const shipmentsData = [
    {
      number: 1001,
      date: new Date('2026-08-01'),
      status: 'تم التسليم',
      packageCount: 5,
      unitPrice: 240,
      totalAmount: 1200,
      description: 'بضائع تجارية',
      clientId: clients[0].id,
      vehicleId: vehicles[0].id,
    },
    {
      number: 1002,
      date: new Date('2026-08-01'),
      status: 'تم التسليم',
      packageCount: 12,
      unitPrice: 233.33,
      totalAmount: 2800,
      description: 'مواد توزيع',
      clientId: clients[1].id,
      vehicleId: vehicles[1].id,
    },
    {
      number: 1003,
      date: new Date('2026-08-02'),
      status: 'قيد التوصيل',
      packageCount: 3,
      unitPrice: 250,
      totalAmount: 750,
      description: 'أقمشة ومستلزمات خياطة',
      clientId: clients[2].id,
      vehicleId: vehicles[0].id,
    },
    {
      number: 1004,
      date: new Date('2026-08-03'),
      status: 'تم التسليم',
      packageCount: 8,
      unitPrice: 200,
      totalAmount: 1600,
      description: 'مواد غذائية معلبة',
      clientId: clients[3].id,
      vehicleId: vehicles[2].id,
    },
    {
      number: 1005,
      date: new Date('2026-08-04'),
      status: 'ملغاة',
      packageCount: 2,
      unitPrice: 300,
      totalAmount: 600,
      description: 'أجهزة إلكترونية',
      clientId: clients[4].id,
      vehicleId: vehicles[1].id,
    },
    {
      number: 1006,
      date: new Date('2026-08-05'),
      status: 'تم التسليم',
      packageCount: 10,
      unitPrice: 180,
      totalAmount: 1800,
      description: 'قطع أثاث',
      clientId: clients[5].id,
      vehicleId: vehicles[3].id,
    },
    {
      number: 1007,
      date: new Date('2026-08-06'),
      status: 'قيد التوصيل',
      packageCount: 6,
      unitPrice: 220,
      totalAmount: 1320,
      description: 'بضائع متنوعة',
      clientId: clients[0].id,
      vehicleId: vehicles[2].id,
    },
    {
      number: 1008,
      date: new Date('2026-08-07'),
      status: 'تم التسليم',
      packageCount: 15,
      unitPrice: 150,
      totalAmount: 2250,
      description: 'مواد تنظيف',
      clientId: clients[1].id,
      vehicleId: vehicles[0].id,
    },
    {
      number: 1009,
      date: new Date('2026-08-08'),
      status: 'تم التسليم',
      packageCount: 4,
      unitPrice: 350,
      totalAmount: 1400,
      description: 'ملابس جاهزة',
      clientId: clients[2].id,
      vehicleId: vehicles[3].id,
    },
    {
      number: 1010,
      date: new Date('2026-08-10'),
      status: 'قيد التوصيل',
      packageCount: 7,
      unitPrice: 260,
      totalAmount: 1820,
      description: 'مواد بناء خفيفة',
      clientId: clients[3].id,
      vehicleId: vehicles[1].id,
    },
    {
      number: 1011,
      date: new Date('2026-08-12'),
      status: 'تم التسليم',
      packageCount: 9,
      unitPrice: 210,
      totalAmount: 1890,
      description: 'إلكترونيات منزلية',
      clientId: clients[4].id,
      vehicleId: vehicles[2].id,
    },
    {
      number: 1012,
      date: new Date('2026-08-14'),
      status: 'تم التسليم',
      packageCount: 20,
      unitPrice: 125,
      totalAmount: 2500,
      description: 'مواد غذائية طازجة',
      clientId: clients[5].id,
      vehicleId: vehicles[0].id,
    },
  ]

  const shipments = await Promise.all(
    shipmentsData.map((s) => prisma.shipment.create({ data: s }))
  )

  console.log(`✅ تم إنشاء ${shipments.length} شحنات`)

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
