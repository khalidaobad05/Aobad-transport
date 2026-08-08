'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search, X, Package, ChevronDown, ChevronUp } from 'lucide-react';
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
  ownerName: string;
}

interface OrderItem {
  id?: string;
  clientId: string;
  packageCount: number;
  description: string;
  client?: Client;
}

interface Shipment {
  id: string;
  number: number;
  date: string;
  status: string;
  description: string | null;
  vehicle: Vehicle;
  orders: (OrderItem & { id: string; client: Client })[];
}

interface ShipmentFormData {
  date: string;
  vehicleId: string;
  description: string;
  status: string;
  orders: OrderItem[];
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

const emptyOrder: OrderItem = {
  clientId: '',
  packageCount: 0,
  description: '',
};

const emptyForm: ShipmentFormData = {
  date: '',
  vehicleId: '',
  description: '',
  status: 'قيد التوصيل',
  orders: [{ ...emptyOrder }],
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
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

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
      vehicleId: shipment.vehicle.id,
      description: shipment.description ?? '',
      status: shipment.status,
      orders: shipment.orders.map((o) => ({
        id: o.id,
        clientId: o.client.id,
        packageCount: o.packageCount,
        description: o.description ?? '',
      })),
    });
    setDialogOpen(true);
  }

  // Order management within the form
  function addOrder() {
    setForm({ ...form, orders: [...form.orders, { ...emptyOrder }] });
  }

  function removeOrder(index: number) {
    if (form.orders.length <= 1) {
      toast.error('يجب أن تحتوي الشحنة على طلبية واحدة على الأقل');
      return;
    }
    const newOrders = form.orders.filter((_, i) => i !== index);
    setForm({ ...form, orders: newOrders });
  }

  function updateOrder(index: number, field: keyof OrderItem, value: string | number) {
    const newOrders = [...form.orders];
    (newOrders[index] as Record<string, unknown>)[field] = value;
    setForm({ ...form, orders: newOrders });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) {
      toast.error('التاريخ مطلوب');
      return;
    }
    if (!form.vehicleId) {
      toast.error('المركبة مطلوبة');
      return;
    }

    // Validate orders
    const validOrders = form.orders.filter((o) => o.clientId && o.packageCount > 0);
    if (validOrders.length === 0) {
      toast.error('يجب إضافة طلبية واحدة صالحة على الأقل');
      return;
    }

    try {
      setSubmitting(true);
      const body = {
        date: form.date,
        vehicleId: form.vehicleId,
        description: form.description.trim() || undefined,
        status: form.status,
        orders: validOrders.map((o) => ({
          clientId: o.clientId,
          packageCount: o.packageCount,
          description: o.description?.trim() || undefined,
        })),
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

  function getTotalPackages(shipment: Shipment): number {
    return shipment.orders.reduce((sum, o) => sum + o.packageCount, 0);
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-date" className="text-sm">التاريخ</Label>
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
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">المركبة</Label>
              <Select value={filterVehicleId} onValueChange={setFilterVehicleId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="الكل" /></SelectTrigger>
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
              <Button onClick={handleSearch} className="bg-amber-500 hover:bg-amber-600 text-white flex-1">
                <Search className="size-4" />
                بحث
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                <X className="size-4" />
                مسح
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <Button onClick={openCreateDialog} className="bg-amber-500 hover:bg-amber-600 text-white">
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
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشحنة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المركبة</TableHead>
                    <TableHead>الصاحب</TableHead>
                    <TableHead>عدد الطلبيات</TableHead>
                    <TableHead>إجمالي الطرود</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => {
                    const isExpanded = expandedShipment === shipment.id;
                    const totalPkgs = getTotalPackages(shipment);
                    return (
                      <>
                        <TableRow
                          key={shipment.id}
                          className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
                          onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                        >
                          <TableCell className="font-medium">{shipment.number}</TableCell>
                          <TableCell>{formatDate(shipment.date)}</TableCell>
                          <TableCell>{shipment.vehicle.registration}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {shipment.vehicle.ownerName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="size-3.5 text-muted-foreground" />
                              <span className="font-semibold">{shipment.orders.length}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-lg">{totalPkgs}</TableCell>
                          <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                        {/* Expanded: show orders detail */}
                        {isExpanded && (
                          <TableRow key={`${shipment.id}-orders`}>
                            <TableCell colSpan={8} className="bg-amber-50/30 dark:bg-amber-900/10 px-8 py-4">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
                                  تفاصيل الطلبيات ({shipment.orders.length})
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {shipment.orders.map((order, oi) => (
                                    <div
                                      key={order.id}
                                      className="border rounded-lg p-3 bg-white dark:bg-gray-800"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">طلبية {oi + 1}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {order.packageCount} طرود
                                        </Badge>
                                      </div>
                                      <p className="font-semibold text-sm">{order.client.name}</p>
                                      {order.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{order.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShipment ? 'تعديل الشحنة' : 'إضافة شحنة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment-date">التاريخ <span className="text-red-500">*</span></Label>
                <Input
                  id="shipment-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>المركبة <span className="text-red-500">*</span></Label>
                <Select
                  value={form.vehicleId}
                  onValueChange={(val) => setForm({ ...form, vehicleId: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registration} - {v.driverName} ({v.ownerName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>حالة الشحنة</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_FORM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipment-desc">وصف الشحنة</Label>
                <Input
                  id="shipment-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="مثال: رحلة الدار البيضاء - الرباط"
                />
              </div>
            </div>

            {/* Orders Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">الطلبيات <span className="text-red-500">*</span></Label>
                <Button type="button" variant="outline" size="sm" onClick={addOrder}>
                  <Plus className="size-3.5 ml-1" />
                  إضافة طلبية
                </Button>
              </div>

              {form.orders.map((order, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      طلبية {index + 1}
                    </span>
                    {form.orders.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-red-500 hover:text-red-700"
                        onClick={() => removeOrder(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">الزبون</Label>
                      <Select
                        value={order.clientId}
                        onValueChange={(val) => updateOrder(index, 'clientId', val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر الزبون" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">عدد الطرود</Label>
                      <Input
                        type="number"
                        min={1}
                        value={order.packageCount || ''}
                        onChange={(e) => updateOrder(index, 'packageCount', parseInt(e.target.value) || 0)}
                        placeholder="عدد الطرود"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">وصف (اختياري)</Label>
                    <Input
                      value={order.description}
                      onChange={(e) => updateOrder(index, 'description', e.target.value)}
                      placeholder="وصف الطلبية"
                    />
                  </div>
                </div>
              ))}
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
