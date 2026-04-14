import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('Link de recuperação enviado!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao solicitar recuperação.');
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex justify-center mb-8">
          <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
            <LayoutDashboard size={24} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Recuperar Senha</h2>
        
        {submitted ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} />
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
            </p>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 text-primary hover:text-primary-hover font-medium transition-colors">
              <ArrowLeft size={18} /> Voltar para o Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8 text-sm">
              Digite seu email e enviaremos instruções para redefinir sua senha.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="seu@email.com"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-slate-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
            
            <div className="mt-8 text-center text-sm">
              <Link to="/login" className="text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-1">
                <ArrowLeft size={16} /> Voltar para o Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
