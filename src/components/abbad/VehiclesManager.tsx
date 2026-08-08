'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Vehicle {
  id: number;
  registration: string;
  driverName: string;
  phone?: string | null;
}

interface VehicleFormData {
  registration: string;
  driverName: string;
  phone: string;
}

const emptyForm: VehicleFormData = {
  registration: '',
  driverName: '',
  phone: '',
};

export default function VehiclesManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles');
      if (!res.ok) throw new Error('فشل في تحميل المركبات');
      const json = await res.json();
      setVehicles(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل المركبات'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  function openCreateDialog() {
    setEditingVehicle(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setForm({
      registration: vehicle.registration,
      driverName: vehicle.driverName,
      phone: vehicle.phone ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.registration.trim()) {
      toast.error('رقم التسجيل مطلوب');
      return;
    }
    if (!form.driverName.trim()) {
      toast.error('اسم السائق/الشريك مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      const body = {
        registration: form.registration.trim(),
        driverName: form.driverName.trim(),
        phone: form.phone.trim() || undefined,
      };

      if (editingVehicle) {
        const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في تحديث المركبة');
        toast.success('تم تحديث المركبة بنجاح');
      } else {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في إضافة المركبة');
        toast.success('تم إضافة المركبة بنجاح');
      }

      setDialogOpen(false);
      fetchVehicles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف المركبة');
      toast.success('تم حذف المركبة بنجاح');
      fetchVehicles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <Button
          onClick={openCreateDialog}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="size-4" />
          إضافة مركبة
        </Button>
      </div>

      {/* Vehicles Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : vehicles.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم التسجيل</TableHead>
                    <TableHead>اسم السائق/الشريك</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {vehicle.registration}
                      </TableCell>
                      <TableCell>{vehicle.driverName}</TableCell>
                      <TableCell>{vehicle.phone ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(vehicle)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deletingId === vehicle.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            {deletingId === vehicle.id ? (
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
              <p className="text-base">لا توجد مركبات مسجلة</p>
              <p className="text-sm mt-1">
                اضغط على &quot;إضافة مركبة&quot; لإضافة مركبة جديدة
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
              {editingVehicle ? 'تعديل المركبة' : 'إضافة مركبة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-registration">
                رقم التسجيل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vehicle-registration"
                value={form.registration}
                onChange={(e) =>
                  setForm({ ...form, registration: e.target.value })
                }
                placeholder="أدخل رقم التسجيل"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-driver">
                اسم السائق/الشريك <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vehicle-driver"
                value={form.driverName}
                onChange={(e) =>
                  setForm({ ...form, driverName: e.target.value })
                }
                placeholder="أدخل اسم السائق أو الشريك"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-phone">الهاتف</Label>
              <Input
                id="vehicle-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
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
                {editingVehicle ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
