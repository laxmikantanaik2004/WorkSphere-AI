import type { EmployeeStatus, TaskStatus, TaskPriority } from '@/lib/types';

export function statusBadgeClass(status: EmployeeStatus | TaskStatus): string {
  switch (status) {
    case 'Active':
    case 'Completed':
      return 'badge-green';
    case 'On Leave':
    case 'Pending':
      return 'badge-amber';
    case 'In Progress':
      return 'badge-blue';
    case 'Inactive':
      return 'badge-gray';
    default:
      return 'badge-gray';
  }
}

export function priorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case 'High':
      return 'badge-red';
    case 'Medium':
      return 'badge-amber';
    case 'Low':
      return 'badge-gray';
    default:
      return 'badge-gray';
  }
}

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'Completed') return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

export function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
