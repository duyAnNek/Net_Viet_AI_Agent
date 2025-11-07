using System;

namespace ChatbotBackend.Models
{
    public class Product
    {
        public int ProductId { get; set; } // PK
        public required string SKU { get; set; }
        public required string ProductName { get; set; }
        public string? Description { get; set; }
        public required string Category { get; set; }
        public decimal Price { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
