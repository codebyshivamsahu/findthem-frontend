// src/components/features/AllCases.tsx
import { useAppStore } from '@/store';
import PersonCard from '@/components/ui/PersonCard';
import CaseDetail from '@/components/ui/CaseDetail';
import { getStatusLabel, getStatusColor, formatDate, calculateDaysMissing, cn } from '@/lib/utils';
import { CaseStatus } from '@/types';

const STATUSES: { status: CaseStatus | 'all'; label: string }[] = [
  { status: 'all',              label: 'All' },
  { status: 'open',             label: 'Open' },
  { status: 'investigating',    label: 'Investigating' },
  { status: 'sighting_reported',label: 'Sighting' },
  { status: 'found',            label: 'Found' },
  { status: 'closed',           label: 'Closed' },
];

export default function AllCases() {
  const { cases, filteredCases, selectedCase, selectCase, filters, setFilters } = useAppStore();
  const statusFilter = (filters.status as CaseStatus | 'all') || 'all';

  const displayed = statusFilter === 'all'
    ? cases
    : cases.filter(c => c.status === statusFilter);

  return (
    <div className="space-y-5">
      {/* Status tabs */}
      <div className="card flex gap-1 p-1.5 w-fit">
        {STATUSES.map(({ status, label }) => {
          const count = status === 'all' ? cases.length : cases.filter(c => c.status === status).length;
          const active = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status: status === 'all' ? undefined : status as CaseStatus })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                active ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {label}
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full', active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayed.map(p => (
          <PersonCard key={p.id} person={p} onClick={() => selectCase(p)} />
        ))}
      </div>

      {displayed.length === 0 && (
        <div className="card p-12 text-center col-span-full">
          <p className="text-gray-400">No cases with this status</p>
        </div>
      )}

      {selectedCase && <CaseDetail person={selectedCase} onClose={() => selectCase(null)} />}
    </div>
  );
}
