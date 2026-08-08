'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { BarChart3, Loader2, ChevronDown, ChevronUp, Package, Truck, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface VehicleInfo {
  id: string;
  registration: string;
  driverName: string;
}

interface OrderDetail {
  clientName: string;
  packageCount: number;
  description: string | null;
}

interface ShipmentDetail {
  number: number;
  date: string;
  description: string | null;
  status: string;
  vehicleRegistration: string;
  driverName: string;
  orders: OrderDetail[];
  totalPackages: number;
}

interface ExpenseDetail {
  number: string;
  date: string;
  type: string;
  amount: number;
  notes: string | null;
  vehicleRegistration: string;
}

interface PartnerReport {
  ownerName: string;
  vehicles: VehicleInfo[];
  shipmentCount: number;
  orderCount: number;
  totalPackages: number;
  totalExpenses: number;
  shipments: ShipmentDetail[];
  expenseDetails: ExpenseDetail[];
}

interface ReportSummary {
  totalShipments: number;
  totalOrders: number;
  totalPackages: number;
  totalExpensesCount: number;
  totalExpenses: number;
}

interface ReportData {
  startDate: string;
  endDate: string;
  partnerReports: PartnerReport[];
  summary: ReportSummary;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-MA') + ' د.م.';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function PrintPartnerReport({
  partner,
 startDate,
  endDate,
}: {
  partner: PartnerReport;
  startDate: string;
  endDate: string;
}) {
  return (
    <div className="p-8 bg-white" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '1px' }}>
          شركة عباد للنقل
        </h1>
        <div className="w-24 h-0.5 bg-gray-400 mx-auto mt-2" />
        <h2 className="text-xl font-bold text-gray-800 mt-4 underline underline-offset-4">
          تقرير أسبوعي - {partner.ownerName}
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          الفترة: {formatDate(startDate)} إلى {formatDate(endDate)}
        </p>
      </div>

      {/* Vehicles */}
      <div className="mb-6">
        <h3 className="font-bold text-base text-gray-800 mb-2 border-b border-gray-300 pb-1">
          المركبات التابعة
        </h3>
        {partner.vehicles.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {partner.vehicles.map((v) => (
              <div key={v.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono">{v.registration}</span>
                <span className="text-gray-500">- السائق: {v.driverName}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">لا توجد مركبات مسجلة</p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">الرحلات</p>
          <p className="text-xl font-bold">{partner.shipmentCount}</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">الطلبيات</p>
          <p className="text-xl font-bold">{partner.orderCount}</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">الطرود</p>
          <p className="text-xl font-bold">{partner.totalPackages}</p>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="mb-6">
        <h3 className="font-bold text-base text-gray-800 mb-2 border-b border-gray-300 pb-1">
          تفاصيل الرحلات
        </h3>
        {partner.shipments.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-2">م</th>
                <th className="border border-gray-400 px-2 py-2">التاريخ</th>
                <th className="border border-gray-400 px-2 py-2">المركبة</th>
                <th className="border border-gray-400 px-2 py-2">الوصف</th>
                <th className="border border-gray-400 px-2 py-2">الزبائن</th>
                <th className="border border-gray-400 px-2 py-2 text-center">الطرود</th>
              </tr>
            </thead>
            <tbody>
              {partner.shipments.map((sh, i) => (
                <tr key={i}>
                  <td className="border border-gray-400 px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-gray-400 px-2 py-1.5">{formatDate(sh.date)}</td>
                  <td className="border border-gray-400 px-2 py-1.5 font-mono text-xs">{sh.vehicleRegistration}</td>
                  <td className="border border-gray-400 px-2 py-1.5">{sh.description || '—'}</td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {sh.orders.map((o, oi) => (
                      <div key={oi} className="text-xs">
                        {o.clientName} ({o.packageCount})
                      </div>
                    ))}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-center font-bold">{sh.totalPackages}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={5} className="border border-gray-400 px-2 py-2 text-left">المجموع</td>
                <td className="border border-gray-400 px-2 py-2 text-center text-lg">{partner.totalPackages}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-sm text-gray-500">لا توجد رحلات في هذه الفترة</p>
        )}
      </div>

      {/* Expenses Table */}
      <div className="mb-8">
        <h3 className="font-bold text-base text-gray-800 mb-2 border-b border-gray-300 pb-1">
          المصاريف
        </h3>
        {partner.expenseDetails.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-2 py-2">م</th>
                <th className="border border-gray-400 px-2 py-2">التاريخ</th>
                <th className="border border-gray-400 px-2 py-2">النوع</th>
                <th className="border border-gray-400 px-2 py-2">المركبة</th>
                <th className="border border-gray-400 px-2 py-2">ملاحظات</th>
                <th className="border border-gray-400 px-2 py-2 text-center">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {partner.expenseDetails.map((exp, i) => (
                <tr key={i}>
                  <td className="border border-gray-400 px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-gray-400 px-2 py-1.5">{formatDate(exp.date)}</td>
                  <td className="border border-gray-400 px-2 py-1.5">{exp.type}</td>
                  <td className="border border-gray-400 px-2 py-1.5 font-mono text-xs">{exp.vehicleRegistration}</td>
                  <td className="border border-gray-400 px-2 py-1.5">{exp.notes || '—'}</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-center">{formatCurrency(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={5} className="border border-gray-400 px-2 py-2 text-left">المجموع</td>
                <td className="border border-gray-400 px-2 py-2 text-center text-lg">{formatCurrency(partner.totalExpenses)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-sm text-gray-500">لا توجد مصاريف في هذه الفترة</p>
        )}
      </div>

      {/* Signature */}
      <div className="grid grid-cols-2 gap-12 mt-16">
        <div className="text-center">
          <p className="font-bold text-gray-700 mb-3">توقيع المسير</p>
          <div className="border-b-2 border-gray-400 pb-1">&nbsp;</div>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-700 mb-3">توقيع الشريك</p>
          <div className="border-b-2 border-gray-400 pb-1">&nbsp;</div>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [printPartner, setPrintPartner] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    if (!startDate) { toast.error('تاريخ البداية مطلوب'); return; }
    if (!endDate) { toast.error('تاريخ النهاية مطلوب'); return; }

    try {
      setLoading(true);
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/weekly-report?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'فشل في تحميل التقرير' }));
        throw new Error(err.message || 'فشل في تحميل التقرير');
      }
      const json = await res.json();
      setReport(json.data);
      setExpandedPartner(null);
      setPrintPartner(null);
      toast.success('تم تحميل التقرير بنجاح');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  function handlePrintPartner(partnerName: string) {
    setPrintPartner(partnerName);
    // Wait for the print content to render, then print
    setTimeout(() => window.print(), 300);
  }

  function handlePrintAll() {
    setPrintPartner('__ALL__');
    setTimeout(() => window.print(), 300);
  }

  const printData = printPartner && report
    ? printPartner === '__ALL__'
      ? report.partnerReports
      : report.partnerReports.filter((p) => p.ownerName === printPartner)
    : null;

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="size-5 text-amber-500" />
            الحصيلة الأسبوعية حسب الشركاء
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wr-start">من تاريخ</Label>
              <Input id="wr-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wr-end">إلى تاريخ</Label>
              <Input id="wr-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerate} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white w-full">
                {loading && <Loader2 className="size-4 animate-spin ml-2" />}
                <BarChart3 className="size-4 ml-2" />
                عرض التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="size-4 text-amber-500" />
                  <p className="text-sm text-muted-foreground">إجمالي الرحلات</p>
                </div>
                <p className="text-2xl font-bold">{report.summary.totalShipments}</p>
                <p className="text-xs text-muted-foreground mt-1">{report.summary.totalOrders} طلبية</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="size-4 text-blue-500" />
                  <p className="text-sm text-muted-foreground">إجمالي الطرود</p>
                </div>
                <p className="text-2xl font-bold">{report.summary.totalPackages}</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">إجمالي المصاريف</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(report.summary.totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{report.summary.totalExpensesCount} مصروف</p>
              </CardContent>
            </Card>
          </div>

          {/* Partner Report Table */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm no-print">
            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">تفاصيل حسب الشريك</CardTitle>
              <Button onClick={handlePrintAll} variant="outline" size="sm"
                className="border-amber-500 text-amber-600 hover:bg-amber-50">
                <Printer className="size-4 ml-1" />
                طباعة الكل
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {report.partnerReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشريك</TableHead>
                      <TableHead>المركبات</TableHead>
                      <TableHead className="text-center">الرحلات</TableHead>
                      <TableHead className="text-center">الطلبيات</TableHead>
                      <TableHead className="text-center">الطرود</TableHead>
                      <TableHead>المصاريف</TableHead>
                      <TableHead className="text-center">طباعة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.partnerReports.map((pr) => {
                      const isExpanded = expandedPartner === pr.ownerName;
                      return (
                        <>
                          <TableRow
                            key={pr.ownerName}
                            className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
                            onClick={() => setExpandedPartner(isExpanded ? null : pr.ownerName)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronUp className="size-4 text-amber-500" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                                <span className="font-bold text-amber-700 dark:text-amber-400">{pr.ownerName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground text-sm">
                                {pr.vehicles.map((v) => v.registration).join('، ') || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-semibold">{pr.shipmentCount}</TableCell>
                            <TableCell className="text-center font-semibold">{pr.orderCount}</TableCell>
                            <TableCell className="text-center font-bold text-lg">{pr.totalPackages}</TableCell>
                            <TableCell className="text-red-600 dark:text-red-400">{formatCurrency(pr.totalExpenses)}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handlePrintPartner(pr.ownerName); }}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                title={`طباعة تقرير ${pr.ownerName}`}
                              >
                                <Printer className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${pr.ownerName}-detail`}>
                              <TableCell colSpan={7} className="bg-amber-50/30 dark:bg-amber-900/10 px-8 py-3">
                                <div className="text-sm space-y-1">
                                  {pr.vehicles.length > 0 ? pr.vehicles.map((v) => (
                                    <div key={v.id} className="flex items-center gap-3">
                                      <Badge variant="outline" className="font-mono text-xs">{v.registration}</Badge>
                                      <span className="text-muted-foreground">السائق: {v.driverName}</span>
                                    </div>
                                  )) : (
                                    <p className="text-muted-foreground">لا توجد مركبات مسجلة</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                  <tfoot>
                    <TableRow className="bg-amber-50 dark:bg-amber-900/20 font-bold">
                      <TableCell>المجموع</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="text-center">{report.summary.totalShipments}</TableCell>
                      <TableCell className="text-center">{report.summary.totalOrders}</TableCell>
                      <TableCell className="text-center text-xl">{report.summary.totalPackages}</TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">{formatCurrency(report.summary.totalExpenses)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </tfoot>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <p className="text-base">لا توجد بيانات في الفترة المحددة</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ============ PRINT VIEW ============ */}
          {printData && printData.length > 0 && (
            <div ref={printRef} className="print-only-area">
              {printData.map((pr, idx) => (
                <div key={pr.ownerName} style={idx > 0 ? { pageBreakBefore: 'always' } : undefined}>
                  <PrintPartnerReport
                    partner={pr}
                    startDate={report!.startDate}
                    endDate={report!.endDate}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}