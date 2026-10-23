
package com.worksphere.service;

import com.worksphere.dto.TaskRequest;
import com.worksphere.dto.TaskResponse;
import com.worksphere.entity.Employee;
import com.worksphere.entity.Task;
import com.worksphere.entity.TaskPriority;
import com.worksphere.entity.TaskStatus;
import com.worksphere.exception.ResourceNotFoundException;
import com.worksphere.repository.EmployeeRepository;
import com.worksphere.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;

    public TaskService(
            TaskRepository taskRepository,
            EmployeeRepository employeeRepository) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
    }

    
@Transactional(readOnly = true)
public List<TaskResponse> getAllTasks(
        String search,
        TaskStatus status,
        Long employeeId) {

    return taskRepository.findAll()
            .stream()
            .filter(task ->
                    search == null || search.isBlank()
                    || task.getTitle().toLowerCase()
                            .contains(search.toLowerCase())
                    || (task.getDescription() != null
                    && task.getDescription().toLowerCase()
                            .contains(search.toLowerCase())))
            .filter(task ->
                    status == null || task.getStatus() == status)
            .filter(task ->
                    employeeId == null
                    || task.getEmployee().getId().equals(employeeId))
            .map(this::toResponse)
            .toList();
}


    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Task not found with ID: " + id));

        return toResponse(task);
    }

    public TaskResponse createTask(TaskRequest request) {
        Employee employee = findEmployee(request.employeeId());

        Task task = new Task();
        applyRequest(task, request);
        task.setEmployee(employee);

        return toResponse(taskRepository.save(task));
    }

    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Task not found with ID: " + id));

        Employee employee = findEmployee(request.employeeId());

        applyRequest(task, request);
        task.setEmployee(employee);

        return toResponse(taskRepository.save(task));
    }

    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Task not found with ID: " + id));

        taskRepository.delete(task);
    }

    private Employee findEmployee(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with ID: " + employeeId));
    }

    private void applyRequest(Task task, TaskRequest request) {
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(
                request.status() != null
                        ? request.status()
                        : TaskStatus.TODO);
        task.setPriority(
                request.priority() != null
                        ? request.priority()
                        : TaskPriority.MEDIUM);
        task.setDueDate(request.dueDate());
    }

    private TaskResponse toResponse(Task task) {
        Employee employee = task.getEmployee();

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                employee.getId(),
                employee.getFirstName() + " " + employee.getLastName()
        );
    }
}
