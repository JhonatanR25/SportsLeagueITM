using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using SportsLeague.API.Mappings;
using SportsLeague.API.Middleware;
using SportsLeague.API.Responses;
using SportsLeague.API.Serialization;
using SportsLeague.DataAccess.Context;
using SportsLeague.DataAccess.Repositories;
using SportsLeague.Domain.Interfaces.Repositories;
using SportsLeague.Domain.Interfaces.Services;
using SportsLeague.Domain.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new IsoDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableIsoDateTimeJsonConverter());
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var controller = new ControllerContext
        {
            HttpContext = context.HttpContext
        };

        var controllerBase = new ValidationControllerProxy(controller);
        controllerBase.ModelState.Merge(context.ModelState);

        return ApiErrorFactory.Validation(controllerBase);
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>();

        if (allowedOrigins is { Length: > 0 })
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(
                    "http://localhost:4200",
                    "http://127.0.0.1:4200")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "No se encontró la cadena de conexión 'DefaultConnection'. Configúrala en appsettings.Development.json o mediante variables de entorno.");

builder.Services.AddDbContext<LeagueDbContext>(options =>
    options.UseSqlServer(defaultConnection));

builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IRefereeRepository, RefereeRepository>();
builder.Services.AddScoped<ITournamentRepository, TournamentRepository>();
builder.Services.AddScoped<ITournamentTeamRepository, TournamentTeamRepository>();
builder.Services.AddScoped<ISponsorRepository, SponsorRepository>();
builder.Services.AddScoped<ITournamentSponsorRepository, TournamentSponsorRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();

builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IRefereeService, RefereeService>();
builder.Services.AddScoped<ITournamentService, TournamentService>();
builder.Services.AddScoped<ISponsorService, SponsorService>();
builder.Services.AddScoped<IMatchService, MatchService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

internal sealed class ValidationControllerProxy : ControllerBase
{
    public ValidationControllerProxy(ControllerContext controllerContext)
    {
        ControllerContext = controllerContext;
    }
}
