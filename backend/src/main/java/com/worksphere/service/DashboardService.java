
package com.worksphere.service;

import com.worksphere.entity.TaskStatus;
import com.worksphere.repository.EmployeeRepository;
import com.worksphere.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final TaskRepository taskRepository;

    public DashboardService(
            EmployeeRepository employeeRepository,
            TaskRepository taskRepository) {
        this.employeeRepository = employeeRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getDashboardMetrics() {
        long totalEmployees = employeeRepository.count();
        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.countByStatus(TaskStatus.COMPLETED);
        long pendingTasks = totalTasks - completedTasks;

        long overdueTasks = taskRepository
                .findByDueDateBeforeAndStatusNot(
                        LocalDate.now(),
                        TaskStatus.COMPLETED
                )
                .size();

        return Map.of(
                "totalEmployees", totalEmployees,
                "totalTasks", totalTasks,
                "completedTasks", completedTasks,
                "pendingTasks", pendingTasks,
                "overdueTasks", overdueTasks
        );
    }
}
