import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SquadsPage from './pages/SquadsPage';
import SquadDetailPage from './pages/SquadDetailPage';
import AuthPage from './pages/AuthPage';
import './App.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
}

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <Link to="/" className="logo">XQuads</Link>
      <span className="tagline">Squad Management</span>
      {user && (
        <div className="header-user">
          <span className="user-name">{user.name}</span>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      )}
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<PrivateRoute><SquadsPage /></PrivateRoute>} />
            <Route path="/squads/:id" element={<PrivateRoute><SquadDetailPage /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
