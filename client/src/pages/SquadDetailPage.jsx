import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getToken } from '../context/AuthContext';
import './SquadDetailPage.css';

const PAGE_SIZE = 10;

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export default function SquadDetailPage() {
  const { id } = useParams();
  const [squad, setSquad] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/squads/${id}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSquad(data); setLoading(false); });
  }, [id]);

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

  async function removeMember(memberId) {
    await fetch(`/api/squads/${id}/members/${memberId}`, { method: 'DELETE', headers: authHeaders() });
    setSquad(prev => {
      const members = prev.members.filter(m => m.id !== memberId);
      // step back if current page is now empty
      const newTotal = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
      if (page > newTotal) setPage(newTotal);
      return { ...prev, members };
    });
  }

  const { paginated, totalPages, safePage } = useMemo(() => {
    if (!squad) return { paginated: [], totalPages: 1, safePage: 1 };
    const totalPages = Math.max(1, Math.ceil(squad.members.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = squad.members.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return { paginated, totalPages, safePage };
  }, [squad, page]);

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
        <h1>{squad.name}</h1>
        {squad.description && <p className="detail-desc">{squad.description}</p>}
        <span className="detail-meta">Created {new Date(squad.created_at).toLocaleDateString()}</span>
      </div>

      <section className="members-section">
        <h2>Members <span className="count">({squad.members.length})</span></h2>

        <form className="add-member-form" onSubmit={addMember}>
          <input
            placeholder="Member name"
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            required
          />
          <input
            placeholder="Role (optional)"
            value={memberRole}
            onChange={e => setMemberRole(e.target.value)}
          />
          <button type="submit" className="btn-primary">Add Member</button>
        </form>

        {squad.members.length === 0 ? (
          <p className="empty">No members yet. Add your first one above.</p>
        ) : (
          <>
            {totalPages > 1 && (
              <p className="members-meta">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, squad.members.length)} of {squad.members.length} members
              </p>
            )}

            <ul className="members-list">
              {paginated.map(member => (
                <li key={member.id} className="member-item">
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                  </div>
                  <button className="btn-danger-sm" onClick={() => removeMember(member.id)}>Remove</button>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                  ← Prev
                </button>
                <div className="page-numbers">
                  {getPageNumbers().map((p, i) =>
                    p === '...'
                      ? <span key={`e-${i}`} className="page-ellipsis">…</span>
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
      </section>
    </div>
  );
}
