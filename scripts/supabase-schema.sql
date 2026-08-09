-- Tables for شركة عباد للنقل

CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "ifu" TEXT,
    "ice" TEXT,
    "rc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registration" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'قيد التوصيل',
    "description" TEXT,
    "generator" TEXT,
    "totalExpected" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" TEXT NOT NULL,
    CONSTRAINT "Shipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageCount" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shipmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Order_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shipmentId" TEXT,
    "vehicleId" TEXT NOT NULL,
    CONSTRAINT "Expense_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'نقدي',
    "htAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvaRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "tvaAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxeProfRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxeProfAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ttcAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timbreFiscal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'غير مدفوعة',
    "notes" TEXT,
    "companyInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'موظف',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Client_code_key" ON "Client"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_registration_key" ON "Vehicle"("registration");
CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_number_key" ON "Shipment"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "Expense_number_key" ON "Expense"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_accessCode_key" ON "Employee"("accessCode");

-- Default employee (المسير)
INSERT INTO "Employee" ("id", "fullName", "accessCode", "role", "active")
SELECT 'default-admin', 'المسير', '1234', 'مسير', true
WHERE NOT EXISTS (SELECT 1 FROM "Employee" WHERE "accessCode" = '1234');

-- Enable updated_at trigger
CREATE OR REPLACE FUNCTION "public"."update_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Client_updated_at" BEFORE UPDATE ON "Client" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
CREATE TRIGGER "Vehicle_updated_at" BEFORE UPDATE ON "Vehicle" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
CREATE TRIGGER "Shipment_updated_at" BEFORE UPDATE ON "Shipment" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
CREATE TRIGGER "Order_updated_at" BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
CREATE TRIGGER "Expense_updated_at" BEFORE UPDATE ON "Expense" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
CREATE TRIGGER "Invoice_updated_at" BEFORE UPDATE ON "Invoice" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
CREATE TRIGGER "Employee_updated_at" BEFORE UPDATE ON "Employee" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
