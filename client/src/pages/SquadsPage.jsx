import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../context/AuthContext';
import './SquadsPage.css';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export default function SquadsPage() {
  const [squads, setSquads] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetch('/api/squads', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setSquads(data); setLoading(false); });
  }, []);

  async function createSquad(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch('/api/squads', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, description }),
    });
    const squad = await res.json();
    setSquads(prev => [...prev, squad]);
    setName('');
    setDescription('');
  }

  async function deleteSquad(id) {
    await fetch(`/api/squads/${id}`, { method: 'DELETE', headers: authHeaders() });
    setSquads(prev => prev.filter(s => s.id !== id));
  }

  const filtered = useMemo(() => {
    let result = squads;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }

    if (filter === 'active') result = result.filter(s => s.members.length > 0);
    if (filter === 'empty') result = result.filter(s => s.members.length === 0);

    result = [...result].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'most') return b.members.length - a.members.length;
      if (sort === 'az') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [squads, search, filter, sort]);

  const hasActiveFilters = search || filter !== 'all' || sort !== 'newest';

  return (
    <div className="squads-page">
      <div className="page-header">
        <h1>Squads</h1>
        <span className="count">{squads.length} squad{squads.length !== 1 ? 's' : ''}</span>
      </div>

      <form className="create-form" onSubmit={createSquad}>
        <h2>New Squad</h2>
        <input
          placeholder="Squad name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />
        <button type="submit" className="btn-primary">Create Squad</button>
      </form>

      {!loading && squads.length > 0 && (
        <div className="search-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search squads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter</label>
            <div className="filter-pills">
              {[['all', 'All'], ['active', 'Has members'], ['empty', 'Empty']].map(([val, label]) => (
                <button
                  key={val}
                  className={`pill ${filter === val ? 'pill-active' : ''}`}
                  onClick={() => setFilter(val)}
                >{label}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort</label>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most">Most members</option>
              <option value="az">A → Z</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters" onClick={() => { setSearch(''); setFilter('all'); setSort('newest'); }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="loading">Loading squads...</p>
      ) : squads.length === 0 ? (
        <p className="empty">No squads yet. Create your first one above.</p>
      ) : filtered.length === 0 ? (
        <p className="empty">No squads match your search.</p>
      ) : (
        <>
          {hasActiveFilters && (
            <p className="results-count">Showing {filtered.length} of {squads.length} squads</p>
          )}
          <div className="squad-grid">
            {filtered.map(squad => (
              <div key={squad.id} className="squad-card">
                <div className="squad-card-body">
                  <Link to={`/squads/${squad.id}`} className="squad-name">
                    {search ? <Highlight text={squad.name} query={search} /> : squad.name}
                  </Link>
                  {squad.description && (
                    <p className="squad-desc">
                      {search ? <Highlight text={squad.description} query={search} /> : squad.description}
                    </p>
                  )}
                  <span className="member-count">{squad.members.length} member{squad.members.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="squad-card-actions">
                  <Link to={`/squads/${squad.id}`} className="btn-secondary">View</Link>
                  <button className="btn-danger" onClick={() => deleteSquad(squad.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Highlight({ text, query }) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="highlight">{part}</mark>
      : part
  );
}
