import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Trophy, Users, X } from 'lucide-react';
import { championshipsApi } from '@/api/endpoints/championships.api';
import { teamsApi } from '@/api/endpoints/teams.api';
import { useAuth } from '@/contexts/AuthContext';
import type { Championship, CreateChampionshipRequest, UpdateChampionshipRequest } from '@/api/types/championship.types';
import { ChampionshipStatus, TiebreakerType } from '@/api/types/common.types';

export function ChampionshipsPage() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
  const [teamsModalChampionship, setTeamsModalChampionship] = useState<Championship | null>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['championships', { page, pageSize: 10 }],
    queryFn: () => championshipsApi.getAll({ page, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: championshipsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      setIsModalOpen(false);
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingChampionship(null);
    createMutation.reset();
    updateMutation.reset();
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChampionshipRequest }) =>
      championshipsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      setIsModalOpen(false);
      setEditingChampionship(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: championshipsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
    },
  });

  const handleCreate = (data: CreateChampionshipRequest) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (id: string, data: UpdateChampionshipRequest) => {
    updateMutation.mutate({ id, data });
  };

  const handleDelete = (id: string) => {
    if (confirm('Esta seguro de eliminar este campeonato?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case ChampionshipStatus.InProgress: return 'En curso';
      case ChampionshipStatus.Upcoming: return 'Proximo';
      case ChampionshipStatus.Finished: return 'Finalizado';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case ChampionshipStatus.InProgress: return 'bg-green-100 text-green-800';
      case ChampionshipStatus.Upcoming: return 'bg-yellow-100 text-yellow-800';
      case ChampionshipStatus.Finished: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campeonatos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los campeonatos de futbol
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => { setEditingChampionship(null); createMutation.reset(); setIsModalOpen(true); }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Campeonato
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campeonato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temporada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                {isAuthenticated && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items?.map((championship) => (
                <tr key={championship.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-green-600 mr-3" />
                      <span className="font-medium text-gray-900">{championship.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {championship.season}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(championship.startDate + 'T12:00:00').toLocaleDateString()} - {new Date(championship.endDate + 'T12:00:00').toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {championship.teamsCount} equipos
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(championship.status)}`}>
                      {getStatusLabel(championship.status)}
                    </span>
                  </td>
                  {isAuthenticated && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setTeamsModalChampionship(championship)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Gestionar equipos"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setEditingChampionship(championship); createMutation.reset(); setIsModalOpen(true); }}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(championship.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!data.hasPreviousPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(page - 1) * 10 + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(page * 10, data.totalCount)}</span> de{' '}
                    <span className="font-medium">{data.totalCount}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!data.hasPreviousPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={!data.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ChampionshipModal
          championship={editingChampionship}
          onClose={handleCloseModal}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          isLoading={editingChampionship ? updateMutation.isPending : createMutation.isPending}
          error={editingChampionship ? updateMutation.error : createMutation.error}
        />
      )}

      {/* Teams Modal */}
      {teamsModalChampionship && (
        <TeamsModal
          championship={teamsModalChampionship}
          onClose={() => {
            setTeamsModalChampionship(null);
            queryClient.invalidateQueries({ queryKey: ['championships'] });
          }}
        />
      )}
    </div>
  );
}

function ChampionshipModal({
  championship,
  onClose,
  onCreate,
  onUpdate,
  isLoading,
  error,
}: {
  championship: Championship | null;
  onClose: () => void;
  onCreate: (data: CreateChampionshipRequest) => void;
  onUpdate: (id: string, data: UpdateChampionshipRequest) => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const isEditing = championship !== null;
  const [name, setName] = useState(championship?.name || '');
  const [season, setSeason] = useState(championship?.season || '');
  const [startDate, setStartDate] = useState(championship?.startDate?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(championship?.endDate?.split('T')[0] || '');
  const [status, setStatus] = useState<ChampionshipStatus>(championship?.status ?? ChampionshipStatus.Upcoming);
  const [tiebreakerType, setTiebreakerType] = useState<TiebreakerType>(championship?.tiebreakerType ?? TiebreakerType.HeadToHead);

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
    return error.message || 'Error al guardar el campeonato';
  };

  const errorMessage = getErrorMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdate(championship.id, { name, season, startDate, endDate, status, tiebreakerType });
    } else {
      onCreate({ name, season, startDate, endDate, tiebreakerType });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {championship ? 'Editar Campeonato' : 'Nuevo Campeonato'}
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Temporada</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2024 o 2024-2025"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Criterio de desempate</label>
              <select
                value={tiebreakerType}
                onChange={(e) => setTiebreakerType(Number(e.target.value) as TiebreakerType)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border px-3 py-2"
              >
                <option value={TiebreakerType.HeadToHead}>Enfrentamientos directos</option>
                <option value={TiebreakerType.GoalDifference}>Diferencia de goles</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Define cómo se desempatan equipos con los mismos puntos
              </p>
            </div>
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value) as ChampionshipStatus)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border px-3 py-2"
                >
                  <option value={ChampionshipStatus.Upcoming}>Proximo</option>
                  <option value={ChampionshipStatus.InProgress}>En curso</option>
                  <option value={ChampionshipStatus.Finished}>Finalizado</option>
                </select>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamsModal({
  championship,
  onClose,
}: {
  championship: Championship;
  onClose: () => void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: championshipDetail } = useQuery({
    queryKey: ['championship', championship.id],
    queryFn: () => championshipsApi.getById(championship.id),
  });

  const { data: allTeams } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => teamsApi.getAll({ pageSize: 100 }),
  });

  const addTeamMutation = useMutation({
    mutationFn: (teamId: string) => championshipsApi.addTeam(championship.id, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championship', championship.id] });
      setSelectedTeamId('');
      setError(null);
    },
    onError: (err: Error) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = err as any;
      if (axiosError.response?.data?.errors) {
        const errors = axiosError.response.data.errors;
        setError(Object.values(errors).flat().join(', '));
      } else if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError('Error al agregar el equipo');
      }
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: (teamId: string) => championshipsApi.removeTeam(championship.id, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championship', championship.id] });
    },
  });

  const registeredTeamIds = championshipDetail?.teams?.map(t => t.teamId) || [];
  const availableTeams = allTeams?.items?.filter(t => !registeredTeamIds.includes(t.id)) || [];

  const handleAddTeam = () => {
    if (selectedTeamId) {
      addTeamMutation.mutate(selectedTeamId);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Equipos - {championship.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2"
            >
              <option value="">Seleccionar equipo...</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <button
              onClick={handleAddTeam}
              disabled={!selectedTeamId || addTeamMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {addTeamMutation.isPending ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Equipos registrados ({championshipDetail?.teams?.length || 0})
          </h4>
          {championshipDetail?.teams?.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay equipos registrados</p>
          ) : (
            <ul className="space-y-2">
              {championshipDetail?.teams?.map((team) => (
                <li key={team.teamId} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md">
                  <span className="font-medium text-gray-900">{team.teamName}</span>
                  <button
                    onClick={() => removeTeamMutation.mutate(team.teamId)}
                    disabled={removeTeamMutation.isPending}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
