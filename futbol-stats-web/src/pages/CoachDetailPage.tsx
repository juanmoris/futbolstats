import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Calendar, Briefcase, Trophy, TrendingUp, Filter } from 'lucide-react';
import { coachesApi } from '@/api/endpoints/coaches.api';
import { statisticsApi } from '@/api/endpoints/statistics.api';

export function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedChampionship, setSelectedChampionship] = useState<string>('');

  const { data: coach, isLoading: isLoadingCoach, error: coachError } = useQuery({
    queryKey: ['coach', id],
    queryFn: () => coachesApi.getById(id!),
    enabled: !!id,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['coach-statistics', id, selectedChampionship],
    queryFn: () => statisticsApi.getCoachStatistics(id!, selectedChampionship || undefined),
    enabled: !!id,
  });

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getCurrentTeam = () => {
    if (!coach?.teamHistory?.length) return null;
    return coach.teamHistory.find(t => !t.endDate);
  };

  // Get all stats (without filter) for the championship selector
  const { data: allStats } = useQuery({
    queryKey: ['coach-statistics-all', id],
    queryFn: () => statisticsApi.getCoachStatistics(id!),
    enabled: !!id,
  });

  const currentTeam = getCurrentTeam();
  const age = coach?.birthDate ? calculateAge(coach.birthDate) : null;
  const isLoading = isLoadingCoach || isLoadingStats;

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (coachError || !coach) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar el entrenador</p>
        <Link to="/coaches" className="text-green-600 hover:text-green-800 mt-4 inline-block">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/coaches"
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al listado
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {coach.photoUrl ? (
                <img
                  src={coach.photoUrl}
                  alt={coach.fullName}
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-green-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="h-16 w-16 text-green-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left text-white">
              <h1 className="text-2xl sm:text-3xl font-bold">{coach.fullName}</h1>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-green-100">
                {coach.countryName && (
                  <div className="flex items-center gap-2">
                    {coach.countryFlagUrl && (
                      <img
                        src={coach.countryFlagUrl}
                        alt={coach.countryName}
                        className="h-4 w-6 object-cover rounded shadow"
                      />
                    )}
                    <span>{coach.countryName}</span>
                  </div>
                )}

                {age && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{age} años</span>
                  </div>
                )}

                {currentTeam && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <Link
                      to={`/teams/${currentTeam.teamId}`}
                      className="hover:text-white hover:underline"
                    >
                      {currentTeam.teamName}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* General Stats */}
        {stats && stats.totalMatches > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
                <p className="text-xs text-gray-500 uppercase">Partidos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
                <p className="text-xs text-gray-500 uppercase">Ganados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.draws}</p>
                <p className="text-xs text-gray-500 uppercase">Empates</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
                <p className="text-xs text-gray-500 uppercase">Perdidos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.goalsFor}</p>
                <p className="text-xs text-gray-500 uppercase">GF</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.goalsAgainst}</p>
                <p className="text-xs text-gray-500 uppercase">GC</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.winPercentage}%</p>
                <p className="text-xs text-gray-500 uppercase">% Victoria</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Championship Filter */}
      {allStats?.championshipStats && allStats.championshipStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filtrar por campeonato:</span>
            </div>
            <select
              value={selectedChampionship}
              onChange={(e) => setSelectedChampionship(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todos los campeonatos</option>
              {allStats.championshipStats.map((c) => (
                <option key={c.championshipId} value={c.championshipId}>
                  {c.championshipName} {c.season}
                </option>
              ))}
            </select>
            {selectedChampionship && (
              <button
                onClick={() => setSelectedChampionship('')}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats by Championship */}
      {!selectedChampionship && stats?.championshipStats && stats.championshipStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Estadísticas por Campeonato
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campeonato
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PJ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    G
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GC
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %V
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.championshipStats.map((champ) => (
                  <tr
                    key={champ.championshipId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedChampionship(champ.championshipId)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{champ.championshipName}</div>
                      <div className="text-sm text-gray-500">{champ.season}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                      {champ.matches}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-green-600">
                      {champ.wins}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-yellow-600">
                      {champ.draws}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-red-600">
                      {champ.losses}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {champ.goalsFor}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {champ.goalsAgainst}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                      {champ.points}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        champ.winPercentage >= 50 ? 'bg-green-100 text-green-800' :
                        champ.winPercentage >= 33 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {champ.winPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats by Team */}
      {stats?.teamStats && stats.teamStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-green-600" />
              Estadísticas por Equipo
              {selectedChampionship && allStats?.championshipStats && (
                <span className="text-sm font-normal text-gray-500">
                  - {allStats.championshipStats.find(c => c.championshipId === selectedChampionship)?.championshipName}
                </span>
              )}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PJ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    G
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GC
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %V
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.teamStats.map((team) => (
                  <tr
                    key={`${team.teamId}-${team.startDate}`}
                    className={team.isCurrent ? 'bg-green-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        to={`/teams/${team.teamId}`}
                        className="flex items-center gap-3 hover:text-green-600"
                      >
                        {team.teamLogo ? (
                          <img
                            src={team.teamLogo}
                            alt={team.teamName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{team.teamName}</span>
                        {team.isCurrent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Actual
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(team.startDate)} - {team.endDate ? formatDate(team.endDate) : 'Presente'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                      {team.matches}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-green-600">
                      {team.wins}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-yellow-600">
                      {team.draws}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-red-600">
                      {team.losses}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.goalsFor}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.goalsAgainst}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                      {team.points}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        team.winPercentage >= 50 ? 'bg-green-100 text-green-800' :
                        team.winPercentage >= 33 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {team.winPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {stats && stats.totalMatches > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Resumen de Rendimiento
              {selectedChampionship && allStats?.championshipStats && (
                <span className="text-sm font-normal text-gray-500">
                  - {allStats.championshipStats.find(c => c.championshipId === selectedChampionship)?.championshipName}
                </span>
              )}
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Win/Draw/Loss Bar */}
              <div className="col-span-1 sm:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Distribución de Resultados</p>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  {stats.wins > 0 && (
                    <div
                      className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(stats.wins / stats.totalMatches) * 100}%` }}
                    >
                      {stats.wins > 0 && `${Math.round((stats.wins / stats.totalMatches) * 100)}%`}
                    </div>
                  )}
                  {stats.draws > 0 && (
                    <div
                      className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(stats.draws / stats.totalMatches) * 100}%` }}
                    >
                      {stats.draws > 0 && `${Math.round((stats.draws / stats.totalMatches) * 100)}%`}
                    </div>
                  )}
                  {stats.losses > 0 && (
                    <div
                      className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(stats.losses / stats.totalMatches) * 100}%` }}
                    >
                      {stats.losses > 0 && `${Math.round((stats.losses / stats.totalMatches) * 100)}%`}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500"></span>
                    Victorias ({stats.wins})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-yellow-500"></span>
                    Empates ({stats.draws})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500"></span>
                    Derrotas ({stats.losses})
                  </span>
                </div>
              </div>

              {/* Goal Difference */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Diferencia de Goles</p>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className={`text-3xl font-bold ${
                    stats.goalsFor - stats.goalsAgainst > 0 ? 'text-green-600' :
                    stats.goalsFor - stats.goalsAgainst < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stats.goalsFor - stats.goalsAgainst > 0 ? '+' : ''}{stats.goalsFor - stats.goalsAgainst}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.goalsFor} GF / {stats.goalsAgainst} GC
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Stats Message */}
      {stats && stats.totalMatches === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {selectedChampionship
              ? 'No hay estadísticas de partidos para este campeonato'
              : 'No hay estadísticas de partidos registradas para este entrenador'
            }
          </p>
        </div>
      )}
    </div>
  );
}
