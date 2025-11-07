using Microsoft.EntityFrameworkCore;
using ChatbotBackend.Models;

namespace ChatbotBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<Department> Departments { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<InventoryLevel> InventoryLevels { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // PKs
            modelBuilder.Entity<Department>().HasKey(d => d.DepartmentId);
            modelBuilder.Entity<Employee>().HasKey(e => e.EmployeeId);
            modelBuilder.Entity<Product>().HasKey(p => p.ProductId);
            modelBuilder.Entity<InventoryLevel>().HasKey(i => i.InventoryId);

            // Relationships
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId);

            modelBuilder.Entity<Department>()
                .HasOne(d => d.Manager)
                .WithMany()
                .HasForeignKey(d => d.ManagerId);

            modelBuilder.Entity<InventoryLevel>()
                .HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId);

            base.OnModelCreating(modelBuilder);
        }
    }
}
