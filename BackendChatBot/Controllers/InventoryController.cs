using Microsoft.AspNetCore.Mvc;
using ChatbotBackend.Models;
using System.Collections.Generic;

namespace ChatbotBackend.Controllers
{
    [ApiController]
    [Route("inventory")]
    public class InventoryController : ControllerBase
    {
        private static readonly List<InventoryLevel> inventory = new List<InventoryLevel>
        {
            new InventoryLevel
            {
                InventoryId = 1,
                ProductId = 1,
                WarehouseId = 1,
                Quantity = 10,
                Product = new Product
                {
                    ProductId = 1,
                    SKU = "P001",
                    ProductName = "Laptop Dell",
                    Category = "Electronics",
                    Price = 1500
                }
            },
            new InventoryLevel
            {
                InventoryId = 2,
                ProductId = 2,
                WarehouseId = 1,
                Quantity = 50,
                Product = new Product
                {
                    ProductId = 2,
                    SKU = "P002",
                    ProductName = "Mouse Logitech",
                    Category = "Electronics",
                    Price = 50
                }
            }
        };

        [HttpGet("value")]
        public ActionResult<List<InventoryLevel>> Get() => Ok(inventory);
    }
}
