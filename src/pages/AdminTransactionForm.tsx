import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTransactionForm() {
  const { id: userId, txId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!txId;

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    if (isEdit) {
      // Fetch transaction details
      fetch(`/api/admin/users/${userId}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          const tx = data.find((t: any) => t.id === Number(txId));
          if (tx) {
            setType(tx.type);
            setAmount(tx.amount.toString());
            setDescription(tx.description);
            setCategory(tx.category);
            setDate(tx.date.split('T')[0]);
          } else {
            toast.error('Transação não encontrada.');
          }
        })
        .catch(() => toast.error('Erro ao carregar transação.'));
    }
  }, [txId, userId, token, user, navigate, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit 
        ? `/api/admin/transactions/${txId}` 
        : `/api/admin/users/${userId}/transactions`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          description,
          category,
          date
        })
      });

      if (res.ok) {
        toast.success(isEdit ? 'Transação atualizada com sucesso!' : 'Transação criada com sucesso!');
        navigate(`/admin/users/${userId}/transactions`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar transação.');
      }
    } catch (err) {
      toast.error('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'income' 
    ? ['Salário', 'Investimentos', 'Freelance', 'Outros']
    : ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'];

  if (user?.role !== 'admin') return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Link to={`/admin/users/${userId}/transactions`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isEdit ? 'Atualize os dados da transação do usuário.' : 'Adicione uma nova transação para o usuário.'}
          </p>
        </div>
      </header>

      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('Salário'); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'income' 
                  ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory('Alimentação'); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'expense' 
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Despesa
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descrição
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Ex: Supermercado"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option value="" disabled>Selecione...</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 py-3 rounded-lg font-bold transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
}
