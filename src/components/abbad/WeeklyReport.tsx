'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, Loader2, ChevronDown, ChevronUp, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface VehicleInfo {
  id: string;
  registration: string;
  driverName: string;
}

interface PartnerReport {
  ownerName: string;
  vehicles: VehicleInfo[];
  shipmentCount: number;
  orderCount: number;
  totalPackages: number;
  totalExpenses: number;
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

export default function WeeklyReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  async function handleGenerate() {
    if (!startDate) {
      toast.error('تاريخ البداية مطلوب');
      return;
    }
    if (!endDate) {
      toast.error('تاريخ النهاية مطلوب');
      return;
    }

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
      toast.success('تم تحميل التقرير بنجاح');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-lg">تفاصيل حسب الشريك (صاحب المركبة)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {report.partnerReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشريك</TableHead>
                      <TableHead>المركبات</TableHead>
                      <TableHead className="text-center">عدد الرحلات</TableHead>
                      <TableHead className="text-center">عدد الطلبيات</TableHead>
                      <TableHead className="text-center">إجمالي الطرود</TableHead>
                      <TableHead>المصاريف</TableHead>
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
                          </TableRow>
                          {/* Expanded: show vehicles detail */}
                          {isExpanded && (
                            <TableRow key={`${pr.ownerName}-detail`}>
                              <TableCell colSpan={6} className="bg-amber-50/30 dark:bg-amber-900/10 px-8 py-3">
                                <div className="text-sm space-y-1">
                                  {pr.vehicles.length > 0 ? pr.vehicles.map((v) => (
                                    <div key={v.id} className="flex items-center gap-3">
                                      <Badge variant="outline" className="font-mono text-xs">{v.registration}</Badge>
                                      <span className="text-muted-foreground">السائق: {v.driverName}</span>
                                    </div>
                                  )) : (
                                    <p className="text-muted-foreground">لا توجد مركبات مسجلة لهذا الشريك</p>
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
        </>
      )}
    </div>
  );
}
