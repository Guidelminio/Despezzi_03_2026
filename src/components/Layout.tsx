import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PieChart, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Target,
  Sun,
  Moon
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const navItems = user?.role === 'admin' 
    ? [
        { path: '/admin', icon: Settings, label: 'Painel Admin' }
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/transactions', icon: ArrowDownCircle, label: 'Transações' },
        { path: '/reports', icon: PieChart, label: 'Relatórios' },
        { path: '/goals', icon: Target, label: 'Metas' },
      ];

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-hidden">
      <Toaster position="top-right" richColors closeButton theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark transition-transform duration-300 md:relative md:translate-x-0 flex flex-col justify-between ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary/15 text-green-800 dark:text-primary font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-green-700 dark:text-primary' : ''} />
                  <span className="text-sm">{item.label}</span>
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
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center text-slate-900">
              <LayoutDashboard size={16} />
            </div>
            <span className="font-bold">Despezi</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu size={24} />
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
