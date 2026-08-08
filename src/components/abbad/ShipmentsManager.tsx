'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Client {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  registration: string;
  driverName: string;
}

interface Shipment {
  id: string;
  number: number;
  date: string;
  status: string;
  packageCount: number;
  unitPrice: number;
  totalAmount: number;
  description: string | null;
  client: Client;
  vehicle: Vehicle;
}

interface ShipmentFormData {
  date: string;
  clientId: string;
  vehicleId: string;
  packageCount: number;
  unitPrice: number;
  totalAmount: number;
  description: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: 'الكل', label: 'الكل' },
  { value: 'تم التسليم', label: 'تم التسليم' },
  { value: 'قيد التوصيل', label: 'قيد التوصيل' },
  { value: 'ملغاة', label: 'ملغاة' },
];

const STATUS_FORM_OPTIONS = [
  { value: 'قيد التوصيل', label: 'قيد التوصيل' },
  { value: 'تم التسليم', label: 'تم التسليم' },
  { value: 'ملغاة', label: 'ملغاة' },
];

const emptyForm: ShipmentFormData = {
  date: '',
  clientId: '',
  vehicleId: '',
  packageCount: 0,
  unitPrice: 0,
  totalAmount: 0,
  description: '',
  status: 'قيد التوصيل',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function formatDateInput(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-MA') + ' د.م.';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'تم التسليم':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
          تم التسليم
        </Badge>
      );
    case 'قيد التوصيل':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
          قيد التوصيل
        </Badge>
      );
    case 'ملغاة':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
          ملغاة
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function ShipmentsManager() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [form, setForm] = useState<ShipmentFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [filterVehicleId, setFilterVehicleId] = useState('');

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterStatus && filterStatus !== 'الكل') params.set('status', filterStatus);
      if (filterVehicleId) params.set('vehicleId', filterVehicleId);

      const res = await fetch(`/api/shipments?${params.toString()}`);
      if (!res.ok) throw new Error('فشل في تحميل الشحنات');
      const json = await res.json();
      setShipments(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الشحنات'
      );
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, filterVehicleId]);

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

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (!res.ok) return;
      const json = await res.json();
      setVehicles(Array.isArray(json) ? json : json.data ?? []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    fetchClients();
    fetchVehicles();
  }, [fetchClients, fetchVehicles]);

  function openCreateDialog() {
    setEditingShipment(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(shipment: Shipment) {
    setEditingShipment(shipment);
    setForm({
      date: formatDateInput(shipment.date),
      clientId: shipment.client.id,
      vehicleId: shipment.vehicle.id,
      packageCount: shipment.packageCount,
      unitPrice: shipment.unitPrice,
      totalAmount: shipment.totalAmount,
      description: shipment.description ?? '',
      status: shipment.status,
    });
    setDialogOpen(true);
  }

  function handlePackageCountChange(value: string) {
    const count = parseInt(value) || 0;
    const newTotal = count * form.unitPrice;
    setForm({ ...form, packageCount: count, totalAmount: newTotal });
  }

  function handleUnitPriceChange(value: string) {
    const price = parseFloat(value) || 0;
    const newTotal = form.packageCount * price;
    setForm({ ...form, unitPrice: price, totalAmount: newTotal });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) {
      toast.error('التاريخ مطلوب');
      return;
    }
    if (!form.clientId) {
      toast.error('الزبون مطلوب');
      return;
    }
    if (!form.vehicleId) {
      toast.error('المركبة/السائق مطلوب');
      return;
    }
    if (form.packageCount <= 0) {
      toast.error('عدد الطرود مطلوب');
      return;
    }
    if (form.unitPrice <= 0) {
      toast.error('سعر الطرد مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      const body = {
        date: form.date,
        clientId: form.clientId,
        vehicleId: form.vehicleId,
        packageCount: form.packageCount,
        unitPrice: form.unitPrice,
        totalAmount: form.totalAmount,
        description: form.description.trim() || undefined,
        status: form.status,
      };

      if (editingShipment) {
        const res = await fetch(`/api/shipments/${editingShipment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في تحديث الشحنة');
        toast.success('تم تحديث الشحنة بنجاح');
      } else {
        const res = await fetch('/api/shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في إضافة الشحنة');
        toast.success('تم إضافة الشحنة بنجاح');
      }

      setDialogOpen(false);
      fetchShipments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف الشحنة');
      toast.success('تم حذف الشحنة بنجاح');
      fetchShipments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  }

  function handleClearFilters() {
    setFilterDate('');
    setFilterStatus('الكل');
    setFilterVehicleId('');
  }

  function handleSearch() {
    fetchShipments();
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-date" className="text-sm">
                التاريخ
              </Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">المركبة/السائق</Label>
              <Select
                value={filterVehicleId}
                onValueChange={setFilterVehicleId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} - {v.driverName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleSearch}
                className="bg-amber-500 hover:bg-amber-600 text-white flex-1"
              >
                <Search className="size-4" />
                بحث
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1"
              >
                <X className="size-4" />
                مسح
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <Button
          onClick={openCreateDialog}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="size-4" />
          إضافة شحنة
        </Button>
      </div>

      {/* Shipments Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg">الشحنات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : shipments.length > 0 ? (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشحنة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الزبون</TableHead>
                    <TableHead>السائق</TableHead>
                    <TableHead>عدد الطرود</TableHead>
                    <TableHead>سعر الطرد</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.number}
                      </TableCell>
                      <TableCell>{formatDate(shipment.date)}</TableCell>
                      <TableCell>{shipment.client.name}</TableCell>
                      <TableCell>{shipment.vehicle.driverName}</TableCell>
                      <TableCell>{shipment.packageCount}</TableCell>
                      <TableCell>{formatCurrency(shipment.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(shipment.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(shipment)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(shipment.id)}
                            disabled={deletingId === shipment.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            {deletingId === shipment.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-base">لا توجد شحنات</p>
              <p className="text-sm mt-1">
                اضغط على &quot;إضافة شحنة&quot; لإضافة شحنة جديدة
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingShipment ? 'تعديل الشحنة' : 'إضافة شحنة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipment-date">
                التاريخ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shipment-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                الزبون <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.clientId}
                onValueChange={(val) => setForm({ ...form, clientId: val })}
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
            <div className="space-y-2">
              <Label>
                المركبة/السائق <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.vehicleId}
                onValueChange={(val) => setForm({ ...form, vehicleId: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المركبة/السائق" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} - {v.driverName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment-packages">
                  عدد الطرود <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shipment-packages"
                  type="number"
                  min={0}
                  value={form.packageCount || ''}
                  onChange={(e) => handlePackageCountChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipment-price">
                  سعر الطرد <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shipment-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.unitPrice || ''}
                  onChange={(e) => handleUnitPriceChange(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipment-total">المبلغ الإجمالي</Label>
              <Input
                id="shipment-total"
                type="text"
                value={formatCurrency(form.totalAmount)}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipment-description">وصف الشحنة</Label>
              <Textarea
                id="shipment-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="أدخل وصف الشحنة (اختياري)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>حالة الشحنة</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm({ ...form, status: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editingShipment ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
