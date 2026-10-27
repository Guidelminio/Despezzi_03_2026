import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const serverFile = fileURLToPath(new URL('../server.ts', import.meta.url));
const tsxCli = fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url));

type RunningApp = {
  baseUrl: string;
  databasePath: string;
  directory: string;
  child: ChildProcessWithoutNullStreams;
};

async function reservePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a local port.'));
        return;
      }
      const port = address.port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function startApp(pythonExecutable: string, extraEnv: Record<string, string> = {}): Promise<RunningApp> {
  const directory = await mkdtemp(path.join(tmpdir(), 'despezi-insights-'));
  const databasePath = path.join(directory, 'integration.sqlite');
  const port = await reservePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [tsxCli, serverFile], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_PATH: databasePath,
      PORT: String(port),
      APP_TIME_ZONE: 'America/Sao_Paulo',
      PYTHON_EXECUTABLE: pythonExecutable,
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
      HOST: '127.0.0.1',
      ...extraEnv,
    },
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  let settled = false;
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => finish(new Error(`Server startup timeout. ${output}`)), 15_000);
      timeout.unref();
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve();
      };
      child.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf8');
        if (output.includes(`Server running on 127.0.0.1:${port}`)) finish();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        output += chunk.toString('utf8');
      });
      child.once('error', (error) => finish(error));
      child.once('exit', (code) => finish(new Error(`Server exited before readiness (${code}). ${output}`)));
    });
  } catch (error) {
    child.kill();
    await rm(directory, { recursive: true, force: true });
    throw error;
  }

  return { baseUrl, databasePath, directory, child };
}

async function stopApp(app: RunningApp): Promise<void> {
  if (app.child.exitCode === null && app.child.signalCode === null) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        app.child.kill();
        resolve();
      }, 3_000);
      app.child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      app.child.kill('SIGTERM');
    });
  }
  await rm(app.directory, { recursive: true, force: true });
}

async function register(baseUrl: string, name: string, email: string): Promise<{ token: string; userId: number }> {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'Despezi-Teste-2026!' }),
  });
  const responseBody = await response.text();
  assert.equal(response.status, 201, responseBody);
  const body = JSON.parse(responseBody) as { token: string; user: { id: number } };
  return { token: body.token, userId: body.user.id };
}

async function postJson(baseUrl: string, route: string, body: unknown, token: string) {
  return fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

test('insights autenticados isolam usuários, filtram pendentes e não perdem schema legado', async () => {
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  const app = await startApp(pythonExecutable);
  try {
    const unauthorized = await fetch(`${app.baseUrl}/api/insights`);
    assert.equal(unauthorized.status, 401);
    assert.equal(unauthorized.headers.get('cache-control'), 'no-store');
    assert.equal(unauthorized.headers.get('x-powered-by'), null);
    assert.ok(unauthorized.headers.get('x-content-type-options'));

    const unsafeRegistration = await fetch(`${app.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Conta Insegura', email: 'user@example.test,attacker@example.net', password: 'Despezi-Teste-2026!' }),
    });
    assert.equal(unsafeRegistration.status, 400);

    const suffix = `${process.pid}-${Date.now()}`;
    const first = await register(app.baseUrl, 'Conta Teste Um', `teste-um-${suffix}@example.test`);
    const second = await register(app.baseUrl, 'Conta Teste Dois', `teste-dois-${suffix}@example.test`);
    const date = new Date().toISOString().slice(0, 10);

    const budget = await postJson(app.baseUrl, '/api/goals', { category: 'alimentacao', amount: 100 }, first.token);
    assert.equal(budget.status, 200);
    const transaction = await postJson(app.baseUrl, '/api/transactions', {
      type: 'expense', amount: 85, description: 'Despesa fictícia de integração', date,
      category: 'alimentacao', payment_method: 'pix',
    }, first.token);
    assert.equal(transaction.status, 201);
    const savingsGoal = await postJson(app.baseUrl, '/api/savings-goals', {
      title: 'Objetivo fictício de integração',
      reason: 'Motivo privado que não deve ser enviado ao worker.',
      targetAmount: 1000,
      amountSaved: 0,
      targetDate: '2027-12-31',
      monthlyContribution: 1,
    }, first.token);
    assert.equal(savingsGoal.status, 201);

    const database = new Database(app.databasePath);
    try {
      const columns = database.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
      assert.ok(columns.some((column) => column.name === 'investor_profile'));
      database.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, date, category, payment_method, status)
        VALUES (?, 'expense', 500, ?, ?, 'alimentacao', 'pix', 'pending')
      `).run(first.userId, 'TEXTO PRIVADO PENDENTE', date);
    } finally {
      database.close();
    }

    const firstInsightsResponse = await fetch(`${app.baseUrl}/api/insights`, {
      headers: { Authorization: `Bearer ${first.token}` },
    });
    assert.equal(firstInsightsResponse.status, 200);
    const firstInsightsBody = await firstInsightsResponse.json() as {
      degraded: boolean;
      insights: Array<{ code: string; category: string | null; message: string }>;
    };
    assert.equal(firstInsightsBody.degraded, false);
    assert.ok(firstInsightsBody.insights.some((insight) => insight.code === 'budget_near_limit'));
    assert.ok(firstInsightsBody.insights.some((insight) => insight.code === 'goals_plan_shortfall'));
    assert.equal(firstInsightsBody.insights.some((insight) => insight.code === 'budget_limit_reached'), false);
    const serializedInsights = JSON.stringify(firstInsightsBody);
    assert.equal(serializedInsights.includes('Motivo privado'), false);
    assert.equal(serializedInsights.includes('TEXTO PRIVADO PENDENTE'), false);
    assert.equal(serializedInsights.includes(`teste-um-${suffix}`), false);

    const secondInsightsResponse = await fetch(`${app.baseUrl}/api/insights`, {
      headers: { Authorization: `Bearer ${second.token}` },
    });
    assert.equal(secondInsightsResponse.status, 200);
    const secondInsightsBody = await secondInsightsResponse.json() as { insights: unknown[] };
    assert.deepEqual(secondInsightsBody.insights, []);

    const statsResponse = await fetch(`${app.baseUrl}/api/stats`, {
      headers: { Authorization: `Bearer ${first.token}` },
    });
    assert.equal(statsResponse.status, 200);
    const stats = await statsResponse.json() as { totalExpense: number };
    assert.equal(stats.totalExpense, 85);
  } finally {
    await stopApp(app);
  }
});

test('OAuth exige state vinculado ao cookie e anuncia PKCE S256', async () => {
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  const app = await startApp(pythonExecutable, {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
  });
  try {
    const authStart = await fetch(`${app.baseUrl}/api/auth/google/url`);
    assert.equal(authStart.status, 200);
    const { url } = await authStart.json() as { url: string };
    const authorizationUrl = new URL(url);
    const state = authorizationUrl.searchParams.get('state');
    const challenge = authorizationUrl.searchParams.get('code_challenge');
    assert.ok(state && state.length >= 40);
    assert.ok(challenge && challenge.length >= 40);
    assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256');

    const setCookie = authStart.headers.get('set-cookie');
    assert.ok(setCookie?.includes('HttpOnly'));
    assert.ok(setCookie?.includes('SameSite=Lax'));
    const cookiePair = setCookie?.split(';')[0];
    assert.ok(cookiePair);

    const callbackWithoutCookie = await fetch(`${app.baseUrl}/api/auth/google/callback?code=fake&state=${encodeURIComponent(state)}`);
    assert.equal(callbackWithoutCookie.status, 400);

    const callbackWithWrongState = await fetch(`${app.baseUrl}/api/auth/google/callback?code=fake&state=wrong-state`, {
      headers: { Cookie: cookiePair },
    });
    assert.equal(callbackWithWrongState.status, 400);
  } finally {
    await stopApp(app);
  }
});

test('modo demo aplica CSP e desativa OAuth Google', async () => {
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  const app = await startApp(pythonExecutable, { DEMO_MODE: 'true' });
  try {
    const response = await fetch(`${app.baseUrl}/api/auth/google/url`);
    assert.equal(response.status, 503);
    assert.ok(response.headers.get('content-security-policy'));
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally {
    await stopApp(app);
  }
});

test('modo demo não abre conexão SMTP mesmo com credenciais configuradas', async () => {
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  let smtpConnections = 0;
  const fakeSmtp = createServer((socket) => {
    smtpConnections += 1;
    socket.destroy();
  });
  await new Promise<void>((resolve, reject) => {
    fakeSmtp.once('error', reject);
    fakeSmtp.listen(0, '127.0.0.1', resolve);
  });
  const address = fakeSmtp.address();
  assert.ok(address && typeof address !== 'string');
  let app: RunningApp | null = null;
  try {
    app = await startApp(pythonExecutable, {
      DEMO_MODE: 'true',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(address.port),
      SMTP_USER: 'demo-user',
      SMTP_PASS: 'demo-password',
    });
    const suffix = `${process.pid}-${Date.now()}`;
    const email = `sem-envio-${suffix}@example.test`;
    await register(app.baseUrl, 'Conta Demo', email);
    const response = await fetch(`${app.baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    assert.equal(response.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(smtpConnections, 0);
  } finally {
    if (app) await stopApp(app);
    await new Promise<void>((resolve) => fakeSmtp.close(() => resolve()));
  }
});

test('falha ao iniciar o worker retorna estado degradado sem interromper transações e estatísticas', async () => {
  const missingPython = path.join(tmpdir(), `python-executable-missing-${process.pid}-${Date.now()}`);
  const app = await startApp(missingPython);
  try {
    const suffix = `${process.pid}-${Date.now()}`;
    const account = await register(app.baseUrl, 'Conta Degradada', `degradada-${suffix}@example.test`);
    const insightsResponse = await fetch(`${app.baseUrl}/api/insights`, {
      headers: { Authorization: `Bearer ${account.token}` },
    });
    assert.equal(insightsResponse.status, 200);
    assert.deepEqual(await insightsResponse.json(), { contract_version: 1, insights: [], degraded: true });

    const transaction = await postJson(app.baseUrl, '/api/transactions', {
      type: 'expense', amount: 15, description: 'Despesa fictícia após falha do worker',
      date: new Date().toISOString().slice(0, 10), category: 'alimentacao', payment_method: 'pix',
    }, account.token);
    assert.equal(transaction.status, 201);
    const statsResponse = await fetch(`${app.baseUrl}/api/stats`, {
      headers: { Authorization: `Bearer ${account.token}` },
    });
    assert.equal(statsResponse.status, 200);
    const stats = await statsResponse.json() as { totalExpense: number };
    assert.equal(stats.totalExpense, 15);
  } finally {
    await stopApp(app);
  }
});
