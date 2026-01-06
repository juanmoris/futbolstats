import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Play, Pause, StopCircle, Users, Plus, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { matchesApi } from '@/api/endpoints/matches.api';
import { playersApi } from '@/api/endpoints/players.api';
import { MatchStatus, EventType } from '@/api/types/common.types';
import type {
  MatchDetail,
  RecordGoalRequest,
  RecordCardRequest,
  RecordSubstitutionRequest,
  SetLineupRequest,
  LineupPlayerRequest
} from '@/api/types/match.types';
import type { Player } from '@/api/types/player.types';
import type { MatchEvent } from '@/api/types/match.types';

function formatMinute(minute: number, extraMinute: number | null): string {
  return extraMinute ? `${minute}+${extraMinute}'` : `${minute}'`;
}

function PlayerEventIcons({ playerId, events }: { playerId: string; events: MatchEvent[] }) {
  const playerEvents = events.filter(e => e.playerId === playerId);

  const goals = playerEvents.filter(e =>
    e.eventType === EventType.Goal || e.eventType === EventType.PenaltyScored
  );
  const ownGoals = playerEvents.filter(e => e.eventType === EventType.OwnGoal);
  const yellowCard = playerEvents.find(e => e.eventType === EventType.YellowCard);
  const redCard = playerEvents.find(e =>
    e.eventType === EventType.RedCard || e.eventType === EventType.SecondYellow
  );
  const subOut = playerEvents.find(e => e.eventType === EventType.SubstitutionOut);
  const subIn = playerEvents.find(e => e.eventType === EventType.SubstitutionIn);

  return (
    <div className="flex items-center gap-1">
      {goals.map((goal, i) => (
        <span
          key={i}
          className="text-xs cursor-default"
          title={`Gol ${formatMinute(goal.minute, goal.extraMinute)}`}
        >
          ⚽
        </span>
      ))}
      {ownGoals.map((og, i) => (
        <span
          key={i}
          className="text-xs text-red-600 cursor-default"
          title={`Autogol ${formatMinute(og.minute, og.extraMinute)}`}
        >
          ⚽
        </span>
      ))}
      {yellowCard && (
        <span
          className="w-3 h-4 bg-yellow-400 rounded-sm cursor-default"
          title={`Tarjeta amarilla ${formatMinute(yellowCard.minute, yellowCard.extraMinute)}`}
        />
      )}
      {redCard && (
        <span
          className="w-3 h-4 bg-red-600 rounded-sm cursor-default"
          title={`Tarjeta roja ${formatMinute(redCard.minute, redCard.extraMinute)}`}
        />
      )}
      {subOut && (
        <span title={`Sustituido ${formatMinute(subOut.minute, subOut.extraMinute)}`}>
          <ArrowDownRight className="h-4 w-4 text-red-500 cursor-default" />
        </span>
      )}
      {subIn && (
        <span title={`Ingresó ${formatMinute(subIn.minute, subIn.extraMinute)}`}>
          <ArrowUpRight className="h-4 w-4 text-green-500 cursor-default" />
        </span>
      )}
    </div>
  );
}

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showLineupModal, setShowLineupModal] = useState<'home' | 'away' | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === MatchStatus.Live || data?.status === MatchStatus.HalfTime ? 10000 : false;
    },
  });

  const startMutation = useMutation({
    mutationFn: () => matchesApi.start(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const halftimeMutation = useMutation({
    mutationFn: () => matchesApi.halftime(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const endMutation = useMutation({
    mutationFn: () => matchesApi.end(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => matchesApi.deleteEvent(id!, eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['match', id] }),
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

  const getEventIcon = (eventType: number) => {
    switch (eventType) {
      case EventType.Goal:
      case EventType.PenaltyScored:
        return '⚽';
      case EventType.OwnGoal:
        return '⚽ (AG)';
      case EventType.YellowCard:
        return '🟨';
      case EventType.RedCard:
      case EventType.SecondYellow:
        return '🟥';
      case EventType.SubstitutionIn:
        return '🔼';
      case EventType.SubstitutionOut:
        return '🔽';
      case EventType.Assist:
        return '🅰️';
      default:
        return '•';
    }
  };

  const getEventLabel = (eventType: number) => {
    switch (eventType) {
      case EventType.Goal: return 'Gol';
      case EventType.PenaltyScored: return 'Gol (Penal)';
      case EventType.OwnGoal: return 'Autogol';
      case EventType.YellowCard: return 'Tarjeta amarilla';
      case EventType.RedCard: return 'Tarjeta roja';
      case EventType.SecondYellow: return 'Segunda amarilla';
      case EventType.SubstitutionIn: return 'Entra';
      case EventType.SubstitutionOut: return 'Sale';
      case EventType.Assist: return 'Asistencia';
      default: return 'Evento';
    }
  };

  const isMatchActive = match?.status === MatchStatus.Live || match?.status === MatchStatus.HalfTime;
  const canStartMatch = match?.status === MatchStatus.Scheduled || match?.status === MatchStatus.HalfTime;
  const canRecordEvents = isMatchActive || match?.status === MatchStatus.Finished;
  const canEditLineup = match?.status === MatchStatus.Scheduled || match?.status === MatchStatus.Finished;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Partido no encontrado</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/matches"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a partidos
      </Link>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="float-right text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Match Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">{match.championshipName} - Jornada {match.matchday}</span>
          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            match.status === MatchStatus.Live ? 'bg-red-100 text-red-800 animate-pulse' :
            match.status === MatchStatus.HalfTime ? 'bg-yellow-100 text-yellow-800' :
            match.status === MatchStatus.Finished ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getStatusLabel(match.status)}
            {match.status === MatchStatus.Live && match.currentMinute && ` (${match.currentMinute}')`}
          </span>
        </div>

        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">{match.homeTeamName}</p>
            </div>
            {match.homeTeamLogo && (
              <img src={match.homeTeamLogo} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
          </div>

          <div className="text-center px-8">
            <div className="text-4xl font-bold text-gray-900">
              {match.homeScore} - {match.awayScore}
            </div>
            <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(match.matchDate).toLocaleDateString('es', {
                timeZone: 'UTC',
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1">
            {match.awayTeamLogo && (
              <img src={match.awayTeamLogo} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
            <div>
              <p className="text-xl font-bold text-gray-900">{match.awayTeamName}</p>
            </div>
          </div>
        </div>

        {match.stadium && (
          <div className="text-center mt-4 text-sm text-gray-500">
            {match.stadium}
          </div>
        )}

        {/* Match Controls */}
        {match.status !== MatchStatus.Finished && (
          <div className="mt-6 flex justify-center gap-3">
            {canStartMatch && (
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                {match.status === MatchStatus.HalfTime ? 'Iniciar 2do Tiempo' : 'Iniciar Partido'}
              </button>
            )}

            {match.status === MatchStatus.Live && (
              <button
                onClick={() => halftimeMutation.mutate()}
                disabled={halftimeMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                <Pause className="h-4 w-4 mr-2" />
                Medio Tiempo
              </button>
            )}

            {isMatchActive && (
              <button
                onClick={() => endMutation.mutate()}
                disabled={endMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Finalizar Partido
              </button>
            )}
          </div>
        )}

        {/* Event Recording Buttons */}
        {canRecordEvents && (
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ⚽ Registrar Gol
            </button>
            <button
              onClick={() => setShowCardModal(true)}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              🟨 Registrar Tarjeta
            </button>
            <button
              onClick={() => setShowSubstitutionModal(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              🔄 Registrar Cambio
            </button>
          </div>
        )}
      </div>

      {/* Events Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Eventos del partido</h3>

        {match.events?.length ? (
          <div className="space-y-3">
            {match.events
              .filter(e => e.eventType !== EventType.Assist)
              .sort((a, b) => a.minute - b.minute)
              .map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    event.teamId === match.homeTeamId ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="w-12 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {event.minute}'
                      {event.extraMinute && `+${event.extraMinute}`}
                    </span>
                  </div>
                  <div className="text-2xl">{getEventIcon(event.eventType)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.playerName}</p>
                    <p className="text-sm text-gray-500">{getEventLabel(event.eventType)}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.teamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName}
                  </div>
                  {canRecordEvents && (
                    <button
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar evento"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay eventos registrados</p>
        )}
      </div>

      {/* Lineups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">{match.homeTeamName}</h3>
            {canEditLineup && (
              <button
                onClick={() => setShowLineupModal('home')}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-1" />
                Alineacion
              </button>
            )}
          </div>
          {match.homeLineup?.length ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">Titulares</div>
              {match.homeLineup
                .filter(p => p.isStarter)
                .map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-800">
                        {player.jerseyNumber}
                      </span>
                      <span className="font-medium">{player.playerName}</span>
                    </div>
                    <PlayerEventIcons playerId={player.playerId} events={match.events} />
                  </div>
                ))}
              {match.homeLineup.filter(p => !p.isStarter).length > 0 && (
                <>
                  <div className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">Suplentes</div>
                  {match.homeLineup
                    .filter(p => !p.isStarter)
                    .map((player) => (
                      <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {player.jerseyNumber}
                          </span>
                          <span className="text-gray-500">{player.playerName}</span>
                        </div>
                        <PlayerEventIcons playerId={player.playerId} events={match.events} />
                      </div>
                    ))}
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Sin alineacion registrada</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">{match.awayTeamName}</h3>
            {canEditLineup && (
              <button
                onClick={() => setShowLineupModal('away')}
                className="inline-flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Users className="h-4 w-4 mr-1" />
                Alineacion
              </button>
            )}
          </div>
          {match.awayLineup?.length ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">Titulares</div>
              {match.awayLineup
                .filter(p => p.isStarter)
                .map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-800">
                        {player.jerseyNumber}
                      </span>
                      <span className="font-medium">{player.playerName}</span>
                    </div>
                    <PlayerEventIcons playerId={player.playerId} events={match.events} />
                  </div>
                ))}
              {match.awayLineup.filter(p => !p.isStarter).length > 0 && (
                <>
                  <div className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">Suplentes</div>
                  {match.awayLineup
                    .filter(p => !p.isStarter)
                    .map((player) => (
                      <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {player.jerseyNumber}
                          </span>
                          <span className="text-gray-500">{player.playerName}</span>
                        </div>
                        <PlayerEventIcons playerId={player.playerId} events={match.events} />
                      </div>
                    ))}
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Sin alineacion registrada</p>
          )}
        </div>
      </div>

      {/* Modals */}
      {showLineupModal && (
        <LineupModal
          match={match}
          teamType={showLineupModal}
          onClose={() => setShowLineupModal(null)}
        />
      )}

      {showGoalModal && (
        <GoalModal
          match={match}
          onClose={() => setShowGoalModal(false)}
        />
      )}

      {showCardModal && (
        <CardModal
          match={match}
          onClose={() => setShowCardModal(false)}
        />
      )}

      {showSubstitutionModal && (
        <SubstitutionModal
          match={match}
          onClose={() => setShowSubstitutionModal(false)}
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

function LineupModal({ match, teamType, onClose }: { match: MatchDetail; teamType: 'home' | 'away'; onClose: () => void }) {
  const teamId = teamType === 'home' ? match.homeTeamId : match.awayTeamId;
  const teamName = teamType === 'home' ? match.homeTeamName : match.awayTeamName;
  const queryClient = useQueryClient();

  const [selectedPlayers, setSelectedPlayers] = useState<LineupPlayerRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: teamPlayers } = useQuery({
    queryKey: ['players', { teamId }],
    queryFn: () => playersApi.getAll({ teamId, onlyActive: true, pageSize: 50 }),
  });

  const setLineupMutation = useMutation({
    mutationFn: (data: SetLineupRequest) => matchesApi.setLineup(match.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const togglePlayer = (player: Player, isStarter: boolean) => {
    const existing = selectedPlayers.find(p => p.playerId === player.id);
    if (existing) {
      setSelectedPlayers(selectedPlayers.filter(p => p.playerId !== player.id));
    } else {
      setSelectedPlayers([...selectedPlayers, {
        playerId: player.id,
        isStarter,
        position: player.position.toString(),
        jerseyNumber: player.jerseyNumber,
      }]);
    }
  };

  const handleSave = () => {
    if (selectedPlayers.filter(p => p.isStarter).length > 11) {
      setError('No puede haber mas de 11 titulares');
      return;
    }
    setLineupMutation.mutate({ teamId, players: selectedPlayers });
  };

  const starters = selectedPlayers.filter(p => p.isStarter);
  const substitutes = selectedPlayers.filter(p => !p.isStarter);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Alineacion - {teamName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Titulares: {starters.length}/11 | Suplentes: {substitutes.length}
            </p>
          </div>

          <div className="space-y-2">
            {teamPlayers?.items?.map((player) => {
              const selected = selectedPlayers.find(p => p.playerId === player.id);
              return (
                <div key={player.id} className="flex items-center justify-between py-2 px-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {player.number}
                    </span>
                    <div>
                      <span className="font-medium">{player.firstName} {player.lastName}</span>
                      <span className="ml-2 text-sm text-gray-500">{player.position}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePlayer(player, true)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        selected?.isStarter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Titular
                    </button>
                    <button
                      onClick={() => togglePlayer(player, false)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        selected && !selected.isStarter ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Suplente
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={setLineupMutation.isPending || selectedPlayers.length === 0}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {setLineupMutation.isPending ? 'Guardando...' : 'Guardar Alineacion'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalModal({ match, onClose }: { match: MatchDetail; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState('');
  const [scorerId, setScorerId] = useState('');
  const [assistPlayerId, setAssistPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [extraMinute, setExtraMinute] = useState('');
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [isPenalty, setIsPenalty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineup = teamId === match.homeTeamId ? match.homeLineup : match.awayLineup;

  const recordGoalMutation = useMutation({
    mutationFn: (data: RecordGoalRequest) => matchesApi.recordGoal(match.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordGoalMutation.mutate({
      scorerId,
      teamId,
      minute: parseInt(minute),
      extraMinute: extraMinute ? parseInt(extraMinute) : undefined,
      assistPlayerId: assistPlayerId || undefined,
      isOwnGoal,
      isPenalty,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Registrar Gol</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Equipo</label>
              <select
                value={teamId}
                onChange={(e) => { setTeamId(e.target.value); setScorerId(''); setAssistPlayerId(''); }}
                required
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                <option value={match.homeTeamId}>{match.homeTeamName}</option>
                <option value={match.awayTeamId}>{match.awayTeamName}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Goleador</label>
              <select
                value={scorerId}
                onChange={(e) => setScorerId(e.target.value)}
                required
                disabled={!teamId}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                {lineup?.map((p) => (
                  <option key={p.playerId} value={p.playerId}>{p.jerseyNumber} - {p.playerName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Asistencia (opcional)</label>
              <select
                value={assistPlayerId}
                onChange={(e) => setAssistPlayerId(e.target.value)}
                disabled={!teamId || isOwnGoal}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Sin asistencia</option>
                {lineup?.filter(p => p.playerId !== scorerId).map((p) => (
                  <option key={p.playerId} value={p.playerId}>{p.jerseyNumber} - {p.playerName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Minuto</label>
                <input
                  type="number"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  required
                  min={1}
                  max={120}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiempo adicional</label>
                <input
                  type="number"
                  value={extraMinute}
                  onChange={(e) => setExtraMinute(e.target.value)}
                  min={1}
                  max={15}
                  placeholder="Opcional"
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPenalty}
                  onChange={(e) => setIsPenalty(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Penal</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isOwnGoal}
                  onChange={(e) => { setIsOwnGoal(e.target.checked); if (e.target.checked) setAssistPlayerId(''); }}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Autogol</span>
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={recordGoalMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md disabled:opacity-50"
            >
              {recordGoalMutation.isPending ? 'Guardando...' : 'Registrar Gol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CardModal({ match, onClose }: { match: MatchDetail; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [minute, setMinute] = useState('');
  const [extraMinute, setExtraMinute] = useState('');
  const [isRed, setIsRed] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const lineup = teamId === match.homeTeamId ? match.homeLineup : match.awayLineup;

  const recordCardMutation = useMutation({
    mutationFn: (data: RecordCardRequest) => matchesApi.recordCard(match.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordCardMutation.mutate({
      playerId,
      teamId,
      minute: parseInt(minute),
      extraMinute: extraMinute ? parseInt(extraMinute) : undefined,
      isRed,
      reason: reason || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Registrar Tarjeta</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Equipo</label>
              <select
                value={teamId}
                onChange={(e) => { setTeamId(e.target.value); setPlayerId(''); }}
                required
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                <option value={match.homeTeamId}>{match.homeTeamName}</option>
                <option value={match.awayTeamId}>{match.awayTeamName}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Jugador</label>
              <select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                required
                disabled={!teamId}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                {lineup?.map((p) => (
                  <option key={p.playerId} value={p.playerId}>{p.jerseyNumber} - {p.playerName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Minuto</label>
                <input
                  type="number"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  required
                  min={1}
                  max={120}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiempo adicional</label>
                <input
                  type="number"
                  value={extraMinute}
                  onChange={(e) => setExtraMinute(e.target.value)}
                  min={1}
                  max={15}
                  placeholder="Opcional"
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de tarjeta</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isRed}
                    onChange={() => setIsRed(false)}
                    className="text-yellow-500"
                  />
                  <span className="ml-2 text-sm">🟨 Amarilla</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isRed}
                    onChange={() => setIsRed(true)}
                    className="text-red-500"
                  />
                  <span className="ml-2 text-sm">🟥 Roja</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Motivo (opcional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Falta grave, mano intencional..."
                className="mt-1 block w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={recordCardMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-orange-600 rounded-md disabled:opacity-50"
            >
              {recordCardMutation.isPending ? 'Guardando...' : 'Registrar Tarjeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubstitutionModal({ match, onClose }: { match: MatchDetail; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState('');
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');
  const [minute, setMinute] = useState('');
  const [extraMinute, setExtraMinute] = useState('');
  const [error, setError] = useState<string | null>(null);

  const lineup = teamId === match.homeTeamId ? match.homeLineup : match.awayLineup;
  const onFieldPlayers = lineup?.filter(p => p.isStarter) || [];
  const benchPlayers = lineup?.filter(p => !p.isStarter) || [];

  const recordSubstitutionMutation = useMutation({
    mutationFn: (data: RecordSubstitutionRequest) => matchesApi.recordSubstitution(match.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', match.id] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordSubstitutionMutation.mutate({
      playerOutId,
      playerInId,
      teamId,
      minute: parseInt(minute),
      extraMinute: extraMinute ? parseInt(extraMinute) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Registrar Cambio</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Equipo</label>
              <select
                value={teamId}
                onChange={(e) => { setTeamId(e.target.value); setPlayerOutId(''); setPlayerInId(''); }}
                required
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                <option value={match.homeTeamId}>{match.homeTeamName}</option>
                <option value={match.awayTeamId}>{match.awayTeamName}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">🔽 Sale</label>
              <select
                value={playerOutId}
                onChange={(e) => setPlayerOutId(e.target.value)}
                required
                disabled={!teamId}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                {onFieldPlayers.map((p) => (
                  <option key={p.playerId} value={p.playerId}>{p.jerseyNumber} - {p.playerName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">🔼 Entra</label>
              <select
                value={playerInId}
                onChange={(e) => setPlayerInId(e.target.value)}
                required
                disabled={!teamId}
                className="mt-1 block w-full rounded-md border px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                {benchPlayers.map((p) => (
                  <option key={p.playerId} value={p.playerId}>{p.jerseyNumber} - {p.playerName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Minuto</label>
                <input
                  type="number"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  required
                  min={1}
                  max={120}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiempo adicional</label>
                <input
                  type="number"
                  value={extraMinute}
                  onChange={(e) => setExtraMinute(e.target.value)}
                  min={1}
                  max={15}
                  placeholder="Opcional"
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={recordSubstitutionMutation.isPending}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md disabled:opacity-50"
            >
              {recordSubstitutionMutation.isPending ? 'Guardando...' : 'Registrar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
