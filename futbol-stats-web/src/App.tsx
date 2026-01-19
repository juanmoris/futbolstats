import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ChampionshipsPage } from '@/pages/ChampionshipsPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { PlayersPage } from '@/pages/PlayersPage';
import { MatchesPage } from '@/pages/MatchesPage';
import { MatchDetailPage } from '@/pages/MatchDetailPage';
import { TeamDetailPage } from '@/pages/TeamDetailPage';
import { CoachesPage } from '@/pages/CoachesPage';
import { StatisticsPage } from '@/pages/StatisticsPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/championships" element={<ChampionshipsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/:id" element={<TeamDetailPage />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/matches/:id" element={<MatchDetailPage />} />
              <Route path="/coaches" element={<CoachesPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
