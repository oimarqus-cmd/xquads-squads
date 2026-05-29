const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const totalSquads = db.prepare('SELECT COUNT(*) as count FROM squads').get().count;
  const totalMembers = db.prepare('SELECT COUNT(*) as count FROM members').get().count;
  const emptySquads = db.prepare('SELECT COUNT(*) as count FROM squads WHERE id NOT IN (SELECT DISTINCT squad_id FROM members)').get().count;
  const avgMembers = totalSquads > 0 ? (totalMembers / totalSquads).toFixed(1) : 0;

  const largestSquad = db.prepare(`
    SELECT s.name, COUNT(m.id) as member_count
    FROM squads s LEFT JOIN members m ON s.id = m.squad_id
    GROUP BY s.id ORDER BY member_count DESC LIMIT 1
  `).get();

  const newestSquad = db.prepare('SELECT name, created_at FROM squads ORDER BY created_at DESC LIMIT 1').get();

  const topSquads = db.prepare(`
    SELECT s.name, s.id, COUNT(m.id) as member_count
    FROM squads s LEFT JOIN members m ON s.id = m.squad_id
    GROUP BY s.id ORDER BY member_count DESC LIMIT 5
  `).all();

  const membersBySquad = db.prepare(`
    SELECT s.name, COUNT(m.id) as members
    FROM squads s LEFT JOIN members m ON s.id = m.squad_id
    GROUP BY s.id ORDER BY members DESC LIMIT 8
  `).all();

  const roleDistribution = db.prepare(`
    SELECT role, COUNT(*) as count FROM members GROUP BY role ORDER BY count DESC LIMIT 6
  `).all();

  const totalTags = db.prepare('SELECT COUNT(DISTINCT LOWER(name)) as count FROM tags').get().count;
  const taggedSquads = db.prepare('SELECT COUNT(DISTINCT squad_id) as count FROM tags').get().count;
  const topTag = db.prepare(`
    SELECT name, COUNT(DISTINCT squad_id) as squads
    FROM tags GROUP BY LOWER(name) ORDER BY squads DESC LIMIT 1
  `).get();

  const tagDistribution = db.prepare(`
    SELECT t.name, COUNT(DISTINCT t.squad_id) as squads
    FROM tags t
    GROUP BY LOWER(t.name)
    ORDER BY squads DESC, t.name ASC
    LIMIT 12
  `).all();

  res.json({
    totalSquads,
    totalMembers,
    emptySquads,
    avgMembers: Number(avgMembers),
    largestSquad: largestSquad || null,
    newestSquad: newestSquad || null,
    topSquads,
    membersBySquad,
    roleDistribution,
    totalTags,
    taggedSquads,
    topTag: topTag || null,
    tagDistribution,
  });
});

module.exports = router;
