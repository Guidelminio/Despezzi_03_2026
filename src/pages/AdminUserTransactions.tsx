import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Trash2, Edit, TrendingUp, TrendingDown, Plus, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminUserTransactions() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);

  const fetchTransactions = () => {
    fetch(`/api/admin/users/${id}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
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
    if (user?.role === 'admin') {
      fetchTransactions();
      // Fetch user info to display name
      fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          const u = data.users.find((u: any) => u.id === Number(id));
          if (u) setUserInfo(u);
        });
    }
  }, [id, token, user]);

  const handleDelete = async () => {
    if (transactionToDelete === null) return;
    
    try {
      const res = await fetch(`/api/admin/transactions/${transactionToDelete}`, {
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

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Acesso negado.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Transações de {userInfo?.name || `Usuário #${id}`}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie as transações deste usuário.</p>
          </div>
        </div>
        <Link 
          to={`/admin/users/${id}/transactions/new`} 
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shadow-primary/20"
        >
          <Plus size={18} />
          Nova Transação
        </Link>
      </header>

      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Data</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Descrição</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Categoria</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Valor</th>
                <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Inbox size={32} className="text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Nenhuma transação encontrada</p>
                      <p className="text-sm">Este usuário não possui transações registradas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      {t.description}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <Link 
                        to={`/admin/users/${id}/transactions/${t.id}/edit`}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                        title="Editar Transação"
                      >
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => setTransactionToDelete(t.id)} 
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Excluir Transação"
                      >
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
        message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita e afetará o saldo do usuário."
        confirmText="Excluir"
      />
    </div>
  );
}
