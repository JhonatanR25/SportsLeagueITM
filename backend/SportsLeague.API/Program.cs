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

builder.Services.AddDbContext<LeagueDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IRefereeRepository, RefereeRepository>();
builder.Services.AddScoped<ITournamentRepository, TournamentRepository>();
builder.Services.AddScoped<ITournamentTeamRepository, TournamentTeamRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();

builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IRefereeService, RefereeService>();
builder.Services.AddScoped<ITournamentService, TournamentService>();
builder.Services.AddScoped<IMatchService, MatchService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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
