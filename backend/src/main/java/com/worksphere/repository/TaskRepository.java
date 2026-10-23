
package com.worksphere.repository;

import com.worksphere.entity.Task;
import com.worksphere.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByEmployee_Id(Long employeeId);

    List<Task> findByTitleContainingIgnoreCase(String title);

    long countByStatus(TaskStatus status);

    List<Task> findByDueDateBeforeAndStatusNot(
            java.time.LocalDate date,
            TaskStatus status
    );
}
