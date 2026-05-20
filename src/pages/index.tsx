// src/pages/index.tsx
import { useAppStore } from '@/store';
import dynamic from 'next/dynamic';
import Login from '@/components/features/Login';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/components/features/Dashboard';
import SearchCases from '@/components/features/SearchCases';
import ReportMissing from '@/components/features/ReportMissing';
import AllCases from '@/components/features/AllCases';
import Statistics from '@/components/features/Statistics';
import Sightings from '@/components/features/Sightings';
import Alerts from '@/components/features/Alerts';
import Profile from '@/components/features/Profile';
import AgeProgression from '@/components/features/AgeProgression';
import CaseTimeline from '@/components/features/CaseTimeline';
import PDFReport from '@/components/features/PDFReport';
import Team from '@/components/features/teams';

const LiveMap = dynamic(() => import('@/components/features/LiveMap'), { ssr: false });
const Heatmap = dynamic(() => import('@/components/features/Heatmap'), { ssr: false });

export default function Home() {
  const { isAuthenticated, activeView, authLoading } = useAppStore();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  const VIEW_MAP: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    search: <SearchCases />,
    report: <ReportMissing />,
    map: <LiveMap />,
    heatmap: <Heatmap />,
    cases: <AllCases />,
    statistics: <Statistics />,
    sightings: <Sightings />,
    alerts: <Alerts />,
    profile: <Profile />,
    age: <AgeProgression />,
    timeline: <CaseTimeline />,
    pdf: <PDFReport />,
    team: <Team />,
  };

  return (
    <MainLayout>
      {VIEW_MAP[activeView] || (
        <div className="card p-12 text-center">
          <p className="text-gray-400">This section is coming soon.</p>
        </div>
      )}
    </MainLayout>
  );
}