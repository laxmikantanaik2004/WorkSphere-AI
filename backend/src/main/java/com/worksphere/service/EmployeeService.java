
package com.worksphere.service;

import com.worksphere.dto.EmployeeRequest;
import com.worksphere.dto.EmployeeResponse;
import com.worksphere.entity.Employee;
import com.worksphere.exception.ResourceNotFoundException;
import com.worksphere.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    
@Transactional(readOnly = true)
public List<EmployeeResponse> getAllEmployees(
        String search,
        String department) {

    List<Employee> employees = employeeRepository.findAll();

    return employees.stream()
            .filter(employee ->
                    search == null || search.isBlank()
                    || employee.getFirstName().toLowerCase()
                            .contains(search.toLowerCase())
                    || employee.getLastName().toLowerCase()
                            .contains(search.toLowerCase())
                    || employee.getEmail().toLowerCase()
                            .contains(search.toLowerCase()))
            .filter(employee ->
                    department == null || department.isBlank()
                    || employee.getDepartment().equalsIgnoreCase(department))
            .map(this::toResponse)
            .toList();
}


    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with ID: " + id));

        return toResponse(employee);
    }

    public EmployeeResponse createEmployee(EmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                    "Email already exists: " + request.email());
        }

        Employee employee = new Employee();
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setDepartment(request.department());
        employee.setJobTitle(request.jobTitle());
        employee.setHireDate(request.hireDate());

        return toResponse(employeeRepository.save(employee));
    }

    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with ID: " + id));

        boolean emailUsed = employeeRepository.existsByEmail(request.email());

        if (emailUsed
                && !employee.getEmail().equalsIgnoreCase(request.email())) {
            throw new IllegalArgumentException(
                    "Email already exists: " + request.email());
        }

        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setDepartment(request.department());
        employee.setJobTitle(request.jobTitle());
        employee.setHireDate(request.hireDate());

        return toResponse(employeeRepository.save(employee));
    }

    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found with ID: " + id));

        employeeRepository.delete(employee);
    }

    private EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getJobTitle(),
                employee.getHireDate()
        );
    }
}
