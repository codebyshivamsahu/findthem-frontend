// src/components/features/Alerts.tsx
import { Bell, AlertTriangle, CheckCircle, Info, Eye, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatRelativeTime } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface Alert {
  id: string; type: 'amber' | 'sighting' | 'match' | 'info';
  title: string; message: string; case_id?: string;
  severity: string; created_at: string;
}

const TYPE_STYLES = {
  amber:    { icon: ShieldAlert,  bg: 'bg-red-50 border-red-100',    icon_color: 'text-red-600'   },
  sighting: { icon: Eye,          bg: 'bg-blue-50 border-blue-100',   icon_color: 'text-blue-600'  },
  match:    { icon: CheckCircle,  bg: 'bg-green-50 border-green-100', icon_color: 'text-green-600' },
  info:     { icon: Info,         bg: 'bg-gray-50 border-gray-100',   icon_color: 'text-gray-500'  },
};

export default function Alerts() {
  const { cases, setActiveView, selectCase } = useAppStore();
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generated: Alert[] = [];
    cases.forEach(c => {
      if (c.status === 'open' && c.age && c.age < 18) {
        generated.push({
          id: `child-${c.id}`, type: 'amber',
          title: `Child Missing Alert: ${c.name}`,
          message: `${c.age}-year-old ${c.gender} missing from ${c.lastSeenLocation}, ${c.district}. Case ${c.caseId}. Please share this alert immediately.`,
          case_id: c.caseId, severity: 'critical', created_at: c.reportedAt,
        });
      }
      if (c.status === 'sighting_reported') {
        generated.push({
          id: `sighting-${c.id}`, type: 'sighting',
          title: `New Sighting Reported — ${c.name}`,
          message: `A sighting has been reported for ${c.name} (${c.caseId}). Location is being verified by authorities.`,
          case_id: c.caseId, severity: 'high', created_at: c.updatedAt || c.reportedAt,
        });
      }
      if (c.status === 'found') {
        generated.push({
          id: `found-${c.id}`, type: 'match',
          title: `Case Resolved — ${c.name}`,
          message: `${c.name} (${c.caseId}) has been found and reunited with family. Case marked as resolved.`,
          case_id: c.caseId, severity: 'low', created_at: c.updatedAt || c.reportedAt,
        });
      }
      if (c.status === 'open' || c.status === 'investigating') {
        generated.push({
          id: `new-${c.id}`, type: 'info',
          title: `New Case Filed — ${c.name}`,
          message: `Missing person case registered: ${c.name}, ${c.age} yrs, last seen at ${c.lastSeenLocation}, ${c.state}. Case ID: ${c.caseId}`,
          case_id: c.caseId, severity: 'medium', created_at: c.reportedAt,
        });
      }
    });
    generated.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setAlerts(generated);
  }, [cases]);

  const markRead    = (id: string) => setReadIds(s => new Set([...s, id]));
  const markAllRead = () => setReadIds(new Set(alerts.map(a => a.id)));
  const unread      = alerts.filter(a => !readIds.has(a.id)).length;

  const handleClick = (caseId?: string) => {
    if (!caseId) return;
    const c = cases.find(x => x.caseId === caseId);
    if (c) { selectCase(c); setActiveView('cases'); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title text-lg">Alerts & Notifications</h2>
          {unread > 0 && <p className="text-sm text-orange-600 font-semibold mt-1">{unread} unread alert{unread > 1 ? 's' : ''}</p>}
        </div>
        {unread > 0 && <button onClick={markAllRead} className="btn-secondary text-sm">Mark all read</button>}
      </div>

      <div className="space-y-3">
        {alerts.map(alert => {
          const style  = TYPE_STYLES[alert.type] || TYPE_STYLES.info;
          const Icon   = style.icon;
          const isRead = readIds.has(alert.id);
          return (
            <div key={alert.id}
              className={`card p-4 border ${style.bg} ${!isRead ? 'ring-1 ring-orange-200' : ''} relative cursor-pointer transition-all hover:shadow-md`}
              onClick={() => { markRead(alert.id); handleClick(alert.case_id); }}>
              {!isRead && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                  <Icon size={16} className={style.icon_color} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-bold text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{formatRelativeTime(alert.created_at)}</span>
                    {alert.case_id && <span className="text-xs font-mono text-orange-600 font-semibold">{alert.case_id}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length === 0 && (
        <div className="card p-12 text-center">
          <Bell size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No alerts at this time</p>
          <p className="text-gray-300 text-sm mt-1">Alerts will appear here when cases are filed or sightings are reported</p>
        </div>
      )}
    </div>
  );
}
