using Microsoft.AspNetCore.Mvc;
using ChatbotBackend.Models;
using System.Collections.Generic;

namespace ChatbotBackend.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProductsController : ControllerBase
    {
        private static readonly List<Product> products = new List<Product>
        {
            new Product { ProductId = 1, SKU="P001", ProductName="Laptop Dell", Category="Electronics", Price=1500 },
            new Product { ProductId = 2, SKU="P002", ProductName="Mouse Logitech", Category="Electronics", Price=50 },
        };

        [HttpGet]
        public ActionResult<List<Product>> Get() => Ok(products);
    }
}
