using System;

namespace ChatbotBackend.Models
{
    public class Employee
    {
        public int EmployeeId { get; set; }  // PK
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public string? PasswordHash { get; set; }
        public string? Position { get; set; }
        public int? DepartmentId { get; set; }
        public string Role { get; set; } = "staff";
        public string Status { get; set; } = "active";
        public DateTime? HireDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation
        public Department? Department { get; set; }
    }
}
