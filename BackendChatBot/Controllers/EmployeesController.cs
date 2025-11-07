using Microsoft.AspNetCore.Mvc;
using ChatbotBackend.Models;
using System.Collections.Generic;

namespace ChatbotBackend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EmployeesController : ControllerBase
    {
        private static readonly List<Employee> employees = new List<Employee>
        {
            new Employee { EmployeeId = 1, FullName = "Nguyen Van A", Email = "a@example.com", Position="Dev", Role="staff" },
            new Employee { EmployeeId = 2, FullName = "Tran Thi B", Email = "b@example.com", Position="Manager", Role="manager" },
        };

        [HttpGet]
        public ActionResult<List<Employee>> Get() => Ok(employees);
    }
}
