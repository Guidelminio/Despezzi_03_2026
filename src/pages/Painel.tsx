import React, { useEffect, useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, TrendingUp, TrendingDown, Wallet, AlertTriangle, Lightbulb } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatIsoDate } from '../utils/financialDates';
import { categoryLabel } from '../data/categories';

type DashboardInsight = { code: string; category: string | null; message: string };

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsUnavailable, setInsightsUnavailable] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const subtitle = useMemo(() => {
    const subtitles = [
      "Aqui está a visão geral das suas finanças hoje.",
      "Acompanhe seus registros e organize seus próximos passos.",
      "Veja receitas e despesas em um só lugar.",
      "Acompanhe seus gastos e fique mais perto dos seus sonhos.",
      "Pequenos passos ajudam a manter seu plano claro.",
      "Seu planejamento financeiro está em dia?",
      "Organize suas finanças, transforme sua vida."
    ];
    return subtitles[Math.floor(Math.random() * subtitles.length)];
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setInsightsLoading(true);
      fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setStats(data));

      fetch('/api/transactions', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTransactions(data.slice(0, 5));
          } else {
            setTransactions([]);
          }
        })
        .catch(() => setTransactions([]));

      fetch('/api/insights', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error('Insights indisponíveis.');
          setInsights(Array.isArray(data.insights) ? data.insights : []);
          setInsightsUnavailable(Boolean(data.degraded));
        })
        .catch(() => {
          setInsights([]);
          setInsightsUnavailable(true);
        })
        .finally(() => setInsightsLoading(false));
    }
  }, [token, user]);

  if (user?.role === 'admin') {
    return <Navigate to="/admin" />;
  }

  // Use real chart data from stats or fallback to empty array
  const chartData = Array.isArray(stats?.chartData) ? stats.chartData : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting}, {user?.name?.split(' ')[0]}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" aria-label="Resumo financeiro">
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"><Wallet size={16} /></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saldo Atual</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">R$ {(stats?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"><TrendingUp size={16} /></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Receitas</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">R$ {(stats?.totalIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"><TrendingDown size={16} /></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Despesas</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">R$ {(stats?.totalExpense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <section className="rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-5 md:p-6" aria-labelledby="dashboard-insights-title">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={20} className="text-amber-600" />
          <h3 id="dashboard-insights-title" className="text-lg font-bold">Insights da sua organização</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Regras simples baseadas nos lançamentos concluídos, limites e objetivos que você informou. São estimativas; nenhum valor é alterado automaticamente.</p>
        {insightsLoading ? (
          <p role="status" className="text-sm text-slate-500">Calculando insights…</p>
        ) : insightsUnavailable ? (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Insights temporariamente indisponíveis. Suas transações, objetivos e limites continuam funcionando normalmente.</p>
        ) : insights.length > 0 ? (
          <ul className="space-y-3" aria-live="polite">
            {insights.map((insight) => {
              const isWarning = insight.code === 'budget_limit_reached' || insight.code === 'goals_plan_shortfall';
              const heading = insight.category
                ? `Limite de ${categoryLabel(insight.category)}`
                : 'Objetivos de poupança';
              const target = insight.category ? '/goals' : '/savings-goals';
              return (
                <li key={`${insight.code}-${insight.category ?? 'goals'}`} className={`flex items-start gap-3 rounded-lg border p-4 ${isWarning ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
                  {isWarning ? <AlertTriangle size={19} className="mt-0.5 shrink-0" aria-hidden="true" /> : <Lightbulb size={19} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{heading}</p>
                    <p className="mt-1 text-sm">{insight.message}</p>
                  </div>
                  <Link
                    to={target}
                    aria-label={insight.category ? `Ver limite de ${categoryLabel(insight.category)}` : 'Ver objetivos de poupança'}
                    className="shrink-0 text-sm underline font-semibold focus-visible:outline"
                  >Ver</Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">Nenhum insight para mostrar agora. Cadastre um objetivo ou limite mensal para acompanhar seu planejamento.</p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-bold">Saldo acumulado por lançamento</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">Receitas menos despesas concluídas; não inclui um saldo inicial informado.</p>
          <div className="h-64 w-full" role="img" aria-label="Gráfico do saldo acumulado, calculado pelas receitas e despesas concluídas; não há saldo inicial informado.">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a3324', borderColor: '#2a4a35', color: '#fff' }}
                  itemStyle={{ color: '#13ec5b' }}
                  labelStyle={{ color: '#888888', marginBottom: '4px' }}
                  formatter={(value: any, name: string, props: any) => {
                    if (name === 'value') return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)), 'Saldo acumulado'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return `${label} - ${data.description || 'Transação'}`;
                    }
                    return label;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" baseValue={0} stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
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
                      <p className="text-xs text-slate-500">{formatIsoDate(t.date)}</p>
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
