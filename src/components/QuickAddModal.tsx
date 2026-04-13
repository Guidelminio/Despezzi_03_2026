import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function QuickAddModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('alimentacao');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-quick-add', handleOpen);
    return () => window.removeEventListener('open-quick-add', handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      toast.error('Valor inválido.');
      return;
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          description,
          category,
          date,
          payment_method: paymentMethod
        })
      });

      if (res.ok) {
        toast.success('Transação adicionada com sucesso!');
        setIsOpen(false);
        // Reset form
        setAmount('');
        setDescription('');
        // Dispatch event to refresh data if needed
        window.dispatchEvent(new CustomEvent('transaction-added'));
      } else {
        toast.error('Erro ao adicionar transação.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro inesperado.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[500px] bg-surface-light dark:bg-surface-dark rounded-t-3xl md:rounded-3xl shadow-2xl z-[70] overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nova Transação</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'expense' 
                        ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <TrendingDown size={16} /> Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'income' 
                        ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <TrendingUp size={16} /> Receita
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <input 
                    type="text" 
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Supermercado"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="alimentacao">Alimentação</option>
                      <option value="transporte">Transporte</option>
                      <option value="moradia">Moradia</option>
                      <option value="lazer">Lazer</option>
                      <option value="saude">Saúde</option>
                      <option value="educacao">Educação</option>
                      <option value="salario">Salário</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data</label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-slate-900 font-bold py-4 rounded-xl mt-4 transition-colors shadow-lg shadow-primary/20"
                >
                  Salvar Transação
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
