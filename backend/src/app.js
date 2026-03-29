const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const threadsRoutes = require('./routes/threads.routes');
const messagesRoutes = require('./routes/messages.routes');
const profileUpdatesRoutes = require('./routes/profile-updates.routes');
const uploadsRoutes = require('./routes/uploads.routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'src', 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/profile-updates', profileUpdatesRoutes);
app.use('/api/uploads', uploadsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

module.exports = app;
