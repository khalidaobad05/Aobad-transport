'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface Vehicle {
  id: string;
  registration: string;
  driverName: string;
}

interface Shipment {
  id: string;
  number: number;
  client: { name: string };
}

interface Expense {
  id: string;
  number: string;
  date: string;
  type: string;
  amount: number;
  notes: string | null;
  vehicle: Vehicle;
  shipment: Shipment | null;
}

interface ExpenseFormData {
  date: string;
  vehicleId: string;
  shipmentId: string;
  type: string;
  amount: number;
  notes: string;
}

const EXPENSE_TYPES = [
  { value: 'وقود', label: 'وقود' },
  { value: 'رسوم الطريق', label: 'رسوم الطريق' },
  { value: 'صيانة خفيفة', label: 'صيانة خفيفة' },
  { value: 'صيانة ثقيلة', label: 'صيانة ثقيلة' },
  { value: 'أتعاب', label: 'أتعاب' },
  { value: 'أخرى', label: 'أخرى' },
];

const emptyForm: ExpenseFormData = {
  date: '',
  vehicleId: '',
  shipmentId: '',
  type: 'وقود',
  amount: 0,
  notes: '',
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

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reference data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterVehicleId) params.set('vehicleId', filterVehicleId);
      if (filterType) params.set('type', filterType);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error('فشل في تحميل المصروفات');
      const json = await res.json();
      setExpenses(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل المصروفات'
      );
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterVehicleId, filterType]);

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

  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch('/api/shipments');
      if (!res.ok) return;
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data ?? [];
      setShipments(list);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchVehicles();
    fetchShipments();
  }, [fetchVehicles, fetchShipments]);

  function openCreateDialog() {
    setEditingExpense(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense);
    setForm({
      date: formatDateInput(expense.date),
      vehicleId: expense.vehicle.id,
      shipmentId: expense.shipment?.id ?? '',
      type: expense.type,
      amount: expense.amount,
      notes: expense.notes ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) {
      toast.error('التاريخ مطلوب');
      return;
    }
    if (!form.vehicleId) {
      toast.error('المركبة/السائق مطلوب');
      return;
    }
    if (!form.type) {
      toast.error('نوع المصروف مطلوب');
      return;
    }
    if (form.amount <= 0) {
      toast.error('المبلغ مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      const body = {
        date: form.date,
        vehicleId: form.vehicleId,
        shipmentId: form.shipmentId || null,
        type: form.type,
        amount: form.amount,
        notes: form.notes.trim() || undefined,
      };

      if (editingExpense) {
        const res = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في تحديث المصروف');
        toast.success('تم تحديث المصروف بنجاح');
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في إضافة المصروف');
        toast.success('تم إضافة المصروف بنجاح');
      }

      setDialogOpen(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف المصروف');
      toast.success('تم حذف المصروف بنجاح');
      fetchExpenses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  }

  function handleClearFilters() {
    setFilterDate('');
    setFilterVehicleId('');
    setFilterType('');
  }

  function handleSearch() {
    fetchExpenses();
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-filter-date" className="text-sm">
                التاريخ
              </Label>
              <Input
                id="expense-filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full"
              />
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
            <div className="space-y-2">
              <Label className="text-sm">نوع المصروف</Label>
              <Select
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {EXPENSE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
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
          إضافة مصروف
        </Button>
      </div>

      {/* Expenses Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg">المصروفات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : expenses.length > 0 ? (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم المصروف</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>نوع المصروف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>السائق</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.number}
                      </TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>{expense.type}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {expense.notes || '—'}
                      </TableCell>
                      <TableCell>{expense.vehicle.driverName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(expense)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingId === expense.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            {deletingId === expense.id ? (
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
              <p className="text-base">لا توجد مصروفات</p>
              <p className="text-sm mt-1">
                اضغط على &quot;إضافة مصروف&quot; لإضافة مصروف جديد
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
              {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-date">
                التاريخ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expense-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
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
            <div className="space-y-2">
              <Label>الشحنة المرتبطة</Label>
              <Select
                value={form.shipmentId}
                onValueChange={(val) => setForm({ ...form, shipmentId: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الشحنة (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون شحنة</SelectItem>
                  {shipments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.number} - {s.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                نوع المصروف <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm({ ...form, type: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">
                المبلغ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expense-amount"
                type="number"
                min={0}
                step={0.01}
                value={form.amount || ''}
                onChange={(e) =>
                  setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-notes">ملاحظات</Label>
              <Textarea
                id="expense-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أدخل ملاحظات (اختياري)"
                rows={3}
              />
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
                {editingExpense ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
