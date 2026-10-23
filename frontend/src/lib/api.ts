
import type {
  Employee,
  EmployeeInput,
  Task,
  TaskInput,
  TaskWithAssignee,
  DashboardMetrics,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api';

// Backend response types

interface EmployeeApiResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  hireDate: string | null;
}

interface TaskApiResponse {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  employeeId: number | null;
  employeeName: string | null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Request failed: ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// TASK STATUS CONVERSION

function toTaskStatus(status: string): string {
  const statuses: Record<string, string> = {
    Pending: 'TODO',
    'In Progress': 'IN_PROGRESS',
    Completed: 'COMPLETED',
  };

  return statuses[status] ?? status;
}

function fromTaskStatus(status: string): Task['status'] {
  const statuses: Record<string, Task['status']> = {
    TODO: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  };

  return statuses[status] ?? 'Pending';
}

// TASK PRIORITY CONVERSION

function toPriority(priority: string): string {
  return priority.toUpperCase();
}

function fromPriority(priority: string): Task['priority'] {
  const priorities: Record<string, Task['priority']> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  };

  return priorities[priority] ?? 'Medium';
}

// RESPONSE MAPPING

function mapEmployee(data: EmployeeApiResponse): Employee {
  return {
    id: String(data.id),
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    department: data.department,
    role: data.jobTitle,
    // Employee status is not stored by the current backend.
    status: 'Active',
    created_at: data.hireDate ?? '',
  };
}

function mapTask(data: TaskApiResponse): Task {
  return {
    id: String(data.id),
    title: data.title,
    description: data.description ?? null,
    status: fromTaskStatus(data.status),
    priority: fromPriority(data.priority),
    due_date: data.dueDate ?? null,
    employee_id:
      data.employeeId == null ? null : String(data.employeeId),
    created_at: '',
  };
}

// REQUEST PAYLOADS

function employeePayload(input: EmployeeInput) {
  return {
    firstName: input.first_name,
    lastName: input.last_name,
    email: input.email,
    department: input.department,
    jobTitle: input.role,
    hireDate: new Date().toISOString().slice(0, 10),
  };
}

function taskPayload(input: TaskInput) {
  if (!input.employee_id) {
    throw new Error('Please select an employee for this task.');
  }

  return {
    title: input.title,
    description: input.description ?? null,
    status: toTaskStatus(input.status ?? 'Pending'),
    priority: toPriority(input.priority ?? 'Medium'),
    dueDate: input.due_date ?? null,
    employeeId: Number(input.employee_id),
  };
}

// EMPLOYEES

export async function fetchEmployees(
  search = '',
  status = 'all',
): Promise<Employee[]> {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  const query = params.toString();

  const data = await request<EmployeeApiResponse[]>(
    `/employees${query ? `?${query}` : ''}`,
  );

  return data
    .map(mapEmployee)
    .filter(
      (employee) => status === 'all' || employee.status === status,
    );
}

export async function createEmployee(
  input: EmployeeInput,
): Promise<Employee> {
  const data = await request<EmployeeApiResponse>('/employees', {
    method: 'POST',
    body: JSON.stringify(employeePayload(input)),
  });

  return mapEmployee(data);
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput,
): Promise<Employee> {
  const data = await request<EmployeeApiResponse>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employeePayload(input)),
  });

  return mapEmployee(data);
}

export async function deleteEmployee(id: string): Promise<void> {
  await request<void>(`/employees/${id}`, {
    method: 'DELETE',
  });
}

// TASKS

export async function fetchTasks(
  search = '',
  status = 'all',
): Promise<TaskWithAssignee[]> {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (status !== 'all') {
    params.set('status', toTaskStatus(status));
  }

  const query = params.toString();

  const data = await request<TaskApiResponse[]>(
    `/tasks${query ? `?${query}` : ''}`,
  );

  return data.map((item) => ({
    ...mapTask(item),
    assignee: item.employeeName ?? null,
  }));
}

export async function createTask(input: TaskInput): Promise<Task> {
  const data = await request<TaskApiResponse>('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskPayload(input)),
  });

  return mapTask(data);
}

export async function updateTask(
  id: string,
  input: TaskInput,
): Promise<Task> {
  const data = await request<TaskApiResponse>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskPayload(input)),
  });

  return mapTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

// DASHBOARD

export async function fetchDashboard(): Promise<DashboardMetrics> {
  return request<DashboardMetrics>('/dashboard');
}
