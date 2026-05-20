// src/components/layout/MainLayout.tsx
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col flex-1 overflow-hidden transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
