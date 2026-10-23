export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  role: string;
  status: EmployeeStatus;
  created_at: string;
}

export type EmployeeInput = Omit<Employee, 'id' | 'created_at' | 'status'> & {
  status?: EmployeeStatus;
};

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  employee_id: string | null;
  created_at: string;
}

export interface TaskWithAssignee extends Task {
  assignee: string | null;
}

export type TaskInput = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  employee_id?: string | null;
};

export interface DashboardMetrics {
  totalEmployees: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}
