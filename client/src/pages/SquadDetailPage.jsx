import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getToken } from '../context/AuthContext';
import './SquadDetailPage.css';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export default function SquadDetailPage() {
  const { id } = useParams();
  const [squad, setSquad] = useState(null);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [loading, setLoading] = useState(true);

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
    setSquad(prev => ({ ...prev, members: prev.members.filter(m => m.id !== memberId) }));
  }

  if (loading) return <p className="loading">Loading...</p>;
  if (!squad) return <p className="loading">Squad not found. <Link to="/">Go back</Link></p>;

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">← All Squads</Link>

      <div className="detail-header">
        <h1>{squad.name}</h1>
        {squad.description && <p className="detail-desc">{squad.description}</p>}
        <span className="detail-meta">Created {new Date(squad.createdAt).toLocaleDateString()}</span>
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
          <ul className="members-list">
            {squad.members.map(member => (
              <li key={member.id} className="member-item">
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.role}</span>
                </div>
                <button className="btn-danger-sm" onClick={() => removeMember(member.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
