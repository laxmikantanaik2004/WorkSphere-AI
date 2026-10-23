
package com.worksphere.dto;

import com.worksphere.entity.TaskPriority;
import com.worksphere.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskRequest(

    @NotBlank(message = "Task title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    String description,

    TaskStatus status,

    TaskPriority priority,

    LocalDate dueDate,

    @NotNull(message = "Employee ID is required")
    Long employeeId

) {
}
