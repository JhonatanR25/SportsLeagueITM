using AutoMapper;
using SportsLeague.API.DTOs.Request;
using SportsLeague.API.DTOs.Response;
using SportsLeague.Domain.Entities;

namespace SportsLeague.API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Team mappings
        CreateMap<TeamRequestDTO, Team>()
            .ForMember(dest => dest.Players, opt => opt.Ignore())
            .ForMember(dest => dest.TournamentTeams, opt => opt.Ignore());

        CreateMap<Team, TeamResponseDTO>();

        // Player mappings
        CreateMap<PlayerRequestDTO, Player>()
            .ForMember(dest => dest.Team, opt => opt.Ignore());

        CreateMap<Player, PlayerResponseDTO>()
            .ForMember(
                dest => dest.TeamName,
                opt => opt.MapFrom(src => src.Team != null ? src.Team.Name : string.Empty));

        // Referee mappings
        CreateMap<RefereeRequestDTO, Referee>();
        CreateMap<Referee, RefereeResponseDTO>();

        // Tournament mappings
        CreateMap<TournamentRequestDTO, Tournament>()
            .ForMember(dest => dest.TournamentTeams, opt => opt.Ignore());

        CreateMap<Tournament, TournamentResponseDTO>()
            .ForMember(
                dest => dest.TeamsCount,
                opt => opt.MapFrom(src => src.TournamentTeams != null ? src.TournamentTeams.Count : 0));

        // Match mappings
        CreateMap<MatchRequestDTO, Match>()
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.HomeScore, opt => opt.Ignore())
            .ForMember(dest => dest.AwayScore, opt => opt.Ignore())
            .ForMember(dest => dest.HomeTeam, opt => opt.Ignore())
            .ForMember(dest => dest.AwayTeam, opt => opt.Ignore())
            .ForMember(dest => dest.Referee, opt => opt.Ignore())
            .ForMember(dest => dest.Tournament, opt => opt.Ignore());

        CreateMap<Match, MatchResponseDTO>()
            .ForMember(
                dest => dest.HomeTeamName,
                opt => opt.MapFrom(src => src.HomeTeam != null ? src.HomeTeam.Name : string.Empty))
            .ForMember(
                dest => dest.AwayTeamName,
                opt => opt.MapFrom(src => src.AwayTeam != null ? src.AwayTeam.Name : string.Empty))
            .ForMember(
                dest => dest.RefereeName,
                opt => opt.MapFrom(src =>
                    src.Referee != null ? $"{src.Referee.FirstName} {src.Referee.LastName}".Trim() : string.Empty))
            .ForMember(
                dest => dest.TournamentName,
                opt => opt.MapFrom(src => src.Tournament != null ? src.Tournament.Name : string.Empty));
    }
}
