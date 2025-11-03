using System;

namespace ChatbotBackend.Models
{
    public class InventoryLevel
    {
        public int InventoryId { get; set; }  // PK
        public int ProductId { get; set; }
        public int WarehouseId { get; set; }
        public int Quantity { get; set; } = 0;
        public DateTime LastUpdated { get; set; } = DateTime.Now;

        // Navigation
        public Product? Product { get; set; }
    }
}
