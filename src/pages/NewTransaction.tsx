import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NewTransaction() {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'expense';
  const navigate = useNavigate();
  const { token } = useAuth();

  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount)) return alert('Valor inválido');

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          amount: numericAmount,
          description,
          date,
          category,
          payment_method: paymentMethod
        })
      });
      if (res.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Nova Transação</h2>
        <p className="text-slate-500 dark:text-slate-400">Preencha os dados para registrar.</p>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${type === 'income' ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-background-light dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-xl text-3xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ex: Supermercado, Salário..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="" disabled>Selecione...</option>
                {type === 'expense' ? (
                  <>
                    <option value="alimentacao">Alimentação</option>
                    <option value="moradia">Moradia</option>
                    <option value="transporte">Transporte</option>
                    <option value="lazer">Lazer</option>
                    <option value="outros">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="salario">Salário</option>
                    <option value="investimento">Investimento</option>
                    <option value="outros">Outros</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Forma de Pagamento</label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'credit_card', label: 'Cartão de Crédito' },
                { id: 'debit_card', label: 'Débito' },
                { id: 'cash', label: 'Dinheiro' },
                { id: 'pix', label: 'Pix' }
              ].map((method) => (
                <label key={method.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-slate-900 dark:peer-checked:text-primary">
                    {method.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 rounded-lg border border-slate-300 dark:border-slate-600 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary-hover text-slate-900 font-bold transition-colors">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
