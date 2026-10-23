import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import type { PageKey } from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Tasks from '@/pages/Tasks';
import AIAssistant from '@/pages/AIAssistant';
import { fetchDashboard } from '@/lib/api';

function App() {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [overdueCount, setOverdueCount] = useState(0);

  const refreshOverdue = useCallback(async () => {
    try { const m = await fetchDashboard(); setOverdueCount(m.overdueTasks); }
    catch { /* surface inside pages */ }
  }, []);

  useEffect(() => {
    refreshOverdue();
    const t = setInterval(refreshOverdue, 30000);
    return () => clearInterval(t);
  }, [refreshOverdue]);

  const navigate = (p: PageKey) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app-shell">
      <Sidebar active={page} onNavigate={navigate} overdueCount={overdueCount} />
      <main className="main">
        {page === 'dashboard' && <Dashboard onGoToTasks={() => navigate('tasks')} />}
        {page === 'employees' && <Employees />}
        {page === 'tasks' && <Tasks />}
        {page === 'ai' && <AIAssistant />}
      </main>
    </div>
  );
}

export default App;
