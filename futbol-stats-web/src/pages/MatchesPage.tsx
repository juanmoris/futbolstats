import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Play, Pause, StopCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import { matchesApi } from '@/api/endpoints/matches.api';
import { championshipsApi } from '@/api/endpoints/championships.api';
import { teamsApi } from '@/api/endpoints/teams.api';
import type { Match, CreateMatchRequest, UpdateMatchRequest } from '@/api/types/match.types';
import { MatchStatus } from '@/api/types/common.types';

export function MatchesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [championshipFilter, setChampionshipFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);
  const queryClient = useQueryClient();

  const { data: championships } = useQuery({
    queryKey: ['championships', 'all'],
    queryFn: () => championshipsApi.getAll({ pageSize: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['matches', { page, pageSize, championshipId: championshipFilter, status: statusFilter }],
    queryFn: () => matchesApi.getAll({
      page,
      pageSize,
      championshipId: championshipFilter || undefined,
      status: statusFilter ? parseInt(statusFilter) as typeof MatchStatus[keyof typeof MatchStatus] : undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: matchesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMatchRequest }) => matchesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setEditingMatch(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: matchesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setDeletingMatch(null);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    createMutation.reset();
  };

  const handleCloseEditModal = () => {
    setEditingMatch(null);
    updateMutation.reset();
  };

  const startMutation = useMutation({
    mutationFn: matchesApi.start,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });

  const halftimeMutation = useMutation({
    mutationFn: matchesApi.halftime,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });

  const endMutation = useMutation({
    mutationFn: matchesApi.end,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });

  const getStatusLabel = (status: number) => {
    switch (status) {
      case MatchStatus.Scheduled: return 'Programado';
      case MatchStatus.Live: return 'En vivo';
      case MatchStatus.HalfTime: return 'Medio tiempo';
      case MatchStatus.Finished: return 'Finalizado';
      case MatchStatus.Postponed: return 'Aplazado';
      case MatchStatus.Cancelled: return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case MatchStatus.Live: return 'bg-red-100 text-red-800';
      case MatchStatus.HalfTime: return 'bg-yellow-100 text-yellow-800';
      case MatchStatus.Finished: return 'bg-green-100 text-green-800';
      case MatchStatus.Scheduled: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partidos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los partidos y registra eventos en vivo
          </p>
        </div>
        <button
          onClick={() => { createMutation.reset(); setIsModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Partido
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={championshipFilter}
          onChange={(e) => { setChampionshipFilter(e.target.value); setPage(1); }}
          className="block w-64 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
        >
          <option value="">Todos los campeonatos</option>
          {championships?.items?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="block w-48 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="0">Programado</option>
          <option value="1">En vivo</option>
          <option value="2">Medio tiempo</option>
          <option value="3">Finalizado</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
          className="block w-24 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            // Agrupar partidos por jornada
            const matchesByMatchday = data?.items?.reduce((acc, match) => {
              const key = `${match.championshipName}-${match.matchday}`;
              if (!acc[key]) {
                acc[key] = {
                  championshipName: match.championshipName,
                  matchday: match.matchday,
                  matches: []
                };
              }
              acc[key].matches.push(match);
              return acc;
            }, {} as Record<string, { championshipName: string; matchday: number; matches: Match[] }>);

            return Object.values(matchesByMatchday || {}).map((group) => (
              <div key={`${group.championshipName}-${group.matchday}`}>
                {/* Encabezado de jornada */}
                <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
                  <span className="font-medium">{group.championshipName}</span>
                  <span className="bg-orange-500 px-3 py-1 rounded-full text-sm font-bold">
                    Jornada {group.matchday}
                  </span>
                </div>

                {/* Partidos de la jornada */}
                <div className="bg-white rounded-b-lg shadow divide-y divide-gray-100">
                  {group.matches.map((match) => (
                    <div key={match.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-end mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                              {getStatusLabel(match.status)}
                              {match.status === MatchStatus.Live && match.currentMinute && ` (${match.currentMinute}')`}
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-8">
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <span className="font-medium text-gray-900">{match.homeTeamName}</span>
                              {match.homeTeamLogo && (
                                <img src={match.homeTeamLogo} alt="" className="h-10 w-10 rounded-full object-cover" />
                              )}
                            </div>

                            <div className="text-center px-4">
                              <div className="text-2xl font-bold text-gray-900">
                                {match.homeScore} - {match.awayScore}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(match.matchDate).toLocaleDateString('es', {
                                  timeZone: 'UTC',
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                              {match.awayTeamLogo && (
                                <img src={match.awayTeamLogo} alt="" className="h-10 w-10 rounded-full object-cover" />
                              )}
                              <span className="font-medium text-gray-900">{match.awayTeamName}</span>
                            </div>
                          </div>

                          {match.stadium && (
                            <div className="text-center mt-2 text-sm text-gray-500">
                              {match.stadium}
                            </div>
                          )}
                        </div>

                        <div className="ml-6 flex items-center gap-2">
                          <Link
                            to={`/matches/${match.id}`}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                            title="Ver detalles"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>

                          {(match.status === MatchStatus.Scheduled || match.status === MatchStatus.Finished) && (
                            <button
                              onClick={() => setEditingMatch(match)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
                              title="Editar partido"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                          )}

                          {match.status === MatchStatus.Scheduled && (
                            <button
                              onClick={() => startMutation.mutate(match.id)}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md"
                              title="Iniciar partido"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          )}

                          {match.status === MatchStatus.Live && (
                            <button
                              onClick={() => halftimeMutation.mutate(match.id)}
                              className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-md"
                              title="Medio tiempo"
                            >
                              <Pause className="h-5 w-5" />
                            </button>
                          )}

                          {(match.status === MatchStatus.Live || match.status === MatchStatus.HalfTime) && (
                            <button
                              onClick={() => endMutation.mutate(match.id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
                              title="Finalizar partido"
                            >
                              <StopCircle className="h-5 w-5" />
                            </button>
                          )}

                          {(match.status === MatchStatus.Scheduled || match.status === MatchStatus.Finished) && (
                            <button
                              onClick={() => setDeletingMatch(match)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
                              title="Eliminar partido"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-700">
                Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, data.totalCount)} de {data.totalCount}
              </p>
              <nav className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!data.hasPreviousPage}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.hasNextPage}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <CreateMatchModal
          championships={championships?.items || []}
          onClose={handleCloseModal}
          onSave={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          error={createMutation.error}
        />
      )}

      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          onClose={handleCloseEditModal}
          onSave={(data) => updateMutation.mutate({ id: editingMatch.id, data })}
          isLoading={updateMutation.isPending}
          error={updateMutation.error}
        />
      )}

      {deletingMatch && (
        <DeleteMatchModal
          match={deletingMatch}
          onClose={() => setDeletingMatch(null)}
          onConfirm={() => deleteMutation.mutate(deletingMatch.id)}
          isLoading={deleteMutation.isPending}
          error={deleteMutation.error}
        />
      )}
    </div>
  );
}

function CreateMatchModal({
  championships,
  onClose,
  onSave,
  isLoading,
  error,
}: {
  championships: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: CreateMatchRequest) => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const [championshipId, setChampionshipId] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [stadium, setStadium] = useState('');
  const [matchday, setMatchday] = useState('1');

  const { data: teams } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => teamsApi.getAll({ pageSize: 100 }),
  });

  const getErrorMessage = (): string | null => {
    if (!error) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as any;
    if (axiosError.response?.data?.errors) {
      const errors = axiosError.response.data.errors;
      return Object.values(errors).flat().join(', ');
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    return error.message || 'Error al guardar el partido';
  };

  const errorMessage = getErrorMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = `${matchDate}T${matchTime}:00Z`;
    onSave({
      championshipId,
      homeTeamId,
      awayTeamId,
      matchDate: dateTime,
      stadium: stadium || undefined,
      matchday: parseInt(matchday),
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Nuevo Partido</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Campeonato</label>
              <select
                value={championshipId}
                onChange={(e) => setChampionshipId(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar</option>
                {championships.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipo Local</label>
                <select
                  value={homeTeamId}
                  onChange={(e) => setHomeTeamId(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                >
                  <option value="">Seleccionar</option>
                  {teams?.items?.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipo Visitante</label>
                <select
                  value={awayTeamId}
                  onChange={(e) => setAwayTeamId(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                >
                  <option value="">Seleccionar</option>
                  {teams?.items?.filter(t => t.id !== homeTeamId).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hora</label>
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estadio</label>
                <input
                  type="text"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Jornada</label>
                <input
                  type="number"
                  value={matchday}
                  onChange={(e) => setMatchday(e.target.value)}
                  min={1}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm text-white bg-orange-600 rounded-md disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMatchModal({
  match,
  onClose,
  onSave,
  isLoading,
  error,
}: {
  match: Match;
  onClose: () => void;
  onSave: (data: UpdateMatchRequest) => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const matchDateTime = new Date(match.matchDate);
  const [matchDate, setMatchDate] = useState(matchDateTime.toISOString().split('T')[0]);
  const [matchTime, setMatchTime] = useState(matchDateTime.toISOString().slice(11, 16));
  const [stadium, setStadium] = useState(match.stadium || '');
  const [matchday, setMatchday] = useState(match.matchday.toString());

  const getErrorMessage = (): string | null => {
    if (!error) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as any;
    if (axiosError.response?.data?.errors) {
      const errors = axiosError.response.data.errors;
      return Object.values(errors).flat().join(', ');
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    return error.message || 'Error al guardar el partido';
  };

  const errorMessage = getErrorMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = `${matchDate}T${matchTime}:00Z`;
    onSave({
      matchDate: dateTime,
      stadium: stadium || undefined,
      matchday: parseInt(matchday),
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Editar Partido</h3>
            <p className="text-sm text-gray-500 mt-1">
              {match.homeTeamName} vs {match.awayTeamName}
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {errorMessage}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hora</label>
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estadio</label>
                <input
                  type="text"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Jornada</label>
                <input
                  type="number"
                  value={matchday}
                  onChange={(e) => setMatchday(e.target.value)}
                  min={1}
                  required
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm text-white bg-orange-600 rounded-md disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteMatchModal({
  match,
  onClose,
  onConfirm,
  isLoading,
  error,
}: {
  match: Match;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const getErrorMessage = (): string | null => {
    if (!error) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as any;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    return error.message || 'Error al eliminar el partido';
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Eliminar Partido</h3>
        </div>
        <div className="px-6 py-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {errorMessage}
            </div>
          )}
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar el partido?
          </p>
          <p className="text-gray-900 font-medium mt-2">
            {match.homeTeamName} vs {match.awayTeamName}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {match.championshipName} - Jornada {match.matchday}
          </p>
          <p className="text-sm text-red-600 mt-4">
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
