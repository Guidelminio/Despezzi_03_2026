import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PieChart, ShieldCheck, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center text-slate-900">
              <LayoutDashboard size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight">Despezi</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Entrar</Link>
            <Link to="/register" className="bg-primary hover:bg-primary-hover text-slate-900 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shadow-primary/20">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background-light dark:via-background-dark to-transparent -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
              Organize seu dinheiro. Planeje o que importa.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
              O Despezi é um protótipo acadêmico para acompanhar receitas e despesas, criar limites por categoria e planejar objetivos de poupança — sem presumir rendimentos ou prometer resultados.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-slate-900 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                Criar conta <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="w-full sm:w-auto bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-8 py-4 rounded-xl text-lg font-medium transition-colors">
                Já tenho uma conta
              </Link>
            </div>
            
            <div className="mt-16 relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-green-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-8 shadow-2xl overflow-hidden">

                <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">Prévia ilustrativa: os valores e objetivos abaixo são fictícios.</p>
                {/* Dashboard Mockup Area */}
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1 flex items-center justify-between">
                        Saldo Atual
                        <LayoutDashboard size={14} className="text-blue-500"/>
                      </div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">R$ 14.520,00</div>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1 flex items-center justify-between">
                        Economia (Mês)
                        <TrendingUp size={14} className="text-green-500"/>
                      </div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">R$ 2.450,00</div>
                    </div>
                  </div>

                  
                  {/* Progress Bars Mockup */}
                  <div className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Progresso de Metas</div>
                     <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Viagem Férias</span>
                          <span className="text-primary font-bold">75%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Reserva de Emergência</span>
                          <span className="text-blue-500 font-bold">40%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                     </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-surface-light dark:bg-surface-dark border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">O que o protótipo reúne</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Recursos para registrar movimentações, acompanhar limites e organizar objetivos de poupança.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background-light dark:bg-background-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Acompanhe movimentações</h3>
                <p className="text-slate-600 dark:text-slate-400">Consulte receitas, despesas, histórico e indicadores gerados pelos lançamentos registrados.</p>
              </div>
              <div className="bg-background-light dark:bg-background-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                  <PieChart size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Limites e objetivos</h3>
                <p className="text-slate-600 dark:text-slate-400">Defina limites de gastos por categoria e planeje quanto juntar por mês para cada objetivo.</p>
              </div>
              <div className="bg-background-light dark:bg-background-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Protótipo transparente</h3>
                <p className="text-slate-600 dark:text-slate-400">Senhas são armazenadas com hash. Como este é um projeto acadêmico, não insira dados financeiros reais.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / CTA */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Conheça o protótipo</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="text-primary" size={20} />
                <span>Projeto acadêmico</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="text-primary" size={20} />
                <span>Sem aconselhamento financeiro</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="text-primary" size={20} />
                <span>Você controla seus limites</span>
              </div>
            </div>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-primary/25">
              Criar conta de teste
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} Despezi. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
