import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data));

    fetch('/api/transactions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTransactions(data.slice(0, 5))); // Get last 5
  }, [token]);

  // Use real chart data from stats or fallback to empty array
  const chartData = stats?.chartData || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Bom dia, {user?.name?.split(' ')[0]}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Aqui está a visão geral das suas finanças hoje.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/transactions/new?type=income" className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <TrendingUp size={18} className="text-primary" />
            Nova Receita
          </Link>
          <Link to="/transactions/new?type=expense" className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shadow-primary/20">
            <Plus size={18} />
            Nova Despesa
          </Link>
        </div>
      </header>

      {stats?.processedBy === 'None' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-400">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-sm font-medium">
            Os cálculos matemáticos estão aguardando o processamento do script Python externo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <Wallet size={16} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saldo Atual</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            R$ {(stats?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              <TrendingUp size={16} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Receitas</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            R$ {(stats?.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              <TrendingDown size={16} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Despesas</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            R$ {(stats?.totalExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold mb-6">Fluxo de Caixa</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a3324', borderColor: '#2a4a35', color: '#fff' }}
                  itemStyle={{ color: '#13ec5b' }}
                />
                <Area type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold mb-6">Últimas Transações</h3>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nenhuma transação encontrada.</p>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            )}
          </div>
          <Link to="/transactions" className="block text-center text-sm text-primary hover:underline mt-6">
            Ver todas
          </Link>
        </div>
      </div>
    </div>
  );
}
