import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, User, Search, Link2, Unlink2, Shield } from 'lucide-react';
import { coachesApi } from '@/api/endpoints/coaches.api';
import { teamsApi } from '@/api/endpoints/teams.api';
import { countriesApi } from '@/api/endpoints/countries.api';
import { useAuth } from '@/contexts/AuthContext';
import type { Coach, CreateCoachRequest, UpdateCoachRequest } from '@/api/types/coach.types';

export function CoachesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [assigningCoach, setAssigningCoach] = useState<Coach | null>(null);
  const [viewingCoach, setViewingCoach] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['coaches', { page, pageSize, search }],
    queryFn: () => coachesApi.getAll({ page, pageSize, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: coachesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCoachRequest }) =>
      coachesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setIsModalOpen(false);
      setEditingCoach(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: coachesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
    },
  });

  const handleCreate = (data: CreateCoachRequest) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: UpdateCoachRequest) => {
    if (editingCoach) {
      updateMutation.mutate({ id: editingCoach.id, data });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Esta seguro de eliminar este entrenador?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Entrenadores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los entrenadores y sus asignaciones a equipos
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => { setEditingCoach(null); setIsModalOpen(true); }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Entrenador
          </button>
        )}
      </div>

      {/* Search and Page Size */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar entrenadores..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
          className="w-full sm:w-24 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
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
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrenador
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nacionalidad
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo Actual
                  </th>
                  {isAuthenticated && (
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.items?.map((coach) => (
                  <tr key={coach.id}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {coach.photoUrl ? (
                          <img src={coach.photoUrl} alt={coach.fullName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          </div>
                        )}
                        <div className="ml-2 sm:ml-3">
                          <button
                            onClick={() => setViewingCoach(coach.id)}
                            className="font-medium text-gray-900 hover:text-blue-600 text-sm sm:text-base truncate max-w-[100px] sm:max-w-none block"
                          >
                            {coach.fullName}
                          </button>
                          {coach.birthDate && (
                            <p className="text-xs text-gray-500">
                              {new Date(coach.birthDate + 'T12:00:00').toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coach.countryName ? (
                        <div className="flex items-center gap-2">
                          {coach.countryFlagUrl && (
                            <img src={coach.countryFlagUrl} alt={coach.countryName} className="h-4 w-6 object-cover rounded" />
                          )}
                          <span>{coach.countryName}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coach.currentTeamId && coach.currentTeamName ? (
                        <Link
                          to={`/teams/${coach.currentTeamId}`}
                          className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                          {coach.currentTeamLogo ? (
                            <img src={coach.currentTeamLogo} alt={coach.currentTeamName} className="h-6 w-6 object-contain" />
                          ) : (
                            <Shield className="h-5 w-5 text-gray-400" />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[60px] sm:max-w-none">
                            {coach.currentTeamName}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm">Sin equipo</span>
                      )}
                    </td>
                    {isAuthenticated && (
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setAssigningCoach(coach)}
                          className="text-green-600 hover:text-green-900 mr-2 sm:mr-4"
                          title={coach.currentTeamId ? 'Cambiar equipo' : 'Asignar a equipo'}
                        >
                          {coach.currentTeamId ? <Unlink2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => { setEditingCoach(coach); setIsModalOpen(true); }}
                          className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coach.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
              <p className="text-sm text-gray-700 text-center sm:text-left">
                Mostrando <span className="font-medium">{(page - 1) * pageSize + 1}</span> a{' '}
                <span className="font-medium">{Math.min(page * pageSize, data.totalCount)}</span> de{' '}
                <span className="font-medium">{data.totalCount}</span> resultados
              </p>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!data.hasPreviousPage}
                  className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.hasNextPage}
                  className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <CoachModal
          coach={editingCoach}
          onClose={() => { setIsModalOpen(false); setEditingCoach(null); }}
          onSave={editingCoach ? handleUpdate : handleCreate}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Modal Asignar Equipo */}
      {assigningCoach && (
        <AssignTeamModal
          coach={assigningCoach}
          onClose={() => setAssigningCoach(null)}
        />
      )}

      {/* Modal Ver Historial */}
      {viewingCoach && (
        <CoachHistoryModal
          coachId={viewingCoach}
          onClose={() => setViewingCoach(null)}
        />
      )}
    </div>
  );
}

function CoachModal({
  coach,
  onClose,
  onSave,
  isLoading,
}: {
  coach: Coach | null;
  onClose: () => void;
  onSave: (data: CreateCoachRequest | UpdateCoachRequest) => void;
  isLoading: boolean;
}) {
  const [firstName, setFirstName] = useState(coach?.firstName || '');
  const [lastName, setLastName] = useState(coach?.lastName || '');
  const [countryId, setCountryId] = useState(coach?.countryId || '');
  const [photoUrl, setPhotoUrl] = useState(coach?.photoUrl || '');
  const [birthDate, setBirthDate] = useState(coach?.birthDate || '');

  const { data: countries } = useQuery({
    queryKey: ['countries', { pageSize: 100 }],
    queryFn: () => countriesApi.getAll({ pageSize: 100 }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName,
      lastName,
      countryId: countryId || undefined,
      photoUrl: photoUrl || undefined,
      birthDate: birthDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-4 sm:px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {coach ? 'Editar Entrenador' : 'Nuevo Entrenador'}
            </h3>
          </div>
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">País</label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
              >
                <option value="">Seleccione un país</option>
                {countries?.items?.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL de Foto</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
              />
            </div>
          </div>
          <div className="px-4 sm:px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignTeamModal({
  coach,
  onClose,
}: {
  coach: Coach;
  onClose: () => void;
}) {
  const [teamId, setTeamId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState<'assign' | 'end'>(coach.currentTeamId ? 'end' : 'assign');
  const queryClient = useQueryClient();

  const { data: teams } = useQuery({
    queryKey: ['teams', { pageSize: 100 }],
    queryFn: () => teamsApi.getAll({ pageSize: 100 }),
  });

  const assignMutation = useMutation({
    mutationFn: () => coachesApi.assignToTeam(coach.id, { teamId, startDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      onClose();
    },
  });

  const endMutation = useMutation({
    mutationFn: () => coachesApi.endAssignment(coach.id, { endDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'assign') {
      assignMutation.mutate();
    } else {
      endMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-4 sm:px-6 py-4 border-b">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              {coach.currentTeamId ? 'Gestionar Asignacion' : 'Asignar a Equipo'} - {coach.fullName}
            </h3>
          </div>
          <div className="px-4 sm:px-6 py-4 space-y-4">
            {coach.currentTeamId && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('end')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                    mode === 'end'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Terminar asignacion
                </button>
                <button
                  type="button"
                  onClick={() => setMode('assign')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                    mode === 'assign'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Asignar nuevo
                </button>
              </div>
            )}

            {mode === 'assign' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipo</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
                  >
                    <option value="">Seleccione un equipo</option>
                    {teams?.items?.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
                  />
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Equipo actual: <strong>{coach.currentTeamName}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border px-3 py-2"
                />
              </div>
            )}
          </div>
          <div className="px-4 sm:px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending || endMutation.isPending}
              className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 ${
                mode === 'end' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {assignMutation.isPending || endMutation.isPending ? 'Guardando...' : mode === 'end' ? 'Terminar' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CoachHistoryModal({
  coachId,
  onClose,
}: {
  coachId: string;
  onClose: () => void;
}) {
  const { data: coach, isLoading } = useQuery({
    queryKey: ['coach', coachId],
    queryFn: () => coachesApi.getById(coachId),
  });

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="px-4 sm:px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate pr-2">
            Historial de {coach?.fullName || 'Entrenador'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0">
            &times;
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-gray-500 text-center">Cargando...</p>
          ) : coach?.teamHistory && coach.teamHistory.length > 0 ? (
            <div className="space-y-4">
              {coach.teamHistory.map((history) => (
                <div key={history.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  {history.teamLogo ? (
                    <img src={history.teamLogo} alt={history.teamName} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                  )}
                  <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{history.teamName}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(history.startDate + 'T12:00:00').toLocaleDateString()} -{' '}
                      {history.endDate
                        ? new Date(history.endDate + 'T12:00:00').toLocaleDateString()
                        : 'Actualidad'}
                    </p>
                  </div>
                  {!history.endDate && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0 ml-2">
                      Actual
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">Sin historial de equipos</p>
          )}
        </div>
        <div className="px-4 sm:px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
