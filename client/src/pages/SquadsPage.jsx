import { useState, useEffect } from 'react';
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

      {loading ? (
        <p className="loading">Loading squads...</p>
      ) : squads.length === 0 ? (
        <p className="empty">No squads yet. Create your first one above.</p>
      ) : (
        <div className="squad-grid">
          {squads.map(squad => (
            <div key={squad.id} className="squad-card">
              <div className="squad-card-body">
                <Link to={`/squads/${squad.id}`} className="squad-name">{squad.name}</Link>
                {squad.description && <p className="squad-desc">{squad.description}</p>}
                <span className="member-count">{squad.members.length} member{squad.members.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="squad-card-actions">
                <Link to={`/squads/${squad.id}`} className="btn-secondary">View</Link>
                <button className="btn-danger" onClick={() => deleteSquad(squad.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
