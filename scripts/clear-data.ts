import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function clearAllData() {
  console.log('\U0001f5d1\ufe0f  جاري تفريغ البيانات التجريبية...');
  console.log('');

  // Count before
  const beforeOrders = await db.order.count();
  const beforeShipments = await db.shipment.count();
  const beforeExpenses = await db.expense.count();
  const beforeClients = await db.client.count();
  const beforeInvoices = await db.invoice.count();
  const beforeVehicles = await db.vehicle.count();
  const beforeEmployees = await db.employee.count();

  console.log(`قبل التفريغ:`);
  console.log(`  - الطلبيات: ${beforeOrders}`);
  console.log(`  - الشحنات: ${beforeShipments}`);
  console.log(`  - المصاريف: ${beforeExpenses}`);
  console.log(`  - الزبائن: ${beforeClients}`);
  console.log(`  - الفواتير: ${beforeInvoices}`);
  console.log(`  - المركبات: ${beforeVehicles} (سيبقى كما هو)`);
  console.log(`  - الموظفين: ${beforeEmployees}`);
  console.log('');

  // Delete in correct order (respect foreign keys)
  const deletedOrders = await db.order.deleteMany({});
  console.log(`\u2705 تم حذف ${deletedOrders.count} طلبية`);

  const deletedExpenses = await db.expense.deleteMany({});
  console.log(`\u2705 تم حذف ${deletedExpenses.count} مصروف`);

  const deletedShipments = await db.shipment.deleteMany({});
  console.log(`\u2705 تم حذف ${deletedShipments.count} شحنة`);

  const deletedInvoices = await db.invoice.deleteMany({});
  console.log(`\u2705 تم حذف ${deletedInvoices.count} فاتورة`);

  const deletedClients = await db.client.deleteMany({});
  console.log(`\u2705 تم حذف ${deletedClients.count} زبون`);

  // Keep vehicles (partners) and employees (admin)
  const afterVehicles = await db.vehicle.count();
  const afterEmployees = await db.employee.count();

  console.log('');
  console.log(`بعد التفريغ:`);
  console.log(`  - المركبات (الشركاء): ${afterVehicles} \u2705 محفوظة`);
  console.log(`  - الموظفين: ${afterEmployees} \u2705 محفوظة`);
  console.log('');
  console.log('\U0001f389 تم تفريغ جميع البيانات التجريبية بنجاح!');

  // Show remaining vehicles
  const vehicles = await db.vehicle.findMany({
    orderBy: { ownerName: 'asc' },
  });
  console.log('');
  console.log('المركبات المحفوظة:');
  vehicles.forEach((v) => {
    console.log(`  \U0001f69b ${v.registration} - ${v.driverName} (${v.ownerName})`);
  });

  // Show remaining employees
  const employees = await db.employee.findMany();
  console.log('');
  console.log('الحسابات المحفوظة:');
  employees.forEach((e) => {
    console.log(`  \U0001f464 ${e.fullName} - كود: ${e.accessCode} (${e.role})`);
  });
}

clearAllData()
  .catch(console.error)
  .finally(() => db.$disconnect());
