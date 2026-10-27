import { Link, useLocation } from 'react-router-dom';
import { SlidersHorizontal, Target } from 'lucide-react';

const sections = [
  { path: '/goals', label: 'Limites de gastos', icon: SlidersHorizontal },
  { path: '/savings-goals', label: 'Objetivos de poupança', icon: Target },
];

export default function PlanningTabs() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Seções de planejamento" className="grid w-full max-w-lg grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/70">
      {sections.map(({ path, label, icon: Icon }) => {
        const isActive = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors sm:text-sm ${isActive
              ? 'bg-white text-green-800 shadow-sm dark:bg-slate-800 dark:text-primary'
              : 'text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800/70'
            }`}
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
