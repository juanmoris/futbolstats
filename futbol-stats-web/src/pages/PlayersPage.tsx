import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, User, Search } from 'lucide-react';
import { playersApi } from '@/api/endpoints/players.api';
import { teamsApi } from '@/api/endpoints/teams.api';
import type { Player, CreatePlayerRequest } from '@/api/types/player.types';
import { PlayerPosition } from '@/api/types/common.types';

export function PlayersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: teams } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => teamsApi.getAll({ pageSize: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['players', { page, pageSize, search, teamId: teamFilter }],
    queryFn: () => playersApi.getAll({
      page,
      pageSize,
      search: search || undefined,
      teamId: teamFilter || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: playersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsModalOpen(false);
      setModalError(null);
    },
    onError: (err) => setModalError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePlayerRequest & { isActive: boolean } }) =>
      playersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsModalOpen(false);
      setModalError(null);
    },
    onError: (err) => setModalError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: playersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const handleSave = (data: CreatePlayerRequest & { isActive?: boolean }) => {
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data: { ...data, isActive: data.isActive ?? true } });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenModal = (player: Player | null) => {
    setEditingPlayer(player);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Esta seguro de eliminar este jugador?')) {
      deleteMutation.mutate(id);
    }
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case PlayerPosition.Goalkeeper: return 'Portero';
      case PlayerPosition.Defender: return 'Defensa';
      case PlayerPosition.Midfielder: return 'Mediocampista';
      case PlayerPosition.Forward: return 'Delantero';
      default: return 'Desconocido';
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case PlayerPosition.Goalkeeper: return 'bg-yellow-100 text-yellow-800';
      case PlayerPosition.Defender: return 'bg-blue-100 text-blue-800';
      case PlayerPosition.Midfielder: return 'bg-green-100 text-green-800';
      case PlayerPosition.Forward: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los jugadores de los equipos
          </p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Jugador
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar jugadores..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
        <select
          value={teamFilter}
          onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}
          className="block w-48 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        >
          <option value="">Todos los equipos</option>
          {teams?.items?.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
          className="block w-24 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posicion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numero
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.items?.map((player) => (
                <tr key={player.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.fullName} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{player.fullName}</p>
                        <p className="text-sm text-gray-500">{player.nationality || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {player.teamName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                      {getPositionLabel(player.position)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{player.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      player.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {player.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(player)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(page - 1) * pageSize + 1}</span> a{' '}
                <span className="font-medium">{Math.min(page * pageSize, data.totalCount)}</span> de{' '}
                <span className="font-medium">{data.totalCount}</span> resultados
              </p>
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
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <PlayerModal
          player={editingPlayer}
          teams={teams?.items || []}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={modalError}
        />
      )}
    </div>
  );
}

function getErrorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axiosError = err as any;
  if (axiosError.response?.data?.errors) {
    const errors = axiosError.response.data.errors;
    return Object.values(errors).flat().join(', ');
  }
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }
  return 'Error al realizar la operacion';
}

function PlayerModal({
  player,
  teams,
  onClose,
  onSave,
  isLoading,
  error,
}: {
  player: Player | null;
  teams: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: CreatePlayerRequest & { isActive?: boolean }) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [firstName, setFirstName] = useState(player?.firstName || '');
  const [lastName, setLastName] = useState(player?.lastName || '');
  const [number, setNumber] = useState(player?.number?.toString() || '');
  const [position, setPosition] = useState(player?.position?.toString() || '0');
  const [teamId, setTeamId] = useState(player?.teamId || '');
  const [nationality, setNationality] = useState(player?.nationality || '');
  const [birthDate, setBirthDate] = useState(player?.birthDate?.split('T')[0] || '');
  const [photoUrl, setPhotoUrl] = useState(player?.photoUrl || '');
  const [isActive, setIsActive] = useState(player?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName,
      lastName,
      number: parseInt(number),
      position: parseInt(position) as typeof PlayerPosition[keyof typeof PlayerPosition],
      teamId,
      nationality: nationality || undefined,
      birthDate: birthDate || undefined,
      photoUrl: photoUrl || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {player ? 'Editar Jugador' : 'Nuevo Jugador'}
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Equipo</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
              >
                <option value="">Seleccionar equipo</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Numero</label>
                <input
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                  min={1}
                  max={99}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Posicion</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
                >
                  <option value="0">Portero</option>
                  <option value="1">Defensa</option>
                  <option value="2">Mediocampista</option>
                  <option value="3">Delantero</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nacionalidad</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL de la foto</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border px-3 py-2"
              />
            </div>
            {player && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Jugador activo</span>
                </label>
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
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
