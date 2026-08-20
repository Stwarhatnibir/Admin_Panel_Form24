import { useCallback, useEffect, useState } from 'react';
import {
  Users,
  FileStack,
  CalendarClock,
  IndianRupee,
  ClipboardList,
  FolderLock,
  MessagesSquare,
  RotateCcw,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import StatCard from '../../components/dashboard/StatCard';
import { StatCardSkeleton } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoadState('loading');
    try {
      const data = await dashboardService.getStats();
      setStats(data);
      setLoadState('loaded');
    } catch (err) {
      setError(err.message || 'Unable to load dashboard stats.');
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loadState === 'error') {
    return <ErrorState message={error} onRetry={loadStats} />;
  }

  const cards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, tone: 'default' },
        { label: 'Total Applications', value: stats.totalApplications, icon: FileStack, tone: 'accent' },
        { label: 'Applications Today', value: stats.applicationsToday, icon: CalendarClock, tone: 'default' },
        { label: 'Revenue', value: formatCurrency(stats.revenue), icon: IndianRupee, tone: 'teal' },
        {
          label: 'Pending Information Requests',
          value: stats.pendingInformationRequests,
          icon: ClipboardList,
          tone: 'default',
        },
        { label: 'Pending Documents', value: stats.pendingDocuments, icon: FolderLock, tone: 'default' },
        { label: 'Open Conversations', value: stats.openConversations, icon: MessagesSquare, tone: 'default' },
        { label: 'Pending Refund Requests', value: stats.pendingRefundRequests, icon: RotateCcw, tone: 'rose' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">Overview</h2>
        <p className="text-sm text-slate-500">A snapshot of activity across the application pipeline.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadState === 'loading'
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="card p-5">
        <p className="font-display text-sm font-semibold text-slate-950">Applications, revenue & user trends</p>
        <p className="mt-1 text-sm text-slate-500">
          Time-series charts and date-range filtering will appear here once the applications and payments APIs are
          built (see build Phase 4 and Phase 8).
        </p>
      </div>
    </div>
  );
}
