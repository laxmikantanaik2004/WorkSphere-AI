import { useEffect, useState } from 'react';
import { Users, ListTodo, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { fetchDashboard } from '@/lib/api';
import type { DashboardMetrics } from '@/lib/types';

interface Props {
  onGoToTasks: () => void;
}

export default function Dashboard({ onGoToTasks }: Props) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const m = await fetchDashboard();
        if (alive) { setMetrics(m); setError(null); }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load dashboard.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const completionRate = metrics && metrics.totalTasks > 0
    ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
    : 0;

  const cards = metrics ? [
    { label: 'Total Employees', value: metrics.totalEmployees, icon: Users, tint: 'rgba(59,130,246,0.16)', color: '#60a5fa' },
    { label: 'Total Tasks', value: metrics.totalTasks, icon: ListTodo, tint: 'rgba(34,211,238,0.16)', color: '#22d3ee' },
    { label: 'Completed', value: metrics.completedTasks, icon: CheckCircle2, tint: 'rgba(52,211,153,0.16)', color: '#34d399' },
    { label: 'Pending', value: metrics.pendingTasks, icon: Clock, tint: 'rgba(251,191,36,0.16)', color: '#fbbf24' },
    { label: 'Overdue', value: metrics.overdueTasks, icon: AlertTriangle, tint: 'rgba(248,113,113,0.16)', color: '#f87171' },
  ] : [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-sub">Workforce overview at a glance</div>
        </div>
      </div>

      {loading && <div className="card"><div className="loading"><div className="spinner" /></div></div>}
      {error && <div className="card error-banner"><span>{error}</span></div>}

      {!loading && metrics && (
        <>
          <div className="stats-grid">
            {cards.map((c) => (
              <div className="stat-card" key={c.label}>
                <div className="stat-icon" style={{ background: c.tint, color: c.color }}>
                  <c.icon size={22} />
                </div>
                <div className="stat-label">{c.label}</div>
                <div className="stat-value">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> Completion Rate
              </h3>
              <span className="badge badge-blue"><span className="badge-dot" />{completionRate}%</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: 'var(--bg-soft)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${completionRate}%`,
                borderRadius: 999,
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div className="page-sub" style={{ marginTop: 12 }}>
              {metrics.completedTasks} of {metrics.totalTasks} tasks completed.
              {metrics.overdueTasks > 0 && (
                <span style={{ color: 'var(--error)', marginLeft: 8 }}>
                  {metrics.overdueTasks} overdue task{metrics.overdueTasks === 1 ? '' : 's'} need attention.
                </span>
              )}
            </div>
          </div>

          {metrics.overdueTasks > 0 && (
            <div className="card card-pad" style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
              <h3 style={{ color: 'var(--error)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} /> Attention needed
              </h3>
              <p className="page-sub" style={{ marginBottom: 14 }}>
                {metrics.overdueTasks} overdue task{metrics.overdueTasks === 1 ? '' : 's'} are past their due date and not yet completed.
              </p>
              <button className="btn btn-primary btn-sm" onClick={onGoToTasks}>Review tasks</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
