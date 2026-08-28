import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PlayPage } from './pages/PlayPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { StorePage } from './pages/StorePage';
import { FriendsPage } from './pages/FriendsPage';
import { ClubsPage } from './pages/ClubsPage';
import { PassPage } from './pages/PassPage';
import { useAuthStore } from './store/authStore';

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/play/:matchId" element={<PlayPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/pass" element={<PassPage />} />
      </Routes>
    </Layout>
  );
}
