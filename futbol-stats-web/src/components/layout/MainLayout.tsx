import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Users, User, LayoutDashboard, Calendar, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Campeonatos', href: '/championships', icon: Trophy },
  { name: 'Equipos', href: '/teams', icon: Users },
  { name: 'Jugadores', href: '/players', icon: User },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Estadisticas', href: '/statistics', icon: BarChart3 },
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                FutbolStats
              </span>
            </div>
            <nav className="flex space-x-6">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href ||
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <>
                  <span className="text-sm text-gray-600">{user.fullName}</span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Salir
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                >
                  Iniciar sesion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
