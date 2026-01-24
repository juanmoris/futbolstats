import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trophy, Users, User, Calendar, Target, ChevronRight } from 'lucide-react';
import { championshipsApi } from '@/api/endpoints/championships.api';
import { teamsApi } from '@/api/endpoints/teams.api';
import { playersApi } from '@/api/endpoints/players.api';
import { matchesApi } from '@/api/endpoints/matches.api';
import { statisticsApi } from '@/api/endpoints/statistics.api';
import { ChampionshipStatus, MatchStatus } from '@/api/types/common.types';
import type { Match } from '@/api/types/match.types';
import type { StandingEntry, Scorer } from '@/api/types/statistics.types';

export function DashboardPage() {
  // Queries para las tarjetas de estadísticas
  const { data: championships } = useQuery({
    queryKey: ['championships', { page: 1, pageSize: 5 }],
    queryFn: () => championshipsApi.getAll({ page: 1, pageSize: 5 }),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', { page: 1, pageSize: 5 }],
    queryFn: () => teamsApi.getAll({ page: 1, pageSize: 5 }),
  });

  const { data: players } = useQuery({
    queryKey: ['players', { page: 1, pageSize: 5 }],
    queryFn: () => playersApi.getAll({ page: 1, pageSize: 5 }),
  });

  const { data: liveMatches } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => matchesApi.getLive(),
  });

  // Query para obtener el campeonato activo
  const { data: activeChampionships } = useQuery({
    queryKey: ['championships', { status: ChampionshipStatus.InProgress }],
    queryFn: () => championshipsApi.getAll({ status: ChampionshipStatus.InProgress, pageSize: 1 }),
  });

  const currentChampionship = activeChampionships?.items?.[0];

  // Query para partidos de la jornada actual
  const { data: matchdayMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ['matches', 'dashboard', currentChampionship?.id, currentChampionship?.maxMatchday],
    queryFn: () => matchesApi.getAll({
      championshipId: currentChampionship!.id,
      matchday: currentChampionship!.maxMatchday,
      pageSize: 20,
    }),
    enabled: !!currentChampionship,
  });

  // Query para tabla de posiciones
  const { data: standings, isLoading: loadingStandings } = useQuery({
    queryKey: ['standings', 'dashboard', currentChampionship?.id],
    queryFn: () => statisticsApi.getStandings(currentChampionship!.id),
    enabled: !!currentChampionship,
  });

  // Query para top goleadores
  const { data: topScorers, isLoading: loadingScorers } = useQuery({
    queryKey: ['topScorers', 'dashboard', currentChampionship?.id],
    queryFn: () => statisticsApi.getTopScorers(currentChampionship!.id, 1, 6),
    enabled: !!currentChampionship,
  });

  const stats = [
    {
      name: 'Campeonatos',
      value: championships?.totalCount || 0,
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Equipos',
      value: teams?.totalCount || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Jugadores',
      value: players?.totalCount || 0,
      icon: User,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Partidos en vivo',
      value: liveMatches?.length || 0,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const getStatusLabel = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.Live:
        return { text: 'EN VIVO', className: 'bg-red-500 text-white animate-pulse' };
      case MatchStatus.HalfTime:
        return { text: 'DESCANSO', className: 'bg-yellow-500 text-white' };
      case MatchStatus.Finished:
        return { text: 'FINAL', className: 'bg-gray-500 text-white' };
      case MatchStatus.Postponed:
        return { text: 'APLAZADO', className: 'bg-orange-500 text-white' };
      case MatchStatus.Cancelled:
        return { text: 'CANCELADO', className: 'bg-gray-700 text-white' };
      default:
        return null;
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general de FutbolStats
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.bgColor} rounded-lg p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campeonato Activo Section */}
      {currentChampionship ? (
        <>
          {/* Championship Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white">
                <Trophy className="h-6 w-6 mr-3" />
                <div>
                  <h2 className="text-lg font-bold">{currentChampionship.name}</h2>
                  <p className="text-green-100 text-sm">Temporada {currentChampionship.season}</p>
                </div>
              </div>
              <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                En curso
              </span>
            </div>
          </div>

          {/* Matchday Section */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Jornada {currentChampionship.maxMatchday}
              </h3>
              <Link
                to="/matches"
                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
              >
                Ver todos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="p-4">
              {loadingMatches ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando partidos...</p>
                </div>
              ) : matchdayMatches?.items?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {matchdayMatches.items.map((match: Match) => {
                    const statusLabel = getStatusLabel(match.status);
                    return (
                      <Link
                        key={match.id}
                        to={`/matches/${match.id}`}
                        className="block bg-gray-50 border rounded-lg p-3 hover:shadow-md hover:border-green-300 transition-all"
                      >
                        <div className="flex justify-between items-center mb-2">
                          {statusLabel ? (
                            <span className={`text-xs px-2 py-0.5 rounded ${statusLabel.className}`}>
                              {statusLabel.text}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {formatMatchDate(match.matchDate)}
                            </span>
                          )}
                          {match.currentMinute && match.status !== MatchStatus.Finished && (
                            <span className="text-xs font-medium text-red-600">
                              {match.currentMinute}'
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/teams/${match.homeTeamId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 flex-1 min-w-0 hover:text-green-600"
                            >
                              {match.homeTeamLogo ? (
                                <img src={match.homeTeamLogo} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-3 w-3 text-gray-500" />
                                </div>
                              )}
                              <span className="text-sm font-medium truncate">{match.homeTeamName}</span>
                            </Link>
                            <span className="font-bold text-lg ml-2">{match.homeScore}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <Link
                              to={`/teams/${match.awayTeamId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 flex-1 min-w-0 hover:text-green-600"
                            >
                              {match.awayTeamLogo ? (
                                <img src={match.awayTeamLogo} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-3 w-3 text-gray-500" />
                                </div>
                              )}
                              <span className="text-sm font-medium truncate">{match.awayTeamName}</span>
                            </Link>
                            <span className="font-bold text-lg ml-2">{match.awayScore}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay partidos en esta jornada</p>
                </div>
              )}
            </div>
          </div>

          {/* Standings and Top Scorers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standings Preview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-green-600" />
                  Tabla de Posiciones
                </h3>
              </div>

              {loadingStandings ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : standings?.standings?.length ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">PJ</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">DG</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {standings.standings.slice(0, 5).map((team: StandingEntry) => (
                          <tr key={team.teamId} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">{team.position}</td>
                            <td className="px-3 py-2">
                              <Link to={`/teams/${team.teamId}`} className="flex items-center gap-2 hover:text-green-600">
                                {team.logoUrl ? (
                                  <img src={team.logoUrl} className="w-5 h-5 rounded-full" alt="" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="h-3 w-3 text-gray-500" />
                                  </div>
                                )}
                                <span className="truncate font-medium">{team.teamName}</span>
                              </Link>
                            </td>
                            <td className="px-3 py-2 text-center font-bold">{team.points}</td>
                            <td className="px-3 py-2 text-center text-gray-500">{team.gamesPlayed}</td>
                            <td className="px-3 py-2 text-center text-gray-500">
                              {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t">
                    <Link
                      to="/statistics?tab=standings"
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                    >
                      Ver tabla completa
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay datos de posiciones</p>
                </div>
              )}
            </div>

            {/* Top Scorers Preview */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-orange-600" />
                  Goleadores
                </h3>
              </div>

              {loadingScorers ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : topScorers?.scorers?.length ? (
                <>
                  <ul className="divide-y">
                    {topScorers.scorers.slice(0, 6).map((scorer: Scorer) => (
                      <li key={scorer.playerId} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                            scorer.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                            scorer.rank === 2 ? 'bg-gray-300 text-gray-800' :
                            scorer.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {scorer.rank}
                          </span>

                          <div className="flex items-center gap-2">
                            {scorer.photoUrl ? (
                              <img src={scorer.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-600" />
                              </div>
                            )}
                            <div>
                              <Link to={`/players/${scorer.playerId}`} className="text-sm font-medium text-gray-900 hover:text-green-600">
                                {scorer.playerName}
                              </Link>
                              <Link to={`/teams/${scorer.teamId}`} className="text-xs text-gray-500 hover:text-green-600 block">
                                {scorer.teamName}
                              </Link>
                            </div>
                          </div>
                        </div>

                        <span className="text-lg font-bold text-gray-900">{scorer.goals}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-3 border-t">
                    <Link
                      to="/statistics?tab=scorers"
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                    >
                      Ver todos los goleadores
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay goleadores registrados</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* No Active Championship Message */
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay campeonato en curso</h3>
          <p className="text-gray-500">
            Los partidos, tabla de posiciones y goleadores se mostrarán cuando haya un campeonato activo.
          </p>
          <Link
            to="/championships"
            className="inline-flex items-center mt-4 text-green-600 hover:text-green-700 font-medium"
          >
            Ver campeonatos
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
