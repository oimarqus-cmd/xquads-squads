const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

function squadWithDetails(squad) {
  if (!squad) return null;
  const members = db.prepare('SELECT * FROM members WHERE squad_id = ?').all(squad.id);
  const tags = db.prepare('SELECT * FROM tags WHERE squad_id = ? ORDER BY name ASC').all(squad.id);
  return { ...squad, members, tags };
}

router.get('/', (req, res) => {
  const squads = db.prepare('SELECT * FROM squads ORDER BY created_at DESC').all();
  res.json(squads.map(squadWithDetails));
});

router.get('/:id', (req, res) => {
  const squad = db.prepare('SELECT * FROM squads WHERE id = ?').get(req.params.id);
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  res.json(squadWithDetails(squad));
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const squad = { id: uuidv4(), name, description: description || '', created_at: new Date().toISOString() };
  db.prepare('INSERT INTO squads (id, name, description, created_at) VALUES (?, ?, ?, ?)').run(squad.id, squad.name, squad.description, squad.created_at);
  res.status(201).json({ ...squad, members: [], tags: [] });
});

router.put('/:id', (req, res) => {
  const squad = db.prepare('SELECT * FROM squads WHERE id = ?').get(req.params.id);
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  const name = req.body.name ?? squad.name;
  const description = req.body.description ?? squad.description;
  db.prepare('UPDATE squads SET name = ?, description = ? WHERE id = ?').run(name, description, req.params.id);
  res.json(squadWithDetails({ ...squad, name, description }));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM squads WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Squad not found' });
  res.status(204).send();
});

// members
router.post('/:id/members', (req, res) => {
  const squad = db.prepare('SELECT id FROM squads WHERE id = ?').get(req.params.id);
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  const { name, role } = req.body;
  if (!name) return res.status(400).json({ error: 'Member name is required' });
  const member = { id: uuidv4(), squad_id: req.params.id, name, role: role || 'Member' };
  db.prepare('INSERT INTO members (id, squad_id, name, role) VALUES (?, ?, ?, ?)').run(member.id, member.squad_id, member.name, member.role);
  res.status(201).json({ id: member.id, name: member.name, role: member.role });
});

router.put('/:id/members/:memberId', (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ? AND squad_id = ?').get(req.params.memberId, req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  const name = req.body.name?.trim() || member.name;
  const role = req.body.role?.trim() || member.role;
  db.prepare('UPDATE members SET name = ?, role = ? WHERE id = ?').run(name, role, req.params.memberId);
  res.json({ id: member.id, name, role });
});

router.delete('/:id/members/:memberId', (req, res) => {
  const info = db.prepare('DELETE FROM members WHERE id = ? AND squad_id = ?').run(req.params.memberId, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Member not found' });
  res.status(204).send();
});

// tags
router.post('/:id/tags', (req, res) => {
  const squad = db.prepare('SELECT id FROM squads WHERE id = ?').get(req.params.id);
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ error: 'Tag name is required' });
  const exists = db.prepare('SELECT id FROM tags WHERE squad_id = ? AND LOWER(name) = LOWER(?)').get(req.params.id, name);
  if (exists) return res.status(409).json({ error: 'Tag already exists' });
  const tag = { id: uuidv4(), squad_id: req.params.id, name };
  db.prepare('INSERT INTO tags (id, squad_id, name) VALUES (?, ?, ?)').run(tag.id, tag.squad_id, tag.name);
  res.status(201).json({ id: tag.id, name: tag.name });
});

router.delete('/:id/tags/:tagId', (req, res) => {
  const info = db.prepare('DELETE FROM tags WHERE id = ? AND squad_id = ?').run(req.params.tagId, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Tag not found' });
  res.status(204).send();
});

module.exports = router;
