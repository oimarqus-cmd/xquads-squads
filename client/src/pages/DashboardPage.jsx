import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../context/AuthContext';
import './DashboardPage.css';

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); });
  }, []);

  if (loading) return <p className="loading">Loading stats...</p>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Squads" value={stats.totalSquads} />
        <StatCard label="Total Members" value={stats.totalMembers} />
        <StatCard label="Avg Members / Squad" value={stats.avgMembers} />
        <StatCard
          label="Empty Squads"
          value={stats.emptySquads}
          sub="squads with no members"
        />
      </div>

      <div className="dashboard-row">
        <div className="dashboard-panel">
          <h2>Top Squads by Size</h2>
          {stats.topSquads.length === 0 ? (
            <p className="empty">No squads yet.</p>
          ) : (
            <ul className="top-squads">
              {stats.topSquads.map((s, i) => (
                <li key={s.id} className="top-squad-item">
                  <span className="rank">#{i + 1}</span>
                  <Link to={`/squads/${s.id}`} className="top-squad-name">{s.name}</Link>
                  <span className="top-squad-count">{s.member_count} member{s.member_count !== 1 ? 's' : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Highlights</h2>
          <div className="highlights">
            {stats.largestSquad ? (
              <div className="highlight-item">
                <span className="highlight-label">Largest squad</span>
                <span className="highlight-value">{stats.largestSquad.name}</span>
                <span className="highlight-sub">{stats.largestSquad.member_count} members</span>
              </div>
            ) : null}
            {stats.newestSquad ? (
              <div className="highlight-item">
                <span className="highlight-label">Newest squad</span>
                <span className="highlight-value">{stats.newestSquad.name}</span>
                <span className="highlight-sub">Created {new Date(stats.newestSquad.created_at).toLocaleDateString()}</span>
              </div>
            ) : null}
            {!stats.largestSquad && !stats.newestSquad && (
              <p className="empty">Create some squads to see highlights.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
