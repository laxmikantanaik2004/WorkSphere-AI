import { LayoutDashboard, Users, ListTodo, Sparkles } from 'lucide-react';

export type PageKey = 'dashboard' | 'employees' | 'tasks' | 'ai';

interface SidebarProps {
  active: PageKey;
  onNavigate: (p: PageKey) => void;
  overdueCount: number;
}

const items: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'tasks', label: 'Tasks', icon: ListTodo },
  { key: 'ai', label: 'AI Assistant', icon: Sparkles },
];

export default function Sidebar({ active, onNavigate, overdueCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">W</div>
        <div>
          <div className="brand-name">WorkSphere AI</div>
          <div className="brand-sub">Workforce Suite</div>
        </div>
      </div>
      <nav className="nav">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item ${active === key ? 'active' : ''}`}
            onClick={() => onNavigate(key)}
          >
            <Icon size={18} />
            {label}
            {key === 'tasks' && overdueCount > 0 && (
              <span className="badge-count" style={{ background: 'rgba(248,113,113,0.2)', color: 'var(--error)' }}>{overdueCount}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">WorkSphere AI v1.0 · MVP build</div>
    </aside>
  );
}
