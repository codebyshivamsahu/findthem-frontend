// src/components/layout/Header.tsx
import { Bell, Search, Menu, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store';
import { useState } from 'react';

const VIEW_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  search:     'Search Cases',
  report:     'Report Missing Person',
  map:        'Live Sighting Map',
  heatmap:    'Case Density Heatmap',
  sightings:  'Sighting Reports',
  alerts:     'Alerts & Notifications',
  statistics: 'Public Statistics',
  cases:      'All Cases',
  settings:   'Settings',
  team:       'Team',
  profile:    'My Profile',
  age:        'Age Progression',
  timeline:   'Case Timeline',
  pdf:        'PDF Report Generator',
};

export default function Header() {
  const { activeView, toggleSidebar, currentUser, setActiveView, setFilters, filters } = useAppStore();
  const [localQuery, setLocalQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, query: localQuery });
    setActiveView('search');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center gap-4 px-6 sticky top-0 z-40">
      <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
        <Menu size={18} />
      </button>

      <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
        {VIEW_TITLES[activeView] || activeView}
      </h1>

      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-6 hidden md:flex">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            placeholder="Search by name, case ID, location..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <button onClick={() => setActiveView('alerts')}
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        <button onClick={() => setActiveView('alerts')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
          <ShieldAlert size={13} className="text-red-600" />
          <span className="text-xs font-semibold text-red-600">Emergency Alert</span>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        {currentUser && (
          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center cursor-pointer"
            title={currentUser.name} onClick={() => setActiveView('profile')}>
            <span className="text-white text-sm font-bold">{currentUser.name.charAt(0)}</span>
          </div>
        )}
      </div>
    </header>
  );
}
