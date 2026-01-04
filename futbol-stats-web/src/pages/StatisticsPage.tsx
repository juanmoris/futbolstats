import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, User, Target } from 'lucide-react';
import { championshipsApi } from '@/api/endpoints/championships.api';
import { statisticsApi } from '@/api/endpoints/statistics.api';

export function StatisticsPage() {
  const [selectedChampionship, setSelectedChampionship] = useState('');
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers'>('standings');

  const { data: championships } = useQuery({
    queryKey: ['championships', 'all'],
    queryFn: () => championshipsApi.getAll({ pageSize: 100 }),
  });

  const { data: standings, isLoading: loadingStandings } = useQuery({
    queryKey: ['standings', selectedChampionship],
    queryFn: () => statisticsApi.getStandings(selectedChampionship),
    enabled: !!selectedChampionship,
  });

  const { data: topScorers, isLoading: loadingScorers } = useQuery({
    queryKey: ['topScorers', selectedChampionship],
    queryFn: () => statisticsApi.getTopScorers(selectedChampionship, 20),
    enabled: !!selectedChampionship,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estadisticas</h1>
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
          className="block w-full md:w-96 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
        >
          <option value="">Seleccionar campeonato</option>
          {championships?.items?.map((c) => (
            <option key={c.id} value={c.id}>{c.name} - {c.season}</option>
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
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('standings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'standings'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-5 w-5 inline mr-2" />
                Tabla de Posiciones
              </button>
              <button
                onClick={() => setActiveTab('scorers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scorers'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="h-5 w-5 inline mr-2" />
                Goleadores
              </button>
            </nav>
          </div>

          {/* Standings Table */}
          {activeTab === 'standings' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loadingStandings ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : standings?.standings?.length ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">PJ</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">G</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">E</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">P</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">GF</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">GC</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">DG</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {standings.standings.map((team, index) => (
                      <tr key={team.teamId} className={index < 4 ? 'bg-green-50' : index >= standings.standings.length - 3 ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{team.position}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {team.logoUrl ? (
                              <img src={team.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover mr-3" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <Users className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{team.teamName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{team.gamesPlayed}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{team.wins}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{team.draws}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{team.losses}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{team.goalsFor}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{team.goalsAgainst}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay equipos registrados en este campeonato</p>
                </div>
              )}
            </div>
          )}

          {/* Top Scorers */}
          {activeTab === 'scorers' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loadingScorers ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : topScorers?.scorers?.length ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">PJ</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Goles</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Pen.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Asist.</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topScorers.scorers.map((scorer) => (
                      <tr key={scorer.playerId} className={scorer.rank <= 3 ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                            scorer.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                            scorer.rank === 2 ? 'bg-gray-300 text-gray-900' :
                            scorer.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-gray-100 text-gray-600'
                          } text-sm font-medium`}>
                            {scorer.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {scorer.photoUrl ? (
                              <img src={scorer.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover mr-3" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                                <User className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{scorer.playerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {scorer.teamLogoUrl && (
                              <img src={scorer.teamLogoUrl} alt="" className="h-6 w-6 rounded-full object-cover mr-2" />
                            )}
                            <span className="text-sm text-gray-500">{scorer.teamName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{scorer.matchesPlayed}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-lg font-bold text-gray-900">{scorer.goals}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{scorer.penaltyGoals}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{scorer.assists}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
