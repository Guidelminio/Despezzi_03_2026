import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Trash2, Filter, ArrowUpDown, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

export default function Transactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  
  // Sort states
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal state
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);

  const fetchTransactions = () => {
    fetch('/api/transactions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          setTransactions([]);
        }
      })
      .catch(() => {
        setTransactions([]);
        toast.error('Erro ao carregar transações.');
      });
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const handleDelete = async () => {
    if (transactionToDelete === null) return;
    
    try {
      const res = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Transação excluída com sucesso!');
        fetchTransactions();
      } else {
        toast.error('Erro ao excluir transação.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setTransactionToDelete(null);
    }
  };

  const formatMethod = (method: string) => {
    const methods: Record<string, string> = {
      credit_card: 'Cartão de Crédito',
      debit_card: 'Débito',
      cash: 'Dinheiro',
      pix: 'Pix'
    };
    return methods[method] || method;
  };

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const filteredAndSortedTransactions = transactions
    .filter(t => {
      if (startDate && new Date(t.date) < new Date(startDate)) return false;
      if (endDate && new Date(t.date) > new Date(endDate)) return false;
      if (category && t.category !== category) return false;
      if (type && t.type !== type) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Transações</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Histórico completo das suas movimentações financeiras.</p>
      </header>

      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Filter size={12} /> Data Inicial</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Filter size={12} /> Data Final</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Filter size={12} /> Categoria</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize"
            >
              <option value="">Todas</option>
              {categories.map(c => (
                <option key={c as string} value={c as string}>{c as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Filter size={12} /> Tipo</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-32">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><ArrowUpDown size={12} /> Ordenar por</label>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as 'date' | 'amount')}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="date">Data</option>
              <option value="amount">Valor</option>
            </select>
          </div>
          <div className="flex-1 md:w-32">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ordem</label>
            <select 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Data</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Descrição</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Categoria</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Método</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Valor</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Inbox size={32} className="text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Nenhuma transação encontrada</p>
                      <p className="text-sm">Tente ajustar os filtros ou adicione uma nova transação.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      {t.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 capitalize">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatMethod(t.payment_method)}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setTransactionToDelete(t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={transactionToDelete !== null}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita e afetará seu saldo."
        confirmText="Excluir"
      />
    </div>
  );
}
