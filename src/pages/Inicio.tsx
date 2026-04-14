import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PieChart, ShieldCheck, TrendingUp, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';

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
              Começar Grátis
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
              O controle financeiro que <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-600">transforma</span> sua vida.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
              Despezi é a plataforma definitiva para acompanhar seus gastos, definir metas e alcançar a independência financeira com facilidade e segurança.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-slate-900 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                Criar Conta Gratuita <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="w-full sm:w-auto bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-8 py-4 rounded-xl text-lg font-medium transition-colors">
                Já tenho uma conta
              </Link>
            </div>
            
            <div className="mt-16 relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-green-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Dashboard Preview" className="rounded-xl w-full object-cover aspect-video opacity-90" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-surface-light dark:bg-surface-dark border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Ferramentas poderosas desenhadas para simplificar a forma como você lida com o seu dinheiro.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background-light dark:bg-background-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Acompanhamento em Tempo Real</h3>
                <p className="text-slate-600 dark:text-slate-400">Visualize seu fluxo de caixa, receitas e despesas atualizados a cada transação, sem atrasos.</p>
              </div>
              <div className="bg-background-light dark:bg-background-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                  <PieChart size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Metas Inteligentes</h3>
                <p className="text-slate-600 dark:text-slate-400">Defina orçamentos por categoria e receba alertas automáticos antes de estourar o limite mensal.</p>
              </div>
              <div className="bg-background-light dark:bg-background-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Segurança em Primeiro Lugar</h3>
                <p className="text-slate-600 dark:text-slate-400">Seus dados são criptografados e mantidos com os mais altos padrões de segurança do mercado.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / CTA */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Pronto para assumir o controle?</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="text-primary" size={20} />
                <span>100% Gratuito</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="text-primary" size={20} />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle2 className="text-primary" size={20} />
                <span>Cancele quando quiser</span>
              </div>
            </div>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg shadow-primary/25">
              Começar Agora Mesmo
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
