const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

let squads = [];

router.get('/', (req, res) => {
  res.json(squads);
});

router.get('/:id', (req, res) => {
  const squad = squads.find(s => s.id === req.params.id);
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  res.json(squad);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const squad = { id: uuidv4(), name, description: description || '', members: [], createdAt: new Date().toISOString() };
  squads.push(squad);
  res.status(201).json(squad);
});

router.put('/:id', (req, res) => {
  const index = squads.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Squad not found' });
  squads[index] = { ...squads[index], ...req.body, id: squads[index].id };
  res.json(squads[index]);
});

router.delete('/:id', (req, res) => {
  const index = squads.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Squad not found' });
  squads.splice(index, 1);
  res.status(204).send();
});

router.post('/:id/members', (req, res) => {
  const squad = squads.find(s => s.id === req.params.id);
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  const { name, role } = req.body;
  if (!name) return res.status(400).json({ error: 'Member name is required' });
  const member = { id: uuidv4(), name, role: role || 'Member' };
  squad.members.push(member);
  res.status(201).json(member);
});

router.delete('/:id/members/:memberId', (req, res) => {
  const squad = squads.find(s => s.id === req.params.id);
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  const index = squad.members.findIndex(m => m.id === req.params.memberId);
  if (index === -1) return res.status(404).json({ error: 'Member not found' });
  squad.members.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
