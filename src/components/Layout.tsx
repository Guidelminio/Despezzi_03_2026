import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import QuickAddModal from './QuickAddModal';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PieChart, 
  Settings, 
  LogOut,
  Target,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const location = useLocation();

  const navItems = user?.role === 'admin' 
    ? [
        { path: '/admin', icon: Settings, label: 'Admin' }
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
        { path: '/transactions', icon: ArrowDownCircle, label: 'Transações' },
        { path: '/reports', icon: PieChart, label: 'Relatórios' },
        { path: '/goals', icon: Target, label: 'Planejar' },
      ];

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isNavItemActive = (path: string) => location.pathname === path
    || (path === '/transactions' && location.pathname.startsWith('/transactions'))
    || (path === '/goals' && location.pathname === '/savings-goals');

  return (
    <div className="flex h-dvh w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-hidden">
      <Toaster position="top-right" richColors closeButton theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      <QuickAddModal />
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 border-r border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark z-50">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center text-slate-900 shadow-sm">
              <LayoutDashboard size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none">Despezi</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal">Gestão Financeira</p>
            </div>
          </div>

          {user?.role !== 'admin' && (
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
              className="w-full mb-6 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-slate-900 px-4 py-3 rounded-xl font-bold transition-all shadow-sm shadow-primary/20"
            >
              <Plus size={20} />
              Nova Transação
            </button>
          )}

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-green-800 dark:text-primary font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/15 rounded-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={20} className={`relative z-10 ${isActive ? 'text-green-700 dark:text-primary' : ''}`} />
                  <span className="relative z-10 text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium w-full text-left"
          >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-sm">{resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-lg font-bold uppercase shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0" title="Sair" aria-label="Sair da conta">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark z-10">
          <div className="flex items-center gap-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center text-slate-900">
              <LayoutDashboard size={16} />
            </div>
            <span className="font-bold">Despezi</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="text-slate-500 min-h-11 min-w-11 flex items-center justify-center" aria-label={resolvedTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}>
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={logout} className="text-slate-500 hover:text-red-500 min-h-11 min-w-11 flex items-center justify-center" aria-label="Sair da conta">
              <LogOut size={20} />
            </button>
          </div>
        </header>
        
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8 lg:pb-8 relative scroll-pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav aria-label="Navegação principal" className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-50 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item, idx) => {
          const isActive = isNavItemActive(item.path);
          const Icon = item.icon;
          
          // Insert Quick Add FAB in the middle
          if (idx === Math.floor(navItems.length / 2)) {
            return (
              <React.Fragment key="quick-add">
                <button 
                  className="relative -top-3 bg-primary text-slate-900 w-11 h-11 shrink-0 flex items-center justify-center rounded-full shadow-lg shadow-primary/30 transform transition-transform active:scale-95"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
                  aria-label="Abrir formulário de nova transação"
                  title="Nova transação"
                >
                  <Plus size={22} className="font-bold" />
                </button>
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`min-w-0 flex-1 flex flex-col items-center justify-center h-full gap-1 ${
                    isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-primary' : ''} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </React.Fragment>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`min-w-0 flex-1 flex flex-col items-center justify-center h-full gap-1 relative ${
                isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={20} className={isActive ? 'text-primary' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
