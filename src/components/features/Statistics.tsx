// src/components/features/Statistics.tsx
import { useAppStore } from '@/store';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Users, CheckCircle, Clock, Eye } from 'lucide-react';

const COLORS = ['#EA580C','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

export default function Statistics() {
  const { cases } = useAppStore();

  const total    = cases.length;
  const open     = cases.filter(c => ['open','investigating','sighting_reported'].includes(c.status)).length;
  const resolved = cases.filter(c => c.status === 'found' || c.status === 'closed').length;

  const resolvedCases = cases.filter(c => c.status === 'found');
  const avgDays = resolvedCases.length > 0
    ? Math.round(resolvedCases.reduce((sum, c) => {
        return sum + Math.floor((new Date(c.updatedAt).getTime() - new Date(c.reportedAt).getTime()) / 86400000);
      }, 0) / resolvedCases.length)
    : 0;

  // Monthly data
  const monthMap: Record<string, { month: string; filed: number; resolved: number }> = {};
  cases.forEach(c => {
    const d   = new Date(c.reportedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const mon = d.toLocaleString('default', { month: 'short' });
    if (!monthMap[key]) monthMap[key] = { month: mon, filed: 0, resolved: 0 };
    monthMap[key].filed++;
    if (c.status === 'found' || c.status === 'closed') monthMap[key].resolved++;
  });
  const monthlyData = Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-6).map(([,v])=>v);

  // State data
  const stateMap: Record<string, { state: string; cases: number; resolved: number }> = {};
  cases.forEach(c => {
    if (!c.state) return;
    if (!stateMap[c.state]) stateMap[c.state] = { state: c.state, cases: 0, resolved: 0 };
    stateMap[c.state].cases++;
    if (c.status === 'found' || c.status === 'closed') stateMap[c.state].resolved++;
  });
  const stateData = Object.values(stateMap).sort((a,b)=>b.cases-a.cases).slice(0,8);

  // Gender distribution
  const genderData = [
    { name: 'Male',   value: cases.filter(c=>c.gender==='male').length },
    { name: 'Female', value: cases.filter(c=>c.gender==='female').length },
    { name: 'Other',  value: cases.filter(c=>c.gender==='other').length },
  ].filter(d=>d.value>0);

  // Status distribution
  const statusData = [
    { name: 'Open',          value: cases.filter(c=>c.status==='open').length },
    { name: 'Investigating', value: cases.filter(c=>c.status==='investigating').length },
    { name: 'Sighting',      value: cases.filter(c=>c.status==='sighting_reported').length },
    { name: 'Found',         value: cases.filter(c=>c.status==='found').length },
    { name: 'Closed',        value: cases.filter(c=>c.status==='closed').length },
  ].filter(d=>d.value>0);

  const resRate = total > 0 ? Math.round((resolved/total)*100) : 0;

  if (total === 0) {
    return (
      <div className="card p-16 text-center">
        <TrendingUp size={36} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">Abhi koi statistics nahi hai</p>
        <p className="text-gray-300 text-sm mt-1">Cases file hone ke baad yahan data dikhega</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Cases',       value: total.toLocaleString(),    icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Open Cases',        value: open.toLocaleString(),     icon: Eye,          color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Resolved',          value: resolved.toLocaleString(), icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Avg Resolution',    value: `${avgDays}d`,             icon: Clock,        color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Resolution Rate',   value: `${resRate}%`,             icon: TrendingUp,   color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 text-center">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Resolution rate bar */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-1">Overall Resolution Rate</h3>
        <p className="text-sm text-gray-400 mb-4">Percentage of cases successfully resolved</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-4">
            <div className="bg-gradient-to-r from-orange-500 to-green-500 h-4 rounded-full transition-all"
              style={{ width: `${resRate}%` }} />
          </div>
          <span className="text-2xl font-bold text-gray-900">{resRate}%</span>
        </div>
        <div className="flex gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm" /><span className="text-gray-600">Resolved: {resolved}</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-sm" /><span className="text-gray-600">Open: {open}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        {monthlyData.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line dataKey="filed"    name="Cases Filed"    stroke="#EA580C" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="resolved" name="Cases Resolved" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* State bar */}
        {stateData.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">Top States by Cases</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stateData} layout="vertical" barSize={10}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '12px' }} />
                <Bar dataKey="cases"    name="Total"    fill="#FED7AA" radius={[0,4,4,0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#EA580C" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gender pie */}
        {genderData.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">Gender Distribution</h3>
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie data={genderData} cx={75} cy={75} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {genderData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-2">
                {genderData.map((d,i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-600">{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status pie */}
        {statusData.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">Case Status Breakdown</h3>
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie data={statusData} cx={75} cy={75} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {statusData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-2">
                {statusData.map((d,i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-600">{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
