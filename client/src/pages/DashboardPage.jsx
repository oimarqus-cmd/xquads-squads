import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { getToken } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { tagChartColor } from '../utils/tagColor';
import './DashboardPage.css';

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

const PURPLE_SHADES = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#6d28d9', '#5b21b6'];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={accent ? { '--card-accent': accent } : {}}>
      <span className={`stat-value${typeof value === 'string' ? ' text' : ''}`}>{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-value">{payload[0].value} {payload[0].name}</p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{payload[0].name}</p>
      <p className="tooltip-value">{payload[0].value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();

  useEffect(() => {
    fetch('/api/stats', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); });
  }, [location.key]);

  if (loading) return <p className="loading">Loading stats...</p>;

  const squadStatusData = [
    { name: 'Active', value: stats.totalSquads - stats.emptySquads },
    { name: 'Empty', value: stats.emptySquads },
  ];

  const cardAccents = stats.tagDistribution.map(t => tagChartColor(t.name, isDark));
  const accent = i => cardAccents[i % cardAccents.length];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Squads" value={stats.totalSquads} accent={accent(0)} />
        <StatCard label="Total Members" value={stats.totalMembers} accent={accent(1)} />
        <StatCard label="Avg Members / Squad" value={stats.avgMembers} accent={accent(2)} />
        <StatCard label="Empty Squads" value={stats.emptySquads} sub="squads with no members" accent={accent(3)} />
        <StatCard label="Unique Tags" value={stats.totalTags} accent={accent(4)} />
        <StatCard label="Tagged Squads" value={stats.taggedSquads} sub={stats.totalSquads > 0 ? `${Math.round(stats.taggedSquads / stats.totalSquads * 100)}% of squads` : ''} accent={accent(5)} />
        {stats.topTag && <StatCard label="Top Tag" value={stats.topTag.name} sub={`${stats.topTag.squads} squad${stats.topTag.squads !== 1 ? 's' : ''}`} accent={tagChartColor(stats.topTag.name, isDark)} />}
      </div>

      <div className="charts-row">
        <div className="dashboard-panel" style={{ '--card-accent': accent(0) }}>
          <h2>Members per Squad</h2>
          {stats.membersBySquad.length === 0 ? (
            <p className="empty">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.membersBySquad} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#8888bb', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#8888bb', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e1e38' }} />
                <Bar dataKey="members" name="members" radius={[4, 4, 0, 0]}>
                  {stats.membersBySquad.map((_, i) => (
                    <Cell key={i} fill={PURPLE_SHADES[i % PURPLE_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="dashboard-panel" style={{ '--card-accent': accent(1) }}>
          <h2>Squad Status</h2>
          {stats.totalSquads === 0 ? (
            <p className="empty">No squads yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={squadStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#7c3aed" />
                  <Cell fill="#2a2a4a" />
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={val => <span style={{ color: '#8888bb', fontSize: 13 }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {stats.roleDistribution.length > 0 && (
          <div className="dashboard-panel" style={{ '--card-accent': accent(2) }}>
            <h2>Members by Role</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.roleDistribution} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#8888bb', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="role" tick={{ fill: '#8888bb', fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e1e38' }} />
                <Bar dataKey="count" name="members" radius={[0, 4, 4, 0]}>
                  {stats.roleDistribution.map((_, i) => (
                    <Cell key={i} fill={PURPLE_SHADES[i % PURPLE_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {stats.tagDistribution.length > 0 && (
          <div className="dashboard-panel" style={{ '--card-accent': accent(3) }}>
            <h2>Squads by Tag</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.tagDistribution} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#8888bb', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8888bb', fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e1e38' }} />
                <Bar dataKey="squads" name="squads" radius={[0, 4, 4, 0]}>
                  {stats.tagDistribution.map((entry, i) => (
                    <Cell key={i} fill={tagChartColor(entry.name, isDark)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="dashboard-row">
        <div className="dashboard-panel" style={{ '--card-accent': accent(4) }}>
          <h2>Top Squads by Size</h2>
          {stats.topSquads.length === 0 ? (
            <p className="empty">No squads yet.</p>
          ) : (
            <ul className="top-squads">
              {stats.topSquads.map((s, i) => (
                <li key={s.id} className="top-squad-item">
                  <span className="rank">#{i + 1}</span>
                  <Link to={`/squads/${s.id}`} className="top-squad-name">{s.name}</Link>
                  <div className="top-squad-bar-wrap">
                    <div
                      className="top-squad-bar"
                      style={{ width: `${stats.topSquads[0].member_count > 0 ? (s.member_count / stats.topSquads[0].member_count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="top-squad-count">{s.member_count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel" style={{ '--card-accent': accent(5) }}>
          <h2>Highlights</h2>
          <div className="highlights">
            {stats.largestSquad && (
              <div className="highlight-item">
                <span className="highlight-label">Largest squad</span>
                <span className="highlight-value">{stats.largestSquad.name}</span>
                <span className="highlight-sub">{stats.largestSquad.member_count} members</span>
              </div>
            )}
            {stats.newestSquad && (
              <div className="highlight-item">
                <span className="highlight-label">Newest squad</span>
                <span className="highlight-value">{stats.newestSquad.name}</span>
                <span className="highlight-sub">Created {new Date(stats.newestSquad.created_at).toLocaleDateString()}</span>
              </div>
            )}
            {!stats.largestSquad && !stats.newestSquad && (
              <p className="empty">Create some squads to see highlights.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
