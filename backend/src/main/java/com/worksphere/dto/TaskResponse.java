
package com.worksphere.dto;

import com.worksphere.entity.TaskPriority;
import com.worksphere.entity.TaskStatus;

import java.time.LocalDate;

public record TaskResponse(
    Long id,
    String title,
    String description,
    TaskStatus status,
    TaskPriority priority,
    LocalDate dueDate,
    Long employeeId,
    String employeeName
) {
}
