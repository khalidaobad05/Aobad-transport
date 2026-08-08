'use client';

import { useState, useEffect } from 'react';
import { Truck, Banknote, Users, Car, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type ShipmentStatus = 'تم التسليم' | 'قيد التوصيل' | 'ملغاة';

interface RevenueDay {
  date: string;
  revenue: number;
}

interface RecentShipment {
  id: string;
  number: number;
  date: string;
  status: string;
  packageCount: number;
  totalAmount: number;
  client: { name: string };
  vehicle: { driverName: string };
}

interface DashboardData {
  shipmentsToday: number;
  revenueToday: number;
  shipmentsWeek: number;
  revenueWeek: number;
  clientsCount: number;
  vehiclesCount: number;
  recentShipments: RecentShipment[];
  revenueByDay: RevenueDay[];
}

const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-MA')} د.م.`;
}

function formatArabicDay(dateStr: string): string {
  try {
    const dayOfWeek = parseISO(dateStr).getDay();
    return ARABIC_DAYS[dayOfWeek];
  } catch {
    return dateStr;
  }
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy/MM/dd');
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: ShipmentStatus) {
  switch (status) {
    case 'تم التسليم':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          {status}
        </Badge>
      );
    case 'قيد التوصيل':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          {status}
        </Badge>
      );
    case 'ملغاة':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
          {status}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const chartConfig = {
  revenue: {
    label: 'الإيرادات',
    color: 'var(--color-amber-500)',
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  loading: boolean;
}) {
  return (
    <Card className="bg-white dark:bg-gray-900 border shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            )}
          </div>
          <div className={`rounded-xl p-3 ${bgColor}`}>
            <Icon className={`size-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('فشل في تحميل بيانات لوحة التحكم');
        const json = await res.json();
        setData(json.data || json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
        );
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const chartData = data?.revenueByDay?.map((d) => ({
    ...d,
    dayName: formatArabicDay(d.date),
  })) ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-destructive font-medium mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-amber-600 hover:underline"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="شحنات اليوم"
          value={data?.shipmentsToday?.toLocaleString('ar-MA') ?? '---'}
          icon={Truck}
          color="text-amber-600"
          bgColor="bg-amber-100 dark:bg-amber-900/30"
          loading={loading}
        />
        <StatCard
          title="إيرادات اليوم"
          value={formatCurrency(data?.revenueToday ?? 0)}
          icon={Banknote}
          color="text-orange-600"
          bgColor="bg-orange-100 dark:bg-orange-900/30"
          loading={loading}
        />
        <StatCard
          title="شحنات الأسبوع"
          value={data?.shipmentsWeek?.toLocaleString('ar-MA') ?? '---'}
          icon={Users}
          color="text-teal-600"
          bgColor="bg-teal-100 dark:bg-teal-900/30"
          loading={loading}
        />
        <StatCard
          title="إيرادات الأسبوع"
          value={formatCurrency(data?.revenueWeek ?? 0)}
          icon={Car}
          color="text-emerald-600"
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          loading={loading}
        />
      </div>

      {/* Revenue Chart */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">إيرادات آخر ٧ أيام</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} dir="rtl">
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="dayName"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.toLocaleString('ar-MA')}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value: number) =>
                        formatCurrency(value)
                      }
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-amber-500)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Shipments Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">آخر الشحنات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data?.recentShipments && data.recentShipments.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشحنة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الزبون</TableHead>
                    <TableHead>السائق</TableHead>
                    <TableHead>عدد الطرود</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.number.toLocaleString('ar-MA')}
                      </TableCell>
                      <TableCell>{formatDate(shipment.date)}</TableCell>
                      <TableCell>{shipment.client?.name || '—'}</TableCell>
                      <TableCell>{shipment.vehicle?.driverName || '—'}</TableCell>
                      <TableCell>
                        {shipment.packageCount.toLocaleString('ar-MA')}
                      </TableCell>
                      <TableCell>{formatCurrency(shipment.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status as ShipmentStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              لا توجد شحنات حديثة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
