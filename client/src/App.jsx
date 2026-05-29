import { Routes, Route, Link, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import SquadsPage from './pages/SquadsPage';
import SquadDetailPage from './pages/SquadDetailPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import './App.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
}

function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <header className="app-header">
      <Link to="/" className="logo">XQuads</Link>
      {user && (
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
          <NavLink to="/squads" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Squads</NavLink>
        </nav>
      )}
      <div className="header-user">
        <button className="theme-toggle" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user && (
          <>
            <span className="user-name">{user.name}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app">
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/squads" element={<PrivateRoute><SquadsPage /></PrivateRoute>} />
              <Route path="/squads/:id" element={<PrivateRoute><SquadDetailPage /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
