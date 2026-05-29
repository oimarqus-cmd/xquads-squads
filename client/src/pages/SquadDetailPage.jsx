import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getToken } from '../context/AuthContext';
import InlineEdit from '../components/InlineEdit';
import './SquadDetailPage.css';

const PAGE_SIZE = 10;

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
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

export default function SquadDetailPage() {
  const { id } = useParams();
  const [squad, setSquad] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/squads/${id}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSquad(data); setLoading(false); });
  }, [id]);

  useEffect(() => { setPage(1); }, [search]);

  async function addMember(e) {
    e.preventDefault();
    if (!memberName.trim()) return;
    const res = await fetch(`/api/squads/${id}/members`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: memberName, role: memberRole }),
    });
    const member = await res.json();
    setSquad(prev => ({ ...prev, members: [...prev.members, member] }));
    setMemberName('');
    setMemberRole('');
  }

  async function updateSquad(patch) {
    const res = await fetch(`/api/squads/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setSquad(prev => ({ ...prev, ...updated, members: prev.members }));
  }

  async function updateMember(memberId, patch) {
    const res = await fetch(`/api/squads/${id}/members/${memberId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setSquad(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, ...updated } : m),
    }));
  }

  async function removeMember(memberId) {
    await fetch(`/api/squads/${id}/members/${memberId}`, { method: 'DELETE', headers: authHeaders() });
    setSquad(prev => {
      const members = prev.members.filter(m => m.id !== memberId);
      const newTotal = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
      if (page > newTotal) setPage(newTotal);
      return { ...prev, members };
    });
  }

  const { filtered, paginated, totalPages, safePage } = useMemo(() => {
    if (!squad) return { filtered: [], paginated: [], totalPages: 1, safePage: 1 };
    let filtered = squad.members;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
      );
    }
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return { filtered, paginated, totalPages, safePage };
  }, [squad, search, page]);

  function getPageNumbers() {
    const pages = [];
    const delta = 1;
    let prev = null;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
        if (prev !== null && i - prev > 1) pages.push('...');
        pages.push(i);
        prev = i;
      }
    }
    return pages;
  }

  if (loading) return <p className="loading">Loading...</p>;
  if (!squad) return <p className="loading">Squad not found. <Link to="/squads">Go back</Link></p>;

  return (
    <div className="detail-page">
      <Link to="/squads" className="back-link">← All Squads</Link>

      <div className="detail-header">
        <InlineEdit value={squad.name} className="squad-title" onSave={val => updateSquad({ name: val })} />
        <InlineEdit value={squad.description} className="detail-desc" multiline placeholder="Add a description..." onSave={val => updateSquad({ description: val })} />
        <span className="detail-meta">Created {new Date(squad.created_at).toLocaleDateString()}</span>
      </div>

      <section className="members-section">
        <h2>Members <span className="count">({squad.members.length})</span></h2>

        <form className="add-member-form" onSubmit={addMember}>
          <input placeholder="Member name" value={memberName} onChange={e => setMemberName(e.target.value)} required />
          <input placeholder="Role (optional)" value={memberRole} onChange={e => setMemberRole(e.target.value)} />
          <button type="submit" className="btn-primary">Add Member</button>
        </form>

        {squad.members.length === 0 ? (
          <p className="empty">No members yet. Add your first one above.</p>
        ) : (
          <>
            <div className="member-search-wrap">
              <span className="search-icon">🔍</span>
              <input className="member-search" placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
            </div>

            {search && (
              <p className="members-meta">
                {filtered.length === 0
                  ? 'No members match your search.'
                  : `${filtered.length} of ${squad.members.length} member${squad.members.length !== 1 ? 's' : ''} match`}
              </p>
            )}

            {filtered.length === 0 ? null : (
              <>
                {totalPages > 1 && !search && (
                  <p className="members-meta">
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} members
                  </p>
                )}

                <ul className="members-list">
                  {paginated.map(member => (
                    <li key={member.id} className="member-item">
                      <div className="member-info">
                        {search ? (
                          <>
                            <span className="member-name"><Highlight text={member.name} query={search} /></span>
                            <span className="member-role"><Highlight text={member.role} query={search} /></span>
                          </>
                        ) : (
                          <>
                            <InlineEdit value={member.name} className="member-name" onSave={val => updateMember(member.id, { name: val })} />
                            <InlineEdit value={member.role} className="member-role" onSave={val => updateMember(member.id, { role: val })} />
                          </>
                        )}
                      </div>
                      <button className="btn-danger-sm" onClick={() => removeMember(member.id)}>Remove</button>
                    </li>
                  ))}
                </ul>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>← Prev</button>
                    <div className="page-numbers">
                      {getPageNumbers().map((p, i) =>
                        p === '...'
                          ? <span key={`e-${i}`} className="page-ellipsis">…</span>
                          : <button key={p} className={`page-num ${safePage === p ? 'page-num-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                      )}
                    </div>
                    <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
