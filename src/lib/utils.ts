// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CaseStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor(diff / 60000);
  if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  return `${mins} min${mins > 1 ? 's' : ''} ago`;
}

export function getStatusLabel(status: CaseStatus): string {
  const labels: Record<CaseStatus, string> = {
    open:              'Open',
    investigating:     'Investigating',
    sighting_reported: 'Sighting Reported',
    found:             'Found',
    closed:            'Closed',
  };
  return labels[status];
}

export function getStatusColor(status: CaseStatus): string {
  const colors: Record<CaseStatus, string> = {
    open:              'bg-red-100 text-red-700 border-red-200',
    investigating:     'bg-blue-100 text-blue-700 border-blue-200',
    sighting_reported: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    found:             'bg-green-100 text-green-700 border-green-200',
    closed:            'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[status];
}

export function getStatusDot(status: CaseStatus): string {
  const colors: Record<CaseStatus, string> = {
    open:              'bg-red-500',
    investigating:     'bg-blue-500',
    sighting_reported: 'bg-yellow-500',
    found:             'bg-green-500',
    closed:            'bg-gray-500',
  };
  return colors[status];
}

export function generateCaseId(): string {
  const year = new Date().getFullYear();
  const num  = Math.floor(Math.random() * 9000) + 1000;
  return `FTI-${year}-${num}`;
}

export function calculateDaysMissing(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
