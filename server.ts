import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import crypto from 'crypto';

// Simple session management for prototype (in-memory)
const sessions: Record<string, number> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to check auth
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !sessions[token]) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    (req as any).userId = sessions[token];
    next();
  };

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
      const info = stmt.run(name, email, password); // In real app, hash password!
      const token = crypto.randomUUID();
      sessions[token] = info.lastInsertRowid as number;
      res.json({ token, user: { id: info.lastInsertRowid, name, email } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Database error' });
      }
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
    if (user) {
      const token = crypto.randomUUID();
      sessions[token] = user.id;
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
    res.json({ user });
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) delete sessions[token];
    res.json({ success: true });
  });

  // Transaction Routes
  app.get('/api/transactions', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(userId);
    res.json(transactions);
  });

  app.post('/api/transactions', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const { type, amount, description, date, category, payment_method, status } = req.body;
    const stmt = db.prepare('INSERT INTO transactions (user_id, type, amount, description, date, category, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(userId, type, amount, description, date, category, payment_method, status || 'completed');
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/transactions/:id', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const id = req.params.id;
    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true });
  });

  // Stats Route (Now reads from Python-processed table)
  app.get('/api/stats', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    
    // Try to get results processed by Python
    const analytics = db.prepare('SELECT * FROM analytics_results WHERE user_id = ?').get(userId) as any;
    
    if (analytics) {
      const data = JSON.parse(analytics.data);
      res.json({
        ...data,
        processedBy: 'Python Script',
        lastUpdate: analytics.updated_at
      });
    } else {
      // Fallback if Python hasn't run yet
      res.json({
        balance: 0,
        totalIncome: 0,
        totalExpense: 0,
        categoryExpenses: {},
        chartData: [],
        message: 'Aguardando processamento do script Python...',
        processedBy: 'None'
      });
    }
  });

  // Admin Routes
  app.get('/api/admin/stats', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role != "admin"').get() as any;
    const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any;
    
    const allTransactions = db.prepare('SELECT * FROM transactions').all() as any[];
    let platformIncome = 0;
    let platformExpense = 0;
    allTransactions.forEach(t => {
      if (t.type === 'income') platformIncome += t.amount;
      if (t.type === 'expense') platformExpense += t.amount;
    });

    const users = db.prepare('SELECT id, name, email, role FROM users WHERE role != "admin"').all();

    res.json({
      totalUsers: totalUsers.count,
      totalTransactions: totalTransactions.count,
      platformBalance: platformIncome - platformExpense,
      users
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
