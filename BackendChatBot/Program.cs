using ChatbotBackend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext (can comment if testing hardcoded data)
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseInMemoryDatabase("TestDb"));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthorization();
app.MapControllers();

app.Run();
