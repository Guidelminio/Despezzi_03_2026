import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('database.sqlite');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
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
    amount REAL NOT NULL,
    UNIQUE(user_id, category),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS goal_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    month TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    UNIQUE(user_id, category, month, alert_type),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Add role column if it doesn't exist (for existing databases)
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
} catch (e) {
  // Column likely already exists
}

// Seed admin user
const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@despezi.com');
if (!adminExists) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin Principal', 
    'admin@despezi.com', 
    'admin123', 
    'admin'
  );
}

  const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
  const insertTx = db.prepare('INSERT INTO transactions (user_id, type, amount, description, date, category, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  
  const categories = ['alimentacao', 'transporte', 'moradia', 'lazer', 'saude', 'salario', 'freelance'];
  const methods = ['credit_card', 'debit_card', 'pix', 'cash'];

  const testUsers = [
    { name: 'Usuário Teste', email: 'teste@despezi.com', pass: 'teste123' },
    { name: 'Maria Silva', email: 'maria@despezi.com', pass: 'senha123' },
    { name: 'João Souza', email: 'joao@despezi.com', pass: 'senha123' },
    { name: 'Ana Costa', email: 'ana@despezi.com', pass: 'senha123' },
    { name: 'Carlos Lima', email: 'carlos@despezi.com', pass: 'senha123' },
    { name: 'Pedro Alves', email: 'pedro@despezi.com', pass: 'senha123' },
    { name: 'Juliana Mendes', email: 'juliana@despezi.com', pass: 'senha123' },
    { name: 'Fernando Rocha', email: 'fernando@despezi.com', pass: 'senha123' },
    { name: 'Camila Santos', email: 'camila@despezi.com', pass: 'senha123' },
    { name: 'Rafael Oliveira', email: 'rafael@despezi.com', pass: 'senha123' }
  ];

  testUsers.forEach((u) => {
    const exists = db.prepare('SELECT * FROM users WHERE email = ?').get(u.email);
    if (!exists) {
      const userResult = insertUser.run(u.name, u.email, u.pass, 'user');
      const userId = userResult.lastInsertRowid;
      
      // Generate 15-30 random transactions for each user for the last 3 months
      const numTxs = Math.floor(Math.random() * 15) + 15;
      for (let i = 0; i < numTxs; i++) {
        const isIncome = Math.random() > 0.7;
        const type = isIncome ? 'income' : 'expense';
        const amount = isIncome ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 500) + 10;
        const category = isIncome ? (Math.random() > 0.5 ? 'salario' : 'freelance') : categories[Math.floor(Math.random() * 5)];
        const method = methods[Math.floor(Math.random() * methods.length)];
        
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Random date in last 90 days
        const dateStr = date.toISOString().split('T')[0];
        
        insertTx.run(userId, type, amount, `Transação ${i+1} - ${u.name.split(' ')[0]}`, dateStr, category, method, 'completed');
      }
    }
  });

export default db;
