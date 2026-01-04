import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock } from 'lucide-react';
import { matchesApi } from '@/api/endpoints/matches.api';
import { MatchStatus, EventType } from '@/api/types/common.types';

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesApi.getById(id!),
    enabled: !!id,
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

      {/* Match Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="text-center mb-4">
          <span className="text-sm text-gray-500">{match.championshipName} - Jornada {match.matchday}</span>
          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            match.status === MatchStatus.Live ? 'bg-red-100 text-red-800' :
            match.status === MatchStatus.Finished ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getStatusLabel(match.status)}
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
      </div>

      {/* Events Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Eventos del partido</h3>

        {match.events?.length ? (
          <div className="space-y-3">
            {match.events
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">{match.homeTeamName}</h3>
          {match.homeLineup?.length ? (
            <div className="space-y-2">
              {match.homeLineup
                .sort((a, b) => (a.isStarter === b.isStarter ? 0 : a.isStarter ? -1 : 1))
                .map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-800">
                        {player.number}
                      </span>
                      <span className={player.isStarter ? 'font-medium' : 'text-gray-500'}>{player.playerName}</span>
                    </div>
                    <span className="text-sm text-gray-500">{player.position}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">Sin alineacion registrada</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{match.awayTeamName}</h3>
          {match.awayLineup?.length ? (
            <div className="space-y-2">
              {match.awayLineup
                .sort((a, b) => (a.isStarter === b.isStarter ? 0 : a.isStarter ? -1 : 1))
                .map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-800">
                        {player.number}
                      </span>
                      <span className={player.isStarter ? 'font-medium' : 'text-gray-500'}>{player.playerName}</span>
                    </div>
                    <span className="text-sm text-gray-500">{player.position}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">Sin alineacion registrada</p>
          )}
        </div>
      </div>
    </div>
  );
}
