import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error || 'Erro ao cadastrar');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 mb-4">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-2xl font-bold">Criar Conta</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Junte-se ao Despezi para controlar seu dinheiro.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-background-light dark:bg-background-dark border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none"
              placeholder="********"
            />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-slate-900 font-bold transition-colors mt-2">
            Cadastrar
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem uma conta? <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
