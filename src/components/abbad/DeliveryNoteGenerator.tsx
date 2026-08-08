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

interface Client {
  id: string;
  name: string;
}

interface ShipmentInfo {
  number: number;
  packageCount: number;
  vehicle: { registration: string; driverName: string; ownerName: string };
}

interface VehicleGroup {
  vehicle: { registration: string; driverName: string; ownerName: string };
  shipments: ShipmentInfo[];
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
              <Label>اسم الزبون <span className="text-red-500">*</span></Label>
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

      {/* Delivery Note Print View - SIMPLIFIED */}
      {noteData && (
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Printer className="size-4 ml-2" />
              طباعة
            </Button>
          </div>

          <div
            id="delivery-note-print"
            className="border-2 border-gray-400 p-10 bg-white"
            style={{ maxWidth: '700px', margin: '0 auto' }}
          >
            {/* Company Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: '2px' }}>
                شركة عباد للنقل
              </h1>
              <div className="w-32 h-0.5 bg-gray-400 mx-auto mt-3" />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 underline underline-offset-4">
                وصل تسليم
              </h2>
            </div>

            {/* Client & Date Info - Simple */}
            <div className="mb-8 space-y-3 text-base">
              <div className="flex gap-4">
                <span className="font-bold text-gray-700 min-w-[100px]">التاريخ:</span>
                <span className="text-gray-900">{formatDate(noteData.date)}</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-gray-700 min-w-[100px]">اسم الزبون:</span>
                <span className="text-gray-900 font-semibold">{noteData.client.name}</span>
              </div>
            </div>

            {/* Shipments detail per vehicle */}
            <div className="mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-3 py-2 font-bold text-gray-700">م</th>
                    <th className="border border-gray-400 px-3 py-2 font-bold text-gray-700">المركبة</th>
                    <th className="border border-gray-400 px-3 py-2 font-bold text-gray-700">السائق</th>
                    <th className="border border-gray-400 px-3 py-2 font-bold text-gray-700 text-center">عدد الطلبيات</th>
                  </tr>
                </thead>
                <tbody>
                  {noteData.vehicleGroups.map((group, gi) => (
                    <tr key={gi}>
                      <td className="border border-gray-400 px-3 py-2 text-center">{gi + 1}</td>
                      <td className="border border-gray-400 px-3 py-2">{group.vehicle.registration}</td>
                      <td className="border border-gray-400 px-3 py-2">{group.vehicle.driverName}</td>
                      <td className="border border-gray-400 px-3 py-2 text-center font-bold text-lg">
                        {group.totalPackages}
                      </td>
                    </tr>
                  ))}
                  {noteData.vehicleGroups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="border border-gray-400 px-3 py-6 text-center text-gray-500">
                        لا توجد شحنات في هذا اليوم
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3} className="border border-gray-400 px-3 py-2 text-left">
                      المجموع الكلي للطلبيات:
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-center text-xl">
                      {noteData.totalPackages}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Empty amount field for manual filling */}
            <div className="mb-10 flex items-center gap-4 text-base">
              <span className="font-bold text-gray-700 min-w-[180px]">المبلغ الواجب أدائه:</span>
              <div className="border-b-2 border-dotted border-gray-400 flex-1 pb-1" style={{ minHeight: '30px' }}>
                {/* فارغ - يملأ يدوياً */}
              </div>
              <span className="text-gray-500 text-sm">د.م.</span>
            </div>

            {/* Signature Lines */}
            <div className="grid grid-cols-2 gap-12 mt-16">
              <div className="text-center">
                <p className="font-bold text-gray-700 mb-3">توقيع الزبون</p>
                <div className="border-b-2 border-gray-400 pb-1">&nbsp;</div>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700 mb-3">توقيع الناقل</p>
                <div className="border-b-2 border-gray-400 pb-1">&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
