// src/components/features/Heatmap.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { MapPin, TrendingUp, AlertCircle } from 'lucide-react';

export default function Heatmap() {
  const { cases } = useAppStore();
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    const link    = document.createElement('link');
    link.rel      = 'stylesheet';
    link.href     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, L]) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents(rl);
    });

    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // Group cases by district
  const districtMap: Record<string, { district: string; state: string; count: number; lat?: number; lng?: number; cases: typeof cases }> = {};
  cases.forEach(c => {
    const key = `${c.district}-${c.state}`;
    if (!districtMap[key]) {
      districtMap[key] = { district: c.district, state: c.state, count: 0, lat: c.latitude, lng: c.longitude, cases: [] };
    }
    districtMap[key].count++;
    districtMap[key].cases.push(c);
    if (!districtMap[key].lat && c.latitude) {
      districtMap[key].lat = c.latitude;
      districtMap[key].lng = c.longitude;
    }
  });

  const hotspots = Object.values(districtMap).sort((a,b) => b.count - a.count);
  const maxCount = hotspots[0]?.count || 1;

  const getHeatColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return '#dc2626'; // red - critical
    if (ratio >= 0.6) return '#ea580c'; // orange - high
    if (ratio >= 0.4) return '#f59e0b'; // amber - medium
    if (ratio >= 0.2) return '#84cc16'; // lime - low
    return '#22c55e';                   // green - minimal
  };

  const getRadius = (count: number) => {
    return 15 + (count / maxCount) * 35;
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="section-title text-lg">Case Density Heatmap</h2>
        <p className="text-sm text-gray-400 mt-1">
          Geographic distribution of missing person cases across India
        </p>
      </div>

      {/* Legend */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Intensity:</span>
        {[
          { color: '#dc2626', label: 'Critical (High)' },
          { color: '#ea580c', label: 'High' },
          { color: '#f59e0b', label: 'Medium' },
          { color: '#84cc16', label: 'Low' },
          { color: '#22c55e', label: 'Minimal' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="card overflow-hidden" style={{ height: '480px' }}>
        {cases.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <MapPin size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No cases to display on heatmap</p>
              <p className="text-gray-300 text-sm">File cases to see geographic distribution</p>
            </div>
          </div>
        ) : !MapComponents ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapComponents.MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <MapComponents.TileLayer
              attribution='© OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hotspots.filter(h => h.lat && h.lng).map(h => (
              <MapComponents.CircleMarker
                key={`${h.district}-${h.state}`}
                center={[h.lat!, h.lng!]}
                radius={getRadius(h.count)}
                pathOptions={{
                  color:       getHeatColor(h.count),
                  fillColor:   getHeatColor(h.count),
                  fillOpacity: 0.65,
                  weight:      2,
                }}
              >
                <MapComponents.Popup>
                  <div className="p-2">
                    <p className="font-bold text-sm">{h.district}, {h.state}</p>
                    <p className="text-red-600 font-bold text-lg">{h.count} case{h.count > 1 ? 's' : ''}</p>
                    <div className="mt-2 space-y-1">
                      {h.cases.slice(0,3).map(c => (
                        <p key={c.id} className="text-xs text-gray-600">• {c.name} ({c.status})</p>
                      ))}
                      {h.cases.length > 3 && <p className="text-xs text-gray-400">+{h.cases.length - 3} more</p>}
                    </div>
                  </div>
                </MapComponents.Popup>
              </MapComponents.CircleMarker>
            ))}
          </MapComponents.MapContainer>
        )}
      </div>

      {/* Hotspots table */}
      {hotspots.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-500" />
            Top Hotspots
          </h3>
          <div className="space-y-2">
            {hotspots.slice(0, 8).map((h, i) => (
              <div key={`${h.district}-${h.state}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-lg font-bold text-gray-300 w-6 text-center">#{i+1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{h.district}, {h.state}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${(h.count/maxCount)*100}%`, background: getHeatColor(h.count) }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-8 text-right">{h.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
