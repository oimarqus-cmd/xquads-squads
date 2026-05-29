import { Routes, Route, Link } from 'react-router-dom';
import SquadsPage from './pages/SquadsPage';
import SquadDetailPage from './pages/SquadDetailPage';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="logo">XQuads</Link>
        <span className="tagline">Squad Management</span>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<SquadsPage />} />
          <Route path="/squads/:id" element={<SquadDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
