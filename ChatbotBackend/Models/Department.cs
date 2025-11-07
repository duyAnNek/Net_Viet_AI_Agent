using System.Collections.Generic;

namespace ChatbotBackend.Models
{
    public class Department
    {
        public int DepartmentId { get; set; } // PK
        public required string DepartmentName { get; set; }
        public int? ManagerId { get; set; }

        // Navigation
        public Employee? Manager { get; set; }
        public List<Employee> Employees { get; set; } = new List<Employee>();
    }
}
