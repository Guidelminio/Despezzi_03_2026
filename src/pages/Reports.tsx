import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, BarChart, Activity, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function Reports() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats(null);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="flex items-center justify-center h-full">Carregando relatórios...</div>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const categoryData = stats?.categoryExpenses ? Object.entries(stats.categoryExpenses).sort((a: any, b: any) => b[1] - a[1]) : [];
  const maxCategoryValue = categoryData.length > 0 ? (categoryData[0] as any)[1] : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Análise detalhada das suas finanças.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo Total</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats?.balance || 0)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Receitas</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats?.totalIncome || 0)}</h3>
            </div>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Despesas</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats?.totalExpense || 0)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Despesas por Categoria */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="text-primary" size={20} />
            <h3 className="text-lg font-bold">Despesas por Categoria</h3>
          </div>
          
          <div className="space-y-4">
            {categoryData.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Nenhuma despesa registrada.</p>
            ) : (
              categoryData.map(([category, amount]: any) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium">{category}</span>
                    <span className="text-slate-500">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${(amount / maxCategoryValue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evolução Mensal */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart className="text-primary" size={20} />
            <h3 className="text-lg font-bold">Evolução Mensal (Últimos 6 meses)</h3>
          </div>
          
          <div className="space-y-4">
            {!Array.isArray(stats?.monthlyChartData) || stats.monthlyChartData.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Dados insuficientes.</p>
            ) : (
              <div className="flex h-64 items-end gap-2">
                {stats.monthlyChartData.map((data: any, index: number) => {
                  // Calculate max value for scaling
                  const maxVal = Math.max(...stats.monthlyChartData.map((d: any) => Math.max(d.income, d.expense, 1)));
                  const incomeHeight = (data.income / maxVal) * 100;
                  const expenseHeight = (data.expense / maxVal) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded p-2 pointer-events-none z-10 whitespace-nowrap">
                        <p className="text-green-400">R: {formatCurrency(data.income)}</p>
                        <p className="text-red-400">D: {formatCurrency(data.expense)}</p>
                      </div>
                      
                      <div className="w-full flex justify-center gap-1 items-end h-full">
                        <div 
                          className="w-1/2 bg-green-500/80 rounded-t-sm" 
                          style={{ height: `${incomeHeight}%`, minHeight: data.income > 0 ? '4px' : '0' }}
                        ></div>
                        <div 
                          className="w-1/2 bg-red-500/80 rounded-t-sm" 
                          style={{ height: `${expenseHeight}%`, minHeight: data.expense > 0 ? '4px' : '0' }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{data.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500/80 rounded-sm"></div> Receitas</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500/80 rounded-sm"></div> Despesas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
