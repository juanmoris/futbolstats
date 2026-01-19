import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Trophy, Target, Shield, AlertTriangle, Award, Calendar } from 'lucide-react';
import { statisticsApi } from '@/api/endpoints/statistics.api';
import { teamsApi } from '@/api/endpoints/teams.api';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | null>(null);

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

  const isLoading = isLoadingTeam || isLoadingAllStats || (selectedChampionshipId && isLoadingFiltered);
  const stats = selectedChampionshipId ? filteredStats : allStats;
  const championships = allStats?.championshipSummaries || [];
  const hasMultipleChampionships = championships.length > 1;

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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/teams"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a equipos
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-500">
                {team.stadium && <span>{team.stadium}</span>}
                {team.stadium && team.foundedYear && <span> &bull; </span>}
                {team.foundedYear && <span>Fundado en {team.foundedYear}</span>}
              </p>
            </div>
          </div>

          {/* Selector de Campeonato */}
          {hasMultipleChampionships && (
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <select
                value={selectedChampionshipId || ''}
                onChange={(e) => setSelectedChampionshipId(e.target.value || null)}
                className="block w-64 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

      {/* Estadísticas Generales */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Estadisticas Generales</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              icon={<Trophy className="h-5 w-5 text-yellow-500" />}
              label="Puntos"
              value={displayStats.points}
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-green-500" />}
              label="Partidos"
              value={displayStats.matchesPlayed}
            />
            <StatCard
              icon={<Award className="h-5 w-5 text-blue-500" />}
              label="Victorias"
              value={displayStats.wins}
              subtitle={`${winRate}%`}
            />
            <StatCard
              icon={<Shield className="h-5 w-5 text-gray-500" />}
              label="Empates"
              value={displayStats.draws}
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              label="Derrotas"
              value={displayStats.losses}
            />
            <StatCard
              icon={<Shield className="h-5 w-5 text-purple-500" />}
              label="Vallas Invictas"
              value={displayStats.cleanSheets}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{displayStats.goalsFor}</p>
              <p className="text-sm text-gray-500">Goles a Favor</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{displayStats.goalsAgainst}</p>
              <p className="text-sm text-gray-500">Goles en Contra</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${displayStats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {displayStats.goalDifference > 0 ? '+' : ''}{displayStats.goalDifference}
              </p>
              <p className="text-sm text-gray-500">Diferencia de Goles</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex justify-center gap-4">
                <div>
                  <p className="text-xl font-bold text-yellow-500">{displayStats.yellowCards}</p>
                  <p className="text-xs text-gray-500">Amarillas</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-500">{displayStats.redCards}</p>
                  <p className="text-xs text-gray-500">Rojas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goleadores y Partidos Jugados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Goleadores del Equipo */}
        {displayStats.topScorers && displayStats.topScorers.length > 0 && (
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Goleadores</h2>
              </div>
              <span className="text-sm text-gray-500">{displayStats.topScorers.length} jugadores</span>
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto max-h-80">
              {displayStats.topScorers.map((scorer, index) => (
                <div key={scorer.playerId} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                    <span className="font-medium text-gray-900">{scorer.playerName}</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{scorer.goals} goles</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partidos Jugados */}
        {displayStats.topPlayersByAppearances && displayStats.topPlayersByAppearances.length > 0 && (
          <div className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Partidos Jugados</h2>
              </div>
              <span className="text-sm text-gray-500">{displayStats.topPlayersByAppearances.length} jugadores</span>
            </div>
            <div className="divide-y divide-gray-200 overflow-y-auto max-h-80">
              {displayStats.topPlayersByAppearances.map((player, index) => (
                <div key={player.playerId} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                    <span className="font-medium text-gray-900">{player.playerName}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{player.matchesPlayed} PJ</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rendimiento por Campeonato - solo mostrar cuando no hay filtro */}
      {!selectedChampionshipId && championships.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Rendimiento por Campeonato</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campeonato
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posicion
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PJ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GC
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DG
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {championships.map((championship) => {
                  const gd = championship.goalsFor - championship.goalsAgainst;
                  return (
                    <tr key={championship.championshipId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="font-medium text-gray-900">{championship.championshipName} {championship.season}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          championship.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                          championship.position === 2 ? 'bg-gray-200 text-gray-800' :
                          championship.position === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {championship.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {championship.matchesPlayed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                        {championship.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600">
                        {championship.goalsFor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600">
                        {championship.goalsAgainst}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className={gd >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {gd > 0 ? '+' : ''}{gd}
                        </span>
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
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}
