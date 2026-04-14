import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, Plus, Trash2, AlertTriangle, CheckCircle2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import { motion } from 'motion/react';

export default function Goals() {
  const { token } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('alimentacao');
  const [newAmount, setNewAmount] = useState('');

  // Modal state
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const categories = [
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'moradia', label: 'Moradia' },
    { id: 'lazer', label: 'Lazer' },
    { id: 'saude', label: 'Saúde' },
    { id: 'educacao', label: 'Educação' },
    { id: 'outros', label: 'Outros' }
  ];

  const fetchData = async () => {
    try {
      const [goalsRes, statsRes] = await Promise.all([
        fetch('/api/goals', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const goalsData = await goalsRes.json();
      const statsData = await statsRes.json();
      
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar metas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount))) {
      toast.error('Valor inválido.');
      return;
    }

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          category: newCategory,
          amount: Number(newAmount)
        })
      });

      if (res.ok) {
        toast.success('Meta salva com sucesso!');
        setIsAdding(false);
        setNewAmount('');
        fetchData();
      } else {
        toast.error('Erro ao salvar meta.');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Ocorreu um erro inesperado.');
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      const res = await fetch(`/api/goals/${goalToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Meta removida com sucesso!');
        fetchData();
      } else {
        toast.error('Erro ao remover meta.');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setGoalToDelete(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Carregando metas...</div>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const currentMonthExpenses = stats?.currentMonthCategoryExpenses || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Metas de Gastos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Defina limites mensais por categoria e acompanhe seu progresso.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shadow-primary/20"
        >
          <Plus size={18} />
          {isAdding ? 'Cancelar' : 'Nova Meta'}
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden"
        >
          <h3 className="text-lg font-bold mb-4">Adicionar ou Atualizar Meta</h3>
          <form onSubmit={handleSaveGoal} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Limite (R$)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Ex: 500.00"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full md:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Salvar Meta
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {goals.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
              <Target size={40} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">Nenhuma meta definida</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">Crie metas para controlar seus gastos mensais por categoria e receba alertas quando estiver perto do limite.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus size={18} />
              Criar Primeira Meta
            </button>
          </div>
        ) : (
          goals.map((goal, index) => {
            const categoryLabel = categories.find(c => c.id === goal.category)?.label || goal.category;
            const spent = currentMonthExpenses[goal.category] || 0;
            const percentage = Math.min((spent / goal.amount) * 100, 100);
            
            let statusColor = 'bg-green-500';
            let textColor = 'text-green-600 dark:text-green-400';
            let StatusIcon = CheckCircle2;
            let statusText = 'Dentro da meta';
            let isExceeded = false;
            let isPerfect = false;
            
            if (spent > goal.amount) {
              statusColor = 'bg-red-500';
              textColor = 'text-red-600 dark:text-red-400';
              StatusIcon = AlertTriangle;
              statusText = 'Meta excedida!';
              isExceeded = true;
            } else if (percentage >= 80) {
              statusColor = 'bg-yellow-500';
              textColor = 'text-yellow-600 dark:text-yellow-400';
              StatusIcon = AlertTriangle;
              statusText = 'Atenção: Próximo ao limite';
            } else if (percentage < 30 && spent > 0) {
              isPerfect = true;
              StatusIcon = PartyPopper;
              statusText = 'Excelente economia!';
            }

            return (
              <motion.div 
                key={goal.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`bg-surface-light dark:bg-surface-dark rounded-xl border ${isExceeded ? 'border-red-500/50 shadow-red-500/10' : 'border-slate-200 dark:border-slate-800'} p-6 shadow-sm relative overflow-hidden`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold capitalize">{categoryLabel}</h3>
                    <motion.div 
                      animate={isExceeded ? { x: [-2, 2, -2, 2, 0] } : {}}
                      transition={{ duration: 0.4, repeat: isExceeded ? Infinity : 0, repeatDelay: 3 }}
                      className={`flex items-center gap-1.5 text-sm font-medium mt-1 ${textColor}`}
                    >
                      <StatusIcon size={16} className={isPerfect ? 'text-yellow-500' : ''} />
                      <span>{statusText}</span>
                    </motion.div>
                  </div>
                  <button 
                    onClick={() => setGoalToDelete(goal.category)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                    title="Remover Meta"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 font-medium">Gasto: {formatCurrency(spent)}</span>
                  <span className="text-slate-500 font-medium">Meta: {formatCurrency(goal.amount)}</span>
                </div>
                
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`${statusColor} h-3 rounded-full`} 
                  />
                </div>
                <div className="text-right text-xs text-slate-500 font-medium">
                  {percentage.toFixed(1)}% utilizado
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={goalToDelete !== null}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDeleteGoal}
        title="Remover Meta"
        message="Tem certeza que deseja remover esta meta? Você deixará de receber alertas para esta categoria."
        confirmText="Remover"
      />
    </div>
  );
}
