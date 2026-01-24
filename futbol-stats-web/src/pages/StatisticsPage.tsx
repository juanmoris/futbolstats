import { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Users, User, Target, RefreshCw, Loader2, Search } from 'lucide-react';
import { championshipsApi } from '@/api/endpoints/championships.api';
import { statisticsApi } from '@/api/endpoints/statistics.api';

export function StatisticsPage() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'standings' | 'scorers') || 'standings';

  const [selectedChampionship, setSelectedChampionship] = useState('');
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers'>(initialTab);
  const [scorerSearch, setScorerSearch] = useState('');
  const [scorerTeamFilter, setScorerTeamFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: championships } = useQuery({
    queryKey: ['championships', 'all'],
    queryFn: () => championshipsApi.getAll({ pageSize: 100 }),
  });

  // Establecer el último campeonato por defecto
  useEffect(() => {
    if (championships?.items?.length && !selectedChampionship) {
      setSelectedChampionship(championships.items[0].id);
    }
  }, [championships, selectedChampionship]);

  // Resetear filtros al cambiar de campeonato
  useEffect(() => {
    setScorerSearch('');
    setScorerTeamFilter('');
  }, [selectedChampionship]);

  const recalculateMutation = useMutation({
    mutationFn: () => championshipsApi.recalculateStandings(selectedChampionship),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings', selectedChampionship] });
    },
  });

  const { data: standings, isLoading: loadingStandings } = useQuery({
    queryKey: ['standings', selectedChampionship],
    queryFn: () => statisticsApi.getStandings(selectedChampionship),
    enabled: !!selectedChampionship,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: topScorersData,
    isLoading: loadingScorers,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['topScorers', selectedChampionship, scorerSearch, scorerTeamFilter],
    queryFn: ({ pageParam = 1 }) => statisticsApi.getTopScorers(
      selectedChampionship,
      pageParam,
      20,
      scorerTeamFilter || undefined,
      scorerSearch || undefined
    ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    enabled: !!selectedChampionship,
  });

  const allScorers = topScorersData?.pages.flatMap(page => page.scorers) ?? [];
  const topScorers = topScorersData?.pages[0] ? {
    championshipId: topScorersData.pages[0].championshipId,
    championshipName: topScorersData.pages[0].championshipName,
    scorers: allScorers,
    totalCount: topScorersData.pages[0].totalCount,
  } : null;

  useEffect(() => {
    if (activeTab !== 'scorers' || !hasNextPage || isFetchingNextPage) return;

    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        threshold: 0,
        rootMargin: '200px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage, topScorersData]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Estadisticas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tabla de posiciones, goleadores y estadisticas de los campeonatos
        </p>
      </div>

      {/* Championship Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Campeonato
        </label>
        <select
          value={selectedChampionship}
          onChange={(e) => setSelectedChampionship(e.target.value)}
          className="block w-full md:w-96 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm"
        >
          {championships?.items?.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.season}</option>
          ))}
        </select>
      </div>

      {!selectedChampionship ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Selecciona un campeonato para ver las estadisticas</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('standings')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'standings'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tabla de </span>Posiciones
              </button>
              <button
                onClick={() => setActiveTab('scorers')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'scorers'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                Goleadores
              </button>
            </nav>
          </div>

          {/* Standings Table */}
          {activeTab === 'standings' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500">
                  Tabla actualizada segun partidos finalizados
                </span>
                <button
                  onClick={() => recalculateMutation.mutate()}
                  disabled={recalculateMutation.isPending}
                  className="inline-flex items-center justify-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  title="Recalcular estadisticas desde cero"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{recalculateMutation.isPending ? 'Recalculando...' : 'Recalcular'}</span>
                  <span className="sm:hidden">{recalculateMutation.isPending ? '...' : 'Recalc.'}</span>
                </button>
              </div>
              {loadingStandings ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : standings?.standings?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="sticky left-0 z-10 bg-gray-50 px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8 sm:w-10">#</th>
                        <th className="sticky left-8 sm:left-10 z-10 bg-gray-50 px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Equipo</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">PJ</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">G</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">E</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">P</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">GF</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">GC</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">DG</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {standings.standings.map((team, index) => {
                        const rowBg = index < 4 ? 'bg-green-50' : index >= standings.standings.length - 3 ? 'bg-red-50' : 'bg-white';
                        return (
                          <tr key={team.teamId} className={rowBg}>
                            <td className={`sticky left-0 z-10 ${rowBg} px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900`}>{team.position}</td>
                            <td className={`sticky left-8 sm:left-10 z-10 ${rowBg} px-2 sm:px-3 py-2 sm:py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                              <Link to={`/teams/${team.teamId}`} className="flex items-center hover:text-green-600">
                                {team.logoUrl ? (
                                  <img src={team.logoUrl} alt="" className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover mr-2 flex-shrink-0" />
                                ) : (
                                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                  </div>
                                )}
                                <span className="font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">{team.teamName}</span>
                              </Link>
                            </td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-500">{team.gamesPlayed}</td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-500">{team.wins}</td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-500">{team.draws}</td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-500">{team.losses}</td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-500">{team.goalsFor}</td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-500">{team.goalsAgainst}</td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center font-medium text-gray-900">
                              {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                            </td>
                            <td className="px-3 py-2 sm:py-3 text-xs sm:text-sm text-center font-bold text-gray-900">{team.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay equipos registrados en este campeonato</p>
                </div>
              )}
            </div>
          )}

          {/* Top Scorers */}
          {activeTab === 'scorers' && (
            <div className="bg-white rounded-lg shadow">
              {/* Filtros de goleadores */}
              <div className="px-4 py-4 border-b">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar jugador..."
                      value={scorerSearch}
                      onChange={(e) => setScorerSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  <select
                    value={scorerTeamFilter}
                    onChange={(e) => setScorerTeamFilter(e.target.value)}
                    className="block w-full sm:w-56 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">Todos los equipos</option>
                    {standings?.standings?.map((team) => (
                      <option key={team.teamId} value={team.teamId}>{team.teamName}</option>
                    ))}
                  </select>
                </div>
              </div>
              {loadingScorers ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : topScorers?.scorers?.length ? (
                <>
                  <div className="px-3 sm:px-4 py-3 border-b flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Mostrando {topScorers.scorers.length} de {topScorers.totalCount} goleadores
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10 sm:w-12">#</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                          <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">PJ</th>
                          <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12 sm:w-16">Goles</th>
                          <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Pen.</th>
                          <th className="hidden sm:table-cell px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Asist.</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topScorers.scorers.map((scorer) => (
                          <tr key={scorer.playerId} className={scorer.rank <= 3 ? 'bg-yellow-50' : ''}>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                                scorer.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                                scorer.rank === 2 ? 'bg-gray-300 text-gray-900' :
                                scorer.rank === 3 ? 'bg-amber-600 text-white' :
                                'bg-gray-100 text-gray-600'
                              } text-xs sm:text-sm font-medium`}>
                                {scorer.rank}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="flex items-center">
                                {scorer.photoUrl ? (
                                  <img src={scorer.photoUrl} alt="" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover mr-2 sm:mr-3 flex-shrink-0" />
                                ) : (
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <Link to={`/players/${scorer.playerId}`} className="font-medium text-gray-900 text-xs sm:text-sm truncate block hover:text-green-600">
                                    {scorer.playerName}
                                  </Link>
                                  {/* Mostrar equipo debajo del nombre en movil */}
                                  <Link to={`/teams/${scorer.teamId}`} className="sm:hidden text-xs text-gray-500 truncate block hover:text-green-600">
                                    {scorer.teamName}
                                  </Link>
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell px-4 py-3">
                              <Link to={`/teams/${scorer.teamId}`} className="flex items-center hover:text-green-600">
                                {scorer.teamLogoUrl && (
                                  <img src={scorer.teamLogoUrl} alt="" className="h-6 w-6 rounded-full object-cover mr-2 flex-shrink-0" />
                                )}
                                <span className="text-sm text-gray-500 truncate">{scorer.teamName}</span>
                              </Link>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3 text-sm text-center text-gray-500">{scorer.matchesPlayed}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              <span className="text-base sm:text-lg font-bold text-gray-900">{scorer.goals}</span>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3 text-sm text-center text-gray-500">{scorer.penaltyGoals}</td>
                            <td className="hidden sm:table-cell px-4 py-3 text-sm text-center text-gray-500">{scorer.assists}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Load more section */}
                  <div ref={loadMoreRef} className="py-4 text-center border-t">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Cargando más goleadores...</span>
                      </div>
                    ) : hasNextPage ? (
                      <button
                        onClick={() => fetchNextPage()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                      >
                        Cargar más goleadores
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">Has llegado al final de la lista</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay goleadores registrados en este campeonato</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
