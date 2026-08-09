'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Search, X, Package, ChevronDown, ChevronUp, UserPlus, Check, Printer, FileText, List } from 'lucide-react';
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

interface Client {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  registration: string;
  driverName: string;
  ownerName: string;
}

interface OrderItem {
  id?: string;
  clientId: string;
  clientName: string;
  packageCount: number;
  price: number;
  description: string;
  client?: Client;
}

interface Shipment {
  id: string;
  number: number;
  date: string;
  status: string;
  description: string | null;
  generator: string | null;
  totalExpected: number | null;
  vehicle: Vehicle;
  orders: (OrderItem & { id: string; client: Client })[];
}

interface ShipmentFormData {
  date: string;
  vehicleId: string;
  description: string;
  generator: string;
  totalExpected: string;
  status: string;
  orders: OrderItem[];
}

const STATUS_OPTIONS = [
  { value: 'الكل', label: 'الكل' },
  { value: 'تم التسليم', label: 'تم التسليم' },
  { value: 'قيد التوصيل', label: 'قيد التوصيل' },
  { value: 'ملغاة', label: 'ملغاة' },
];

const STATUS_FORM_OPTIONS = [
  { value: 'قيد التوصيل', label: 'قيد التوصيل' },
  { value: 'تم التسليم', label: 'تم التسليم' },
  { value: 'ملغاة', label: 'ملغاة' },
];

const emptyOrder: OrderItem = {
  clientId: '',
  clientName: '',
  packageCount: 0,
  price: 0,
  description: '',
};

const emptyForm: ShipmentFormData = {
  date: '',
  vehicleId: '',
  description: '',
  generator: '',
  totalExpected: '',
  status: 'قيد التوصيل',
  orders: [{ ...emptyOrder }],
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'تم التسليم':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
          تم التسليم
        </Badge>
      );
    case 'قيد التوصيل':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
          قيد التوصيل
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

// ========== Client Autocomplete Input ==========
function ClientAutocomplete({
  value,
  onChange,
  clients,
}: {
  value: string;
  onChange: (clientId: string, clientName: string) => void;
  clients: Client[];
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = inputValue.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(inputValue.trim().toLowerCase())
      )
    : clients;

  const shownClients = filteredClients.slice(0, 8);

  const exactMatch = clients.find(
    (c) => c.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  const isNewClient = inputValue.trim().length > 0 && !exactMatch;

  function handleSelect(client: Client) {
    setInputValue(client.name);
    onChange(client.id, client.name);
    setIsOpen(false);
    setHighlightIndex(-1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    onChange('', val);
    setIsOpen(true);
    setHighlightIndex(-1);
  }

  function handleAddNew() {
    if (!inputValue.trim()) return;
    onChange('', inputValue.trim());
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const totalItems = shownClients.length + (isNewClient ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < shownClients.length) {
        handleSelect(shownClients[highlightIndex]);
      } else if (highlightIndex === shownClients.length && isNewClient) {
        handleAddNew();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      if (shownClients.length === 1 && !isNewClient) {
        e.preventDefault();
        handleSelect(shownClients[0]);
      } else if (exactMatch) {
        e.preventDefault();
        handleSelect(exactMatch);
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب اسم الزبون..."
          className="w-full pr-8"
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              onChange('', '');
              inputRef.current?.focus();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {isOpen && (shownClients.length > 0 || isNewClient) && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {shownClients.map((client, idx) => (
            <button
              key={client.id}
              type="button"
              onClick={() => handleSelect(client)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`
                w-full text-right px-3 py-2 text-sm flex items-center gap-2 transition-colors
                ${idx === highlightIndex
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <span className="truncate flex-1">{client.name}</span>
              {exactMatch?.id === client.id && (
                <Check className="size-3.5 text-emerald-500 shrink-0" />
              )}
            </button>
          ))}
          {isNewClient && (
            <button
              type="button"
              onClick={handleAddNew}
              onMouseEnter={() => setHighlightIndex(shownClients.length)}
              className={`
                w-full text-right px-3 py-2 text-sm flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 transition-colors
                ${highlightIndex === shownClients.length
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-emerald-600 dark:text-emerald-400'
                }
              `}
            >
              <UserPlus className="size-3.5 shrink-0" />
              <span>إضافة "{inputValue.trim()}" كزبون جديد</span>
            </button>
          )}
        </div>
      )}

      {!exactMatch && inputValue.trim() && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
          <UserPlus className="size-3" />
          سيتم إضافة "{inputValue.trim()}" إلى لائحة الزبائن
        </p>
      )}
    </div>
  );
}

// ========== Print Styles for Shipment ==========
function ShipmentPrintView({
  shipment,
  mode,
}: {
  shipment: Shipment;
  mode: 'detailed' | 'summary';
}) {
  const totalPackages = shipment.orders.reduce((sum, o) => sum + o.packageCount, 0);
  const totalRevenue = shipment.orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const ordersWithPrice = shipment.orders.filter((o) => o.price && o.price > 0);

  return (
    <div
      id={`shipment-print-${shipment.id}`}
      className="print-only-area"
      dir="rtl"
    >
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        {/* Company Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', letterSpacing: '2px' }}>
            شركة عباد للنقل
          </h1>
          <div style={{ width: '120px', height: '2px', backgroundColor: '#333', margin: '8px auto' }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', textDecoration: 'underline', textDecorationOffset: '4px' }}>
            {mode === 'detailed' ? 'بيان الشحنة التفصيلي' : 'بيان الشحنة - الحصيلة الكلية'}
          </h2>
        </div>

        {/* Shipment Info */}
        <div style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '2' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>رقم الشحنة:</span>
            <span style={{ fontWeight: 'bold', color: '#000' }}>{shipment.number}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>التاريخ:</span>
            <span>{formatDate(shipment.date)}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>المركبة:</span>
            <span>{shipment.vehicle.registration}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>السائق:</span>
            <span>{shipment.vehicle.driverName}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>الصاحب:</span>
            <span>{shipment.vehicle.ownerName}</span>
          </div>
          {shipment.description && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>الوصف:</span>
              <span>{shipment.description}</span>
            </div>
          )}
          {shipment.generator && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>المولد:</span>
              <span>{shipment.generator}</span>
            </div>
          )}
          {shipment.totalExpected != null && shipment.totalExpected > 0 && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>المجموع المتوقع:</span>
              <span style={{ fontWeight: 'bold' }}>{shipment.totalExpected} طرود</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>الحالة:</span>
            <span>{shipment.status}</span>
          </div>
        </div>

        {mode === 'detailed' ? (
          /* ========= DETAILED MODE ========= */
          <div>
            {/* Orders Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #333' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #ccc' }}>الرقم</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #ccc' }}>اسم الزبون</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #ccc' }}>عدد الطرود</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #ccc' }}>السعر (د.م.)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #ccc' }}>الوصف</th>
                </tr>
              </thead>
              <tbody>
                {shipment.orders.map((order, idx) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px', border: '1px solid #eee', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee', fontWeight: '500' }}>{order.client.name}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee', textAlign: 'center', fontWeight: 'bold' }}>{order.packageCount}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee', textAlign: 'center' }}>{order.price ? order.price.toFixed(2) : '---'}</td>
                    <td style={{ padding: '8px', border: '1px solid #eee', color: '#666' }}>{order.description || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>إجمالي الطلبيات:</span>
                <span style={{ fontWeight: 'bold' }}>{shipment.orders.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>إجمالي الطرود:</span>
                <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#000' }}>{totalPackages}</span>
              </div>
              {ordersWithPrice.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold', color: '#555' }}>إجمالي الأسعار:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#16a34a' }}>{totalRevenue.toFixed(2)} د.م.</span>
                </div>
              )}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc', fontSize: '13px', color: '#888' }}>
                ({ordersWithPrice.length} من {shipment.orders.length} طلبيات لها سعر مسجل)
              </div>
            </div>
          </div>
        ) : (
          /* ========= SUMMARY MODE ========= */
          <div>
            <div style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px', border: '2px solid #333', fontSize: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#555', fontSize: '16px' }}>عدد الطلبيات:</span>
                <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{shipment.orders.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#555', fontSize: '16px' }}>إجمالي الطرود:</span>
                <span style={{ fontWeight: 'bold', fontSize: '24px', color: '#000' }}>{totalPackages} طرود</span>
              </div>
              {ordersWithPrice.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #333' }}>
                  <span style={{ fontWeight: 'bold', color: '#555', fontSize: '16px' }}>الحصيلة الكلية:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '24px', color: '#16a34a' }}>{totalRevenue.toFixed(2)} د.م.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Lines */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '60px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', color: '#555', marginBottom: '12px' }}>توقيع المسير</p>
            <div style={{ borderBottom: '2px solid #333', paddingBottom: '4px' }}>&nbsp;</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', color: '#555', marginBottom: '12px' }}>توقيع السائق</p>
            <div style={{ borderBottom: '2px solid #333', paddingBottom: '4px' }}>&nbsp;</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Main Component ==========
export default function ShipmentsManager() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [form, setForm] = useState<ShipmentFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  // Print state
  const [printShipment, setPrintShipment] = useState<Shipment | null>(null);
  const [printMode, setPrintMode] = useState<'detailed' | 'summary'>('detailed');
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  // Reference data
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [filterVehicleId, setFilterVehicleId] = useState('');

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterStatus && filterStatus !== 'الكل') params.set('status', filterStatus);
      if (filterVehicleId && filterVehicleId !== 'all') params.set('vehicleId', filterVehicleId);

      const res = await fetch(`/api/shipments?${params.toString()}`);
      if (!res.ok) throw new Error('فشل في تحميل الشحنات');
      const json = await res.json();
      setShipments(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الشحنات'
      );
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, filterVehicleId]);

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

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  useEffect(() => {
    fetchClients();
    fetchVehicles();
  }, [fetchClients, fetchVehicles]);

  function openCreateDialog() {
    setEditingShipment(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(shipment: Shipment) {
    setEditingShipment(shipment);
    setForm({
      date: formatDateInput(shipment.date),
      vehicleId: shipment.vehicle.id,
      description: shipment.description ?? '',
      generator: shipment.generator ?? '',
      totalExpected: shipment.totalExpected ? String(shipment.totalExpected) : '',
      status: shipment.status,
      orders: shipment.orders.map((o) => ({
        id: o.id,
        clientId: o.client.id,
        clientName: o.client.name,
        packageCount: o.packageCount,
        price: (o as Record<string, unknown>).price as number || 0,
        description: o.description ?? '',
      })),
    });
    setDialogOpen(true);
  }

  // Order management within the form
  function addOrder() {
    setForm({ ...form, orders: [...form.orders, { ...emptyOrder }] });
  }

  function removeOrder(index: number) {
    if (form.orders.length <= 1) {
      toast.error('يجب أن تحتوي الشحنة على طلبية واحدة على الأقل');
      return;
    }
    const newOrders = form.orders.filter((_, i) => i !== index);
    setForm({ ...form, orders: newOrders });
  }

  function updateOrderClient(index: number, clientId: string, clientName: string) {
    const newOrders = [...form.orders];
    newOrders[index] = { ...newOrders[index], clientId, clientName };
    setForm({ ...form, orders: newOrders });
  }

  function updateOrderField(index: number, field: 'packageCount' | 'price' | 'description', value: string | number) {
    const newOrders = [...form.orders];
    (newOrders[index] as Record<string, unknown>)[field] = value;
    setForm({ ...form, orders: newOrders });
  }

  // Ensure a client exists (find or create), returns the client ID
  async function ensureClient(name: string): Promise<string | null> {
    try {
      const res = await fetch('/api/clients/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (json.created) {
        fetchClients();
      }
      return json.data.id;
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) {
      toast.error('التاريخ مطلوب');
      return;
    }
    if (!form.vehicleId) {
      toast.error('المركبة مطلوبة');
      return;
    }

    // Validate orders - each must have a client name and package count
    const validOrders = form.orders.filter(
      (o) => o.clientName.trim() && o.packageCount > 0
    );
    if (validOrders.length === 0) {
      toast.error('يجب إضافة طلبية واحدة صالحة على الأقل (اسم الزبون وعدد الطرود)');
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Ensure all clients exist
      const resolvedOrders = await Promise.all(
        validOrders.map(async (o) => {
          let clientId = o.clientId;
          if (!clientId) {
            clientId = (await ensureClient(o.clientName.trim())) || '';
          }
          return {
            clientId,
            packageCount: o.packageCount,
            price: o.price > 0 ? o.price : undefined,
            description: o.description?.trim() || undefined,
          };
        })
      );

      const unresolved = resolvedOrders.find((o) => !o.clientId);
      if (unresolved) {
        throw new Error('فشل في تسجيل أحد الزبائن');
      }

      // Step 2: Create/update the shipment
      const body = {
        date: form.date,
        vehicleId: form.vehicleId,
        description: form.description.trim() || undefined,
        generator: form.generator.trim() || undefined,
        totalExpected: form.totalExpected ? parseInt(form.totalExpected) || undefined : undefined,
        status: form.status,
        orders: resolvedOrders,
      };

      if (editingShipment) {
        const res = await fetch(`/api/shipments/${editingShipment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في تحديث الشحنة');
        toast.success('تم تحديث الشحنة بنجاح');
      } else {
        const res = await fetch('/api/shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('فشل في إضافة الشحنة');
        toast.success('تم إضافة الشحنة بنجاح');
      }

      setDialogOpen(false);
      fetchShipments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل في حذف الشحنة');
      toast.success('تم حذف الشحنة بنجاح');
      fetchShipments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  }

  function handleClearFilters() {
    setFilterDate('');
    setFilterStatus('الكل');
    setFilterVehicleId('');
  }

  function handleSearch() {
    fetchShipments();
  }

  function getTotalPackages(shipment: Shipment): number {
    return shipment.orders.reduce((sum, o) => sum + o.packageCount, 0);
  }

  function getTotalRevenue(shipment: Shipment): number {
    return shipment.orders.reduce((sum, o) => sum + ((o as Record<string, unknown>).price as number || 0), 0);
  }

  function openPrintDialog(shipment: Shipment) {
    setPrintShipment(shipment);
    setPrintDialogOpen(true);
  }

  function handlePrint(mode: 'detailed' | 'summary') {
    setPrintMode(mode);
    setPrintDialogOpen(false);
    // Small delay to let React render the print view, then print
    setTimeout(() => {
      window.print();
    }, 200);
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm no-print">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-date" className="text-sm">التاريخ</Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">المركبة</Label>
              <Select value={filterVehicleId || 'all'} onValueChange={(v) => setFilterVehicleId(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="الكل" /></SelectTrigger>
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
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="bg-amber-500 hover:bg-amber-600 text-white flex-1">
                <Search className="size-4" />
                بحث
              </Button>
              <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                <X className="size-4" />
                مسح
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with Add Button */}
      <div className="flex items-center justify-between no-print">
        <Button onClick={openCreateDialog} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="size-4" />
          إضافة شحنة
        </Button>
      </div>

      {/* Shipments Table */}
      <Card className="bg-white dark:bg-gray-900 border shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg">الشحنات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : shipments.length > 0 ? (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشحنة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المولد</TableHead>
                    <TableHead>المركبة</TableHead>
                    <TableHead>عدد الطلبيات</TableHead>
                    <TableHead>السعة الكلية</TableHead>
                    <TableHead>المجموع المتوقع</TableHead>
                    <TableHead>الحصيلة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => {
                    const isExpanded = expandedShipment === shipment.id;
                    const totalPkgs = getTotalPackages(shipment);
                    const totalRev = getTotalRevenue(shipment);
                    return (
                      <>
                        <TableRow
                          key={shipment.id}
                          className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-900/10 no-print"
                          onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                        >
                          <TableCell className="font-medium">{shipment.number}</TableCell>
                          <TableCell>{formatDate(shipment.date)}</TableCell>
                          <TableCell>
                            {shipment.generator ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {shipment.generator}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">---</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{shipment.vehicle.registration}</div>
                            <div className="text-xs text-muted-foreground">{shipment.vehicle.ownerName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="size-3.5 text-muted-foreground" />
                              <span className="font-semibold">{shipment.orders.length}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-lg">{totalPkgs} <span className="text-xs font-normal text-muted-foreground">طرود</span></TableCell>
                          <TableCell>
                            {shipment.totalExpected != null && shipment.totalExpected > 0 ? (
                              <div>
                                <span className="font-bold">{shipment.totalExpected}</span>
                                <span className="text-xs text-muted-foreground mr-1">طرود</span>
                                {(() => {
                                  const diff = totalPkgs - shipment.totalExpected;
                                  if (diff === 0) return <span className="text-emerald-500 text-xs mr-1">(مطابق)</span>;
                                  return <span className={`text-xs mr-1 ${diff > 0 ? 'text-blue-500' : 'text-red-500'}`}>({diff > 0 ? `+${diff}` : diff})</span>;
                                })()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">---</span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                            {totalRev > 0 ? `${totalRev.toFixed(0)} د.م.` : '---'}
                          </TableCell>
                          <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(shipment)}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                title="تعديل"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPrintDialog(shipment)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="طباعة"
                              >
                                <Printer className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(shipment.id)}
                                disabled={deletingId === shipment.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="حذف"
                              >
                                {deletingId === shipment.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Expanded: show orders detail */}
                        {isExpanded && (
                          <TableRow key={`${shipment.id}-orders`} className="no-print">
                            <TableCell colSpan={10} className="bg-amber-50/30 dark:bg-amber-900/10 px-8 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                    تفاصيل الطلبيات ({shipment.orders.length})
                                  </p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="font-bold">العدد الكلي للطلبيات: <span className="text-amber-600 dark:text-amber-400">{shipment.orders.length}</span></span>
                                    <span className="font-bold">السعة الكلية: <span className="text-amber-600 dark:text-amber-400">{totalPkgs} طرود</span></span>
                                    {shipment.totalExpected != null && shipment.totalExpected > 0 && (
                                      <span className="font-bold">المجموع المتوقع: <span className="text-amber-600 dark:text-amber-400">{shipment.totalExpected}</span>
                                        {(() => {
                                          const diff = totalPkgs - shipment.totalExpected;
                                          if (diff === 0) return <span className="text-emerald-500 mr-1">(مطابق)</span>;
                                          return <span className={`mr-1 ${diff > 0 ? 'text-blue-500' : 'text-red-500'}`}>({diff > 0 ? `+${diff}` : diff})</span>;
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {shipment.orders.map((order, oi) => (
                                    <div
                                      key={order.id}
                                      className="border rounded-lg p-3 bg-white dark:bg-gray-800"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">طلبية {oi + 1}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {order.packageCount} طرود
                                        </Badge>
                                      </div>
                                      <p className="font-semibold text-sm">{order.client.name}</p>
                                      {(order as Record<string, unknown>).price as number > 0 && (
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                          {(order as Record<string, unknown>).price as number} د.م.
                                        </p>
                                      )}
                                      {order.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{order.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-base">لا توجد شحنات</p>
              <p className="text-sm mt-1">
                اضغط على &quot;إضافة شحنة&quot; لإضافة شحنة جديدة
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
              {editingShipment ? 'تعديل الشحنة' : 'إضافة شحنة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment-date">التاريخ <span className="text-red-500">*</span></Label>
                <Input
                  id="shipment-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>المركبة <span className="text-red-500">*</span></Label>
                <Select
                  value={form.vehicleId}
                  onValueChange={(val) => setForm({ ...form, vehicleId: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registration} - {v.driverName} ({v.ownerName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>حالة الشحنة</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_FORM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipment-desc">وصف الشحنة</Label>
                <Input
                  id="shipment-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="مثال: رحلة الدار البيضاء - الرباط"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipment-generator">المولد <span className="text-muted-foreground">(اختياري)</span></Label>
                <Input
                  id="shipment-generator"
                  value={form.generator}
                  onChange={(e) => setForm({ ...form, generator: e.target.value })}
                  placeholder="مثال: الدارة الكهربائية"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipment-total-expected">المجموع المتوقع <span className="text-muted-foreground">(اختياري)</span></Label>
                <Input
                  id="shipment-total-expected"
                  type="number"
                  min={0}
                  value={form.totalExpected}
                  onChange={(e) => setForm({ ...form, totalExpected: e.target.value })}
                  placeholder="العدد الكلي المتوقع للطرود"
                />
              </div>
            </div>

            {/* Orders Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">الطلبيات <span className="text-red-500">*</span></Label>
                <Button type="button" variant="outline" size="sm" onClick={addOrder}>
                  <Plus className="size-3.5 ml-1" />
                  إضافة طلبية
                </Button>
              </div>

              {form.orders.map((order, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      طلبية {index + 1}
                    </span>
                    {form.orders.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-red-500 hover:text-red-700"
                        onClick={() => removeOrder(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">اسم الزبون <span className="text-red-500">*</span></Label>
                    <ClientAutocomplete
                      value={order.clientName}
                      onChange={(clientId, clientName) =>
                        updateOrderClient(index, clientId, clientName)
                      }
                      clients={clients}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">عدد الطرود <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min={1}
                        value={order.packageCount || ''}
                        onChange={(e) => updateOrderField(index, 'packageCount', parseInt(e.target.value) || 0)}
                        placeholder="عدد الطرود"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">السعر (د.م.) <span className="text-muted-foreground">- اختياري</span></Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={order.price || ''}
                        onChange={(e) => updateOrderField(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="يُدخل لاحقاً"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">وصف (اختياري)</Label>
                      <Input
                        value={order.description}
                        onChange={(e) => updateOrderField(index, 'description', e.target.value)}
                        placeholder="وصف الطلبية"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Statistics Summary */}
            <div className="border rounded-xl p-4 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">الإحصائيات الحية</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{form.orders.filter(o => o.clientName.trim() && o.packageCount > 0).length}</p>
                  <p className="text-xs text-muted-foreground">العدد الكلي للطلبيات</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{form.orders.reduce((sum, o) => sum + (o.packageCount > 0 ? o.packageCount : 0), 0)}</p>
                  <p className="text-xs text-muted-foreground">السعة الكلية (طرود)</p>
                </div>
                {form.totalExpected && parseInt(form.totalExpected) > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{parseInt(form.totalExpected)}</p>
                    <p className="text-xs text-muted-foreground">المجموع المتوقع</p>
                  </div>
                )}
                {form.totalExpected && parseInt(form.totalExpected) > 0 && (
                  <div className="text-center">
                    {(() => {
                      const actual = form.orders.reduce((sum, o) => sum + (o.packageCount > 0 ? o.packageCount : 0), 0);
                      const expected = parseInt(form.totalExpected);
                      const diff = actual - expected;
                      return (
                        <>
                          <p className={`text-2xl font-bold ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {diff === 0 ? '=' : diff > 0 ? `+${diff}` : diff}
                          </p>
                          <p className="text-xs text-muted-foreground">الفرق</p>
                        </>
                      );
                    })()}
                  </div>
                )}
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
                {editingShipment ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Mode Selection Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>اختر نوع الطباعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <button
              type="button"
              onClick={() => handlePrint('detailed')}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-right hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">طباعة تفصيلية</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    طباعة الشحنة مع جميع تفاصيل البضائع والطلبيات وأسماء الزبائن والأسعار
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handlePrint('summary')}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-right hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <List className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">طباعة الحصيلة الكلية</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    طباعة الشحنة بإجمالي عدد الطرود والحصيلة المالية فقط بدون تفاصيل البضائع
                  </p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print View (hidden, shown only during print) */}
      {printShipment && (
        <ShipmentPrintView shipment={printShipment} mode={printMode} />
      )}
    </div>
  );
}