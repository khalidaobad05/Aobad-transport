'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Users, Car, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { parseISO } from 'date-fns';
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

interface OrderInfo {
  id: string;
  packageCount: number;
  description: string | null;
  client: { name: string };
}

interface RecentShipment {
  id: string;
  number: number;
  date: string;
  status: string;
  description: string | null;
  vehicle: { registration: string; driverName: string; ownerName: string };
  orders: OrderInfo[];
}

interface OrdersDay {
  date: string;
  orders: number;
  packages: number;
}

interface DashboardData {
  shipmentsToday: number;
  ordersToday: number;
  packagesToday: number;
  shipmentsWeek: number;
  ordersWeek: number;
  packagesWeek: number;
  clientsCount: number;
  vehiclesCount: number;
  recentShipments: RecentShipment[];
  ordersByDay: OrdersDay[];
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
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
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
  packages: {
    label: 'الطرود',
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
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  loading: boolean;
  subtitle?: string;
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
            {subtitle && !loading && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
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

  const chartData = data?.ordersByDay?.map((d) => ({
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
          title="رحلات اليوم"
          value={data?.shipmentsToday?.toLocaleString('ar-MA') ?? '---'}
          icon={Truck}
          color="text-amber-600"
          bgColor="bg-amber-100 dark:bg-amber-900/30"
          loading={loading}
          subtitle={`${data?.ordersToday ?? 0} طلبية`}
        />
        <StatCard
          title="طرود اليوم"
          value={data?.packagesToday?.toLocaleString('ar-MA') ?? '---'}
          icon={Package}
          color="text-orange-600"
          bgColor="bg-orange-100 dark:bg-orange-900/30"
          loading={loading}
        />
        <StatCard
          title="رحلات الأسبوع"
          value={data?.shipmentsWeek?.toLocaleString('ar-MA') ?? '---'}
          icon={Car}
          color="text-teal-600"
          bgColor="bg-teal-100 dark:bg-teal-900/30"
          loading={loading}
          subtitle={`${data?.ordersWeek ?? 0} طلبية`}
        />
        <StatCard
          title="طرود الأسبوع"
          value={data?.packagesWeek?.toLocaleString('ar-MA') ?? '---'}
          icon={Package}
          color="text-emerald-600"
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          loading={loading}
        />
      </div>

      {/* Quick info row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="العملاء"
          value={data?.clientsCount?.toLocaleString('ar-MA') ?? '---'}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          loading={loading}
        />
        <StatCard
          title="المركبات"
          value={data?.vehiclesCount?.toLocaleString('ar-MA') ?? '---'}
          icon={Car}
          color="text-purple-600"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
          loading={loading}
        />
      </div>

      {/* Packages Chart */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">الطرود في آخر ٧ أيام</CardTitle>
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
                        value.toLocaleString('ar-MA') + ' طرد'
                      }
                    />
                  }
                />
                <Bar
                  dataKey="packages"
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
          <CardTitle className="text-lg font-semibold">آخر الرحلات</CardTitle>
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
                    <TableHead>رقم الرحلة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المركبة</TableHead>
                    <TableHead>الصاحب</TableHead>
                    <TableHead>الطلبيات</TableHead>
                    <TableHead>الطرود</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentShipments.map((shipment) => {
                    const totalPkgs = shipment.orders.reduce((s, o) => s + o.packageCount, 0);
                    const clientNames = shipment.orders.map((o) => o.client.name).join('، ');
                    return (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">
                          {shipment.number.toLocaleString('ar-MA')}
                        </TableCell>
                        <TableCell>{formatDate(shipment.date)}</TableCell>
                        <TableCell>{shipment.vehicle?.registration || '—'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {shipment.vehicle?.ownerName || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={clientNames}>
                          {shipment.orders.length} ({clientNames})
                        </TableCell>
                        <TableCell className="font-bold">{totalPkgs}</TableCell>
                        <TableCell>{getStatusBadge(shipment.status as ShipmentStatus)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              لا توجد رحلات حديثة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
