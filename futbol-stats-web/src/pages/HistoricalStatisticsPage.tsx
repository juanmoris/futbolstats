import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Users, Target, UserCheck, User, Loader2, Search, X } from 'lucide-react';
import { statisticsApi } from '@/api/endpoints/statistics.api';
import { countriesApi } from '@/api/endpoints/countries.api';
import type { ScorerTeamBreakdown, AppearanceTeamBreakdown } from '@/api/types/statistics.types';

type TabType = 'rankings' | 'scorers' | 'appearances';

type BreakdownModal =
  | { type: 'scorer'; playerName: string; breakdowns: ScorerTeamBreakdown[] }
  | { type: 'appearance'; playerName: string; breakdowns: AppearanceTeamBreakdown[] }
  | null;

export function HistoricalStatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [rankingSearch, setRankingSearch] = useState('');
  const [scorerSearch, setScorerSearch] = useState('');
  const [scorerCountry, setScorerCountry] = useState('');
  const [appearanceSearch, setAppearanceSearch] = useState('');
  const [appearanceCountry, setAppearanceCountry] = useState('');
  const [breakdownModal, setBreakdownModal] = useState<BreakdownModal>(null);

  const scorerLoadMoreRef = useRef<HTMLDivElement>(null);
  const appearanceLoadMoreRef = useRef<HTMLDivElement>(null);

  // Countries for filters
  const { data: countries } = useQuery({
    queryKey: ['countries', 'all'],
    queryFn: () => countriesApi.getAll({ pageSize: 100 }),
  });

  // Tab 1: Historical Team Rankings
  const { data: rankings, isLoading: loadingRankings } = useQuery({
    queryKey: ['historicalRankings', rankingSearch],
    queryFn: () => statisticsApi.getHistoricalTeamRankings(rankingSearch || undefined),
  });

  // Tab 2: Historical Top Scorers
  const {
    data: scorersData,
    isLoading: loadingScorers,
    fetchNextPage: fetchNextScorers,
    hasNextPage: hasNextScorers,
    isFetchingNextPage: isFetchingNextScorers,
  } = useInfiniteQuery({
    queryKey: ['historicalScorers', scorerSearch, scorerCountry],
    queryFn: ({ pageParam = 1 }) => statisticsApi.getHistoricalTopScorers(
      pageParam,
      20,
      scorerCountry || undefined,
      scorerSearch || undefined
    ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });

  const allScorers = scorersData?.pages.flatMap(page => page.scorers) ?? [];
  const scorersTotalCount = scorersData?.pages[0]?.totalCount ?? 0;

  // Tab 3: Historical Most Appearances
  const {
    data: appearancesData,
    isLoading: loadingAppearances,
    fetchNextPage: fetchNextAppearances,
    hasNextPage: hasNextAppearances,
    isFetchingNextPage: isFetchingNextAppearances,
  } = useInfiniteQuery({
    queryKey: ['historicalAppearances', appearanceSearch, appearanceCountry],
    queryFn: ({ pageParam = 1 }) => statisticsApi.getHistoricalMostAppearances(
      pageParam,
      20,
      appearanceCountry || undefined,
      appearanceSearch || undefined
    ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });

  const allAppearances = appearancesData?.pages.flatMap(page => page.players) ?? [];
  const appearancesTotalCount = appearancesData?.pages[0]?.totalCount ?? 0;

  // IntersectionObserver for scorers
  useEffect(() => {
    if (activeTab !== 'scorers' || !hasNextScorers || isFetchingNextScorers) return;

    const element = scorerLoadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextScorers && !isFetchingNextScorers) {
          fetchNextScorers();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [activeTab, hasNextScorers, isFetchingNextScorers, fetchNextScorers, scorersData]);

  // IntersectionObserver for appearances
  useEffect(() => {
    if (activeTab !== 'appearances' || !hasNextAppearances || isFetchingNextAppearances) return;

    const element = appearanceLoadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextAppearances && !isFetchingNextAppearances) {
          fetchNextAppearances();
        }
      },
      { threshold: 0, rootMargin: '200px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [activeTab, hasNextAppearances, isFetchingNextAppearances, fetchNextAppearances, appearancesData]);

  const multiTeamBadge = (count: number, onClick: () => void) => (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="ml-1 inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
      title="Ver desglose por equipo"
    >
      +{count} mas
    </button>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Estadisticas Historicas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Rankings acumulados de todos los campeonatos
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rankings')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'rankings'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Posiciones </span>Historicas
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
            <span className="hidden sm:inline">Goleadores </span>Historicos
          </button>
          <button
            onClick={() => setActiveTab('appearances')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'appearances'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Partidos </span>Jugados
          </button>
        </nav>
      </div>

      {/* Tab: Historical Rankings */}
      {activeTab === 'rankings' && (
        <div className="bg-white rounded-lg shadow">
          {/* Search */}
          <div className="px-4 py-4 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipo..."
                value={rankingSearch}
                onChange={(e) => setRankingSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </div>
          {loadingRankings ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : rankings?.rankings?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8 sm:w-10">#</th>
                    <th className="sticky left-8 sm:left-10 z-10 bg-gray-50 px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Equipo</th>
                    <th className="hidden md:table-cell px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">Camp.</th>
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
                  {rankings.rankings.map((team) => (
                    <tr key={team.teamId} className="bg-white hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{team.rank}</td>
                      <td className="sticky left-8 sm:left-10 z-10 bg-white px-2 sm:px-3 py-2 sm:py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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
                      <td className="hidden md:table-cell px-3 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-500">{team.championshipsPlayed}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay datos historicos de equipos</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Historical Top Scorers */}
      {activeTab === 'scorers' && (
        <div className="bg-white rounded-lg shadow">
          {/* Filters */}
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
                value={scorerCountry}
                onChange={(e) => setScorerCountry(e.target.value)}
                className="block w-full sm:w-56 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Todas las nacionalidades</option>
                {countries?.items?.map((country) => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>
          </div>
          {loadingScorers ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : allScorers.length ? (
            <>
              <div className="px-3 sm:px-4 py-3 border-b flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">
                  Mostrando {allScorers.length} de {scorersTotalCount} goleadores
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
                    {allScorers.map((scorer) => (
                      <tr key={scorer.playerId} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-600">
                          {scorer.rank}
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
                              {scorer.countryFlagUrl && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <img src={scorer.countryFlagUrl} alt={scorer.countryName || ''} className="h-3 w-4 object-cover rounded-sm" />
                                  <span className="hidden sm:inline">{scorer.countryName}</span>
                                </span>
                              )}
                              {/* Mobile: team + multi-team badge */}
                              <span className="sm:hidden text-xs text-gray-500 flex items-center">
                                <Link to={`/teams/${scorer.teamId}`} className="truncate hover:text-green-600">
                                  {scorer.teamName}
                                </Link>
                                {scorer.teamBreakdowns.length > 1 && multiTeamBadge(
                                  scorer.teamBreakdowns.length - 1,
                                  () => setBreakdownModal({ type: 'scorer', playerName: scorer.playerName, breakdowns: scorer.teamBreakdowns })
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <div className="flex items-center">
                            <Link to={`/teams/${scorer.teamId}`} className="flex items-center hover:text-green-600">
                              {scorer.teamLogoUrl && (
                                <img src={scorer.teamLogoUrl} alt="" className="h-6 w-6 rounded-full object-cover mr-2 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-500 truncate">{scorer.teamName}</span>
                            </Link>
                            {scorer.teamBreakdowns.length > 1 && multiTeamBadge(
                              scorer.teamBreakdowns.length - 1,
                              () => setBreakdownModal({ type: 'scorer', playerName: scorer.playerName, breakdowns: scorer.teamBreakdowns })
                            )}
                          </div>
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
              {/* Load more */}
              <div ref={scorerLoadMoreRef} className="py-4 text-center border-t">
                {isFetchingNextScorers ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Cargando mas goleadores...</span>
                  </div>
                ) : hasNextScorers ? (
                  <button
                    onClick={() => fetchNextScorers()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                  >
                    Cargar mas goleadores
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Has llegado al final de la lista</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay goleadores historicos registrados</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Historical Most Appearances */}
      {activeTab === 'appearances' && (
        <div className="bg-white rounded-lg shadow">
          {/* Filters */}
          <div className="px-4 py-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar jugador..."
                  value={appearanceSearch}
                  onChange={(e) => setAppearanceSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <select
                value={appearanceCountry}
                onChange={(e) => setAppearanceCountry(e.target.value)}
                className="block w-full sm:w-56 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Todas las nacionalidades</option>
                {countries?.items?.map((country) => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>
          </div>
          {loadingAppearances ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando...</p>
            </div>
          ) : allAppearances.length ? (
            <>
              <div className="px-3 sm:px-4 py-3 border-b flex justify-between items-center">
                <span className="text-xs sm:text-sm text-gray-500">
                  Mostrando {allAppearances.length} de {appearancesTotalCount} jugadores
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10 sm:w-12">#</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12 sm:w-16">PJ</th>
                      <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Titular</th>
                      <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Suplente</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allAppearances.map((player) => (
                      <tr key={player.playerId} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-600">
                          {player.rank}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt="" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover mr-2 sm:mr-3 flex-shrink-0" />
                            ) : (
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link to={`/players/${player.playerId}`} className="font-medium text-gray-900 text-xs sm:text-sm truncate block hover:text-green-600">
                                {player.playerName}
                              </Link>
                              {player.countryFlagUrl && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <img src={player.countryFlagUrl} alt={player.countryName || ''} className="h-3 w-4 object-cover rounded-sm" />
                                  <span className="hidden sm:inline">{player.countryName}</span>
                                </span>
                              )}
                              {/* Mobile: team + multi-team badge */}
                              <span className="sm:hidden text-xs text-gray-500 flex items-center">
                                <Link to={`/teams/${player.teamId}`} className="truncate hover:text-green-600">
                                  {player.teamName}
                                </Link>
                                {player.teamBreakdowns.length > 1 && multiTeamBadge(
                                  player.teamBreakdowns.length - 1,
                                  () => setBreakdownModal({ type: 'appearance', playerName: player.playerName, breakdowns: player.teamBreakdowns })
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <div className="flex items-center">
                            <Link to={`/teams/${player.teamId}`} className="flex items-center hover:text-green-600">
                              {player.teamLogoUrl && (
                                <img src={player.teamLogoUrl} alt="" className="h-6 w-6 rounded-full object-cover mr-2 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-500 truncate">{player.teamName}</span>
                            </Link>
                            {player.teamBreakdowns.length > 1 && multiTeamBadge(
                              player.teamBreakdowns.length - 1,
                              () => setBreakdownModal({ type: 'appearance', playerName: player.playerName, breakdowns: player.teamBreakdowns })
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <span className="text-base sm:text-lg font-bold text-gray-900">{player.matchesPlayed}</span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-center text-gray-500">{player.matchesAsStarter}</td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-center text-gray-500">{player.matchesAsSub}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Load more */}
              <div ref={appearanceLoadMoreRef} className="py-4 text-center border-t">
                {isFetchingNextAppearances ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Cargando mas jugadores...</span>
                  </div>
                ) : hasNextAppearances ? (
                  <button
                    onClick={() => fetchNextAppearances()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                  >
                    Cargar mas jugadores
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Has llegado al final de la lista</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay datos de partidos jugados</p>
            </div>
          )}
        </div>
      )}

      {/* Team Breakdown Modal */}
      {breakdownModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setBreakdownModal(null)}
        >
          <div className="fixed inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">
                {breakdownModal.playerName}
              </h3>
              <button
                onClick={() => setBreakdownModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500 mb-3">Desglose por equipo</p>
              {breakdownModal.type === 'scorer' ? (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b">
                      <th className="text-left py-2 pr-2">Equipo</th>
                      <th className="text-center py-2 px-2 w-10">PJ</th>
                      <th className="text-center py-2 px-2 w-10">Goles</th>
                      <th className="text-center py-2 px-2 w-10">Pen.</th>
                      <th className="text-center py-2 px-2 w-10">Asist.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {breakdownModal.breakdowns.map((tb) => (
                      <tr key={tb.teamId}>
                        <td className="py-2 pr-2">
                          <Link
                            to={`/teams/${tb.teamId}`}
                            className="flex items-center gap-1.5 hover:text-green-600"
                            onClick={() => setBreakdownModal(null)}
                          >
                            {tb.teamLogoUrl ? (
                              <img src={tb.teamLogoUrl} alt="" className="h-5 w-5 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <Users className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                            <span className="truncate">{tb.teamName}</span>
                          </Link>
                        </td>
                        <td className="text-center py-2 px-2 text-gray-500">{tb.matchesPlayed}</td>
                        <td className="text-center py-2 px-2 font-semibold">{tb.goals}</td>
                        <td className="text-center py-2 px-2 text-gray-500">{tb.penaltyGoals}</td>
                        <td className="text-center py-2 px-2 text-gray-500">{tb.assists}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b">
                      <th className="text-left py-2 pr-2">Equipo</th>
                      <th className="text-center py-2 px-2 w-10">PJ</th>
                      <th className="text-center py-2 px-2 w-14">Titular</th>
                      <th className="text-center py-2 px-2 w-14">Suplente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {breakdownModal.breakdowns.map((tb) => (
                      <tr key={tb.teamId}>
                        <td className="py-2 pr-2">
                          <Link
                            to={`/teams/${tb.teamId}`}
                            className="flex items-center gap-1.5 hover:text-green-600"
                            onClick={() => setBreakdownModal(null)}
                          >
                            {tb.teamLogoUrl ? (
                              <img src={tb.teamLogoUrl} alt="" className="h-5 w-5 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <Users className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                            <span className="truncate">{tb.teamName}</span>
                          </Link>
                        </td>
                        <td className="text-center py-2 px-2 font-semibold">{tb.matchesPlayed}</td>
                        <td className="text-center py-2 px-2 text-gray-500">{tb.matchesAsStarter}</td>
                        <td className="text-center py-2 px-2 text-gray-500">{tb.matchesAsSub}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
