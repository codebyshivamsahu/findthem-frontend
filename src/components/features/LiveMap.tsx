// src/components/features/LiveMap.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { getStatusColor, calculateDaysMissing, cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

export default function LiveMap() {
  const { cases } = useAppStore();
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'missing' | 'sightings'>('all');
  const [sightings, setSightings] = useState<any[]>([]);

  useEffect(() => {
    api.sightings.list()
      .then((res: any) => setSightings(res?.data || []))
      .catch(() => setSightings([]));
  }, []);

  useEffect(() => {
    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, L]) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapComponents(rl);
    });

    return () => { document.head.removeChild(link); };
  }, []);

  const personsWithCoords = (cases.length > 0 ? cases : []).filter(
    (p: any) => p.latitude && p.longitude
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="card flex gap-1 p-1">
          {(['all', 'missing', 'sightings'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                filter === f ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {f === 'all' ? 'All' : f === 'missing' ? 'Missing' : 'Sightings'}
            </button>
          ))}
        </div>
        <div className="flex gap-3 ml-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-100 rounded-xl px-3 py-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Missing ({personsWithCoords.length})</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-100 rounded-xl px-3 py-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Sightings ({sightings.length})</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="card overflow-hidden" style={{ height: '520px' }}>
        {MapComponents ? (
          <MapComponents.MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <MapComponents.TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {(filter === 'all' || filter === 'missing') && personsWithCoords.map((person: any) => (
              <MapComponents.Marker
                key={person.id}
                position={[person.latitude, person.longitude]}
              >
                <MapComponents.Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="flex gap-3 items-start">
                      <img
                        src={Array.isArray(person.photos) ? person.photos[0] : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=100&background=f97316&color=fff`}
                        alt={person.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=100&background=f97316&color=fff`; }}
                      />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{person.name}</p>
                        <p className="text-xs text-gray-500">{person.caseId}</p>
                        <p className="text-xs text-gray-500">{person.age} yrs • {person.gender}</p>
                        <p className="text-xs font-semibold text-red-600 mt-1">
                          Missing {calculateDaysMissing(person.lastSeenDate)} days
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                      <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                      {person.lastSeenLocation}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">📞 {person.contactPhone}</p>
                  </div>
                </MapComponents.Popup>
              </MapComponents.Marker>
            ))}

            {(filter === 'all' || filter === 'sightings') && sightings.map(s => (
              <MapComponents.CircleMarker
                key={s.id}
                center={[s.latitude, s.longitude]}
                radius={10}
                pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.7 }}
              >
                <MapComponents.Popup>
                  <div className="p-2">
                    <p className="font-bold text-sm text-blue-700">Sighting Report</p>
                    <p className="text-xs text-gray-500 mt-1">{s.address}</p>
                    <p className="text-xs text-gray-600 mt-1">{s.description}</p>
                    {s.status === 'verified' && (
                      <p className="text-xs font-bold text-green-600 mt-1">Verified by reviewer</p>
                    )}
                  </div>
                </MapComponents.Popup>
              </MapComponents.CircleMarker>
            ))}
          </MapComponents.MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Map load ho raha hai…</p>
            </div>
          </div>
        )}
      </div>

      {/* Cases list below map */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Cases on Map</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {personsWithCoords.map((p: any) => (
            <div key={p.id} className="card p-4 flex gap-3 hover:shadow-md transition-shadow cursor-pointer">
              <img
                src={Array.isArray(p.photos) ? p.photos[0] : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=100&background=f97316&color=fff`}
                alt={p.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=100&background=f97316&color=fff`; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400 font-mono">{p.caseId}</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={10} className="text-gray-400" />
                  <p className="text-xs text-gray-500 truncate">{p.lastSeenLocation}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-red-500 flex-shrink-0">
                {calculateDaysMissing(p.lastSeenDate)}d
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
