// src/components/features/Dashboard.tsx
import { useAppStore } from '@/store';
import PersonCard from '@/components/ui/PersonCard';
import CaseDetail from '@/components/ui/CaseDetail';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, AlertCircle, Clock, ShieldAlert, FileText } from 'lucide-react';
import { calculateDaysMissing } from '@/lib/utils';

const PIE_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#10B981', '#6B7280'];

export default function Dashboard() {
  const { cases, selectCase, selectedCase, setActiveView } = useAppStore();

  const total      = cases.length;
  const open       = cases.filter(c => c.status === 'open').length;
  const investing  = cases.filter(c => c.status === 'investigating').length;
  const sighting   = cases.filter(c => c.status === 'sighting_reported').length;
  const found      = cases.filter(c => c.status === 'found').length;
  const closed     = cases.filter(c => c.status === 'closed').length;

  const STAT_CARDS = [
    { label: 'Total Cases',    value: total,   icon: Users,        color: 'bg-blue-50 text-blue-600'   },
    { label: 'Open Cases',     value: open + investing + sighting, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Found / Closed', value: found + closed, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Investigating',  value: investing, icon: Clock,       color: 'bg-purple-50 text-purple-600' },
  ];

  const PIE_DATA = [
    { name: 'Open',          value: open       || 0 },
    { name: 'Investigating', value: investing   || 0 },
    { name: 'Sighting',      value: sighting    || 0 },
    { name: 'Found',         value: found       || 0 },
    { name: 'Closed',        value: closed      || 0 },
  ].filter(d => d.value > 0);

  // Group by month for bar chart
  const monthMap: Record<string, { month: string; filed: number; resolved: number }> = {};
  cases.forEach(c => {
    if (!c.reportedAt) return;
    const d   = new Date(c.reportedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const mon = d.toLocaleString('default', { month: 'short' });
    if (!monthMap[key]) monthMap[key] = { month: mon, filed: 0, resolved: 0 };
    monthMap[key].filed++;
    if (c.status === 'found' || c.status === 'closed') monthMap[key].resolved++;
  });
  const monthlyData = Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-6).map(([,v])=>v);

  // State distribution
  const stateMap: Record<string, { state: string; cases: number; resolved: number }> = {};
  cases.forEach(c => {
    if (!c.state) return;
    if (!stateMap[c.state]) stateMap[c.state] = { state: c.state, cases: 0, resolved: 0 };
    stateMap[c.state].cases++;
    if (c.status === 'found' || c.status === 'closed') stateMap[c.state].resolved++;
  });
  const stateData = Object.values(stateMap).sort((a,b) => b.cases - a.cases).slice(0, 8);

  const recentCases = [...cases].sort((a,b) =>
    new Date(b.reportedAt||0).getTime() - new Date(a.reportedAt||0).getTime()
  ).slice(0, 4);

  const criticalCase = cases.find(c => c.status === 'open' && c.age && c.age < 18);

  return (
    <div className="space-y-6">

      {/* Alert banner — show only if there's a critical open case */}
      {criticalCase ? (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <ShieldAlert size={14} />
              <span className="text-sm font-bold uppercase tracking-wide">Emergency Alert Active</span>
            </div>
            <p className="text-lg font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              {criticalCase.name}, {criticalCase.age} — Missing from {criticalCase.lastSeenLocation}
            </p>
            <p className="text-white/80 text-sm mt-1">Case {criticalCase.caseId} • Missing {calculateDaysMissing(criticalCase.lastSeenDate)} days</p>
          </div>
          <button
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0"
            onClick={() => selectCase(criticalCase)}
          >
            View Case
          </button>
        </div>
      ) : total === 0 ? (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white text-center">
          <FileText size={32} className="mx-auto mb-2 opacity-80" />
          <p className="font-bold text-lg">No Cases Yet</p>
          <p className="text-white/80 text-sm mt-1">Start by reporting a missing person</p>
          <button
            onClick={() => setActiveView('report')}
            className="mt-3 bg-white text-orange-600 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-orange-50 transition-colors"
          >
            + Report Missing Person
          </button>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${color.split(' ')[0]}`}>
                <Icon size={18} className={color.split(' ')[1]} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar chart */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Monthly Overview</h3>
              <span className="text-xs text-gray-400">Cases filed vs resolved</span>
            </div>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barSize={14} barCategoryGap="30%">
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Bar dataKey="filed"    name="Filed"    fill="#FED7AA" radius={[4,4,0,0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#EA580C" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
            )}
          </div>

          {/* Pie chart */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Case Status</h3>
            {PIE_DATA.length > 0 ? (
              <div className="flex flex-col items-center">
                <PieChart width={160} height={160}>
                  <Pie data={PIE_DATA} cx={75} cy={75} innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                    {PIE_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 w-full">
                  {PIE_DATA.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-gray-600">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
            )}
          </div>
        </div>
      )}

      {/* Recent cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-lg">Recent Cases</h2>
          {cases.length > 0 && (
            <button onClick={() => setActiveView('cases')} className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
              View all →
            </button>
          )}
        </div>
        {recentCases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentCases.map(p => (
              <PersonCard key={p.id} person={p} onClick={() => selectCase(p)} />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center text-gray-400">
            <p className="text-sm">Koi case nahi mila. Pehla case report karein.</p>
            <button onClick={() => setActiveView('report')} className="mt-3 btn-primary text-sm px-5">
              + Report Missing Person
            </button>
          </div>
        )}
      </div>

      {/* State table */}
      {stateData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">State-wise Distribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['State', 'Total Cases', 'Open', 'Resolved', 'Resolution Rate'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stateData.map(row => {
                  const rate = row.cases > 0 ? Math.round((row.resolved / row.cases) * 100) : 0;
                  return (
                    <tr key={row.state} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-medium text-gray-800">{row.state}</td>
                      <td className="py-3 pr-4 text-gray-600">{row.cases}</td>
                      <td className="py-3 pr-4 text-red-600 font-medium">{row.cases - row.resolved}</td>
                      <td className="py-3 pr-4 text-green-600 font-medium">{row.resolved}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-20">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-gray-600 text-xs font-bold">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCase && <CaseDetail person={selectedCase} onClose={() => selectCase(null)} />}
    </div>
  );
}
