import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import crypto from 'crypto';
import { sendGoalAlertEmail, sendPasswordResetEmail } from './src/services/emailService.ts';
import { hashPassword, isScryptPasswordHash, verifyLegacyPassword, verifyPassword } from './src/security/password.ts';
import { calculateFinancialStats, type FinancialTransaction } from './src/services/financialStats.ts';
import { validateTransactionInput } from './src/services/transactionValidation.ts';
import { calculateSavingsGoalPlan, validateSavingsGoalInput } from './src/services/savingsGoalCalculations.ts';
import { isValidCategory } from './src/data/categories.ts';
import { isValidPassword } from './src/utils/passwordPolicy.ts';
import { monthKeyInTimeZone } from './src/utils/financialDates.ts';

interface Session {
  userId: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const sessions = new Map<string, Session>();

function createSession(userId: number): string {
  const token = crypto.randomUUID();
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function revokeSessionsForUser(userId: number): void {
  for (const [token, session] of sessions) {
    if (session.userId === userId) sessions.delete(token);
  }
}

function serializeSavingsGoal(row: any) {
  const values = {
    targetAmountCents: Number(row.target_amount_cents),
    amountSavedCents: Number(row.amount_saved_cents),
    targetDate: row.target_date || null,
    monthlyContributionCents: row.monthly_contribution_cents == null
      ? null
      : Number(row.monthly_contribution_cents),
  };
  return {
    id: Number(row.id),
    title: row.title,
    reason: row.reason,
    targetAmount: values.targetAmountCents / 100,
    amountSaved: values.amountSavedCents / 100,
    targetDate: values.targetDate,
    monthlyContribution: values.monthlyContributionCents == null ? null : values.monthlyContributionCents / 100,
    ...calculateSavingsGoalPlan(values, new Date(), process.env.APP_TIME_ZONE || 'America/Sao_Paulo'),
  };
}

function createRateLimiter(maxRequests: number, windowMs: number) {
  const clients = new Map<string, { count: number; resetAt: number }>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = `${req.ip || 'unknown'}:${req.path}`;
    let entry = clients.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }
    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
    }
    entry.count += 1;
    if (clients.size > 10_000) {
      for (const [clientKey, client] of clients) {
        if (client.resetAt <= now) clients.delete(clientKey);
      }
    }
    next();
  };
}

function asyncHandler(
  handler: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>,
): express.RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

async function migrateLegacyPasswords(): Promise<void> {
  const legacyUsers = db.prepare('SELECT id, password FROM users').all() as Array<{ id: number; password: string }>;
  const updatePassword = db.prepare('UPDATE users SET password = ? WHERE id = ?');
  for (const user of legacyUsers) {
    if (!isScryptPasswordHash(user.password)) {
      updatePassword.run(await hashPassword(String(user.password)), user.id);
    }
  }
}

async function startServer() {
  await migrateLegacyPasswords();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20kb' }));

  // Middleware to check authenticated, unexpired in-memory sessions.
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Não autenticado.' });
    const session = sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) sessions.delete(token);
      return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
    }
    (req as any).userId = session.userId;
    next();
  };

  const loginRateLimit = createRateLimiter(8, 15 * 60 * 1000);
  const registrationRateLimit = createRateLimiter(5, 60 * 60 * 1000);
  const recoveryRateLimit = createRateLimiter(3, 60 * 60 * 1000);
  const resetRateLimit = createRateLimiter(8, 15 * 60 * 1000);

    // Auth Routes
  app.post('/api/auth/register', registrationRateLimit, async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;

    if (name.length < 3 || name.length > 80) {
      return res.status(400).json({ error: 'O nome deve ter entre 3 e 80 caracteres.' });
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'A senha deve ter entre 8 e 128 caracteres.' });
    }

    try {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
      if (existing) return res.status(409).json({ error: 'Não foi possível criar a conta com esse e-mail.' });

      const passwordHash = await hashPassword(password);
      const info = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
        .run(name, email, passwordHash);
      const userId = Number(info.lastInsertRowid);
      const token = createSession(userId);
      return res.status(201).json({ token, user: { id: userId, name, email, role: 'user' } });
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Não foi possível criar a conta com esse e-mail.' });
      }
      console.error('Erro ao criar conta.');
      return res.status(500).json({ error: 'Não foi possível concluir o cadastro.' });
    }
  });

  app.post('/api/auth/login', loginRateLimit, asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (!email || typeof password !== 'string' || password.length > 128) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email) as any;
    let passwordMatches = false;
    if (user) {
      if (isScryptPasswordHash(user.password)) {
        passwordMatches = await verifyPassword(password, user.password);
      } else if (verifyLegacyPassword(password, String(user.password))) {
        // Fallback para uma conta antiga caso uma migração não tenha sido concluída.
        const passwordHash = await hashPassword(password);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(passwordHash, user.id);
        passwordMatches = true;
      }
    }

    if (!user || !passwordMatches) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    const token = createSession(Number(user.id));
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }));

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(401).json({ error: 'Conta não encontrada.' });
    return res.json({ user });
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) sessions.delete(token);
    return res.json({ success: true });
  });

  app.post('/api/auth/forgot-password', recoveryRateLimit, asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const user = db.prepare('SELECT id, name FROM users WHERE email = ? COLLATE NOCASE').get(email) as any;
      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken, 'utf8').digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
        db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)')
          .run(user.id, tokenHash, expiresAt);
        const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
        const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, user.name, resetLink);
      }
    }
    // Resposta igual para não revelar se o endereço está cadastrado.
    return res.json({ success: true, message: 'Se o e-mail existir, um link de recuperação foi enviado.' });
  }));

  app.post('/api/auth/reset-password', resetRateLimit, asyncHandler(async (req, res) => {
    const token = req.body?.token;
    const newPassword = req.body?.newPassword;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: 'A senha deve ter entre 8 e 128 caracteres.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token, 'utf8').digest('hex');
    const findReset = () => db.prepare(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ? OR token = ? LIMIT 1',
    ).get(tokenHash, token) as any;
    const currentRecord = findReset();
    if (!currentRecord || Date.parse(currentRecord.expires_at) <= Date.now()) {
      if (currentRecord) db.prepare('DELETE FROM password_resets WHERE token = ? OR token = ?').run(tokenHash, token);
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }

    const passwordHash = await hashPassword(newPassword);
    const updatePassword = db.transaction(() => {
      const resetRecord = findReset();
      if (!resetRecord || Date.parse(resetRecord.expires_at) <= Date.now()) return null;
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(passwordHash, resetRecord.user_id);
      db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(resetRecord.user_id);
      return Number(resetRecord.user_id);
    });
    const userId = updatePassword();
    if (!userId) return res.status(400).json({ error: 'Token inválido ou expirado.' });
    revokeSessionsForUser(userId);
    return res.json({ success: true, message: 'Senha atualizada com sucesso.' });
  }));

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
      
      if (typeof userData.email !== 'string' || userData.verified_email !== true) {
        throw new Error('Google account email is missing or not verified');
      }

      // Check if user exists or create
      let user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
        .get(userData.email.trim().toLowerCase()) as any;
      let userId;
      
      if (!user) {
        // Create new user with random password since they use Google
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = await hashPassword(randomPassword);
        const info = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
          String(userData.name || userData.email.split('@')[0]).slice(0, 80),
          String(userData.email).trim().toLowerCase(),
          passwordHash,
          'user'
        );
        userId = info.lastInsertRowid;
      } else {
        userId = user.id;
      }

      // Create session
      const sessionToken = createSession(Number(userId));
      const targetOrigin = JSON.stringify(new URL(process.env.APP_URL || `http://localhost:${PORT}`).origin);

      // Restrict postMessage to the configured application origin.
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${sessionToken}' }, ${targetOrigin});
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
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC').all(userId);
    return res.json(transactions);
  });

  app.post('/api/transactions', requireAuth, asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const validation = validateTransactionInput(req.body);
    if (validation.ok === false) return res.status(400).json({ error: validation.error });
    const { type, amount, description, date, category, payment_method, status } = validation.value;
    const info = db.prepare(
      'INSERT INTO transactions (user_id, type, amount, description, date, category, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(userId, type, amount, description, date, category, payment_method, status);

    if (type === 'expense') {
      try {
        const currentMonthKey = monthKeyInTimeZone(new Date(), process.env.APP_TIME_ZONE || 'America/Sao_Paulo');
        const goal = db.prepare('SELECT * FROM spending_goals WHERE user_id = ? AND category = ?')
          .get(userId, category) as any;
        if (goal) {
          const spentResult = db.prepare(`
            SELECT SUM(amount) as total
            FROM transactions
            WHERE user_id = ? AND type = 'expense' AND category = ? AND status = 'completed' AND date LIKE ?
          `).get(userId, category, `${currentMonthKey}%`) as any;
          const totalSpent = Number(spentResult?.total || 0);
          const percentage = goal.amount > 0 ? (totalSpent / goal.amount) * 100 : 0;
          const alertType = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : null;
          if (alertType) {
            const existingAlert = db.prepare(
              'SELECT id FROM goal_alerts WHERE user_id = ? AND category = ? AND month = ? AND alert_type = ?',
            ).get(userId, category, currentMonthKey, alertType);
            if (!existingAlert) {
              const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(userId) as any;
              if (user?.email) {
                const emailSent = await sendGoalAlertEmail(user.email, user.name, category, totalSpent, goal.amount, alertType);
                if (emailSent) {
                  db.prepare(
                    'INSERT INTO goal_alerts (user_id, category, month, alert_type) VALUES (?, ?, ?, ?)',
                  ).run(userId, category, currentMonthKey, alertType);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Falha ao verificar alertas de limites de gasto.');
      }
    }

    return res.status(201).json({ id: Number(info.lastInsertRowid) });
  }));

  app.delete('/api/transactions/:id', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
    const result = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Transação não encontrada.' });
    return res.json({ success: true });
  });

  // Spending limits (not savings goals)
  app.get('/api/goals', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    return res.json(db.prepare('SELECT * FROM spending_goals WHERE user_id = ? ORDER BY category').all(userId));
  });

  app.post('/api/goals', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const category = req.body?.category;
    const amount = req.body?.amount;
    if (!isValidCategory('expense', category)) return res.status(400).json({ error: 'Categoria de despesa inválida.' });
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
      return res.status(400).json({ error: 'O limite deve ser um valor positivo válido.' });
    }
    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
      return res.status(400).json({ error: 'O limite deve ter no máximo duas casas decimais.' });
    }
    db.prepare(`
      INSERT INTO spending_goals (user_id, category, amount)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, category) DO UPDATE SET amount = excluded.amount
    `).run(userId, category, amount);
    return res.json({ success: true });
  });

  app.delete('/api/goals/:category', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const category = req.params.category;
    if (!isValidCategory('expense', category)) return res.status(400).json({ error: 'Categoria de despesa inválida.' });
    db.prepare('DELETE FROM spending_goals WHERE user_id = ? AND category = ?').run(userId, category);
    return res.json({ success: true });
  });

  // Personal savings goals are distinct from monthly spending limits.
  app.get('/api/savings-goals', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const rows = db.prepare('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(userId) as any[];
    return res.json(rows.map(serializeSavingsGoal));
  });

  app.post('/api/savings-goals', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const validation = validateSavingsGoalInput(req.body, new Date(), process.env.APP_TIME_ZONE || 'America/Sao_Paulo');
    if (validation.ok === false) return res.status(400).json({ error: validation.error });
    const goal = validation.value;
    const info = db.prepare(`
      INSERT INTO savings_goals (
        user_id, title, reason, target_amount_cents, amount_saved_cents, target_date, monthly_contribution_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      goal.title,
      goal.reason,
      goal.targetAmountCents,
      goal.amountSavedCents,
      goal.targetDate,
      goal.monthlyContributionCents,
    );
    const created = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?')
      .get(Number(info.lastInsertRowid), userId) as any;
    return res.status(201).json(serializeSavingsGoal(created));
  });

  app.put('/api/savings-goals/:id', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
    const validation = validateSavingsGoalInput(req.body, new Date(), process.env.APP_TIME_ZONE || 'America/Sao_Paulo');
    if (validation.ok === false) return res.status(400).json({ error: validation.error });
    const goal = validation.value;
    const result = db.prepare(`
      UPDATE savings_goals
      SET title = ?, reason = ?, target_amount_cents = ?, amount_saved_cents = ?, target_date = ?,
          monthly_contribution_cents = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      goal.title,
      goal.reason,
      goal.targetAmountCents,
      goal.amountSavedCents,
      goal.targetDate,
      goal.monthlyContributionCents,
      id,
      userId,
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Objetivo não encontrado.' });
    const updated = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?').get(id, userId) as any;
    return res.json(serializeSavingsGoal(updated));
  });

  app.delete('/api/savings-goals/:id', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
    const result = db.prepare('DELETE FROM savings_goals WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Objetivo não encontrado.' });
    return res.json({ success: true });
  });

  // Financial stats use completed transactions and a fixed six-calendar-month window.
  app.get('/api/stats', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const transactions = db.prepare(
      "SELECT id, type, amount, description, date, category, status FROM transactions WHERE user_id = ? AND status = 'completed' ORDER BY date ASC, id ASC",
    ).all(userId) as FinancialTransaction[];
    return res.json(calculateFinancialStats(
      transactions,
      new Date(),
      process.env.APP_TIME_ZONE || 'America/Sao_Paulo',
    ));
  });

// User Profile Route
  app.post('/api/users/profile', requireAuth, (req, res) => {
    try {
      const userId = (req as any).userId;
      const { profile } = req.body;
      db.prepare('UPDATE users SET investor_profile = ? WHERE id = ?').run(profile, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar perfil' });
    }
  });


  // Admin Routes
  app.get('/api/admin/stats', requireAuth, (req, res) => {
    const userId = (req as any).userId;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role != \'admin\'').get() as any;
    const totalTransactions = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'").get() as any;
    
    const allTransactions = db.prepare("SELECT * FROM transactions WHERE status = 'completed'").all() as any[];
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
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as transactionCount,
        SUM(CASE WHEN t.status = 'completed' AND t.type = 'income' THEN t.amount ELSE 0 END) - SUM(CASE WHEN t.status = 'completed' AND t.type = 'expense' THEN t.amount ELSE 0 END) as balance
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

    const idToDelete = Number(req.params.id);
    if (!Number.isSafeInteger(idToDelete) || idToDelete <= 0) {
      return res.status(400).json({ error: 'Identificador inválido.' });
    }

    try {
      const deleteUser = db.transaction((targetUserId: number) => {
        db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(targetUserId);
        db.prepare('DELETE FROM goal_alerts WHERE user_id = ?').run(targetUserId);
        db.prepare('DELETE FROM spending_goals WHERE user_id = ?').run(targetUserId);
        db.prepare('DELETE FROM savings_goals WHERE user_id = ?').run(targetUserId);
        db.prepare('DELETE FROM transactions WHERE user_id = ?').run(targetUserId);
        return db.prepare("DELETE FROM users WHERE id = ? AND role != 'admin'").run(targetUserId).changes > 0;
      });
      if (!deleteUser(idToDelete)) return res.status(404).json({ error: 'Usuário não encontrado.' });
      revokeSessionsForUser(idToDelete);
      return res.json({ success: true });
    } catch (error) {
      console.error('Falha ao excluir usuário e dados relacionados.');
      return res.status(500).json({ error: 'Não foi possível excluir o usuário.' });
    }
  });

  // Admin User Transactions Management
  app.get('/api/admin/users/:id/transactions', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const targetUserId = Number(req.params.id);
    if (!Number.isSafeInteger(targetUserId) || targetUserId <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
    const targetUser = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC').all(targetUserId);
    res.json({ user: targetUser, transactions });
  });

  app.post('/api/admin/users/:id/transactions', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const targetUserId = Number(req.params.id);
    if (!Number.isSafeInteger(targetUserId) || targetUserId <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
    if (!db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId)) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const validation = validateTransactionInput(req.body);
    if (validation.ok === false) return res.status(400).json({ error: validation.error });
    const { type, amount, description, date, category, payment_method, status } = validation.value;
    const info = db.prepare('INSERT INTO transactions (user_id, type, amount, description, date, category, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(targetUserId, type, amount, description, date, category, payment_method, status);
    return res.status(201).json({ id: Number(info.lastInsertRowid) });
  });

  app.put('/api/admin/transactions/:txId', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const txId = Number(req.params.txId);
    if (!Number.isSafeInteger(txId) || txId <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
    const validation = validateTransactionInput(req.body);
    if (validation.ok === false) return res.status(400).json({ error: validation.error });
    const { type, amount, description, date, category, payment_method } = validation.value;
    const result = db.prepare('UPDATE transactions SET type = ?, amount = ?, description = ?, date = ?, category = ?, payment_method = ? WHERE id = ?')
      .run(type, amount, description, date, category, payment_method, txId);
    if (result.changes === 0) return res.status(404).json({ error: 'Transação não encontrada.' });
    return res.json({ success: true });
  });

  app.delete('/api/admin/transactions/:txId', requireAuth, (req, res) => {
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get((req as any).userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const txId = Number(req.params.txId);
    if (!Number.isSafeInteger(txId) || txId <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
    const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(txId);
    if (result.changes === 0) return res.status(404).json({ error: 'Transação não encontrada.' });
    return res.json({ success: true });
  });

  app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Falha interna ao processar uma requisição.');
    if (res.headersSent) return next(error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
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

startServer().catch((error) => {
  console.error('Falha ao inicializar o servidor:', error instanceof Error ? error.message : 'erro desconhecido');
  process.exitCode = 1;
});
