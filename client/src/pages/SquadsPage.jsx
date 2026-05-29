import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getToken, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InlineEdit from '../components/InlineEdit';
import TagChip from '../components/TagChip';
import { tagChartColor } from '../utils/tagColor';
import './SquadsPage.css';

const PAGE_SIZE_OPTIONS = [6, 12, 24];

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export default function SquadsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { logout } = useAuth();
  const location = useLocation();
  const [squads, setSquads] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    fetch('/api/squads', { headers: authHeaders() })
      .then(r => { if (r.status === 401) { logout(); return null; } return r.json(); })
      .then(data => { if (Array.isArray(data)) { setSquads(data); setLoading(false); } });
  }, [location.key]);

  useEffect(() => { setPage(1); }, [search, filter, sort, pageSize, activeTag]);

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

  async function updateSquad(id, patch) {
    const res = await fetch(`/api/squads/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setSquads(prev => prev.map(s => s.id === id ? { ...s, ...updated, members: s.members, tags: s.tags } : s));
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
    if (activeTag) result = result.filter(s => s.tags?.some(t => t.name === activeTag));
    return [...result].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'most') return b.members.length - a.members.length;
      if (sort === 'az') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [squads, search, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const hasActiveFilters = search || filter !== 'all' || sort !== 'newest' || activeTag;

  const allTags = useMemo(() => {
    const seen = new Set();
    squads.forEach(s => s.tags?.forEach(t => seen.add(t.name)));
    return [...seen].sort();
  }, [squads]);

  function getPageNumbers() {
    const pages = [];
    const delta = 1;
    const left = safePage - delta;
    const right = safePage + delta;
    let prev = null;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        if (prev !== null && i - prev > 1) pages.push('...');
        pages.push(i);
        prev = i;
      }
    }
    return pages;
  }

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
            {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter</label>
            <div className="filter-pills">
              {[['all', 'All'], ['active', 'Has members'], ['empty', 'Empty']].map(([val, label]) => (
                <button key={val} className={`pill ${filter === val ? 'pill-active' : ''}`} onClick={() => setFilter(val)}>
                  {label}
                </button>
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

          {allTags.length > 0 && (
            <div className="filter-group">
              <label className="filter-label">Tag</label>
              <div className="filter-pills">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`pill ${activeTag === tag ? 'pill-active' : ''}`}
                    onClick={() => setActiveTag(t => t === tag ? '' : tag)}
                  >{tag}</button>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button className="clear-filters" onClick={() => { setSearch(''); setFilter('all'); setSort('newest'); setActiveTag(''); }}>
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
          <div className="list-meta">
            <p className="results-count">
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} squad{filtered.length !== 1 ? 's' : ''}
              {hasActiveFilters && squads.length !== filtered.length && ` (filtered from ${squads.length})`}
            </p>
            <div className="filter-group">
              <label className="filter-label">Per page</label>
              <div className="filter-pills">
                {PAGE_SIZE_OPTIONS.map(n => (
                  <button key={n} className={`pill ${pageSize === n ? 'pill-active' : ''}`} onClick={() => setPageSize(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="squad-grid">
            {paginated.map(squad => {
              const accentColor = squad.tags?.length > 0 ? tagChartColor(squad.tags[0].name, isDark) : null;
              return (
              <div key={squad.id} className="squad-card" style={accentColor ? { '--card-accent': accentColor } : {}}>
                <div className="squad-card-body">
                  {search ? (
                    <Link to={`/squads/${squad.id}`} className="squad-name">
                      <Highlight text={squad.name} query={search} />
                    </Link>
                  ) : (
                    <InlineEdit
                      value={squad.name}
                      className="squad-name"
                      onSave={val => updateSquad(squad.id, { name: val })}
                    />
                  )}
                  {search ? (
                    squad.description && (
                      <p className="squad-desc"><Highlight text={squad.description} query={search} /></p>
                    )
                  ) : (
                    <InlineEdit
                      value={squad.description}
                      className="squad-desc"
                      multiline
                      placeholder="Add a description..."
                      onSave={val => updateSquad(squad.id, { description: val })}
                    />
                  )}
                  {squad.tags?.length > 0 && (
                    <div className="tag-list">
                      {squad.tags.map(tag => (
                        <TagChip key={tag.id} name={tag.name} />
                      ))}
                    </div>
                  )}
                  <span className="member-count">{squad.members.length} member{squad.members.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="squad-card-actions">
                  <Link to={`/squads/${squad.id}`} className="btn-secondary">View</Link>
                  <button className="btn-danger" onClick={() => deleteSquad(squad.id)}>Delete</button>
                </div>
              </div>
            );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                ← Prev
              </button>
              <div className="page-numbers">
                {getPageNumbers().map((p, i) =>
                  p === '...'
                    ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
                    : <button
                        key={p}
                        className={`page-num ${safePage === p ? 'page-num-active' : ''}`}
                        onClick={() => setPage(p)}
                      >{p}</button>
                )}
              </div>
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                Next →
              </button>
            </div>
          )}
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
