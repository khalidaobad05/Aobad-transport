'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Printer, Eye } from 'lucide-react';
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
  phone: string | null;
  address: string | null;
  ifu: string | null;
  ice: string | null;
  rc: string | null;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  ice: string;
  ifu: string;
  rc: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  paymentMethod: string;
  htAmount: number;
  tvaRate: number;
  tvaAmount: number;
  taxeProfRate: number;
  taxeProfAmount: number;
  ttcAmount: number;
  timbreFiscal: number;
  status: string;
  notes: string | null;
  companyInfo: string | null;
  createdAt: string;
  client: Client;
}

interface InvoiceFormData {
  date: string;
  clientId: string;
  paymentMethod: string;
  htAmount: number;
  tvaRate: number;
  taxeProfRate: number;
  timbreFiscal: number;
  notes: string;
  status: string;
  // Company info fields (all optional)
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyICE: string;
  companyIFU: string;
  companyRC: string;
}

const PAYMENT_METHODS = [
  { value: 'نقدي', label: 'نقدي' },
  { value: 'شيك', label: 'شيك' },
  { value: 'تحويل بنكي', label: 'تحويل بنكي' },
  { value: 'آجل', label: 'آجل' },
];

const TVA_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '7', label: '7%' },
  { value: '10', label: '10%' },
  { value: '14', label: '14%' },
  { value: '20', label: '20%' },
];

const STORAGE_KEY = 'abbad-company-info';

function loadSavedCompanyInfo(): CompanyInfo {
  if (typeof window === 'undefined') return { name: 'شركة عباد للنقل', address: '', phone: '', ice: '', ifu: '', rc: '' };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { name: 'شركة عباد للنقل', address: '', phone: '', ice: '', ifu: '', rc: '' };
}

function saveCompanyInfo(info: CompanyInfo) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  }
}

const defaultCompany = loadSavedCompanyInfo();

const emptyForm: InvoiceFormData = {
  date: '',
  clientId: '',
  paymentMethod: 'نقدي',
  htAmount: 0,
  tvaRate: 20,
  taxeProfRate: 0,
  timbreFiscal: 0,
  notes: '',
  status: 'غير مدفوعة',
  companyName: defaultCompany.name,
  companyAddress: defaultCompany.address,
  companyPhone: defaultCompany.phone,
  companyICE: defaultCompany.ice,
  companyIFU: defaultCompany.ifu,
  companyRC: defaultCompany.rc,
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
    case 'مدفوعة':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
          مدفوعة
        </Badge>
      );
    case 'غير مدفوعة':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
          غير مدفوعة
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

function computeTaxValues(htAmount: number, tvaRate: number, taxeProfRate: number, timbreFiscal: number) {
  const tvaAmount = htAmount * (tvaRate / 100);
  const taxeProfAmount = htAmount * (taxeProfRate / 100);
  const ttcAmount = htAmount + tvaAmount + taxeProfAmount + timbreFiscal;
  return { tvaAmount, taxeProfAmount, ttcAmount };
}

function parseCompanyInfo(raw: string | null): CompanyInfo {
  if (!raw) return loadSavedCompanyInfo();
  try {
    return JSON.parse(raw);
  } catch {
    return loadSavedCompanyInfo();
  }
}

export default function InvoicesManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<InvoiceFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [companySectionOpen, setCompanySectionOpen] = useState(false);

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);

  // Print view
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('فشل في تحميل الفواتير');
      const json = await res.json();
      setInvoices(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الفواتير'
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function openCreateDialog() {
    const saved = loadSavedCompanyInfo();
    setEditingInvoice(null);
    setForm({
      ...emptyForm,
      companyName: saved.name,
      companyAddress: saved.address,
      companyPhone: saved.phone,
      companyICE: saved.ice,
      companyIFU: saved.ifu,
      companyRC: saved.rc,
    });
    setCompanySectionOpen(false);
    setDialogOpen(true);
  }

  function openEditDialog(invoice: Invoice) {
    const info = parseCompanyInfo(invoice.companyInfo);
    setEditingInvoice(invoice);
    setForm({
      date: formatDateInput(invoice.date),
      clientId: invoice.client.id,
      paymentMethod: invoice.paymentMethod,
      htAmount: invoice.htAmount,
      tvaRate: invoice.tvaRate,
      taxeProfRate: invoice.taxeProfRate,
      timbreFiscal: invoice.timbreFiscal,
      notes: invoice.notes ?? '',
      status: invoice.status,
      companyName: info.name,
      companyAddress: info.address,
      companyPhone: info.phone,
      companyICE: info.ice,
      companyIFU: info.ifu,
      companyRC: info.rc,
    });
    setCompanySectionOpen(true);
    setDialogOpen(true);
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
    if (form.htAmount <= 0) {
      toast.error('المبلغ HT مطلوب');
      return;
    }

    try {
      setSubmitting(true);

      // Save company info for next time
      const companyInfo: CompanyInfo = {
        name: form.companyName.trim() || 'شركة عباد للنقل',
        address: form.companyAddress.trim(),
        phone: form.companyPhone.trim(),
        ice: form.companyICE.trim(),
        ifu: form.companyIFU.trim(),
        rc: form.companyRC.trim(),
      };
      saveCompanyInfo(companyInfo);

      const { tvaAmount, taxeProfAmount, ttcAmount } = computeTaxValues(
        form.htAmount,
        form.tvaRate,
        form.taxeProfRate,
        form.timbreFiscal
      );
      const body = {
        date: form.date,
        clientId: form.clientId,
        paymentMethod: form.paymentMethod,
        htAmount: form.htAmount,
        tvaRate: form.tvaRate,
        tvaAmount,
        taxeProfRate: form.taxeProfRate,
        taxeProfAmount,
        ttcAmount,
        timbreFiscal: form.timbreFiscal,
        notes: form.notes.trim() || undefined,
        status: form.status,
        companyInfo: JSON.stringify(companyInfo),
      };

      if (editingInvoice) {
        const res = await fetch(`/api/invoices/${editingInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في تحديث الفاتورة');
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في إنشاء الفاتورة');
        toast.success('تم إنشاء الفاتورة بنجاح');
      }

      setDialogOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف الفاتورة');
      toast.success('تم حذف الفاتورة بنجاح');
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  }

  // Live calculation values
  const liveCalc = computeTaxValues(form.htAmount, form.tvaRate, form.taxeProfRate, form.timbreFiscal);

  const selectedClient = clients.find((c) => c.id === form.clientId);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between no-print">
        <Button
          onClick={openCreateDialog}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="size-4" />
          إنشاء فاتورة
        </Button>
      </div>

      {/* Invoices Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm no-print">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg">الفواتير</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الزبون</TableHead>
                    <TableHead>مبلغ HT</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead>مبلغ TTC</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>{invoice.client.name}</TableCell>
                      <TableCell>{formatCurrency(invoice.htAmount)}</TableCell>
                      <TableCell>{invoice.tvaRate}%</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.ttcAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPrintInvoice(invoice)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                            title="عرض/طباعة"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(invoice)}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            {deletingId === invoice.id ? (
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
              <p className="text-base">لا توجد فواتير</p>
              <p className="text-sm mt-1">
                اضغط على &quot;إنشاء فاتورة&quot; لإنشاء فاتورة جديدة
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
              {editingInvoice ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Info Section (collapsible) */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setCompanySectionOpen(!companySectionOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <span className="font-bold text-sm text-amber-800 dark:text-amber-300">
                  معلومات الشركة (اختياري)
                </span>
                <svg
                  className={`w-4 h-4 text-amber-600 transition-transform ${companySectionOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {companySectionOpen && (
                <div className="p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    هذه المعلومات ستُحفظ وتُستخدم تلقائياً في الفواتير القادمة. جميع الحقول اختيارية.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">اسم الشركة</Label>
                      <Input
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        placeholder="شركة عباد للنقل"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">العنوان</Label>
                      <Input
                        value={form.companyAddress}
                        onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                        placeholder="العنوان"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الهاتف</Label>
                      <Input
                        value={form.companyPhone}
                        onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                        placeholder="رقم الهاتف"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ICE</Label>
                      <Input
                        value={form.companyICE}
                        onChange={(e) => setForm({ ...form, companyICE: e.target.value })}
                        placeholder="رقم ICE"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">IFU</Label>
                      <Input
                        value={form.companyIFU}
                        onChange={(e) => setForm({ ...form, companyIFU: e.target.value })}
                        placeholder="رقم IFU"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">RC</Label>
                      <Input
                        value={form.companyRC}
                        onChange={(e) => setForm({ ...form, companyRC: e.target.value })}
                        placeholder="رقم RC"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-date">
                  التاريخ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="inv-date"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(val) => setForm({ ...form, paymentMethod: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نسبة TVA</Label>
                <Select
                  value={String(form.tvaRate)}
                  onValueChange={(val) => setForm({ ...form, tvaRate: parseFloat(val) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TVA_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-ht">المبلغ HT <span className="text-red-500">*</span></Label>
                <Input
                  id="inv-ht"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.htAmount || ''}
                  onChange={(e) =>
                    setForm({ ...form, htAmount: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-taxe-prof">نسبة الضريبة المهنية (%) <span className="text-muted-foreground">- اختياري</span></Label>
                <Input
                  id="inv-taxe-prof"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.taxeProfRate || ''}
                  onChange={(e) =>
                    setForm({ ...form, taxeProfRate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-timbre">Timbre Fiscal <span className="text-muted-foreground">- اختياري</span></Label>
                <Input
                  id="inv-timbre"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.timbreFiscal || ''}
                  onChange={(e) =>
                    setForm({ ...form, timbreFiscal: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="غير مدفوعة">غير مدفوعة</SelectItem>
                    <SelectItem value="مدفوعة">مدفوعة</SelectItem>
                    <SelectItem value="ملغاة">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-notes">ملاحظات</Label>
              <Textarea
                id="inv-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="أدخل ملاحظات (اختياري)"
                rows={3}
              />
            </div>

            {/* Live Calculation Preview */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-3">
                معاينة الحساب
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">المبلغ HT:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-left">
                  {formatCurrency(form.htAmount)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">مبلغ TVA ({form.tvaRate}%):</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-left">
                  {formatCurrency(liveCalc.tvaAmount)}
                </span>
                {form.taxeProfRate > 0 && (
                  <>
                    <span className="text-gray-600 dark:text-gray-400">الضريبة المهنية ({form.taxeProfRate}%):</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-left">
                      {formatCurrency(liveCalc.taxeProfAmount)}
                    </span>
                  </>
                )}
                {form.timbreFiscal > 0 && (
                  <>
                    <span className="text-gray-600 dark:text-gray-400">Timbre Fiscal:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-left">
                      {formatCurrency(form.timbreFiscal)}
                    </span>
                  </>
                )}
                <span className="text-gray-600 dark:text-gray-400 font-bold border-t border-amber-300 dark:border-amber-700 pt-2">
                  المبلغ TTC:
                </span>
                <span className="font-bold text-lg text-amber-700 dark:text-amber-300 text-left border-t border-amber-300 dark:border-amber-700 pt-2">
                  {formatCurrency(liveCalc.ttcAmount)}
                </span>
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
                {editingInvoice ? 'تحديث' : 'إنشاء'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Print View */}
      <Dialog open={!!printInvoice} onOpenChange={(open) => !open && setPrintInvoice(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" id="invoice-print">
          <div className="no-print flex justify-end mb-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Printer className="size-4 ml-2" />
              طباعة
            </Button>
          </div>
          {printInvoice && (() => {
            const ci = parseCompanyInfo(printInvoice.companyInfo);
            return (
              <div className="border-2 border-gray-300 p-8 bg-white dark:bg-gray-900">
                {/* Company Header */}
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {ci.name || 'شركة عباد للنقل'}
                  </h1>
                  {ci.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ci.address}</p>
                  )}
                  {ci.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">هاتف: {ci.phone}</p>
                  )}
                  <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                    {ci.ice && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">ICE: {ci.ice}</span>}
                    {ci.ifu && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">IFU: {ci.ifu}</span>}
                    {ci.rc && <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">RC: {ci.rc}</span>}
                  </div>
                </div>

                <p className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300 mt-4 mb-6">
                  فاتورة رسمية (Facture)
                </p>

                {/* Info Rows */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6 border-b border-gray-300 pb-4">
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الفاتورة:</span>
                    <span className="text-gray-900 dark:text-gray-100">{printInvoice.number}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">التاريخ:</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(printInvoice.date)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">الزبون:</span>
                    <span className="text-gray-900 dark:text-gray-100">{printInvoice.client.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">طريقة الدفع:</span>
                    <span className="text-gray-900 dark:text-gray-100">{printInvoice.paymentMethod}</span>
                  </div>
                  {printInvoice.client.address && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">العنوان:</span>
                      <span className="text-gray-900 dark:text-gray-100">{printInvoice.client.address}</span>
                    </div>
                  )}
                  {printInvoice.client.phone && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">الهاتف:</span>
                      <span className="text-gray-900 dark:text-gray-100">{printInvoice.client.phone}</span>
                    </div>
                  )}
                  {printInvoice.client.ifu && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">IFU:</span>
                      <span className="text-gray-900 dark:text-gray-100">{printInvoice.client.ifu}</span>
                    </div>
                  )}
                  {printInvoice.client.ice && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">ICE:</span>
                      <span className="text-gray-900 dark:text-gray-100">{printInvoice.client.ice}</span>
                    </div>
                  )}
                  {printInvoice.client.rc && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">RC:</span>
                      <span className="text-gray-900 dark:text-gray-100">{printInvoice.client.rc}</span>
                    </div>
                  )}
                </div>

                {/* Invoice Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-amber-50 dark:bg-amber-900/20">
                        <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">م</th>
                        <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">الوصف</th>
                        <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 text-center">الكمية</th>
                        <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 text-center">سعر الوحدة</th>
                        <th className="border border-gray-300 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 text-center">المبلغ HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="even:bg-gray-50 dark:even:bg-gray-800/50">
                        <td className="border border-gray-300 px-3 py-2 text-center">1</td>
                        <td className="border border-gray-300 px-3 py-2">خدمات النقل</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">1</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{formatCurrency(printInvoice.htAmount)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{formatCurrency(printInvoice.htAmount)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                          المبلغ HT:
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-semibold">{formatCurrency(printInvoice.htAmount)}</td>
                      </tr>
                      {printInvoice.tvaRate > 0 && (
                        <tr>
                          <td colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                            TVA ({printInvoice.tvaRate}%):
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{formatCurrency(printInvoice.tvaAmount)}</td>
                        </tr>
                      )}
                      {printInvoice.taxeProfRate > 0 && (
                        <tr>
                          <td colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                            الضريبة المهنية ({printInvoice.taxeProfRate}%):
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{formatCurrency(printInvoice.taxeProfAmount)}</td>
                        </tr>
                      )}
                      {printInvoice.timbreFiscal > 0 && (
                        <tr>
                          <td colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                            Timbre Fiscal:
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{formatCurrency(printInvoice.timbreFiscal)}</td>
                        </tr>
                      )}
                      <tr className="bg-amber-50 dark:bg-amber-900/20 font-bold">
                        <td colSpan={4} className="border border-gray-300 px-3 py-3 text-left text-lg text-gray-900 dark:text-gray-100">
                          المبلغ TTC:
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center text-xl text-amber-700 dark:text-amber-300">
                          {formatCurrency(printInvoice.ttcAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Notes */}
                {printInvoice.notes && (
                  <div className="text-sm mb-6">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">ملاحظات:</span>{' '}
                    <span className="text-gray-900 dark:text-gray-100">{printInvoice.notes}</span>
                  </div>
                )}

                {/* Signature Lines */}
                <div className="grid grid-cols-2 gap-8 mt-12 pt-4">
                  <div className="text-center">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">توقيع الزبون</p>
                    <div className="border-b border-gray-400 dark:border-gray-600 pb-1">&nbsp;</div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">توقيع {ci.name || 'شركة عباد للنقل'}</p>
                    <div className="border-b border-gray-400 dark:border-gray-600 pb-1">&nbsp;</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
