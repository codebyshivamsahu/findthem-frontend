// src/components/ui/PersonCard.tsx
import Image from 'next/image';
import { MissingPerson } from '@/types';
import { getStatusLabel, getStatusColor, getStatusDot, calculateDaysMissing, formatDate, cn } from '@/lib/utils';
import { MapPin, Calendar, Phone, ChevronRight, User } from 'lucide-react';

interface Props {
  person: MissingPerson;
  onClick?: () => void;
  compact?: boolean;
}

export default function PersonCard({ person, onClick, compact = false }: Props) {
  const days = calculateDaysMissing(person.lastSeenDate);

  return (
    <div
      onClick={onClick}
      className={cn(
        'card overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group',
        compact ? 'flex gap-4 p-4' : ''
      )}
    >
      {/* Photo */}
      <div className={cn('relative bg-gray-100 overflow-hidden', compact ? 'w-16 h-16 rounded-xl flex-shrink-0' : 'h-52 w-full')}>
        <img
          src={person.photos[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=400`}
          alt={person.name}
          className={cn('w-full h-full object-cover object-top', compact ? 'rounded-xl' : '')}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=400&background=f97316&color=fff`;
          }}
        />
        {!compact && (
          <div className="absolute top-3 left-3">
            <span className={cn('badge', getStatusColor(person.status))}>
              <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(person.status))} />
              {getStatusLabel(person.status)}
            </span>
          </div>
        )}
        {!compact && days > 30 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            {days}d missing
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(compact ? 'flex-1 min-w-0' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-orange-600 transition-colors">
              {person.name}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{person.caseId}</p>
          </div>
          {compact && (
            <span className={cn('badge flex-shrink-0', getStatusColor(person.status))}>
              {getStatusLabel(person.status)}
            </span>
          )}
          {!compact && (
            <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400 mt-1 flex-shrink-0" />
          )}
        </div>

        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User size={12} />
            <span>{person.age} yrs • {person.gender === 'male' ? 'Male' : person.gender === 'female' ? 'Female' : 'Other'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} />
            <span className="truncate">{person.lastSeenLocation}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} />
            <span>Last seen {formatDate(person.lastSeenDate)}</span>
            {days > 0 && (
              <span className={cn('font-semibold', days > 30 ? 'text-red-500' : days > 7 ? 'text-yellow-600' : 'text-gray-600')}>
                ({days}d ago)
              </span>
            )}
          </div>
        </div>

        {!compact && (
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Phone size={11} />
              <span>{person.contactPhone}</span>
            </div>
            {person.matchConfidence && (
              <span className="text-xs font-bold text-green-600">{person.matchConfidence}% match</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
