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
                    {allStats.countryFlagUrl ? (
                      <img src={allStats.countryFlagUrl} alt={allStats.countryName} className="h-4 w-5 object-cover rounded-sm" />
                    ) : (
                      <MapPin className="h-4 w-4 text-gray-400" />
                    )}
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
            <GeneralStatsGrid
              stats={displayStats}
              isGoalkeeper={isGoalkeeper}
              goalsConceded={goalsConceded}
              filteredMatches={filteredMatches}
            />
          )}
        </div>
      </div>

      {/* Estadisticas por Equipo y por Campeonato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Estadisticas por Equipo */}
        {allStats.teamStats && allStats.teamStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 rounded-md p-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Por Equipo</h2>
              </div>
              <span className="text-xs text-gray-400">{allStats.teamStats.length} equipos</span>
            </div>
            <div className="divide-y divide-gray-50 overflow-y-auto max-h-64">
              {allStats.teamStats.map((ts) => (
                <Link
                  key={ts.teamId}
                  to={`/teams/${ts.teamId}`}
                  className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {ts.teamLogoUrl ? (
                      <img
                        src={ts.teamLogoUrl}
                        alt={ts.teamName}
                        className="h-8 w-8 rounded-full object-cover shrink-0 border border-gray-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm truncate hover:text-blue-600">{ts.teamName}</span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{ts.matchesPlayed} PJ</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isGoalkeeper ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {isGoalkeeper ? (goalsConcededByTeam[ts.teamName] || 0) : ts.goals} {isGoalkeeper ? 'enc' : 'gol'}
                        </span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                          {ts.assists} ast
                        </span>
                        {(ts.yellowCards > 0 || ts.redCards > 0) && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">
                            {ts.yellowCards}/{ts.redCards}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Estadisticas por Campeonato */}
        {championships.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-100 rounded-md p-1.5">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Por Campeonato</h2>
              </div>
              <span className="text-xs text-gray-400">{championships.length} camp.</span>
            </div>
            <div className="divide-y divide-gray-50 overflow-y-auto max-h-64">
              {(selectedChampionshipId
                ? championships.filter(c => c.championshipId === selectedChampionshipId)
                : championships
              ).map((cs) => (
                <div key={cs.championshipId} className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm truncate">{cs.championshipName}</span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{cs.matchesPlayed} PJ</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{cs.season}</span>
                        <span className="text-gray-300">·</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isGoalkeeper ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {isGoalkeeper ? (goalsConcededByChampionship[cs.championshipName] || 0) : cs.goals} {isGoalkeeper ? 'enc' : 'gol'}
                        </span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                          {cs.assists} ast
                        </span>
                        {(cs.yellowCards > 0 || cs.redCards > 0) && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">
                            {cs.yellowCards}/{cs.redCards}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de Partidos */}
      {filteredMatches && filteredMatches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 rounded-md p-1.5">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Partidos Jugados</h2>
            </div>
            <span className="text-xs text-gray-400">{filteredMatches.length} partidos</span>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-96">
            {filteredMatches.map((match) => {
              const isWin = match.teamScore > match.opponentScore;
              const isDraw = match.teamScore === match.opponentScore;
              const resultBg = isWin ? 'bg-green-500' : isDraw ? 'bg-gray-400' : 'bg-red-500';
              const rowBg = isWin ? 'hover:bg-green-50' : isDraw ? 'hover:bg-gray-50' : 'hover:bg-red-50';

              return (
                <Link
                  key={match.matchId}
                  to={`/matches/${match.matchId}`}
                  className={`block px-4 py-2.5 ${rowBg} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    {/* Indicador de resultado */}
                    <div className={`w-1 h-10 rounded-full ${resultBg} shrink-0`} />

                    {/* Logo rival */}
                    {match.opponentLogoUrl ? (
                      <img
                        src={match.opponentLogoUrl}
                        alt={match.opponentName}
                        className="h-8 w-8 rounded-full object-cover shrink-0 border border-gray-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-gray-400" />
                      </div>
                    )}

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-gray-900 text-sm truncate">{match.opponentName}</span>
                          <span className="text-xs text-gray-400 shrink-0">({match.isHome ? 'L' : 'V'})</span>
                        </div>
                        <span className={`text-sm font-bold ${isWin ? 'text-green-600' : isDraw ? 'text-gray-500' : 'text-red-600'} hover:underline`}>
                          {match.teamScore}-{match.opponentScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">{formatDate(match.matchDate)}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{match.championshipName}</span>
                        <span className="text-gray-300">·</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${match.isStarter ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                          {match.isStarter ? 'TIT' : 'SUP'}
                        </span>
                        {/* Stats del partido */}
                        {isGoalkeeper ? (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${match.opponentScore === 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {match.opponentScore === 0 ? 'Valla inv.' : `${match.opponentScore} enc`}
                          </span>
                        ) : (
                          <>
                            {match.goals > 0 && (
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-600">
                                {match.goals} gol{match.goals > 1 ? 'es' : ''}
                              </span>
                            )}
                            {match.assists > 0 && (
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                                {match.assists} ast
                              </span>
                            )}
                          </>
                        )}
                        {match.yellowCards > 0 && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">
                            {match.yellowCards} TA
                          </span>
                        )}
                        {match.redCards > 0 && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            {match.redCards} TR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
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

import type { PlayerStatisticsResponse, PlayerMatch } from '@/api/types/statistics.types';

// Funciones de calculo de metricas
function calculateMetrics(stats: PlayerStatisticsResponse, _isGoalkeeper: boolean, goalsConceded: number, filteredMatches: PlayerMatch[] | null) {
  const matchesPlayed = stats.matchesPlayed || 0;

  // Ratios por partido
  const goalsPerMatch = matchesPlayed > 0 ? (stats.goals / matchesPlayed).toFixed(2) : '0.00';
  const assistsPerMatch = matchesPlayed > 0 ? (stats.assists / matchesPlayed).toFixed(2) : '0.00';
  const participation = stats.goals + stats.assists;
  const participationPerMatch = matchesPlayed > 0 ? (participation / matchesPlayed).toFixed(2) : '0.00';

  // Porcentaje de titularidades
  const starterPercentage = matchesPlayed > 0 ? Math.round((stats.matchesStarted / matchesPlayed) * 100) : 0;

  // Efectividad de penales
  const totalPenalties = stats.penaltiesScored + stats.penaltiesMissed;
  const penaltyEfficiency = totalPenalties > 0
    ? Math.round((stats.penaltiesScored / totalPenalties) * 100)
    : null;

  // Tarjetas por partido (escala a 100 para la barra, max 1 tarjeta por partido = 100%)
  const cardsTotal = stats.yellowCards + stats.redCards;
  const cardsPerMatch = matchesPlayed > 0 ? (cardsTotal / matchesPlayed) : 0;
  const cardsProgress = Math.min(cardsPerMatch * 100, 100);

  // Para porteros: goles encajados por partido y porterias a cero
  const goalsConcededPerMatch = matchesPlayed > 0 ? (goalsConceded / matchesPlayed).toFixed(2) : '0.00';
  const cleanSheets = filteredMatches?.filter(m => m.opponentScore === 0).length || 0;
  const cleanSheetPercentage = matchesPlayed > 0 ? Math.round((cleanSheets / matchesPlayed) * 100) : 0;

  // Progreso para goles (escala relativa, max razonable ~1 gol por partido = 100%)
  const goalsProgress = matchesPlayed > 0 ? Math.min((stats.goals / matchesPlayed) * 100, 100) : 0;
  const assistsProgress = matchesPlayed > 0 ? Math.min((stats.assists / matchesPlayed) * 100, 100) : 0;
  const participationProgress = matchesPlayed > 0 ? Math.min((participation / matchesPlayed) * 100, 100) : 0;

  return {
    goalsPerMatch,
    assistsPerMatch,
    participation,
    participationPerMatch,
    starterPercentage,
    penaltyEfficiency,
    totalPenalties,
    cardsTotal,
    cardsPerMatch: cardsPerMatch.toFixed(2),
    cardsProgress,
    goalsConcededPerMatch,
    cleanSheets,
    cleanSheetPercentage,
    goalsProgress,
    assistsProgress,
    participationProgress,
  };
}

function GeneralStatsGrid({
  stats,
  isGoalkeeper,
  goalsConceded,
  filteredMatches,
}: {
  stats: PlayerStatisticsResponse;
  isGoalkeeper: boolean;
  goalsConceded: number;
  filteredMatches: PlayerMatch[] | null;
}) {
  const metrics = calculateMetrics(stats, isGoalkeeper, goalsConceded, filteredMatches);

  if (isGoalkeeper) {
    // Vista para porteros
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Partidos */}
        <EnhancedStatCard
          icon={<Shirt className="h-5 w-5" />}
          label="Partidos"
          value={stats.matchesPlayed}
          ratio={`${metrics.starterPercentage}% titular`}
          progress={metrics.starterPercentage}
          colorScheme="blue"
        />

        {/* Goles Encajados */}
        <EnhancedStatCard
          icon={<Target className="h-5 w-5" />}
          label="Goles Enc."
          value={goalsConceded}
          ratio={`${metrics.goalsConcededPerMatch} por PJ`}
          progress={Math.max(0, 100 - parseFloat(metrics.goalsConcededPerMatch) * 50)}
          colorScheme="red"
        />

        {/* Porterias a Cero */}
        <EnhancedStatCard
          icon={<Award className="h-5 w-5" />}
          label="Vallas Inv."
          value={metrics.cleanSheets}
          ratio={`${metrics.cleanSheetPercentage}% de partidos`}
          progress={metrics.cleanSheetPercentage}
          colorScheme="green"
        />

        {/* Asistencias (porteros tambien pueden asistir) */}
        <EnhancedStatCard
          icon={<Target className="h-5 w-5" />}
          label="Asistencias"
          value={stats.assists}
          ratio={`${metrics.assistsPerMatch} por PJ`}
          progress={metrics.assistsProgress}
          colorScheme="purple"
        />

        {/* Penales */}
        <EnhancedStatCard
          icon={<Target className="h-5 w-5" />}
          label="Penales"
          value={metrics.penaltyEfficiency !== null ? `${metrics.penaltyEfficiency}%` : '-'}
          ratio={metrics.totalPenalties > 0 ? `${stats.penaltiesScored} de ${metrics.totalPenalties}` : 'Sin penales'}
          progress={metrics.penaltyEfficiency || 0}
          colorScheme="orange"
        />

        {/* Disciplina */}
        <EnhancedStatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Disciplina"
          value={`${stats.yellowCards} / ${stats.redCards}`}
          ratio={`${metrics.cardsPerMatch} por PJ`}
          progress={metrics.cardsProgress}
          colorScheme="yellow"
        />
      </div>
    );
  }

  // Vista para jugadores de campo
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Goles */}
      <EnhancedStatCard
        icon={<Target className="h-5 w-5" />}
        label="Goles"
        value={stats.goals}
        ratio={`${metrics.goalsPerMatch} por PJ`}
        progress={metrics.goalsProgress}
        colorScheme="green"
      />

      {/* Asistencias */}
      <EnhancedStatCard
        icon={<Award className="h-5 w-5" />}
        label="Asistencias"
        value={stats.assists}
        ratio={`${metrics.assistsPerMatch} por PJ`}
        progress={metrics.assistsProgress}
        colorScheme="purple"
      />

      {/* Participacion en Goles */}
      <EnhancedStatCard
        icon={<Trophy className="h-5 w-5" />}
        label="G + A"
        value={metrics.participation}
        ratio={`${metrics.participationPerMatch} por PJ`}
        progress={metrics.participationProgress}
        colorScheme="cyan"
      />

      {/* Partidos */}
      <EnhancedStatCard
        icon={<Shirt className="h-5 w-5" />}
        label="Partidos"
        value={stats.matchesPlayed}
        ratio={`${metrics.starterPercentage}% titular`}
        progress={metrics.starterPercentage}
        colorScheme="blue"
      />

      {/* Penales */}
      <EnhancedStatCard
        icon={<Target className="h-5 w-5" />}
        label="Penales"
        value={metrics.penaltyEfficiency !== null ? `${metrics.penaltyEfficiency}%` : '-'}
        ratio={metrics.totalPenalties > 0 ? `${stats.penaltiesScored} de ${metrics.totalPenalties}` : 'Sin penales'}
        progress={metrics.penaltyEfficiency || 0}
        colorScheme="orange"
      />

      {/* Disciplina */}
      <EnhancedStatCard
        icon={<AlertTriangle className="h-5 w-5" />}
        label="Disciplina"
        value={`${stats.yellowCards} / ${stats.redCards}`}
        ratio={`${metrics.cardsPerMatch} por PJ`}
        progress={metrics.cardsProgress}
        colorScheme="yellow"
      />
    </div>
  );
}

type ColorScheme = 'green' | 'purple' | 'blue' | 'orange' | 'yellow' | 'red' | 'cyan';

const colorSchemes: Record<ColorScheme, { iconBg: string; iconColor: string; progressBg: string; progressFill: string; valueColor: string }> = {
  green: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-green-500',
    valueColor: 'text-green-600',
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-purple-500',
    valueColor: 'text-purple-600',
  },
  blue: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-blue-500',
    valueColor: 'text-blue-600',
  },
  orange: {
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-orange-500',
    valueColor: 'text-orange-600',
  },
  yellow: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-yellow-500',
    valueColor: 'text-yellow-600',
  },
  red: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-red-500',
    valueColor: 'text-red-600',
  },
  cyan: {
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    progressBg: 'bg-gray-200',
    progressFill: 'bg-cyan-500',
    valueColor: 'text-cyan-600',
  },
};

function EnhancedStatCard({
  icon,
  label,
  value,
  ratio,
  progress,
  colorScheme,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  ratio?: string;
  progress?: number;
  colorScheme: ColorScheme;
}) {
  const colors = colorSchemes[colorScheme];

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`${colors.iconBg} rounded-md p-1.5`}>
            <span className={colors.iconColor}>{icon}</span>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
        </div>
        <p className={`text-xl font-bold ${colors.valueColor}`}>{value}</p>
      </div>

      {(ratio || progress !== undefined) && (
        <div className="flex items-center gap-2">
          {progress !== undefined && (
            <div className={`${colors.progressBg} rounded-full h-1 flex-1`}>
              <div
                className={`${colors.progressFill} rounded-full h-1 transition-all duration-500`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
          {ratio && (
            <span className="text-xs text-gray-400 whitespace-nowrap">{ratio}</span>
          )}
        </div>
      )}
    </div>
  );
}
