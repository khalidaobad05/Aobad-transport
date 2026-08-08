'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Client {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  ifu: string | null;
  ice: string | null;
  rc: string | null;
}

interface VehicleInfo {
  id: string;
  registration: string;
  driverName: string;
}

interface ShipmentRow {
  number: number;
  description: string | null;
  packageCount: number;
  unitPrice: number;
  totalAmount: number;
  vehicle: VehicleInfo;
}

interface VehicleGroup {
  vehicle: VehicleInfo;
  shipments: ShipmentRow[];
  totalPackages: number;
  totalAmount: number;
}

interface DeliveryNoteData {
  date: string;
  client: Client;
  vehicleGroups: VehicleGroup[];
  totalPackages: number;
  totalAmount: number;
  shipmentCount: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-MA') + ' د.م.';
}

function generateNoteNumber(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `BL-${y}${m}${day}`;
}

export default function DeliveryNoteGenerator() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [noteData, setNoteData] = useState<DeliveryNoteData | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) return;
      const json = await res.json();
      setClients(Array.isArray(json) ? json : json.data ?? []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function handleGenerate() {
    if (!selectedDate) {
      toast.error('التاريخ مطلوب');
      return;
    }
    if (!selectedClientId) {
      toast.error('اسم الزبون مطلوب');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        date: selectedDate,
        clientId: selectedClientId,
      });
      const res = await fetch(`/api/delivery-note?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'فشل في توليد وصل التسليم' }));
        throw new Error(err.message || 'فشل في توليد وصل التسليم');
      }
      const json = await res.json();
      setNoteData(json.data);
      toast.success('تم توليد وصل التسليم بنجاح');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  // Flatten all shipments from all vehicle groups into a single list
  function getFlatShipments(): (ShipmentRow & { rowIndex: number })[] {
    if (!noteData) return [];
    const flat: (ShipmentRow & { rowIndex: number })[] = [];
    noteData.vehicleGroups.forEach((group) => {
      group.shipments.forEach((shipment) => {
        flat.push({ ...shipment, vehicle: group.vehicle, rowIndex: flat.length + 1 });
      });
    });
    return flat;
  }

  const flatShipments = getFlatShipments();

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm no-print">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg">توليد وصل التسليم</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dn-date">
                التاريخ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dn-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                اسم الزبون <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الزبون" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading && <Loader2 className="size-4 animate-spin ml-2" />}
              <FileText className="size-4 ml-2" />
              توليد وصل التسليم
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Note Print View */}
      {noteData && (
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Printer className="size-4 ml-2" />
              طباعة
            </Button>
          </div>

          <div
            id="delivery-note-print"
            className="border-2 border-gray-300 p-8 bg-white dark:bg-gray-900"
          >
            {/* Company Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                شركة عباد للنقل
              </h1>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                وصل تسليم شحنة (Bon de Livraison)
              </p>
            </div>

            {/* Info Rows */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6 border-b border-gray-300 pb-4">
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الوصل:</span>
                <span className="text-gray-900 dark:text-gray-100">{generateNoteNumber(noteData.date)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">التاريخ:</span>
                <span className="text-gray-900 dark:text-gray-100">{formatDate(noteData.date)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">اسم الزبون:</span>
                <span className="text-gray-900 dark:text-gray-100">{noteData.client.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">الهاتف:</span>
                <span className="text-gray-900 dark:text-gray-100">{noteData.client.phone || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">العنوان:</span>
                <span className="text-gray-900 dark:text-gray-100">{noteData.client.address || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">IFU:</span>
                <span className="text-gray-900 dark:text-gray-100">{noteData.client.ifu || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">ICE:</span>
                <span className="text-gray-900 dark:text-gray-100">{noteData.client.ice || '—'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">RC:</span>
                <span className="text-gray-900 dark:text-gray-100">{noteData.client.rc || '—'}</span>
              </div>
            </div>

            {/* Shipments Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-amber-50 dark:bg-amber-900/20">
                    <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">م</th>
                    <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">وصف الشحنة</th>
                    <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">المركبة</th>
                    <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">السائق</th>
                    <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 text-center">عدد الطرود</th>
                    <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 text-center">سعر الطرد</th>
                    <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 text-center">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {flatShipments.map((shipment) => (
                    <tr key={shipment.number} className="even:bg-gray-50 dark:even:bg-gray-800/50">
                      <td className="border border-gray-300 px-3 py-2 text-center">{shipment.rowIndex}</td>
                      <td className="border border-gray-300 px-3 py-2">{shipment.description || 'شحنة بضائع'}</td>
                      <td className="border border-gray-300 px-3 py-2">{shipment.vehicle.registration}</td>
                      <td className="border border-gray-300 px-3 py-2">{shipment.vehicle.driverName}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{shipment.packageCount}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{formatCurrency(shipment.unitPrice)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{formatCurrency(shipment.totalAmount)}</td>
                    </tr>
                  ))}
                  {flatShipments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                        لا توجد شحنات
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50 dark:bg-amber-900/20 font-bold">
                    <td colSpan={4} className="border border-gray-300 px-3 py-2 text-left">
                      المجموع الصافي الإجمالي:
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {noteData.totalPackages}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">—</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-lg">
                      {formatCurrency(noteData.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-4">
              <div className="text-center">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">توقيع واستلام الزبون</p>
                <div className="border-b border-gray-400 dark:border-gray-600 pb-1">&nbsp;</div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">توقيع الناقل</p>
                <div className="border-b border-gray-400 dark:border-gray-600 pb-1">&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
