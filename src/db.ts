import Database from 'better-sqlite3';

const databasePath = process.env.DATABASE_PATH || 'database.sqlite';
const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Initialize schema. Password values store versioned scrypt hashes, never plaintext.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    investor_profile TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL CHECK(amount > 0),
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'completed',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS spending_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    UNIQUE(user_id, category),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    target_amount_cents INTEGER NOT NULL CHECK(target_amount_cents > 0),
    amount_saved_cents INTEGER NOT NULL DEFAULT 0 CHECK(amount_saved_cents >= 0),
    target_date TEXT,
    monthly_contribution_cents INTEGER CHECK(monthly_contribution_cents IS NULL OR monthly_contribution_cents > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS goal_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    UNIQUE(user_id, category, month, alert_type),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Backward-compatible additions for databases created by earlier versions.
const userColumns = new Set(
  (db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>).map((column) => column.name),
);
if (!userColumns.has('role')) db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
if (!userColumns.has('investor_profile')) db.exec('ALTER TABLE users ADD COLUMN investor_profile TEXT');

export default db;
