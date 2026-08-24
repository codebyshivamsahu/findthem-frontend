// src/components/features/SearchCases.tsx
import { useState } from 'react';
import { useAppStore } from '@/store';
import PersonCard from '@/components/ui/PersonCard';
import CaseDetail from '@/components/ui/CaseDetail';
import { INDIAN_STATES } from '@/lib/mockData';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CaseStatus, Gender } from '@/types';

export default function SearchCases() {
  const { filteredCases, filters, setFilters, selectedCase, selectCase } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.query || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, query: localQuery });
  };

  const clearFilters = () => {
    setFilters({});
    setLocalQuery('');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            placeholder="Search by name, case ID, location, district…"
            className="input pl-11 h-12"
          />
          {localQuery && (
            <button type="button" onClick={() => { setLocalQuery(''); setFilters({ ...filters, query: '' }); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary px-6 h-12">Search</button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`relative btn-secondary h-12 px-4 flex items-center gap-2 ${showFilters ? 'border-orange-300 bg-orange-50 text-orange-700' : ''}`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Filter Cases</h3>
            <button onClick={clearFilters} className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={filters.status || ''}
                onChange={e => setFilters({ ...filters, status: e.target.value as CaseStatus || undefined })}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="sighting_reported">Sighting Reported</option>
                <option value="found">Found</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="label">Gender</label>
              <select
                className="input"
                value={filters.gender || ''}
                onChange={e => setFilters({ ...filters, gender: e.target.value as Gender || undefined })}
              >
                <option value="">Any gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">State</label>
              <select
                className="input"
                value={filters.state || ''}
                onChange={e => setFilters({ ...filters, state: e.target.value || undefined })}
              >
                <option value="">All states</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Age Range</label>
              <div className="flex gap-2">
                <input
                  type="number" placeholder="Min" className="input"
                  value={filters.ageMin || ''}
                  onChange={e => setFilters({ ...filters, ageMin: e.target.value ? +e.target.value : undefined })}
                />
                <input
                  type="number" placeholder="Max" className="input"
                  value={filters.ageMax || ''}
                  onChange={e => setFilters({ ...filters, ageMax: e.target.value ? +e.target.value : undefined })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-800">{filteredCases.length}</span> cases
          {filters.query && <span> for &quot;<span className="text-orange-600">{filters.query}</span>&quot;</span>}
        </p>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none">
          <option>Sort: Most Recent</option>
          <option>Sort: Oldest First</option>
          <option>Sort: Name A-Z</option>
        </select>
      </div>

      {/* Results grid */}
      {filteredCases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCases.map(p => (
            <PersonCard key={p.id} person={p} onClick={() => selectCase(p)} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Search size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No cases found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          <button onClick={clearFilters} className="btn-primary mt-4 text-sm">Clear filters</button>
        </div>
      )}

      {selectedCase && <CaseDetail person={selectedCase} onClose={() => selectCase(null)} />}
    </div>
  );
}
