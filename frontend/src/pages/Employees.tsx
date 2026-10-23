
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/lib/api';
import type { Employee, EmployeeInput, EmployeeStatus } from '@/lib/types';
import Modal from '@/components/Modal';
import { statusBadgeClass } from '@/components/badges';

const STATUSES: EmployeeStatus[] = ['Active', 'On Leave', 'Inactive'];
const FILTERS = ['all', ...STATUSES];

const empty: EmployeeInput = {
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  role: '',
  status: 'Active',
};

export default function Employees() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeInput>(empty);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchEmployees(search, filter);
      setRows(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load employees.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      status: employee.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const validate = (): string | null => {
    if (!form.first_name.trim()) {
      return 'First name is required.';
    }

    if (!form.last_name.trim()) {
      return 'Last name is required.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Enter a valid email address.';
    }

    if (!form.department.trim()) {
      return 'Department is required.';
    }

    if (!form.role.trim()) {
      return 'Role is required.';
    }

    return null;
  };

  const save = async () => {
    const validationError = validate();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload: EmployeeInput = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        role: form.role.trim(),
        status: form.status,
      };

      if (editing) {
        await updateEmployee(editing.id, payload);
      } else {
        await createEmployee(payload);
      }

      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : 'Failed to save employee.',
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (
      !window.confirm(
        'Delete this employee? Their assigned tasks will be unassigned but kept.',
      )
    ) {
      return;
    }

    try {
      await deleteEmployee(id);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to delete employee.',
      );
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Employees</h1>
          <div className="page-sub">Manage your team members</div>
        </div>

        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search className="search-icon" size={18} />
          <input
            placeholder="Search by name, email, department or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === 'all' ? 'All statuses' : status}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading && (
          <div className="loading">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="empty-state">
            <Users size={42} />
            <div>No employees found.</div>
            <button
              className="btn btn-primary btn-sm"
              onClick={openCreate}
            >
              <Plus size={16} /> Add your first employee
            </button>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((employee) => (
                  <tr key={employee.id}>
                    <td className="cell-strong">
                      {employee.first_name} {employee.last_name}
                    </td>
                    <td className="cell-muted">{employee.email}</td>
                    <td>{employee.department}</td>
                    <td>{employee.role}</td>
                    <td>
                      <span
                        className={`badge ${statusBadgeClass(employee.status)}`}
                      >
                        <span className="badge-dot" />
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(employee)}
                          aria-label="Edit employee"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="icon-btn"
                          onClick={() => void remove(employee.id)}
                          aria-label="Delete employee"
                          style={{ color: 'var(--error)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'Edit Employee' : 'Add Employee'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button
                className="btn btn-ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={() => void save()}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="form-row">
            <div className="field">
              <label>First name</label>
              <input
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                placeholder="Aisha"
              />
            </div>

            <div className="field">
              <label>Last name</label>
              <input
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                placeholder="Khan"
              />
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="aisha.khan@worksphere.io"
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Department</label>
              <input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                placeholder="Engineering"
              />
            </div>

            <div className="field">
              <label>Role</label>
              <input
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                placeholder="Backend Developer"
              />
            </div>
          </div>

          <div className="field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as EmployeeStatus,
                })
              }
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <div className="field-error">{formError}</div>
          )}
        </Modal>
      )}
    </div>
  );
}
