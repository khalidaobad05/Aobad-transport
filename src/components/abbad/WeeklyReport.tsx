'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BarChart3, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
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

interface VehicleReport {
  vehicle: {
    id: string;
    registration: string;
    driverName: string;
  };
  shipmentCount: number;
  expenseCount: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

interface ReportSummary {
  totalShipments: number;
  totalExpensesCount: number;
  totalIncome: number;
  totalExpenses: number;
  totalNetProfit: number;
}

interface ReportData {
  startDate: string;
  endDate: string;
  vehicleReports: VehicleReport[];
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
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      const res = await fetch(`/api/weekly-report?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'فشل في تحميل التقرير' }));
        throw new Error(err.message || 'فشل في تحميل التقرير');
      }
      const json = await res.json();
      setReport(json.data);
      toast.success('تم تحميل التقرير بنجاح');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="size-5 text-amber-500" />
            التقرير المالي
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wr-start">
                من تاريخ
              </Label>
              <Input
                id="wr-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wr-end">
                إلى تاريخ
              </Label>
              <Input
                id="wr-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white w-full"
              >
                {loading && <Loader2 className="size-4 animate-spin ml-2" />}
                <BarChart3 className="size-4 ml-2" />
                عرض التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">إجمالي المداخيل</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report.summary.totalIncome)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.summary.totalShipments} رحلة
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">إجمالي المصاريف</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(report.summary.totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.summary.totalExpensesCount} مصروف
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 border shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">صافي الربح</p>
                <div className="flex items-center gap-2">
                  {report.summary.totalNetProfit >= 0 ? (
                    <TrendingUp className="size-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="size-5 text-red-500" />
                  )}
                  <p
                    className={`text-2xl font-bold ${
                      report.summary.totalNetProfit >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(report.summary.totalNetProfit)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Report Table */}
          <Card className="bg-white dark:bg-gray-900 border shadow-sm">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-lg">تفاصيل حسب المركبة</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {report.vehicleReports.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>السائق</TableHead>
                        <TableHead>رقم المركبة</TableHead>
                        <TableHead className="text-center">عدد الرحلات</TableHead>
                        <TableHead>مجموع المداخيل</TableHead>
                        <TableHead>مجموع المصاريف</TableHead>
                        <TableHead>الربح الصافي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.vehicleReports.map((vr) => (
                        <TableRow key={vr.vehicle.id}>
                          <TableCell className="font-medium">
                            {vr.vehicle.driverName}
                          </TableCell>
                          <TableCell>{vr.vehicle.registration}</TableCell>
                          <TableCell className="text-center">
                            {vr.shipmentCount}
                          </TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(vr.totalIncome)}
                          </TableCell>
                          <TableCell className="text-red-600 dark:text-red-400">
                            {formatCurrency(vr.totalExpenses)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {vr.netProfit >= 0 ? (
                                <>
                                  <TrendingUp className="size-3 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {formatCurrency(vr.netProfit)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="size-3 text-red-500" />
                                  <span className="text-red-600 dark:text-red-400 font-semibold">
                                    {formatCurrency(vr.netProfit)}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <TableRow className="bg-amber-50 dark:bg-amber-900/20 font-bold">
                        <TableCell>المجموع</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-center">
                          {report.summary.totalShipments}
                        </TableCell>
                        <TableCell className="text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(report.summary.totalIncome)}
                        </TableCell>
                        <TableCell className="text-red-600 dark:text-red-400">
                          {formatCurrency(report.summary.totalExpenses)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {report.summary.totalNetProfit >= 0 ? (
                              <>
                                <TrendingUp className="size-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                                  {formatCurrency(report.summary.totalNetProfit)}
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="size-3 text-red-500" />
                                <span className="text-red-600 dark:text-red-400 text-lg">
                                  {formatCurrency(report.summary.totalNetProfit)}
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  </Table>
                </div>
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
