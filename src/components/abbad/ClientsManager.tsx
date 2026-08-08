'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  ifu?: string | null;
  ice?: string | null;
  rc?: string | null;
}

interface ClientFormData {
  name: string;
  phone: string;
  address: string;
  ifu: string;
  ice: string;
  rc: string;
}

const emptyForm: ClientFormData = {
  name: '',
  phone: '',
  address: '',
  ifu: '',
  ice: '',
  rc: '',
};

export default function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchClients = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/clients${params}`);
      if (!res.ok) throw new Error('فشل في تحميل الزبائن');
      const json = await res.json();
      setClients(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الزبائن');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchClients]);

  function openCreateDialog() {
    setEditingClient(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      phone: client.phone ?? '',
      address: client.address ?? '',
      ifu: client.ifu ?? '',
      ice: client.ice ?? '',
      rc: client.rc ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        ifu: form.ifu.trim() || undefined,
        ice: form.ice.trim() || undefined,
        rc: form.rc.trim() || undefined,
      };

      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في تحديث الزبون');
        toast.success('تم تحديث الزبون بنجاح');
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في إضافة الزبون');
        toast.success('تم إضافة الزبون بنجاح');
      }

      setDialogOpen(false);
      fetchClients(search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف الزبون');
      toast.success('تم حذف الزبون بنجاح');
      fetchClients(search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Search & Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setSearch(e.target.value);
            }}
            className="pr-10"
          />
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="size-4" />
          إضافة زبون
        </Button>
      </div>

      {/* Clients Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : clients.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>IFU</TableHead>
                    <TableHead>ICE</TableHead>
                    <TableHead>RC</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client, index) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {(index + 1).toLocaleString('ar-MA')}
                      </TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.phone ?? '—'}</TableCell>
                      <TableCell>{client.address ?? '—'}</TableCell>
                      <TableCell>{client.ifu ?? '—'}</TableCell>
                      <TableCell>{client.ice ?? '—'}</TableCell>
                      <TableCell>{client.rc ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(client)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingId === client.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            {deletingId === client.id ? (
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
              <p className="text-base">لا يوجد زبائن</p>
              <p className="text-sm mt-1">اضغط على &quot;إضافة زبون&quot; لإضافة زبون جديد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'تعديل الزبون' : 'إضافة زبون جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">
                الاسم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="أدخل اسم الزبون"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">الهاتف</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-address">العنوان</Label>
              <Input
                id="client-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="أدخل العنوان"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-ifu">IFU</Label>
                <Input
                  id="client-ifu"
                  value={form.ifu}
                  onChange={(e) => setForm({ ...form, ifu: e.target.value })}
                  placeholder="IFU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-ice">ICE</Label>
                <Input
                  id="client-ice"
                  value={form.ice}
                  onChange={(e) => setForm({ ...form, ice: e.target.value })}
                  placeholder="ICE"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-rc">RC</Label>
                <Input
                  id="client-rc"
                  value={form.rc}
                  onChange={(e) => setForm({ ...form, rc: e.target.value })}
                  placeholder="RC"
                />
              </div>
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
                {editingClient ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
