import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import crypto from 'crypto';
import { sendGoalAlertEmail, sendPasswordResetEmail } from './src/services/emailService.ts';

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

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email) as any;
    
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      
      db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, resetToken, expiresAt);
      
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
      
      await sendPasswordResetEmail(email, user.name, resetLink);
    }
    
    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'Se o email existir, um link de recuperação foi enviado.' });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    
    try {
      db.prepare('BEGIN TRANSACTION').run();
      
      const resetRecord = db.prepare('SELECT user_id, expires_at FROM password_resets WHERE token = ?').get(token) as any;
      
      if (!resetRecord) {
        db.prepare('ROLLBACK').run();
        return res.status(400).json({ error: 'Token inválido ou expirado.' });
      }
      
      if (new Date(resetRecord.expires_at) < new Date()) {
        db.prepare('DELETE FROM password_resets WHERE token = ?').run(token);
        db.prepare('ROLLBACK').run();
        return res.status(400).json({ error: 'Token expirado.' });
      }
      
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, resetRecord.user_id);
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(resetRecord.user_id);
      
      db.prepare('COMMIT').run();
      res.json({ success: true, message: 'Senha atualizada com sucesso.' });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      res.status(500).json({ error: 'Erro ao redefinir a senha.' });
    }
  });

  // Google OAuth Routes
  app.get('/api/auth/google/url', (req, res) => {
    const redirectUri = `${process.env.APP_URL || `http://localhost:${PORT}`}/api/auth/google/callback`;
    
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL || `http://localhost:${PORT}`}/api/auth/google/callback`;
    
    try {
      // Exchange code for token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        throw new Error('Failed to get access token');
      }

      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      
      const userData = await userResponse.json();
      
      if (!userData.email) {
        throw new Error('Failed to get user email');
      }

      // Check if user exists or create
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(userData.email) as any;
      let userId;
      
      if (!user) {
        // Create new user with random password since they use Google
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const info = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
          userData.name || userData.email.split('@')[0],
          userData.email,
          randomPassword,
          'user'
        );
        userId = info.lastInsertRowid;
      } else {
        userId = user.id;
      }

      // Create session
      const sessionToken = crypto.randomUUID();
      sessions[sessionToken] = userId as number;

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${sessionToken}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação concluída. Esta janela deve fechar automaticamente.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google OAuth Error:', error);
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR' }, '*');
                window.close();
              }
            </script>
            <p>Erro na autenticação. Feche esta janela e tente novamente.</p>
          </body>
        </html>
      `);
    }
  });

  // Transaction Routes
  app.get('/api/transactions', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(userId);
    res.json(transactions);
  });

  app.post('/api/transactions', requireAuth, async (req, res) => {
    const userId = (req as any).userId;
    const { type, amount, description, date, category, payment_method, status } = req.body;
    const stmt = db.prepare('INSERT INTO transactions (user_id, type, amount, description, date, category, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(userId, type, amount, description, date, category, payment_method, status || 'completed');
    
    if (type === 'expense') {
      try {
        const currentMonthStr = new Date().toISOString().substring(0, 7);
        const goal = db.prepare('SELECT * FROM spending_goals WHERE user_id = ? AND category = ?').get(userId, category) as any;
        
        if (goal) {
          const spentResult = db.prepare(`
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE user_id = ? AND type = 'expense' AND category = ? AND date LIKE ?
          `).get(userId, category, `${currentMonthStr}%`) as any;
          
          const totalSpent = spentResult.total || 0;
          const percentage = (totalSpent / goal.amount) * 100;
          
          let alertType: 'warning' | 'exceeded' | null = null;
          if (percentage >= 100) {
            alertType = 'exceeded';
          } else if (percentage >= 80) {
            alertType = 'warning';
          }
          
          if (alertType) {
            const existingAlert = db.prepare(`
              SELECT * FROM goal_alerts 
              WHERE user_id = ? AND category = ? AND month = ? AND alert_type = ?
            `).get(userId, category, currentMonthStr, alertType);
            
            if (!existingAlert) {
              const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(userId) as any;
              if (user && user.email) {
                await sendGoalAlertEmail(user.email, user.name, category, totalSpent, goal.amount, alertType);
                db.prepare(`
                  INSERT INTO goal_alerts (user_id, category, month, alert_type) 
                  VALUES (?, ?, ?, ?)
                `).run(userId, category, currentMonthStr, alertType);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error checking goals for alerts:', e);
      }
    }

    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/transactions/:id', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const id = req.params.id;
    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true });
  });

  // Goals Routes
  app.get('/api/goals', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const goals = db.prepare('SELECT * FROM spending_goals WHERE user_id = ?').all(userId);
    res.json(goals);
  });

  app.post('/api/goals', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const { category, amount } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO spending_goals (user_id, category, amount) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, category) 
      DO UPDATE SET amount = excluded.amount
    `);
    stmt.run(userId, category, amount);
    res.json({ success: true });
  });

  app.delete('/api/goals/:category', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const category = req.params.category;
    db.prepare('DELETE FROM spending_goals WHERE user_id = ? AND category = ?').run(userId, category);
    res.json({ success: true });
  });

  // Stats Route
  app.get('/api/stats', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date ASC').all(userId) as any[];
    
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses: Record<string, number> = {};
    const currentMonthCategoryExpenses: Record<string, number> = {};
    
    const currentMonthStr = new Date().toISOString().substring(0, 7);

    // Calculate chart data based on transactions (cumulative balance over time)
    const chartData: any[] = [];
    let cumulativeBalance = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        cumulativeBalance += t.amount;
      }
      if (t.type === 'expense') {
        totalExpense += t.amount;
        cumulativeBalance -= t.amount;
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
        if (t.date.startsWith(currentMonthStr)) {
          currentMonthCategoryExpenses[t.category] = (currentMonthCategoryExpenses[t.category] || 0) + t.amount;
        }
      }

      // Add point to chart data for each transaction
      chartData.push({
        name: new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: cumulativeBalance,
        income: t.type === 'income' ? t.amount : 0,
        expense: t.type === 'expense' ? t.amount : 0,
        description: t.description
      });
    });

    // If no transactions, provide empty data
    if (chartData.length === 0) {
      chartData.push({ name: 'Hoje', value: 0, income: 0, expense: 0 });
    }

    // Calculate last 6 months chart data for reports
    const monthlyChartData = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      let monthIncome = 0;
      let monthExpense = 0;
      
      transactions.forEach(t => {
        if (t.date.startsWith(monthStr)) {
          if (t.type === 'income') monthIncome += t.amount;
          if (t.type === 'expense') monthExpense += t.amount;
        }
      });
      
      monthlyChartData.push({
        name: monthNames[d.getMonth()],
        value: monthIncome - monthExpense, // Net balance for the month
        income: monthIncome,
        expense: monthExpense
      });
    }

    res.json({
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      categoryExpenses,
      currentMonthCategoryExpenses,
      chartData,
      monthlyChartData
    });
  });

  // Admin Routes
  app.get('/api/admin/stats', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role != \'admin\'').get() as any;
    const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any;
    
    const allTransactions = db.prepare('SELECT * FROM transactions').all() as any[];
    let platformIncome = 0;
    let platformExpense = 0;
    allTransactions.forEach(t => {
      if (t.type === 'income') platformIncome += t.amount;
      if (t.type === 'expense') platformExpense += t.amount;
    });

    const users = db.prepare(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        COUNT(t.id) as transactionCount,
        SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) - SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as balance
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id
    `).all();

    res.json({
      totalUsers: totalUsers.count,
      totalTransactions: totalTransactions.count,
      platformBalance: platformIncome - platformExpense,
      users
    });
  });

  app.delete('/api/admin/users/:id', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const idToDelete = req.params.id;
    
    try {
      db.prepare('BEGIN TRANSACTION').run();
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(idToDelete);
      db.prepare('DELETE FROM users WHERE id = ? AND role != \'admin\'').run(idToDelete);
      db.prepare('COMMIT').run();
      res.json({ success: true });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Admin User Transactions Management
  app.get('/api/admin/users/:id/transactions', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const targetUserId = req.params.id;
    const targetUser = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(targetUserId);
    res.json({ user: targetUser, transactions });
  });

  app.post('/api/admin/users/:id/transactions', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const targetUserId = req.params.id;
    const { type, amount, description, date, category, payment_method, status } = req.body;
    const stmt = db.prepare('INSERT INTO transactions (user_id, type, amount, description, date, category, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(targetUserId, type, amount, description, date, category, payment_method, status || 'completed');
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/admin/transactions/:txId', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const txId = req.params.txId;
    const { type, amount, description, date, category, payment_method } = req.body;
    db.prepare('UPDATE transactions SET type = ?, amount = ?, description = ?, date = ?, category = ?, payment_method = ? WHERE id = ?')
      .run(type, amount, description, date, category, payment_method, txId);
    res.json({ success: true });
  });

  app.delete('/api/admin/transactions/:txId', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const txId = req.params.txId;
    db.prepare('DELETE FROM transactions WHERE id = ?').run(txId);
    res.json({ success: true });
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
