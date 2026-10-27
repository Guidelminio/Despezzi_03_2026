import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, BarChart, Activity, DollarSign, TrendingUp, TrendingDown, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { categoryLabel } from '../data/categories';
import { buildPtBrCsv } from '../utils/csv';
import { localTodayIsoDate } from '../utils/financialDates';

export default function Reports() {
  const { token, user } = useAuth();
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
  const monthlyChartData = Array.isArray(stats?.monthlyChartData) ? stats.monthlyChartData : [];
  const hasMonthlyData = monthlyChartData.some((item: any) => Number(item.income) > 0 || Number(item.expense) > 0);
  const maxMonthlyValue = Math.max(1, ...monthlyChartData.map((item: any) => Number(item.income) || 0), ...monthlyChartData.map((item: any) => Number(item.expense) || 0));

  const exportToPDF = () => {
    if (!stats) {
      toast.error('Não há dados para exportar.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('pt-BR');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('Relatório Financeiro - Despezi', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Gerado por: ${user?.name || 'Usuário'}`, 14, 30);
    doc.text(`Data: ${today}`, 14, 35);
    doc.line(14, 40, pageWidth - 14, 40);

    // Resumo Geral
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Resumo Geral', 14, 52);

    autoTable(doc, {
      startY: 58,
      head: [['Saldo acumulado', 'Total Receitas', 'Total Despesas']],
      body: [[
        formatCurrency(stats.balance),
        formatCurrency(stats.totalIncome),
        formatCurrency(stats.totalExpense)
      ]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Primary-ish
      styles: { fontSize: 12, cellPadding: 5 }
    });

    // Despesas por Categoria
    const finalY1 = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(16);
    doc.text('Despesas por Categoria', 14, finalY1 + 15);

    autoTable(doc, {
      startY: finalY1 + 20,
      head: [['Categoria', 'Valor Total']],
      body: categoryData.map(([cat, val]: any) => [categoryLabel(String(cat)), formatCurrency(Number(val))]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 10 }
    });

    // Evolução Mensal
    if (stats.monthlyChartData && stats.monthlyChartData.length > 0) {
      const finalY2 = (doc as any).lastAutoTable.finalY || finalY1 + 40;
      
      // Check if we need a new page
      if (finalY2 + 60 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Evolução Mensal', 14, 22);
        autoTable(doc, {
          startY: 28,
          head: [['Mês', 'Receitas', 'Despesas', 'Saldo Líquido']],
          body: stats.monthlyChartData.map((d: any) => [d.name, formatCurrency(d.income), formatCurrency(d.expense), formatCurrency(d.value)]),
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] },
          styles: { fontSize: 10 }
        });
      } else {
        doc.setFontSize(16);
        doc.text('Evolução Mensal', 14, finalY2 + 15);
        autoTable(doc, {
          startY: finalY2 + 20,
          head: [['Mês', 'Receitas', 'Despesas', 'Saldo Líquido']],
          body: stats.monthlyChartData.map((d: any) => [d.name, formatCurrency(d.income), formatCurrency(d.expense), formatCurrency(d.value)]),
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] },
          styles: { fontSize: 10 }
        });
      }
    }

    doc.save(`relatorio_financeiro_${localTodayIsoDate()}.pdf`);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  const exportSummaryToCSV = () => {
    if (!stats) {
      toast.error('Não há dados para exportar.');
      return;
    }

    const rows: Array<Array<string | number | null>> = [
      ['RESUMO GERAL'],
      ['Escopo', 'Todo o histórico de lançamentos concluídos'],
      ['Saldo acumulado', 'Total de receitas', 'Total de despesas'],
      [formatCurrency(stats.balance), formatCurrency(stats.totalIncome), formatCurrency(stats.totalExpense)],
      [],
      ['DESPESAS POR CATEGORIA', 'Todo o histórico de lançamentos concluídos'],
      ['Categoria', 'Valor total'],
      ...categoryData.map(([category, amount]: any) => [categoryLabel(String(category)), formatCurrency(Number(amount))]),
      [],
      ['EVOLUÇÃO MENSAL', 'Últimas seis competências'],
      ['Mês', 'Receitas', 'Despesas', 'Saldo líquido'],
      ...monthlyChartData.map((data: any) => [data.name, formatCurrency(data.income), formatCurrency(data.expense), formatCurrency(data.value)]),
    ];

    const blob = new Blob([buildPtBrCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `resumo_financeiro_despezi_${localTodayIsoDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    
    toast.success('Resumo exportado com sucesso!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Análise detalhada das suas finanças.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={exportToPDF}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <FileText size={16} />
            Exportar (PDF)
          </button>
          <button 
            onClick={exportSummaryToCSV}
            className="inline-flex items-center justify-center gap-2 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Exportar (CSV)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo acumulado</p>
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
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-4 mb-5">Todo o histórico de lançamentos concluídos.</p>
          
          <div className="space-y-4">
            {categoryData.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Nenhuma despesa registrada.</p>
            ) : (
              categoryData.map(([category, amount]: any) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{categoryLabel(String(category))}</span>
                    <span className="text-slate-500">{formatCurrency(amount)}</span>
                  </div>
                  <div
                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5"
                    role="progressbar"
                    aria-label={`Despesas de ${categoryLabel(String(category))}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(maxCategoryValue > 0 ? (Number(amount) / maxCategoryValue) * 100 : 0)}
                  >
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
            {!hasMonthlyData ? (
              <p className="text-slate-500 text-center py-4">Não há receitas ou despesas concluídas nas últimas seis competências.</p>
            ) : (
              <div className="flex h-64 items-end gap-2" role="img" aria-label="Comparação mensal de receitas e despesas concluídas nas últimas seis competências">
                {monthlyChartData.map((data: any, index: number) => {
                  const incomeHeight = (data.income / maxMonthlyValue) * 100;
                  const expenseHeight = (data.expense / maxMonthlyValue) * 100;
                  
                  return (
                      <div key={data.monthKey || index} className="min-w-0 flex-1 flex flex-col items-center justify-end h-full gap-2 group relative" title={`${data.name}: receitas ${formatCurrency(data.income)}; despesas ${formatCurrency(data.expense)}`}>
                        {/* Tooltip */}
                      <div className="hidden xl:block absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded p-2 pointer-events-none z-10 whitespace-nowrap">
                        <p className="text-green-400">Receitas: {formatCurrency(data.income)}</p>
                        <p className="text-red-400">Despesas: {formatCurrency(data.expense)}</p>
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
                      <span className="text-[10px] sm:text-xs text-slate-500 font-medium whitespace-nowrap" aria-label={data.name}>
                        <span className="sm:hidden">{data.name.split('/')[0]}</span>
                        <span className="hidden sm:inline">{data.name}</span>
                      </span>
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
