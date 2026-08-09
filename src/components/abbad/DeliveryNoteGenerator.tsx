'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText, Printer, Loader2, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Client {
  id: string;
  name: string;
}

interface SingleDeliveryNote {
  date: string;
  client: { id: string; name: string };
  totalPackages: number;
  orderCount: number;
}

interface ClientDayNote {
  client: { id: string; name: string };
  totalPackages: number;
  orderCount: number;
  shipments: string[];
}

interface AllDeliveryNotes {
  date: string;
  mode: 'all';
  notes: ClientDayNote[];
  totalClients: number;
  totalPackages: number;
}

type NoteData = SingleDeliveryNote | AllDeliveryNotes;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function isAllMode(data: NoteData): data is AllDeliveryNotes {
  return 'mode' in data && data.mode === 'all';
}

function HalfPageNote({ note, date }: { note: ClientDayNote; date: string; index: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '50vh',
        padding: '20px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ccc',
        pageBreakInside: 'avoid',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', letterSpacing: '1px', margin: 0 }}>
          شركة عباد للنقل
        </h2>
        <div style={{ width: '80px', height: '1.5px', backgroundColor: '#333', margin: '4px auto' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', textDecoration: 'underline', textDecorationOffset: '3px', margin: 0 }}>
          وصل تسليم
        </h3>
      </div>

      <div style={{ fontSize: '13px', lineHeight: '1.8', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontWeight: 'bold', color: '#555', minWidth: '80px' }}>التاريخ:</span>
          <span style={{ fontWeight: '500' }}>{formatDate(date)}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontWeight: 'bold', color: '#555', minWidth: '80px' }}>اسم الزبون:</span>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{note.client.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontWeight: 'bold', color: '#555', minWidth: '80px' }}>عدد الطلبيات:</span>
          <span style={{ fontWeight: 'bold' }}>{note.orderCount}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontWeight: 'bold', color: '#555', minWidth: '80px' }}>عدد الطرود:</span>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#000' }}>{note.totalPackages}</span>
        </div>
        {note.shipments.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontWeight: 'bold', color: '#555', minWidth: '80px' }}>الشحنات:</span>
            <span style={{ fontSize: '11px', color: '#666' }}>{note.shipments.join(' | ')}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ fontWeight: 'bold', color: '#555', minWidth: '140px' }}>المبلغ الواجب أدائه:</span>
        <div style={{ borderBottom: '1.5px dotted #999', flex: 1, paddingBottom: '2px', minHeight: '20px' }}></div>
        <span style={{ color: '#666' }}>د.م.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', color: '#555', fontSize: '11px', marginBottom: '4px' }}>توقيع الزبون</p>
          <div style={{ borderBottom: '1.5px solid #333', paddingBottom: '2px' }}>&nbsp;</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', color: '#555', fontSize: '11px', marginBottom: '4px' }}>توقيع الناقل</p>
          <div style={{ borderBottom: '1.5px solid #333', paddingBottom: '2px' }}>&nbsp;</div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryNoteGenerator() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [mode, setMode] = useState<'single' | 'all'>('single');
  const [loading, setLoading] = useState(false);
  const [noteData, setNoteData] = useState<NoteData | null>(null);

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
    fetchClients();
  }, [fetchClients]);

  async function handleGenerate() {
    if (!selectedDate) {
      toast.error('التاريخ مطلوب');
      return;
    }
    if (mode === 'single' && !selectedClientId) {
      toast.error('اسم الزبون مطلوب');
      return;
    }

    try {
      setLoading(true);
      setNoteData(null);

      const params = new URLSearchParams({ date: selectedDate });
      if (mode === 'single') {
        params.set('clientId', selectedClientId);
      } else {
        params.set('allClients', 'true');
      }

      const res = await fetch(`/api/delivery-note?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'فشل في توليد وصل التسليم' }));
        throw new Error(err.message || 'فشل في توليد وصل التسليم');
      }
      const json = await res.json();
      setNoteData(json.data);

      if (mode === 'all') {
        const allData = json.data as AllDeliveryNotes;
        toast.success(`تم توليد ${allData.notes.length} وصل تسليم ل ${allData.totalClients} زبون`);
      } else {
        toast.success('تم توليد وصل التسليم بنجاح');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  function getPairedNotes(): Array<[ClientDayNote, ClientDayNote?]> {
    if (!noteData || !isAllMode(noteData)) return [];
    const pairs: Array<[ClientDayNote, ClientDayNote?]> = [];
    for (let i = 0; i < noteData.notes.length; i += 2) {
      pairs.push([noteData.notes[i], noteData.notes[i + 1]]);
    }
    return pairs;
  }

  const pairedNotes = getPairedNotes();

  const singleMode = noteData && !isAllMode(noteData);
  const allMode = noteData && isAllMode(noteData);

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-900 border shadow-sm no-print">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-lg">توليد وصل التسليم</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setMode('single'); setNoteData(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                mode === 'single'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              <User className="size-4" />
              زبون واحد
            </button>
            <button
              type="button"
              onClick={() => { setMode('all'); setNoteData(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                mode === 'all'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Users className="size-4" />
              جميع زبائن اليوم
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dn-date">
                التاريخ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dn-date"
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setNoteData(null); }}
                required
              />
            </div>
            {mode === 'single' && (
              <div className="space-y-2">
                <Label>اسم الزبون <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
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
            )}
          </div>

          {mode === 'all' && (
            <p className="text-xs text-muted-foreground mt-2">
              سيتم إنشاء وصل تسليم لكل زبون لديه طلبيات في هذا اليوم (مجمعة عبر جميع الشحنات). كل ورقة A4 تحتوي على توصيلين.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading && <Loader2 className="size-4 animate-spin ml-2" />}
              <FileText className="size-4 ml-2" />
              {mode === 'all' ? 'توليد تواصيل اليوم' : 'توليد وصل التسليم'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {singleMode && (
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Printer className="size-4 ml-2" />
              طباعة
            </Button>
          </div>
          <div
            id="delivery-note-print"
            className="border-2 border-gray-400 p-10 bg-white"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: '2px' }}>
                شركة عباد للنقل
              </h1>
              <div className="w-32 h-0.5 bg-gray-400 mx-auto mt-3" />
            </div>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800 underline underline-offset-4">
                وصل تسليم
              </h2>
            </div>
            <div className="mb-10 space-y-4 text-lg">
              <div className="flex gap-4">
                <span className="font-bold text-gray-700 min-w-[120px]">التاريخ:</span>
                <span className="text-gray-900">{formatDate(noteData.date)}</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-gray-700 min-w-[120px]">اسم الزبون:</span>
                <span className="text-gray-900 font-semibold">{noteData.client.name}</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-gray-700 min-w-[120px]">عدد الطلبيات:</span>
                <span className="text-gray-900 font-bold text-xl">{noteData.totalPackages}</span>
              </div>
            </div>
            <div className="mb-12 flex items-center gap-4 text-lg">
              <span className="font-bold text-gray-700 min-w-[200px]">المبلغ الواجب أدائه:</span>
              <div className="border-b-2 border-dotted border-gray-400 flex-1 pb-1" style={{ minHeight: '35px' }}></div>
              <span className="text-gray-500">د.م.</span>
            </div>
            <div className="grid grid-cols-2 gap-12 mt-20">
              <div className="text-center">
                <p className="font-bold text-gray-700 mb-3">توقيع الزبون</p>
                <div className="border-b-2 border-gray-400 pb-1">&nbsp;</div>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-700 mb-3">توقيع الناقل</p>
                <div className="border-b-2 border-gray-400 pb-1">&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {allMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between no-print">
            <div className="text-sm text-muted-foreground">
              <span className="font-bold text-gray-700 dark:text-gray-300">{noteData.totalClients}</span> زبون -{' '}
              <span className="font-bold text-gray-700 dark:text-gray-300">{noteData.totalPackages}</span> طرد إجمالي -{' '}
              <span className="font-bold text-gray-700 dark:text-gray-300">{pairedNotes.length}</span> ورقة
            </div>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Printer className="size-4 ml-2" />
              طباعة جميع التوصيلات
            </Button>
          </div>

          <div className="print-only-area" dir="rtl">
            {pairedNotes.map((pair, pageIdx) => (
              <div
                key={pageIdx}
                style={{
                  pageBreakAfter: pageIdx < pairedNotes.length - 1 ? 'always' : 'auto',
                  width: '100%',
                }}
              >
                <HalfPageNote note={pair[0]} date={noteData.date} index={pageIdx * 2} />
                {pair[1] && (
                  <HalfPageNote note={pair[1]} date={noteData.date} index={pageIdx * 2 + 1} />
                )}
              </div>
            ))}
          </div>

          <div className="no-print space-y-6">
            <h3 className="font-bold text-lg">معاينة التوصيلات ({noteData.notes.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {noteData.notes.map((note, idx) => (
                <div
                  key={note.client.id}
                  className="border rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">توصيل {idx + 1}</span>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      {note.totalPackages} طرود
                    </span>
                  </div>
                  <p className="font-bold">{note.client.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.orderCount} طلبيات - الشحنات: {note.shipments.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
