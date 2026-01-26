import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Trophy, Target, Shield, Award, Calendar, User } from 'lucide-react';
import { statisticsApi } from '@/api/endpoints/statistics.api';
import { teamsApi } from '@/api/endpoints/teams.api';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | null>(null);
  const hasInitializedDefault = useRef(false);

  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(id!),
    enabled: !!id,
  });

  // Query para obtener la lista de campeonatos (sin filtro)
  const { data: allStats, isLoading: isLoadingAllStats } = useQuery({
    queryKey: ['teamStatistics', id],
    queryFn: () => statisticsApi.getTeamStatistics(id!),
    enabled: !!id,
  });

  // Query para estadisticas filtradas por campeonato
  const { data: filteredStats, isLoading: isLoadingFiltered } = useQuery({
    queryKey: ['teamStatistics', id, selectedChampionshipId],
    queryFn: () => statisticsApi.getTeamStatistics(id!, selectedChampionshipId!),
    enabled: !!id && !!selectedChampionshipId,
  });

  const championships = allStats?.championshipSummaries || [];
  const hasMultipleChampionships = championships.length > 1;

  // Seleccionar el campeonato más reciente por defecto (solo la primera vez)
  useEffect(() => {
    if (championships.length > 0 && !hasInitializedDefault.current) {
      setSelectedChampionshipId(championships[0].championshipId);
      hasInitializedDefault.current = true;
    }
  }, [championships]);

  const _isLoading = isLoadingTeam || isLoadingAllStats || (selectedChampionshipId && isLoadingFiltered);
  void _isLoading; // Variable reservada para uso futuro
  const stats = selectedChampionshipId ? filteredStats : allStats;

  if (isLoadingTeam || isLoadingAllStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!team || !allStats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Equipo no encontrado</p>
        <Link to="/teams" className="text-blue-600 hover:underline mt-2 inline-block">
          Volver a equipos
        </Link>
      </div>
    );
  }

  const displayStats = stats || allStats;
  const winRate = displayStats.matchesPlayed > 0
    ? ((displayStats.wins / displayStats.matchesPlayed) * 100).toFixed(1)
    : '0';

  const selectedChampionship = selectedChampionshipId
    ? championships.find(c => c.championshipId === selectedChampionshipId)
    : null;
  const selectedChampionshipLabel = selectedChampionship
    ? `${selectedChampionship.championshipName} ${selectedChampionship.season}`.trim()
    : null;

  // Agregar estadísticas de entrenadores cuando se muestran todos los campeonatos
  const aggregatedCoaches = !selectedChampionshipId ? (() => {
    const coachMap = new Map<string, {
      coachId: string;
      coachName: string;
      photoUrl: string | null;
      countryName: string | null;
      countryFlagUrl: string | null;
      matchesManaged: number;
      wins: number;
      draws: number;
      losses: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
      firstMatchDate: string | null;
      lastMatchDate: string | null;
      isCurrentCoach: boolean;
    }>();

    championships.forEach(champ => {
      champ.coaches?.forEach(coach => {
        const existing = coachMap.get(coach.coachId);
        if (existing) {
          existing.matchesManaged += coach.matchesManaged;
          existing.wins += coach.wins;
          existing.draws += coach.draws;
          existing.losses += coach.losses;
          existing.points += coach.points;
          existing.goalsFor += coach.goalsFor;
          existing.goalsAgainst += coach.goalsAgainst;
          // Actualizar primera fecha si es anterior
          if (coach.firstMatchDate && (!existing.firstMatchDate || new Date(coach.firstMatchDate) < new Date(existing.firstMatchDate))) {
            existing.firstMatchDate = coach.firstMatchDate;
          }
          // Actualizar última fecha si es posterior
          if (coach.lastMatchDate && (!existing.lastMatchDate || new Date(coach.lastMatchDate) > new Date(existing.lastMatchDate))) {
            existing.lastMatchDate = coach.lastMatchDate;
          }
          // Si alguno es entrenador actual, mantenerlo como actual
          if (coach.isCurrentCoach) {
            existing.isCurrentCoach = true;
          }
        } else {
          coachMap.set(coach.coachId, { ...coach });
        }
      });
    });

    return Array.from(coachMap.values()).sort((a, b) => {
      // Ordenar por última fecha de partido (más reciente primero)
      if (a.lastMatchDate && b.lastMatchDate) {
        return new Date(b.lastMatchDate).getTime() - new Date(a.lastMatchDate).getTime();
      }
      // Si solo uno tiene fecha, ese va primero
      if (a.lastMatchDate) return -1;
      if (b.lastMatchDate) return 1;
      // Si ninguno tiene fecha, ordenar por partidos dirigidos
      return b.matchesManaged - a.matchesManaged;
    });
  })() : null;

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/teams"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a equipos
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-sm sm:text-base text-gray-500">
                {team.stadium && <span>{team.stadium}</span>}
                {team.stadium && team.foundedYear && <span> &bull; </span>}
                {team.foundedYear && <span>Fundado en {team.foundedYear}</span>}
              </p>
            </div>
          </div>

          {/* Selector de Campeonato */}
          {hasMultipleChampionships && (
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <select
                value={selectedChampionshipId || ''}
                onChange={(e) => setSelectedChampionshipId(e.target.value || null)}
                className="block w-full lg:w-64 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todos los campeonatos</option>
                {championships.map((c) => (
                  <option key={c.championshipId} value={c.championshipId}>
                    {c.championshipName} {c.season}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Indicador de campeonato seleccionado */}
        {selectedChampionshipLabel && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-sm text-yellow-800">
            <Trophy className="h-4 w-4" />
            <span>Mostrando estadisticas de: <strong>{selectedChampionshipLabel}</strong></span>
          </div>
        )}
      </div>

      {/* Estadísticas Complementarias */}
      <div className="bg-white rounded-lg shadow mb-6 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600">Efectividad:</span>
          <span className="font-semibold text-gray-900">{winRate}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-purple-500" />
          <span className="text-gray-600">Vallas invictas:</span>
          <span className="font-semibold text-gray-900">{displayStats.cleanSheets}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Tarjetas:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-4 bg-yellow-400 rounded-sm"></span>
            <span className="font-semibold text-gray-900">{displayStats.yellowCards}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-4 bg-red-500 rounded-sm"></span>
            <span className="font-semibold text-gray-900">{displayStats.redCards}</span>
          </span>
        </div>
      </div>

      {/* Partidos Jugados y Goleadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Partidos Jugados */}
        {displayStats.topPlayersByAppearances && displayStats.topPlayersByAppearances.length > 0 && (
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Partidos Jugados</h2>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">{displayStats.topPlayersByAppearances.length} jug.</span>
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto max-h-80">
              {displayStats.topPlayersByAppearances.map((player, index) => (
                <Link key={player.playerId} to={`/players/${player.playerId}`} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-base sm:text-lg font-bold text-gray-400 w-5 sm:w-6 shrink-0">{index + 1}</span>
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.playerName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">{player.playerName}</span>
                      {player.countryFlagUrl && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <img src={player.countryFlagUrl} alt={player.countryName || ''} className="h-3 w-4 object-cover rounded-sm" />
                          <span className="hidden sm:inline">{player.countryName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-blue-600 shrink-0 ml-2">{player.matchesPlayed}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Goleadores del Equipo */}
        {displayStats.topScorers && displayStats.topScorers.length > 0 && (
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Goleadores</h2>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">{displayStats.topScorers.length} jug.</span>
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto max-h-80">
              {displayStats.topScorers.map((scorer, index) => (
                <Link key={scorer.playerId} to={`/players/${scorer.playerId}`} className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-base sm:text-lg font-bold text-gray-400 w-5 sm:w-6 shrink-0">{index + 1}</span>
                    {scorer.photoUrl ? (
                      <img src={scorer.photoUrl} alt={scorer.playerName} className="h-8 w-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">{scorer.playerName}</span>
                      {scorer.countryFlagUrl && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <img src={scorer.countryFlagUrl} alt={scorer.countryName || ''} className="h-3 w-4 object-cover rounded-sm" />
                          <span className="hidden sm:inline">{scorer.countryName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-green-600 shrink-0 ml-2">{scorer.goals}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entrenadores */}
      {(selectedChampionshipId
        ? championships.filter(c => c.championshipId === selectedChampionshipId).some(c => c.coaches && c.coaches.length > 0)
        : aggregatedCoaches && aggregatedCoaches.length > 0
      ) && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 sm:px-6 py-4 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {selectedChampionshipId
                ? (championships.find(c => c.championshipId === selectedChampionshipId)?.coaches?.length ?? 0) === 1 ? 'Entrenador' : 'Entrenadores'
                : (aggregatedCoaches?.length === 1 ? 'Entrenador' : 'Entrenadores')}
            </h2>
          </div>
          <div className="px-4 sm:px-6 py-4 overflow-x-auto">
            {selectedChampionshipId ? (
              // Mostrar entrenadores del campeonato seleccionado
              championships.filter(c => c.championshipId === selectedChampionshipId).map((championship) => (
                <div key={championship.championshipId} className="inline-flex gap-4">
                  {championship.coaches?.map((coach) => {
                    const winRate = coach.matchesManaged > 0
                      ? ((coach.wins / coach.matchesManaged) * 100).toFixed(0)
                      : '0';
                    const goalDiff = coach.goalsFor - coach.goalsAgainst;
                    return (
                      <div
                        key={coach.coachId}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 w-[365px] flex-shrink-0"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {coach.photoUrl ? (
                            <img
                              src={coach.photoUrl}
                              alt={coach.coachName}
                              className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-sm">
                              <User className="h-7 w-7 text-gray-500" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">{coach.coachName}</div>
                            {coach.countryName && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                {coach.countryFlagUrl && (
                                  <img
                                    src={coach.countryFlagUrl}
                                    alt={coach.countryName}
                                    className="h-3 w-4 object-cover rounded-sm"
                                  />
                                )}
                                <span>{coach.countryName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                            <div className="text-lg font-bold text-gray-900">{coach.matchesManaged}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">PJ</div>
                          </div>
                          <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                            <div className="text-lg font-bold text-green-600">{coach.wins}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">PG</div>
                          </div>
                          <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                            <div className="text-lg font-bold text-gray-500">{coach.draws}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">PE</div>
                          </div>
                          <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                            <div className="text-lg font-bold text-red-600">{coach.losses}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">PP</div>
                          </div>
                          <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                            <div className="text-lg font-bold text-blue-600">{coach.points}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Pts</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">
                              <span className="font-medium text-gray-700">{coach.goalsFor}</span> GF
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-gray-700">{coach.goalsAgainst}</span> GC
                            </span>
                            <span className={goalDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {goalDiff > 0 ? '+' : ''}{goalDiff}
                            </span>
                          </div>
                          <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {winRate}% efect.
                          </div>
                        </div>
                        {coach.firstMatchDate && (
                          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                            {coach.isCurrentCoach ? (
                              <span>
                                Desde: <span className="font-medium text-gray-700">
                                  {new Date(coach.firstMatchDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </span>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span>
                                  Inicio: <span className="font-medium text-gray-700">
                                    {new Date(coach.firstMatchDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </span>
                                {coach.lastMatchDate && (
                                  <span>
                                    Fin: <span className="font-medium text-gray-700">
                                      {new Date(coach.lastMatchDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              // Mostrar entrenadores agregados (todos los campeonatos)
              <div className="inline-flex gap-4">
                {aggregatedCoaches?.map((coach) => {
                  const winRate = coach.matchesManaged > 0
                    ? ((coach.wins / coach.matchesManaged) * 100).toFixed(0)
                    : '0';
                  const goalDiff = coach.goalsFor - coach.goalsAgainst;
                  return (
                    <div
                      key={coach.coachId}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 w-[365px] flex-shrink-0"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {coach.photoUrl ? (
                          <img
                            src={coach.photoUrl}
                            alt={coach.coachName}
                            className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-white shadow-sm">
                            <User className="h-7 w-7 text-gray-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{coach.coachName}</div>
                          {coach.countryName && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                              {coach.countryFlagUrl && (
                                <img
                                  src={coach.countryFlagUrl}
                                  alt={coach.countryName}
                                  className="h-3 w-4 object-cover rounded-sm"
                                />
                              )}
                              <span>{coach.countryName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                          <div className="text-lg font-bold text-gray-900">{coach.matchesManaged}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">PJ</div>
                        </div>
                        <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                          <div className="text-lg font-bold text-green-600">{coach.wins}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">PG</div>
                        </div>
                        <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                          <div className="text-lg font-bold text-gray-500">{coach.draws}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">PE</div>
                        </div>
                        <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                          <div className="text-lg font-bold text-red-600">{coach.losses}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">PP</div>
                        </div>
                        <div className="bg-white rounded-lg py-2 px-1 border border-gray-100">
                          <div className="text-lg font-bold text-blue-600">{coach.points}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Pts</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">
                            <span className="font-medium text-gray-700">{coach.goalsFor}</span> GF
                          </span>
                          <span className="text-gray-500">
                            <span className="font-medium text-gray-700">{coach.goalsAgainst}</span> GC
                          </span>
                          <span className={goalDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {goalDiff > 0 ? '+' : ''}{goalDiff}
                          </span>
                        </div>
                        <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {winRate}% efect.
                        </div>
                      </div>
                      {coach.firstMatchDate && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                          {coach.isCurrentCoach ? (
                            <span>
                              Desde: <span className="font-medium text-gray-700">
                                {new Date(coach.firstMatchDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </span>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>
                                Inicio: <span className="font-medium text-gray-700">
                                  {new Date(coach.firstMatchDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </span>
                              {coach.lastMatchDate && (
                                <span>
                                  Fin: <span className="font-medium text-gray-700">
                                    {new Date(coach.lastMatchDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rendimiento por Campeonato */}
      {championships.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {selectedChampionshipId ? 'Rendimiento en el Campeonato' : 'Rendimiento por Campeonato'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campeonato
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pos.
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PJ
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PG
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PE
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PP
                  </th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GC
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DG
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(selectedChampionshipId
                  ? championships.filter(c => c.championshipId === selectedChampionshipId)
                  : championships
                ).map((championship) => {
                  const gd = championship.goalsFor - championship.goalsAgainst;
                  return (
                    <tr key={championship.championshipId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-1 sm:mr-2 shrink-0" />
                          <span className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{championship.championshipName} {championship.season}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          championship.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                          championship.position === 2 ? 'bg-gray-200 text-gray-800' :
                          championship.position === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {championship.position}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {championship.matchesPlayed}
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-green-600">
                        {championship.wins}
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {championship.draws}
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-red-600">
                        {championship.losses}
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {championship.goalsFor}
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {championship.goalsAgainst}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm">
                        <span className={gd >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {gd > 0 ? '+' : ''}{gd}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm font-bold text-gray-900">
                        {championship.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje si no hay campeonatos - solo mostrar cuando no hay filtro */}
      {!selectedChampionshipId && championships.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Este equipo no participa en ningun campeonato</p>
        </div>
      )}
    </div>
  );
}
