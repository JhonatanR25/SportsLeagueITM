using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportsLeague.DataAccess.Context;
using SportsLeague.DataAccess.Repositories;
using SportsLeague.Domain.Interfaces.Repositories;
using SportsLeague.Domain.Interfaces.Services;
using SportsLeague.Domain.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Entity Framework Core ──
builder.Services.AddDbContext<LeagueDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.MigrationsAssembly("SportsLeague.DataAccess")));

// ── Repositories ──
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IRefereeRepository, RefereeRepository>();     
builder.Services.AddScoped<ITournamentRepository, TournamentRepository>();   
builder.Services.AddScoped<ITournamentTeamRepository, TournamentTeamRepository>();



// ── Services ──
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IRefereeService, RefereeService>();        
builder.Services.AddScoped<ITournamentService, TournamentService>();  



// ── AutoMapper ──
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// ── Controllers ──
builder.Services.AddControllers();

// ── ProblemDetails / manejo global básico de errores ──
builder.Services.AddProblemDetails();

// ── Swagger ──
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ── Middleware Pipeline ──
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Manejo global de excepciones como red de seguridad.
// No reemplaza tus try/catch actuales; solo evita respuestas vacías
// si aparece una excepción no controlada.
app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionHandler");

        if (feature?.Error is not null)
        {
            logger.LogError(feature.Error, "Unhandled exception while processing request");
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Ocurrió un error interno en el servidor.",
            Detail = app.Environment.IsDevelopment()
                ? feature?.Error.Message
                : "Intenta nuevamente más tarde."
        };

        await context.Response.WriteAsJsonAsync(problem);
    });
});

app.MapGet("/", () => Results.Redirect("/swagger"));

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();