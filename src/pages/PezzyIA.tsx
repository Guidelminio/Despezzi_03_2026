import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, PiggyBank, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export default function PezzyAI() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: `Oink! 🐷 Olá, ${user?.name?.split(' ')[0]}! Eu sou o **Pezzy AI**, seu assistente financeiro pessoal. Como posso ajudar você a cuidar melhor do seu dinheiro hoje?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: data.reply }]);
      } else {
        toast.error(data.error || 'Erro ao falar com o Pezzy.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Resuma meus gastos deste mês.",
    "Posso comprar um item de R$ 500?",
    "Sugira uma meta de economia.",
    "Onde posso investir meu dinheiro?"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col">
      <header className="flex items-center gap-3 mb-6 shrink-0">
        <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 p-3 rounded-2xl shadow-sm">
          <PiggyBank size={28} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            Pezzy AI <Sparkles size={20} className="text-yellow-500" />
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Seu assistente financeiro inteligente</p>
        </div>
      </header>

      <div className="flex-1 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                  : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
              }`}>
                {msg.role === 'user' ? user?.name?.[0]?.toUpperCase() || 'U' : <PiggyBank size={18} />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-slate-900 rounded-tr-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm font-medium">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                <PiggyBank size={18} />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-slate-500" />
                <span className="text-sm text-slate-500">Pezzy está pensando...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action)}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary px-3 py-1.5 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                >
                  {action}
                </button>
              ))}
            </div>
          )}
          
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao Pezzy sobre suas finanças..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-primary hover:bg-primary-hover text-slate-900 w-12 h-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
