const express = require('express');
const cors = require('cors');
const path = require('path');
const squadsRouter = require('./routes/squads');
const authRouter = require('./routes/auth');
const statsRouter = require('./routes/stats');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/squads', authMiddleware, squadsRouter);
app.use('/api/stats', authMiddleware, statsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
