import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Wand2, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { fetchTasks, updateTask } from '@/lib/api';
import { generateTaskDescription, recommendOverdueActions, type Recommendation } from '@/lib/ai';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';

export default function AIAssistant() {
  // Generator panel
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Recommendations panel
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [recos, setRecos] = useState<Recommendation[]>([]);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const t = await fetchTasks();
      setTasks(t);
      setRecos(recommendOverdueActions(t));
      setApproved(new Set());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load tasks.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!title.trim()) { setGenError('Enter a task title to generate a description.'); return; }
    setGenerating(true); setGenError(null);
    try {
      const desc = await generateTaskDescription(title.trim(), priority);
      setOutput(desc);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Generation failed.');
    } finally { setGenerating(false); }
  };

  const approve = async (r: Recommendation) => {
    const task = tasks.find((t) => t.id === r.taskId);
    if (!task) return;
    setApprovingId(r.taskId);
    try {
      const newDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
      const nextStatus: TaskStatus = task.status === 'Pending' ? 'In Progress' : task.status;
      await updateTask(r.taskId, {
        title: task.title,
        description: task.description,
        status: nextStatus,
        priority: task.priority,
        due_date: newDate,
        employee_id: task.employee_id,
      });
      setApproved((s) => new Set(s).add(r.taskId));
      await load();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Approval failed.');
    } finally { setApprovingId(null); }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <div className="page-sub">Lightweight AI help for task descriptions and overdue action</div>
        </div>
      </div>

      <div className="ai-grid">
        {/* Generator */}
        <div className="card ai-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="stat-icon" style={{ width: 36, height: 36, margin: 0, background: 'rgba(34,211,238,0.16)', color: 'var(--accent)' }}><Wand2 size={20} /></span>
            Task Description Generator
          </h3>
          <p className="ai-sub">Draft a concise, professional task description from a title. Works offline — add an OpenAI key for richer results.</p>

          <div className="field">
            <label>Task title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Migrate billing to new pricing model" />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {(['Low', 'Medium', 'High'] as TaskPriority[]).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={generate} disabled={generating} style={{ marginTop: 14 }}>
            <Wand2 size={18} /> {generating ? 'Generating…' : 'Generate description'}
          </button>
          {genError && <div className="field-error" style={{ marginTop: 10 }}>{genError}</div>}
          <div className={`gen-output ${output ? '' : 'empty'}`} style={{ marginTop: 16 }}>
            {output || 'Your generated description will appear here.'}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card ai-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="stat-icon" style={{ width: 36, height: 36, margin: 0, background: 'rgba(248,113,113,0.16)', color: 'var(--error)' }}><AlertTriangle size={20} /></span>
            Overdue Task Recommendations
          </h3>
          <p className="ai-sub">Suggested actions for overdue tasks. Manager approval moves them forward and sets a revised due date.</p>

          {loading && <div className="loading" style={{ padding: '30px 0' }}><div className="spinner" /></div>}
          {loadError && <div className="error-banner" style={{ marginBottom: 12 }}><span>{loadError}</span></div>}

          {!loading && !loadError && recos.length === 0 && (
            <div className="reco-empty">
              <CheckCircle2 size={28} />
              <div>All tasks are on track. No overdue action needed.</div>
            </div>
          )}

          {!loading && !loadError && recos.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {recos.map((r) => (
                <div className="reco-item" key={r.taskId}>
                  <div className="reco-icon"><AlertTriangle size={18} /></div>
                  <div className="reco-body">
                    <div className="reco-title">{r.title}</div>
                    <div className="reco-reason">{r.reason}</div>
                    <div className="reco-suggest">Recommended: {r.suggestion}</div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      {approved.has(r.taskId) ? (
                        <span className="badge badge-green"><ShieldCheck size={13} /> Approved</span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => approve(r)}
                          disabled={approvingId === r.taskId}
                        >
                          <ShieldCheck size={14} /> {approvingId === r.taskId ? 'Approving…' : 'Approve & reschedule'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Sparkles size={18} style={{ color: 'var(--accent)', marginTop: 2 }} />
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          The AI features are optional and modular. The description generator uses a built-in template engine by default.
          To use OpenAI, add a <code style={{ color: 'var(--accent)' }}>VITE_OPENAI_API_KEY</code> environment variable — the app keeps working without it.
          Overdue recommendations are computed from your live task data, and approving one reschedules the task with a 2-day buffer.
        </div>
      </div>
    </div>
  );
}
