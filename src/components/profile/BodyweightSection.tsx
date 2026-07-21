import { useState, useMemo } from 'react';
import {
  useBodyweightEntries,
  useLogBodyweight,
  useUpdateBodyweight,
  useDeleteBodyweight,
} from '@/hooks/useBodyweight';
import { useUnitPreference } from '@/hooks/useUnitPreference';

// =============================================================================
// BodyweightChart — SVG line chart showing last 30 entries as trend
// =============================================================================

function BodyweightChart({ entries }: { entries: { entry_date: string; weight_kg: number }[] }) {
  const { kgToDisplay, weightLabel } = useUnitPreference();

  // Take last 30 entries and reverse so chronological (oldest → newest)
  const chartData = useMemo(() => {
    const recent = entries.slice(0, 30).reverse();
    return recent.map((e) => ({
      date: e.entry_date,
      value: kgToDisplay(e.weight_kg),
    }));
  }, [entries, kgToDisplay]);

  if (chartData.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-400">
        Log at least 2 entries to see a trend chart
      </div>
    );
  }

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const padding = 8;
  const width = 320;
  const height = 120;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span>{chartData[0].date}</span>
        <span>{chartData[chartData.length - 1].date}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
        aria-label={`Bodyweight trend chart in ${weightLabel}`}
        role="img"
      >
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding}
          x2={width - padding}
          y2={padding}
          stroke="#374151"
          strokeWidth="0.5"
        />
        <line
          x1={padding}
          y1={padding + chartHeight / 2}
          x2={width - padding}
          y2={padding + chartHeight / 2}
          stroke="#374151"
          strokeWidth="0.5"
        />
        <line
          x1={padding}
          y1={padding + chartHeight}
          x2={width - padding}
          y2={padding + chartHeight}
          stroke="#374151"
          strokeWidth="0.5"
        />
        {/* Trend line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {points.map((point, i) => {
          const [x, y] = point.split(',');
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.5"
              fill="#818cf8"
              stroke="#1f2937"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
        <span>
          {minVal.toFixed(1)} {weightLabel}
        </span>
        <span>
          {maxVal.toFixed(1)} {weightLabel}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// BodyweightForm — input weight + date, log new entry
// =============================================================================

function BodyweightForm({
  defaultWeight,
}: {
  defaultWeight: number | null;
}) {
  const { weightLabel, inputToKg, kgToDisplay } = useUnitPreference();
  const logBodyweight = useLogBodyweight();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState(() =>
    defaultWeight !== null ? String(kgToDisplay(defaultWeight)) : '',
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numWeight = parseFloat(weight);
    if (!weight || isNaN(numWeight) || numWeight <= 0) {
      setError('Please enter a valid weight');
      return;
    }

    try {
      await logBodyweight.mutateAsync({
        weight_kg: inputToKg(numWeight),
        entry_date: date,
      });
      // Reset weight to logged value (will become new default on next render)
      setWeight(String(numWeight));
      setDate(today);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log bodyweight');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <label htmlFor="bw-weight" className="mb-1 block text-sm font-medium text-gray-300">
            Weight ({weightLabel})
          </label>
          <input
            id="bw-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={`e.g. ${weightLabel === 'kg' ? '70.0' : '154.0'}`}
            className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-base text-white placeholder:text-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="w-[130px] shrink-0">
          <label htmlFor="bw-date" className="mb-1 block text-sm font-medium text-gray-300">
            Date
          </label>
          <input
            id="bw-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-2.5 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={logBodyweight.isPending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {logBodyweight.isPending ? 'Logging...' : 'Log Bodyweight'}
      </button>
    </form>
  );
}

// =============================================================================
// BodyweightList — chronological entries with edit/delete
// =============================================================================

interface EditingState {
  id: string;
  weight: string;
  date: string;
}

function BodyweightList({
  entries,
}: {
  entries: { id: string; weight_kg: number; entry_date: string }[];
}) {
  const { formatWeight, inputToKg, kgToDisplay, weightLabel } = useUnitPreference();
  const updateBodyweight = useUpdateBodyweight();
  const deleteBodyweight = useDeleteBodyweight();

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function startEdit(entry: { id: string; weight_kg: number; entry_date: string }) {
    setEditing({
      id: entry.id,
      weight: String(kgToDisplay(entry.weight_kg)),
      date: entry.entry_date,
    });
    setDeleteConfirmId(null);
  }

  async function saveEdit() {
    if (!editing) return;
    const numWeight = parseFloat(editing.weight);
    if (isNaN(numWeight) || numWeight <= 0) return;

    await updateBodyweight.mutateAsync({
      id: editing.id,
      weight_kg: inputToKg(numWeight),
      entry_date: editing.date,
    });
    setEditing(null);
  }

  async function confirmDelete(id: string) {
    await deleteBodyweight.mutateAsync(id);
    setDeleteConfirmId(null);
  }

  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        No bodyweight entries yet. Log your first one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-800">
      {entries.map((entry) => (
        <li key={entry.id} className="py-3">
          {editing?.id === entry.id ? (
            // Edit mode
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={editing.weight}
                  onChange={(e) => setEditing({ ...editing, weight: e.target.value })}
                  className="w-24 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label={`Weight in ${weightLabel}`}
                />
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label="Entry date"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={updateBodyweight.isPending}
                  className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-600 active:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : deleteConfirmId === entry.id ? (
            // Delete confirmation
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">Delete this entry?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => confirmDelete(entry.id)}
                  disabled={deleteBodyweight.isPending}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 active:bg-red-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-600 active:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Display mode
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-100">
                  {formatWeight(entry.weight_kg)}
                </span>
                <span className="ml-3 text-sm text-gray-400">{entry.entry_date}</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(entry)}
                  className="rounded p-2.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 active:bg-gray-700 transition-colors"
                  aria-label={`Edit entry for ${entry.entry_date}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteConfirmId(entry.id); setEditing(null); }}
                  className="rounded p-2.5 text-gray-500 hover:bg-red-950 hover:text-red-400 active:bg-red-900 transition-colors"
                  aria-label={`Delete entry for ${entry.entry_date}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// =============================================================================
// BodyweightSection — parent component combining Form, Chart, and List
// =============================================================================

export default function BodyweightSection() {
  const { data: entries, isLoading, isError } = useBodyweightEntries();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-100">Bodyweight</h2>
        <div className="flex items-center justify-center py-8">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-100">Bodyweight</h2>
        <p className="text-sm text-red-400">Failed to load bodyweight entries.</p>
      </div>
    );
  }

  const entryList = entries ?? [];
  const mostRecentWeight = entryList.length > 0 ? entryList[0].weight_kg : null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-100">Bodyweight</h2>

      {/* Form to log new entry */}
      <BodyweightForm defaultWeight={mostRecentWeight} />

      {/* Trend chart */}
      <BodyweightChart entries={entryList} />

      {/* Entry list */}
      <BodyweightList entries={entryList} />
    </section>
  );
}
