using Microsoft.EntityFrameworkCore;
using Relax.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Obtém a string de conexão do User Secrets
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "A string de conexão DefaultConnection não foi encontrada."
    );

// Configura o SQL Server
builder.Services.AddDbContext<RelaxDbContext>(options =>
    options.UseSqlServer(connectionString));

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");
app.MapGet("/api/teste-banco", async (RelaxDbContext db) =>
{
    try
    {
        bool conectado = await db.Database.CanConnectAsync();

        if (conectado)
        {
            return Results.Ok(new
            {
                mensagem = "Conexão com SQL Server realizada com sucesso!"
            });
        }

        return Results.Problem(
            "Não foi possível conectar ao banco de dados.",
            statusCode: 503
        );
    }
    catch
    {
        return Results.Problem(
            "Erro ao conectar ao banco de dados.",
            statusCode: 503
        );
    }
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
