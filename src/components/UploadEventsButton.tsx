import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useBookings, type Sound } from '../hooks/useBookings';
import { CITIES } from '../data/cities';

function toISODate(v: unknown): string {
  if (v == null || v === '') return '';
  if (typeof v === 'number') {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(s);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    let y = dmy[3];
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}-${d}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function toInt(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function pick(row: Record<string, unknown>, keys: string[]): unknown {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_\-/()]/g, '');
  const map: Record<string, unknown> = {};
  for (const k of Object.keys(row)) map[norm(k)] = row[k];
  for (const k of keys) {
    const v = map[norm(k)];
    if (v != null && v !== '') return v;
  }
  return undefined;
}

function findCity(name: string) {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  return (
    CITIES.find((c) => c.name.toLowerCase() === n) ??
    CITIES.find((c) => n.includes(c.name.toLowerCase())) ??
    null
  );
}

function normaliseBrand(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const low = s.toLowerCase();
  if (low.includes('hospital')) return 'Hospitality';
  if (low.includes('korsakov')) return 'Korsakov';
  if (low.includes('ukf')) return 'UKF';
  if (low.includes('undivide')) return 'Undivide';
  return s;
}

export default function UploadEventsButton({ className, label = 'Upload', icon = '⬆️' }: { className?: string; label?: string; icon?: string } = {}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const add = useBookings((s) => s.add);
  const [status, setStatus] = useState<string>('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Reading…');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      let imported = 0;
      let skipped = 0;
      const unknownCities = new Set<string>();

      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        const fallbackBrand = /hospitality/i.test(sheetName)
          ? 'Hospitality'
          : /korsakov/i.test(sheetName)
            ? 'Korsakov'
            : /ukf/i.test(sheetName)
              ? 'UKF'
              : '';

        for (const r of rows) {
          const date = toISODate(
            pick(r, ['date', 'show date', 'event date', 'announce date']),
          );
          const venue = String(pick(r, ['venue', 'location']) ?? '').trim();
          const cityName = String(pick(r, ['city', 'town', 'market']) ?? '').trim();
          const showName = String(
            pick(r, ['show name', 'show', 'event', 'event name', 'name']) ?? '',
          ).trim();
          if (!date && !venue && !showName) {
            skipped++;
            continue;
          }

          const brand = normaliseBrand(pick(r, ['brand', 'promoter']) ?? fallbackBrand);
          const cap = toInt(pick(r, ['capacity', 'cap', 'no tickets']));
          const sold = toInt(pick(r, ['tickets sold', 'sold', 'on-sale', 'ticketssold']));
          const statusVal = String(pick(r, ['status']) ?? '').trim();
          const ref = String(pick(r, ['und ref', 'ref', 'reference']) ?? '').trim();
          const notes = String(pick(r, ['notes', 'comments']) ?? '').trim();
          const runtimes = String(pick(r, ['run times', 'run times 24hr', 'times']) ?? '').trim();
          const share = String(pick(r, ['undivide share', 'share']) ?? '').trim();
          const bookingLead = String(pick(r, ['booking lead']) ?? '').trim();
          const promoLead = String(pick(r, ['promo lead']) ?? '').trim();
          const advanceLead = String(pick(r, ['advance lead']) ?? '').trim();
          const accountsLead = String(pick(r, ['accounts lead']) ?? '').trim();
          const showSheet = String(pick(r, ['show sheet link', 'show sheet']) ?? '').trim();

          const matched = findCity(cityName);
          if (!matched && cityName) unknownCities.add(cityName);

          const notesBlocks = [
            ref && `Ref: ${ref}`,
            statusVal && `Status: ${statusVal}`,
            runtimes && `Run: ${runtimes}`,
            share && `Undivide share: ${share}`,
            bookingLead && `Booking: ${bookingLead}`,
            promoLead && `Promo: ${promoLead}`,
            advanceLead && `Advance: ${advanceLead}`,
            accountsLead && `Accounts: ${accountsLead}`,
            showSheet && `Sheet: ${showSheet}`,
            notes,
          ].filter(Boolean).join(' · ');

          add({
            city: matched?.name ?? cityName ?? 'Unknown',
            country: matched?.country ?? '',
            lat: matched?.lat ?? 0,
            lng: matched?.lng ?? 0,
            venue: venue || '—',
            date: date || new Date().toISOString().slice(0, 10),
            promoter: brand || sheetName,
            capacity: cap,
            ticketsSold: sold,
            sound: 'All Styles' as Sound,
            lineup: showName,
            notes: notesBlocks,
          });
          imported++;
        }
      }

      const msg =
        `Imported ${imported}` +
        (skipped ? ` · skipped ${skipped}` : '') +
        (unknownCities.size
          ? ` · ${unknownCities.size} unknown cities (no map pin)`
          : '');
      setStatus(msg);
      setTimeout(() => setStatus(''), 6000);
    } catch (err) {
      console.error(err);
      setStatus('Failed to read file');
      setTimeout(() => setStatus(''), 4000);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className={className ?? 'text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-full flex items-center gap-1'}
        title="Bulk import shows from an .xlsx file"
      >
        <span>{icon}</span> <span>{label}</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        className="hidden"
      />
      {status && (
        <div className="fixed top-14 right-4 z-50 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow">
          {status}
        </div>
      )}
    </>
  );
}

