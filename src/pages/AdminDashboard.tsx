import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, CreditCard, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setStats(data));
    }
  }, [token, user]);

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Acesso negado.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Painel do Administrador</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Visão geral da plataforma Despezi.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              <Users size={16} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total de Usuários</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {stats?.totalUsers || 0}
          </p>
        </div>
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
              <CreditCard size={16} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total de Transações</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {stats?.totalTransactions || 0}
          </p>
        </div>
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <DollarSign size={16} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saldo Global da Plataforma</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            R$ {(stats?.platformBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold">Gerenciar Usuários</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">ID</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Nome</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">E-mail</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats?.users?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                stats?.users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500">#{u.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
