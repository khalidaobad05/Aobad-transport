'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, UserCheck, UserX, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Employee {
  id: string;
  fullName: string;
  accessCode: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface EmployeeFormData {
  fullName: string;
  accessCode: string;
  role: string;
  active: boolean;
}

const emptyForm: EmployeeFormData = {
  fullName: '',
  accessCode: '',
  role: 'موظف',
  active: true,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

export default function EmployeesManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('فشل في تحميل الموظفين');
      const json = await res.json();
      setEmployees(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  function openCreateDialog() {
    setEditingEmployee(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(emp: Employee) {
    setEditingEmployee(emp);
    setForm({
      fullName: emp.fullName,
      accessCode: emp.accessCode,
      role: emp.role,
      active: emp.active,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    if (!form.accessCode.trim()) {
      toast.error('الكود مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      if (editingEmployee) {
        const res = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('فشل في التحديث');
        toast.success('تم تحديث الموظف بنجاح');
      } else {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'فشل' }));
          throw new Error(err.message || 'فشل في الإضافة');
        }
        toast.success('تم إضافة الموظف بنجاح');
      }
      setDialogOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(emp: Employee) {
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emp, active: !emp.active }),
      });
      if (!res.ok) throw new Error('فشل في تحديث الحالة');
      toast.success(emp.active ? 'تم تعطيل الموظف' : 'تم تفعيل الموظف');
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في الحذف');
      toast.success('تم حذف الموظف بنجاح');
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = employees.filter((e) => e.active).length;
  const adminCount = employees.filter((e) => e.role === 'مسير').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="size-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
            </div>
            <p className="text-2xl font-bold">{employees.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="size-4 text-emerald-500" />
              <p className="text-sm text-muted-foreground">الموظفون النشطون</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900 border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="size-4 text-purple-500" />
              <p className="text-sm text-muted-foreground">المسيرون</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{adminCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex items-center justify-between">
        <Button onClick={openCreateDialog} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="size-4" />
          إضافة موظف
        </Button>
      </div>

      {/* Employees Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg">الموظفون وكودات الدخول</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم الكامل</TableHead>
                    <TableHead>الكود</TableHead>
                    <TableHead>الصلاحية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} className={!emp.active ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{emp.fullName}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono tracking-wider">
                          {emp.accessCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        {emp.role === 'مسير' ? (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                            <Shield className="size-3 ml-1" />
                            مسير
                          </Badge>
                        ) : (
                          <Badge variant="secondary">موظف</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {emp.active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                            <UserCheck className="size-3 ml-1" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                            <UserX className="size-3 ml-1" />
                            معطل
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(emp.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(emp)}
                            className={emp.active ? 'text-orange-600 hover:text-orange-700' : 'text-emerald-600 hover:text-emerald-700'}
                            title={emp.active ? 'تعطيل' : 'تفعيل'}
                          >
                            {emp.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(emp)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(emp.id)}
                            disabled={deletingId === emp.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            {deletingId === emp.id ? (
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
              <p className="text-base">لا يوجد موظفون</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'تعديل الموظف' : 'إضافة موظف جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">الاسم الكامل <span className="text-red-500">*</span></Label>
              <Input
                id="emp-name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="أدخل الاسم الكامل"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-code">كود الدخول <span className="text-red-500">*</span></Label>
              <Input
                id="emp-code"
                value={form.accessCode}
                onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
                placeholder="أدخل كود فريد"
                className="font-mono tracking-widest text-center"
                required
              />
              <p className="text-xs text-muted-foreground">سيستخدم الموظف هذا الكود مع اسمه للدخول</p>
            </div>
            <div className="space-y-2">
              <Label>الصلاحية</Label>
              <Select
                value={form.role}
                onValueChange={(val) => setForm({ ...form, role: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="موظف">موظف</SelectItem>
                  <SelectItem value="مسير">مسير</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                المسير يمكنه إدارة الموظفين والكودات
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                إلغاء
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editingEmployee ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
