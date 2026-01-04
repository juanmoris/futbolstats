import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, User, Calendar } from 'lucide-react';
import { championshipsApi } from '@/api/endpoints/championships.api';
import { teamsApi } from '@/api/endpoints/teams.api';
import { playersApi } from '@/api/endpoints/players.api';

export function DashboardPage() {
  const { data: championships } = useQuery({
    queryKey: ['championships', { page: 1, pageSize: 5 }],
    queryFn: () => championshipsApi.getAll({ page: 1, pageSize: 5 }),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', { page: 1, pageSize: 5 }],
    queryFn: () => teamsApi.getAll({ page: 1, pageSize: 5 }),
  });

  const { data: players } = useQuery({
    queryKey: ['players', { page: 1, pageSize: 5 }],
    queryFn: () => playersApi.getAll({ page: 1, pageSize: 5 }),
  });

  const stats = [
    {
      name: 'Campeonatos',
      value: championships?.totalCount || 0,
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Equipos',
      value: teams?.totalCount || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Jugadores',
      value: players?.totalCount || 0,
      icon: User,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Partidos en vivo',
      value: 0,
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general de FutbolStats
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.bgColor} rounded-lg p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Championships */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-green-600" />
              Campeonatos Recientes
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {championships?.items?.length ? (
              championships.items.map((championship) => (
                <li key={championship.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {championship.name}
                      </p>
                      <p className="text-sm text-gray-500">{championship.season}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      championship.status === 1
                        ? 'bg-green-100 text-green-800'
                        : championship.status === 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {championship.status === 1 ? 'En curso' : championship.status === 0 ? 'Proximo' : 'Finalizado'}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-4 text-sm text-gray-500">
                No hay campeonatos registrados
              </li>
            )}
          </ul>
        </div>

        {/* Recent Teams */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Equipos Recientes
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {teams?.items?.length ? (
              teams.items.map((team) => (
                <li key={team.id} className="px-6 py-4">
                  <div className="flex items-center">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{team.name}</p>
                      <p className="text-sm text-gray-500">{team.shortName}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-4 text-sm text-gray-500">
                No hay equipos registrados
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
