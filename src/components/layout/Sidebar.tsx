// src/components/layout/Sidebar.tsx
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Search, PlusCircle, MapPin, Bell,
  BarChart2, Settings, LogOut, ChevronLeft, ChevronRight,
  Shield, Users, FileText, Eye, UserCircle, Flame,
  Clock, Wand2, Map,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard'        },
  { id: 'search',     icon: Search,          label: 'Search Cases'     },
  { id: 'report',     icon: PlusCircle,      label: 'Report Missing'   },
  { id: 'map',        icon: MapPin,          label: 'Live Map'         },
  { id: 'heatmap',    icon: Map,             label: 'Heatmap'          },
  { id: 'sightings',  icon: Eye,             label: 'Sightings'        },
  { id: 'timeline',   icon: Clock,           label: 'Case Timeline'    },
  { id: 'age',        icon: Wand2,           label: 'Age Progression'  },
  { id: 'pdf',        icon: FileText,        label: 'PDF Reports'      },
  { id: 'alerts',     icon: Bell,            label: 'Alerts'           },
  { id: 'statistics', icon: BarChart2,       label: 'Statistics'       },
  { id: 'cases',      icon: Flame,           label: 'All Cases'        },
];

const BOTTOM_ITEMS = [
  { id: 'team',     icon: Users,      label: 'Team'     },
  { id: 'profile',  icon: UserCircle, label: 'Profile'  },
  { id: 'settings', icon: Settings,   label: 'Settings' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, activeView, setActiveView, currentUser, logout } = useAppStore();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-white border-r border-gray-100 z-50 flex flex-col transition-all duration-300',
      sidebarOpen ? 'w-64' : 'w-16'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 flex-shrink-0">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              Find Them India
            </p>
            <p className="text-[10px] text-orange-600 font-medium tracking-wide uppercase">Missing Persons Portal</p>
          </div>
        )}
        <button onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon     = item.icon;
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={cn('nav-link w-full', isActive ? 'nav-link-active' : 'nav-link-inactive', !sidebarOpen && 'justify-center')}
              title={!sidebarOpen ? item.label : undefined}>
              <Icon size={17} className="flex-shrink-0" />
              {sidebarOpen && <span className="flex-1 text-left text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5 flex-shrink-0">
        {BOTTOM_ITEMS.map(item => {
          const Icon     = item.icon;
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={cn('nav-link w-full', isActive ? 'nav-link-active' : 'nav-link-inactive', !sidebarOpen && 'justify-center')}
              title={!sidebarOpen ? item.label : undefined}>
              <Icon size={17} />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}

        {currentUser && (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl bg-orange-50 border border-orange-100',
            !sidebarOpen && 'justify-center px-2'
          )}>
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
              onClick={() => setActiveView('profile')}>
              <span className="text-white text-xs font-bold">{currentUser.name.charAt(0)}</span>
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setActiveView('profile')}>
                  <p className="text-xs font-semibold text-gray-900 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-orange-600 capitalize">{currentUser.role}</p>
                </div>
                <button onClick={logout}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                  title="Logout">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
