import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Trophy,
  Target,
  Users,
  Calendar,
  MapPin,
  Shirt,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { statisticsApi } from '@/api/endpoints/statistics.api';

const positionLabels: Record<string, string> = {
  Goalkeeper: 'Portero',
  Defender: 'Defensa',
  Midfielder: 'Mediocampista',
  Forward: 'Delantero',
};

const positionColors: Record<string, string> = {
  Goalkeeper: 'bg-yellow-100 text-yellow-800',
  Defender: 'bg-blue-100 text-blue-800',
  Midfielder: 'bg-green-100 text-green-800',
  Forward: 'bg-red-100 text-red-800',
};

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | null>(null);
  const hasInitializedDefault = useRef(false);

  // Query para estadisticas generales (sin filtro de campeonato)
  const { data: allStats, isLoading: isLoadingAll } = useQuery({
    queryKey: ['playerStatistics', id],
    queryFn: () => statisticsApi.getPlayerStatistics(id!),
    enabled: !!id,
  });

  // Query para estadisticas filtradas por campeonato
  const { data: filteredStats, isLoading: isLoadingFiltered } = useQuery({
    queryKey: ['playerStatistics', id, selectedChampionshipId],
    queryFn: () => statisticsApi.getPlayerStatistics(id!, selectedChampionshipId!),
    enabled: !!id && !!selectedChampionshipId,
  });

  const championships = allStats?.championshipStats || [];
  const hasChampionships = championships.length > 0;

  // Seleccionar el primer campeonato por defecto (solo la primera vez)
  useEffect(() => {
    if (championships.length > 0 && !hasInitializedDefault.current) {
      setSelectedChampionshipId(championships[0].championshipId);
      hasInitializedDefault.current = true;
    }
  }, [championships]);

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!allStats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Jugador no encontrado</p>
        <Link to="/players" className="text-purple-600 hover:underline mt-2 inline-block">
          Volver a jugadores
        </Link>
      </div>
    );
  }

  const stats = selectedChampionshipId ? filteredStats : allStats;
  const displayStats = stats || allStats;
  const age = calculateAge(allStats.birthDate);

  const selectedChampionship = selectedChampionshipId
    ? championships.find(c => c.championshipId === selectedChampionshipId)
    : null;
  const selectedChampionshipLabel = selectedChampionship
    ? `${selectedChampionship.championshipName} ${selectedChampionship.season}`
    : null;

  // Filtrar partidos por campeonato seleccionado
  const filteredMatches = selectedChampionshipId && allStats.recentMatches
    ? allStats.recentMatches.filter(m => m.championshipName === selectedChampionship?.championshipName)
    : allStats.recentMatches;

  // Calcular goles encajados para porteros
  const isGoalkeeper = allStats.position === 'Goalkeeper';
  const goalsConceded = filteredMatches?.reduce((total, match) => total + match.opponentScore, 0) || 0;

  // Calcular goles encajados por equipo (para porteros)
  const goalsConcededByTeam = allStats.recentMatches?.reduce((acc, match) => {
    acc[match.teamName] = (acc[match.teamName] || 0) + match.opponentScore;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calcular goles encajados por campeonato (para porteros)
  const goalsConcededByChampionship = allStats.recentMatches?.reduce((acc, match) => {
    acc[match.championshipName] = (acc[match.championshipName] || 0) + match.opponentScore;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/players"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a jugadores
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Foto del jugador */}
            {allStats.photoUrl ? (
              <img
                src={allStats.photoUrl}
                alt={allStats.playerName}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-gray-200 shrink-0"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-gray-200 shrink-0">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600" />
              </div>
            )}

            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {allStats.playerName}
                </h1>
                {allStats.number && (
                  <span className="text-xl sm:text-2xl font-bold text-gray-400">#{allStats.number}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm text-gray-600">
                {/* Posicion */}
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${positionColors[allStats.position] || 'bg-gray-100 text-gray-800'}`}>
                  {positionLabels[allStats.position] || allStats.position}
                </span>

                {/* Equipo actual */}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-xs sm:text-sm">{allStats.teamName}</span>
                </div>

                {/* Nacionalidad */}
                {allStats.countryName && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm">{allStats.countryName}</span>
                  </div>
                )}

                {/* Edad */}
                {age !== null && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm">{age} anos</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selector de Campeonato */}
          {hasChampionships && (
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
              <select
                value={selectedChampionshipId || ''}
                onChange={(e) => setSelectedChampionshipId(e.target.value || null)}
                className="block w-full lg:w-64 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
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

      {/* Estadisticas Generales */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-4 sm:px-6 py-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Estadisticas Generales</h2>
        </div>
        <div className="p-4 sm:p-6">
          {isLoadingFiltered && selectedChampionshipId ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Cargando estadisticas...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                  icon={<Shirt className="h-5 w-5 text-blue-500" />}
                  label="Partidos"
                  value={displayStats.matchesPlayed}
                  subtitle={`${displayStats.matchesStarted} titular`}
                />
                <StatCard
                  icon={<Target className={`h-5 w-5 ${isGoalkeeper ? 'text-red-500' : 'text-green-500'}`} />}
                  label={isGoalkeeper ? 'Goles Enc.' : 'Goles'}
                  value={isGoalkeeper ? goalsConceded : displayStats.goals}
                />
                <StatCard
                  icon={<Award className="h-5 w-5 text-purple-500" />}
                  label="Asistencias"
                  value={displayStats.assists}
                />
                <StatCard
                  icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  label="Amarillas"
                  value={displayStats.yellowCards}
                />
                <StatCard
                  icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                  label="Rojas"
                  value={displayStats.redCards}
                />
                <StatCard
                  icon={<Target className="h-5 w-5 text-orange-500" />}
                  label="Autogoles"
                  value={displayStats.ownGoals}
                />
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{displayStats.matchesStarted}</p>
                  <p className="text-xs sm:text-sm text-gray-500">Como Titular</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-600">{displayStats.matchesAsSub}</p>
                  <p className="text-xs sm:text-sm text-gray-500">Como Suplente</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{displayStats.penaltiesScored}</p>
                  <p className="text-xs sm:text-sm text-gray-500">Pen. Marcados</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{displayStats.penaltiesMissed}</p>
                  <p className="text-xs sm:text-sm text-gray-500">Pen. Fallados</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Estadisticas por Equipo y por Campeonato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Estadisticas por Equipo */}
        {allStats.teamStats && allStats.teamStats.length > 0 && (
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Por Equipo</h2>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">{allStats.teamStats.length} equipos</span>
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto max-h-80">
              {allStats.teamStats.map((ts) => (
                <div key={ts.teamId} className="px-4 sm:px-6 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      {ts.teamLogoUrl ? (
                        <img
                          src={ts.teamLogoUrl}
                          alt={ts.teamName}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{ts.teamName}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600 shrink-0 ml-2">{ts.matchesPlayed} PJ</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 ml-9 sm:ml-11">
                    <span className={isGoalkeeper ? 'text-red-600' : 'text-green-600'}>
                      {isGoalkeeper ? (goalsConcededByTeam[ts.teamName] || 0) : ts.goals} {isGoalkeeper ? 'enc.' : 'goles'}
                    </span>
                    <span className="text-purple-600">{ts.assists} asist.</span>
                    <span className="text-yellow-600">{ts.yellowCards} TA</span>
                    <span className="text-red-600">{ts.redCards} TR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estadisticas por Campeonato */}
        {championships.length > 0 && (
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Por Campeonato</h2>
              </div>
              <span className="text-xs sm:text-sm text-gray-500">{championships.length} camp.</span>
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto max-h-80">
              {(selectedChampionshipId
                ? championships.filter(c => c.championshipId === selectedChampionshipId)
                : championships
              ).map((cs) => (
                <div key={cs.championshipId} className="px-4 sm:px-6 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{cs.championshipName} {cs.season}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600 shrink-0 ml-2">{cs.matchesPlayed} PJ</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 ml-6">
                    <span className={isGoalkeeper ? 'text-red-600' : 'text-green-600'}>
                      {isGoalkeeper ? (goalsConcededByChampionship[cs.championshipName] || 0) : cs.goals} {isGoalkeeper ? 'enc.' : 'goles'}
                    </span>
                    <span className="text-purple-600">{cs.assists} asist.</span>
                    <span className="text-yellow-600">{cs.yellowCards} TA</span>
                    <span className="text-red-600">{cs.redCards} TR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de Partidos */}
      {filteredMatches && filteredMatches.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Partidos Jugados</h2>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">{filteredMatches.length} partidos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Rival
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campeonato
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Res.
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isGoalkeeper ? 'G. Enc.' : 'Goles'}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asist.
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarjetas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match) => {
                  const isWin = match.teamScore > match.opponentScore;
                  const isDraw = match.teamScore === match.opponentScore;
                  const resultColor = isWin ? 'text-green-600' : isDraw ? 'text-gray-600' : 'text-red-600';
                  const resultBg = isWin ? 'bg-green-50' : isDraw ? 'bg-gray-50' : 'bg-red-50';

                  return (
                    <tr key={match.matchId} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-3 py-3 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-2">
                          {match.opponentLogoUrl && (
                            <img
                              src={match.opponentLogoUrl}
                              alt={match.opponentName}
                              className="h-6 w-6 rounded-full object-cover shrink-0"
                            />
                          )}
                          <span className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">{match.opponentName}</span>
                          <span className="text-xs text-gray-400">({match.isHome ? 'L' : 'V'})</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {formatDate(match.matchDate)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-2 shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">{match.championshipName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold ${resultBg} ${resultColor}`}>
                          {match.teamScore}-{match.opponentScore}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          match.isStarter ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {match.isStarter ? 'Titular' : 'Suplente'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {isGoalkeeper ? (
                          match.opponentScore > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold bg-red-100 text-red-800">
                              {match.opponentScore}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold bg-green-100 text-green-800">
                              0
                            </span>
                          )
                        ) : (
                          match.goals > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold bg-green-100 text-green-800">
                              {match.goals}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">-</span>
                          )
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {match.assists > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold bg-purple-100 text-purple-800">
                            {match.assists}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs sm:text-sm">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {match.yellowCards > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              {match.yellowCards}
                            </span>
                          )}
                          {match.redCards > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {match.redCards}
                            </span>
                          )}
                          {match.yellowCards === 0 && match.redCards === 0 && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje si no hay partidos */}
      {(!filteredMatches || filteredMatches.length === 0) && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay partidos registrados</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
        {icon}
        <span className="text-xs sm:text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}
