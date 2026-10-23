import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ListTodo, Wand2 } from 'lucide-react';
import { fetchTasks, createTask, updateTask, deleteTask, fetchEmployees } from '@/lib/api';
import { generateTaskDescription } from '@/lib/ai';
import type { Task, TaskWithAssignee, TaskInput, TaskStatus, TaskPriority, Employee } from '@/lib/types';
import Modal from '@/components/Modal';
import { statusBadgeClass, priorityBadgeClass, isOverdue, formatDate } from '@/components/badges';

const STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const FILTERS = ['all', ...STATUSES];

const empty: TaskInput = {
  title: '', description: '', status: 'Pending', priority: 'Medium', due_date: '', employee_id: '',
};

export default function Tasks() {
  const [rows, setRows] = useState<TaskWithAssignee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskInput>(empty);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [t, e] = await Promise.all([fetchTasks(search, filter), fetchEmployees()]);
      setRows(t); setEmployees(e);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load tasks.'); }
    finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null); setForm(empty); setFormError(null); setModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      due_date: t.due_date ?? '',
      employee_id: t.employee_id ?? '',
    });
    setFormError(null); setModalOpen(true);
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Task title is required.';
    return null;
  };

  const save = async () => {
    const v = validate();
    if (v) { setFormError(v); return; }
    setSaving(true); setFormError(null);
    const payload: TaskInput = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      employee_id: form.employee_id || null,
    };
    try {
      if (editing) await updateTask(editing.id, payload);
      else await createTask(payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed.');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try { await deleteTask(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed.'); }
  };

  const generate = async () => {
    if (!form.title.trim()) { setFormError('Enter a task title first so the AI has something to describe.'); return; }
    setGenerating(true); setFormError(null);
    try {
      const desc = await generateTaskDescription(form.title, form.priority ?? 'Medium');
      setForm((f) => ({ ...f, description: desc }));
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'AI generation failed.');
    } finally { setGenerating(false); }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <div className="page-sub">Assign and track work across your team</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Add Task</button>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search className="search-icon" size={18} />
          <input placeholder="Search by title or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {FILTERS.map((f) => <option key={f} value={f}>{f === 'all' ? 'All statuses' : f}</option>)}
        </select>
      </div>

      <div className="card">
        {loading && <div className="loading"><div className="spinner" /></div>}
        {error && <div className="error-banner"><span>{error}</span></div>}
        {!loading && !error && rows.length === 0 && (
          <div className="empty-state">
            <ListTodo size={42} />
            <div>No tasks found.</div>
            <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> Add your first task</button>
          </div>
        )}
        {!loading && !error && rows.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const overdue = isOverdue(t.due_date, t.status);
                  return (
                    <tr key={t.id}>
                      <td className="cell-strong">{t.title}</td>
                      <td className="cell-muted">{t.assignee ?? 'Unassigned'}</td>
                      <td><span className={`badge ${priorityBadgeClass(t.priority)}`}><span className="badge-dot" />{t.priority}</span></td>
                      <td><span className={`badge ${statusBadgeClass(t.status)}`}><span className="badge-dot" />{t.status}</span></td>
                      <td>
                        {overdue
                          ? <span className="badge badge-red"><span className="badge-dot" />{formatDate(t.due_date)} · overdue</span>
                          : <span className="cell-muted">{formatDate(t.due_date)}</span>}
                      </td>
                      <td>
                        <div className="cell-actions">
                          <button className="icon-btn" onClick={() => openEdit(t)} aria-label="Edit"><Pencil size={16} /></button>
                          <button className="icon-btn" onClick={() => remove(t.id)} aria-label="Delete" style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'Edit Task' : 'Add Task'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Refactor authentication module" />
          </div>
          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Description</span>
              <button className="btn btn-ghost btn-sm" onClick={generate} disabled={generating} style={{ padding: '4px 10px' }}>
                <Wand2 size={14} /> {generating ? 'Generating…' : 'Generate with AI'}
              </button>
            </label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what needs to be done…"
            />
            <span className="hint">Optional. Use AI to draft a professional description from the title.</span>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Due date</label>
              <input type="date" value={form.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Assignee</label>
              <select value={form.employee_id ?? ''} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} — {emp.department}</option>
                ))}
              </select>
            </div>
          </div>
          {formError && <div className="field-error">{formError}</div>}
        </Modal>
      )}
    </div>
  );
}
