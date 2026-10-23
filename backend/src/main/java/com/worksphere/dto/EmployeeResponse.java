
package com.worksphere.dto;

import java.time.LocalDate;

public record EmployeeResponse(
    Long id,
    String firstName,
    String lastName,
    String email,
    String department,
    String jobTitle,
    LocalDate hireDate
) {
}
