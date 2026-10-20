import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Lightbulb, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { formatIsoDate, formatMonthKey, localTodayIsoDate } from '../utils/financialDates';

type SavingsGoal = {
  id: number;
  title: string;
  reason: string;
  targetAmount: number;
  amountSaved: number;
  targetDate: string | null;
  monthlyContribution: number | null;
  remainingCents: number;
  monthsToTarget: number | null;
  requiredMonthlyCents: number | null;
  estimatedCompletionMonth: string | null;
  plannedContributionTotalCents: number | null;
  shortfallCents: number | null;
  isComplete: boolean;
  isOnTrack: boolean | null;
  insight: string;
};

type GoalForm = {
  title: string;
  reason: string;
  targetAmount: string;
  amountSaved: string;
  targetDate: string;
  monthlyContribution: string;
};

const emptyForm: GoalForm = {
  title: '',
  reason: '',
  targetAmount: '',
  amountSaved: '0',
  targetDate: '',
  monthlyContribution: '',
};

const money = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number.isFinite(value) ? value : 0);

const centsMoney = (value: number | null | undefined) => money((value ?? 0) / 100);

export default function ObjetivosPoupanca() {
  const { token } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [error, setError] = useState('');

  const loadGoals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/savings-goals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar seus objetivos.');
      setGoals(Array.isArray(data) ? data : []);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar seus objetivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGoals();
  }, [token]);

  const plannedMonthlyTotal = useMemo(() => goals
    .filter((goal) => !goal.isComplete)
    .reduce((total, goal) => total + (goal.monthlyContribution ?? ((goal.requiredMonthlyCents ?? 0) / 100)), 0), [goals]);

  const beginCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const beginEdit = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      reason: goal.reason,
      targetAmount: goal.targetAmount.toFixed(2),
      amountSaved: goal.amountSaved.toFixed(2),
      targetDate: goal.targetDate || '',
      monthlyContribution: goal.monthlyContribution == null ? '' : goal.monthlyContribution.toFixed(2),
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      reason: form.reason,
      targetAmount: Number(form.targetAmount),
      amountSaved: form.amountSaved === '' ? 0 : Number(form.amountSaved),
      targetDate: form.targetDate || null,
      monthlyContribution: form.monthlyContribution === '' ? null : Number(form.monthlyContribution),
    };
    try {
      const response = await fetch(editingId == null ? '/api/savings-goals' : `/api/savings-goals/${editingId}`, {
        method: editingId == null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o objetivo.');
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadGoals();
      toast.success(editingId == null ? 'Objetivo criado.' : 'Objetivo atualizado.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Não foi possível salvar o objetivo.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (goalToDelete == null || !token) return;
    try {
      const response = await fetch(`/api/savings-goals/${goalToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir o objetivo.');
      setGoals((current) => current.filter((goal) => goal.id !== goalToDelete));
      toast.success('Objetivo excluído.');
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o objetivo.');
    } finally {
      setGoalToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2"><Target size={20} /><span className="text-sm font-semibold">Objetivos de poupança</span></div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dê um plano para o que você quer conquistar</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-2xl">Defina o que quer alcançar, por que isso importa e como pretende juntar. Os cálculos são lineares e não presumem rendimento, inflação ou financiamento.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link to="/goals" className="inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Ver orçamento</Link>
          <button onClick={beginCreate} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-4 py-2 rounded-lg text-sm font-bold"><Plus size={16} /> Novo objetivo</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Resumo dos objetivos">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm text-slate-500">Objetivos ativos</p>
          <p className="text-2xl font-bold mt-1">{goals.filter((goal) => !goal.isComplete).length}</p>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm text-slate-500">Aporte mensal planejado</p>
          <p className="text-2xl font-bold mt-1">{money(plannedMonthlyTotal)}</p>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Importante</p>
          <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-1">Esse total não é uma avaliação de renda disponível. Nenhum limite de gasto muda sem sua ação.</p>
        </div>
      </section>

      {showForm && (
        <section className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-7 shadow-sm" aria-labelledby="goal-form-title">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 id="goal-form-title" className="text-xl font-bold">{editingId == null ? 'Criar objetivo' : 'Editar objetivo'}</h2>
              <p className="text-sm text-slate-500 mt-1">O motivo fica visível somente na sua conta.</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">Cancelar</button>
          </div>
          {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium">Nome do objetivo
              <input required minLength={3} maxLength={80} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex.: Comprar um carro" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">Valor-alvo (R$)
              <input required type="number" min="0.01" max="1000000000" step="0.01" value={form.targetAmount} onChange={(event) => setForm({ ...form, targetAmount: event.target.value })} placeholder="50000,00" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark px-3 py-2" />
            </label>
            <label className="block text-sm font-medium md:col-span-2">Por que esse objetivo é importante para você?
              <textarea required maxLength={500} rows={3} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Escreva um motivo que ajude você a manter o foco." className="mt-1 w-full resize-y rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark px-3 py-2" />
              <span className="block text-right text-xs text-slate-400">{form.reason.length}/500</span>
            </label>
            <label className="block text-sm font-medium">Quanto já juntou? (R$)
              <input type="number" min="0" max={form.targetAmount || '1000000000'} step="0.01" value={form.amountSaved} onChange={(event) => setForm({ ...form, amountSaved: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">Prazo desejado (opcional)
              <input type="date" min={localTodayIsoDate()} value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">Quanto consegue guardar por mês? (opcional)
              <input type="number" min="0.01" max="1000000000" step="0.01" value={form.monthlyContribution} onChange={(event) => setForm({ ...form, monthlyContribution: event.target.value })} placeholder="Ex.: 500,00" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-background-dark px-3 py-2" />
            </label>
            <p className="md:col-span-2 text-xs text-slate-500">Informe um prazo ou um aporte mensal. Se informar os dois, mostraremos se o aporte cobre o objetivo até a data. Você pode editar tudo depois.</p>
            <div className="md:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-slate-900 text-sm font-bold disabled:opacity-60">{saving ? 'Salvando…' : 'Salvar objetivo'}</button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Carregando objetivos…</div>
      ) : error && !showForm ? (
        <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-950/30 p-5 text-sm text-red-700 dark:text-red-300">{error}</div>
      ) : goals.length === 0 ? (
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Target size={36} className="mx-auto text-slate-400 mb-3" />
          <h2 className="text-xl font-bold">Seu primeiro objetivo começa com uma ideia</h2>
          <p className="text-sm text-slate-500 mt-2 mb-5">Diga o que quer conquistar, quanto precisa e qual ritmo parece possível para você.</p>
          <button onClick={beginCreate} className="inline-flex items-center gap-2 bg-primary text-slate-900 px-4 py-2 rounded-lg font-bold"><Plus size={16} /> Criar meu objetivo</button>
        </div>
      ) : (
        <section className="space-y-4" aria-label="Seus objetivos de poupança">
          {goals.map((goal) => {
            const progress = Math.min(100, Math.max(0, goal.targetAmount > 0 ? (goal.amountSaved / goal.targetAmount) * 100 : 0));
            return (
              <article key={goal.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {goal.isComplete ? <CheckCircle2 size={20} className="text-green-600" /> : <Target size={20} className="text-primary" />}
                      <h2 className="text-lg md:text-xl font-bold break-words">{goal.title}</h2>
                      <span className={`text-xs rounded-full px-2 py-1 font-semibold ${goal.isComplete ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{goal.isComplete ? 'Alcançado' : 'Em andamento'}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap">{goal.reason}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => beginEdit(goal)} aria-label={`Editar ${goal.title}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><Pencil size={15} /> Editar</button>
                    <button onClick={() => setGoalToDelete(goal.id)} aria-label={`Excluir ${goal.title}`} className="rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-500 hover:text-red-600" title="Excluir objetivo"><Trash2 size={17} /></button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3"><p className="text-xs text-slate-500">Valor-alvo</p><p className="font-bold mt-1">{money(goal.targetAmount)}</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3"><p className="text-xs text-slate-500">Já juntou</p><p className="font-bold mt-1">{money(goal.amountSaved)}</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3"><p className="text-xs text-slate-500">Falta</p><p className="font-bold mt-1">{centsMoney(goal.remainingCents)}</p></div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3"><p className="text-xs text-slate-500">{goal.targetDate ? 'Prazo desejado' : 'Previsão no ritmo atual'}</p><p className="font-bold mt-1">{goal.targetDate ? formatIsoDate(goal.targetDate) : goal.estimatedCompletionMonth ? formatMonthKey(goal.estimatedCompletionMonth) : '—'}</p></div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progresso</span><span>{progress.toFixed(1)}%</span></div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="progressbar" aria-label={`Progresso de ${goal.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                    <div className={`h-full rounded-full ${goal.isComplete ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className={`mt-4 rounded-xl p-4 ${goal.isOnTrack === false ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200' : 'bg-primary/10 text-slate-800 dark:text-slate-100'}`}>
                  <div className="flex items-start gap-2"><Lightbulb size={17} className="mt-0.5 shrink-0 text-amber-600" /><div className="text-sm">
                    {goal.targetDate && goal.requiredMonthlyCents != null && <p><strong>Aporte mensal necessário para o prazo:</strong> {centsMoney(goal.requiredMonthlyCents)}{goal.monthsToTarget != null ? ` por ${goal.monthsToTarget} ${goal.monthsToTarget === 1 ? 'mês' : 'meses'}` : ''}.</p>}
                    {goal.monthlyContribution != null && <p><strong>Aporte que você planejou:</strong> {money(goal.monthlyContribution)} por mês.</p>}
                    {!goal.targetDate && goal.monthlyContribution != null && goal.estimatedCompletionMonth && <p><strong>Previsão:</strong> cerca de {goal.monthsToTarget} {goal.monthsToTarget === 1 ? 'mês' : 'meses'}, em {formatMonthKey(goal.estimatedCompletionMonth)}.</p>}
                    {goal.isOnTrack === false && goal.shortfallCents != null && <p><strong>Diferença estimada no prazo:</strong> {centsMoney(goal.shortfallCents)}.</p>}
                    <p className="mt-1">{goal.isComplete ? 'Objetivo concluído. Você pode atualizar o valor ou definir uma nova meta.' : goal.insight}</p>
                  </div></div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">
        <CalendarClock size={16} className="shrink-0 mt-0.5" />
        <p>Estimativas simples: não consideram rendimentos, inflação, valorização de bens, financiamento nem despesas que você não informou. O total mensal planejado não significa que esse valor esteja disponível no seu orçamento.</p>
      </div>

      <ConfirmModal
        isOpen={goalToDelete !== null}
        onClose={() => setGoalToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir objetivo"
        message="Deseja excluir este objetivo? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />
    </div>
  );
}
