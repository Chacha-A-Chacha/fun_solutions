// file: src/components/SessionCapacityMatrix.js
// Admin-only editor for per-(day, timeSlot, licence class) session capacity.
// One licence class is edited at a time via two grids (weekday / weekend),
// since weekday and weekend use different time-slot sets. Capacity 0 = the
// class is not offered at that slot. Bulk-saves only changed cells.

'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  DAYS,
  DAY_NAMES,
  DAY_TIME_SLOTS,
  TIME_SLOT_NAMES,
  LICENCE_CLASSES,
  LICENCE_CLASS_NAMES,
} from '@/app/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Grid3x3, Save, RefreshCcw, AlertTriangle, Loader2 } from 'lucide-react';

const WEEKDAYS = [DAYS.MONDAY, DAYS.TUESDAY, DAYS.WEDNESDAY, DAYS.THURSDAY, DAYS.FRIDAY];
const WEEKEND = [DAYS.SATURDAY, DAYS.SUNDAY];
const WEEKDAY_SLOTS = DAY_TIME_SLOTS[DAYS.MONDAY];
const WEEKEND_SLOTS = DAY_TIME_SLOTS[DAYS.SATURDAY];

export default function SessionCapacityMatrix() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState('B2');
  // edits keyed by session id → string value from the input
  const [edits, setEdits] = useState({});
  const [bulkValue, setBulkValue] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/session-capacities');
      setRows(data.rows || []);
    } catch {
      toast.error('Failed to load capacity matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Switching class discards uncommitted edits (they belong to the old class view)
  useEffect(() => { setEdits({}); setBulkValue(''); }, [category]);

  // Lookup for the selected class: `${day}_${timeSlot}` → row
  const bySlot = useMemo(() => {
    const map = {};
    for (const r of rows) {
      if (r.category === category) map[`${r.day}_${r.timeSlot}`] = r;
    }
    return map;
  }, [rows, category]);

  const cellValue = (row) =>
    row && edits[row.id] !== undefined ? edits[row.id] : String(row?.capacity ?? 0);

  const changed = useMemo(() => {
    const out = [];
    for (const [id, val] of Object.entries(edits)) {
      const row = rows.find((r) => r.id === id);
      if (!row) continue;
      if (val !== '' && Number(val) !== row.capacity) out.push({ id, capacity: Number(val) });
    }
    return out;
  }, [edits, rows]);

  const setCell = (id, val) => {
    // allow only non-negative integers (or empty while typing)
    if (val !== '' && !/^\d+$/.test(val)) return;
    setEdits((prev) => ({ ...prev, [id]: val }));
  };

  const applyBulk = () => {
    if (bulkValue === '' || !/^\d+$/.test(bulkValue)) {
      toast.error('Enter a whole number to apply to all slots');
      return;
    }
    const next = {};
    for (const r of rows) {
      if (r.category === category) next[r.id] = bulkValue;
    }
    setEdits(next);
  };

  const save = async () => {
    if (changed.length === 0) return;
    setSaving(true);
    try {
      const { data } = await axios.patch('/api/admin/session-capacities', { updates: changed });
      // reflect saved values locally, then clear edits
      const savedMap = Object.fromEntries(changed.map((c) => [c.id, c.capacity]));
      setRows((prev) => prev.map((r) => (savedMap[r.id] !== undefined ? { ...r, capacity: savedMap[r.id] } : r)));
      setEdits({});
      setBulkValue('');
      toast.success(data.message || 'Capacities updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save capacities');
    } finally {
      setSaving(false);
    }
  };

  const renderGrid = (days, slots, title) => (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left font-medium text-gray-500 w-40">Time</th>
              {days.map((d) => (
                <th key={d} className="p-2 text-center font-medium text-gray-600">{DAY_NAMES[d].slice(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-t border-gray-100">
                <td className="p-2 text-gray-600 whitespace-nowrap">{TIME_SLOT_NAMES[slot]}</td>
                {days.map((d) => {
                  const row = bySlot[`${d}_${slot}`];
                  const val = cellValue(row);
                  const over = row && Number(val) < row.enrolledCount;
                  const open = Number(val || 0) > 0;
                  return (
                    <td key={d} className="p-1 text-center">
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={val}
                          disabled={!row || saving}
                          onChange={(e) => row && setCell(row.id, e.target.value)}
                          className={`h-9 w-16 mx-auto text-center ${
                            over
                              ? 'border-red-400 text-red-600 font-medium'
                              : open
                                ? 'border-blue-300 bg-blue-50 text-blue-900 font-medium'
                                : 'text-gray-300'
                          }`}
                          title={over ? `Below current enrolment (${row.enrolledCount})` : (open ? 'Open' : 'Closed (not offered)')}
                        />
                        {row?.enrolledCount > 0 && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">{row.enrolledCount} booked</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Grid3x3 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900">Session capacity by class</div>
            <p className="text-xs text-gray-500 mt-0.5">
              Slots offered per licence class at each day &amp; time. Set to 0 to close a slot for a class.
            </p>
          </div>
        </div>

        {/* Class selector + bulk apply */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LICENCE_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>{LICENCE_CLASS_NAMES[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Set all…"
              value={bulkValue}
              onChange={(e) => (/^\d*$/.test(e.target.value) ? setBulkValue(e.target.value) : null)}
              className="h-9 w-28"
            />
            <Button variant="outline" size="sm" onClick={applyBulk} disabled={saving}>
              Apply to all
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            {renderGrid(WEEKDAYS, WEEKDAY_SLOTS, 'Weekdays (Mon–Fri)')}
            {renderGrid(WEEKEND, WEEKEND_SLOTS, 'Weekend (Sat–Sun)')}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            {changed.length > 0 ? (
              <>
                <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                  {changed.length} unsaved
                </Badge>
                <span className="hidden sm:inline">for class {category}</span>
              </>
            ) : (
              <span>No unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={load} disabled={saving}>
              <RefreshCcw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            <Button
              size="sm"
              onClick={save}
              disabled={saving || changed.length === 0}
              className="bg-blue-900 hover:bg-blue-800"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
                : <><Save className="w-4 h-4 mr-1.5" /> Save changes</>}
            </Button>
          </div>
        </div>

        {changed.some((c) => {
          const row = rows.find((r) => r.id === c.id);
          return row && c.capacity < row.enrolledCount;
        }) && (
          <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-md p-2 text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Some slots are set below their current enrolment. Saving won&apos;t cancel existing bookings — it only stops new ones.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
