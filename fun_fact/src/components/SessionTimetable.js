// file: src/components/SessionTimetable.js
// Weekly schedule grid for staff: time-slot rows × day columns, with a chip per
// class in each cell (class + enrolled/capacity, coloured by fill). Clicking a
// chip opens that session's roster. Weekday and weekend use different slot sets,
// so they render as two grids.

'use client';

import { DAYS, DAY_NAMES, DAY_TIME_SLOTS, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { Users } from 'lucide-react';

const WEEKDAYS = [DAYS.MONDAY, DAYS.TUESDAY, DAYS.WEDNESDAY, DAYS.THURSDAY, DAYS.FRIDAY];
const WEEKEND = [DAYS.SATURDAY, DAYS.SUNDAY];
const WEEKDAY_SLOTS = DAY_TIME_SLOTS[DAYS.MONDAY];
const WEEKEND_SLOTS = DAY_TIME_SLOTS[DAYS.SATURDAY];

function fillClasses(pct) {
  if (pct >= 100) return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
  if (pct >= 50) return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
  return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
}

function Chip({ session, onClick }) {
  const pct = session.capacity > 0 ? Math.round((session.enrolledCount / session.capacity) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${session.category} — ${session.enrolledCount}/${session.capacity} enrolled`}
      className={`w-full flex items-center justify-between gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${fillClasses(pct)}`}
    >
      <span className="font-semibold">{session.category}</span>
      <span className="flex items-center gap-0.5 tabular-nums">
        <Users className="w-3 h-3" />
        {session.enrolledCount}/{session.capacity}
      </span>
    </button>
  );
}

function Grid({ days, slots, byCell, onOpenSession }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs font-medium text-gray-500 w-36">Time</th>
            {days.map((d) => (
              <th key={d} className="p-2 text-center text-xs font-semibold text-gray-600 min-w-[110px]">
                {DAY_NAMES[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot} className="border-t border-gray-100 align-top">
              <td className="p-2 text-xs text-gray-600 whitespace-nowrap">{TIME_SLOT_NAMES[slot]}</td>
              {days.map((d) => {
                const cell = byCell[`${d}_${slot}`] || [];
                return (
                  <td key={d} className="p-1">
                    {cell.length > 0 ? (
                      <div className="space-y-1">
                        {cell.map((s) => (
                          <Chip key={s.id} session={s} onClick={() => onOpenSession(s)} />
                        ))}
                      </div>
                    ) : (
                      <div className="h-8 rounded-md border border-dashed border-gray-100" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SessionTimetable({ sessions, onOpenSession }) {
  // Index sessions by day_timeSlot, keeping class order stable
  const byCell = {};
  for (const s of sessions) {
    const key = `${s.day}_${s.timeSlot}`;
    (byCell[key] ||= []).push(s);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Weekdays (Mon–Fri)</div>
        <Grid days={WEEKDAYS} slots={WEEKDAY_SLOTS} byCell={byCell} onOpenSession={onOpenSession} />
      </div>
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Weekend (Sat–Sun)</div>
        <Grid days={WEEKEND} slots={WEEKEND_SLOTS} byCell={byCell} onOpenSession={onOpenSession} />
      </div>
    </div>
  );
}
