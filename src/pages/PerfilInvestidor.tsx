import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PiggyBank, Shield, TrendingUp, Rocket, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const questions = [
  {
    id: 1,
    question: "Qual é o seu principal objetivo ao investir?",
    options: [
      { text: "Proteger meu dinheiro e não perder nada.", points: 1 },
      { text: "Ter um crescimento constante, aceitando pequenos riscos.", points: 2 },
      { text: "Multiplicar meu patrimônio, mesmo que haja riscos altos.", points: 3 }
    ]
  },
  {
    id: 2,
    question: "O que você faria se seus investimentos caíssem 10% em um mês?",
    options: [
      { text: "Tiraria todo o dinheiro imediatamente.", points: 1 },
      { text: "Ficaria preocupado, mas esperaria recuperar.", points: 2 },
      { text: "Aproveitaria para investir mais, pois está barato.", points: 3 }
    ]
  },
  {
    id: 3,
    question: "Por quanto tempo você pretende deixar seu dinheiro investido?",
    options: [
      { text: "Menos de 1 ano (preciso do dinheiro logo).", points: 1 },
      { text: "De 1 a 5 anos.", points: 2 },
      { text: "Mais de 5 anos (pensando no longo prazo).", points: 3 }
    ]
  }
];

export default function PerfilInvestidor() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateAndSaveProfile(newAnswers);
    }
  };

  const calculateAndSaveProfile = async (finalAnswers: number[]) => {
    setIsSubmitting(true);
    const totalPoints = finalAnswers.reduce((a, b) => a + b, 0);
    
    let profile = 'Conservador';
    if (totalPoints >= 5 && totalPoints <= 7) profile = 'Moderado';
    if (totalPoints >= 8) profile = 'Arrojado';

    setResult(profile);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ profile })
      });

      if (!res.ok) throw new Error('Falha ao salvar perfil');
      
      toast.success('Perfil de investidor salvo com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar seu perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProfileDetails = (profile: string) => {
    switch (profile) {
      case 'Conservador':
        return {
          icon: Shield,
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          desc: 'Você prefere segurança. O ideal é focar em Renda Fixa, Tesouro Direto e CDBs.'
        };
      case 'Moderado':
        return {
          icon: TrendingUp,
          color: 'text-yellow-500',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          desc: 'Você busca equilíbrio. Pode misturar Renda Fixa com um pouco de Fundos Imobiliários e Ações.'
        };
      case 'Arrojado':
        return {
          icon: Rocket,
          color: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-900/30',
          desc: 'Você aceita riscos em busca de altos retornos. Ações, Criptomoedas e Fundos Multimercado são para você.'
        };
      default:
        return { icon: PiggyBank, color: 'text-primary', bg: 'bg-primary/20', desc: '' };
    }
  };

  if (result) {
    const details = getProfileDetails(result);
    const Icon = details.icon;

    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-light dark:bg-surface-dark rounded-3xl p-8 text-center shadow-sm border border-slate-200 dark:border-slate-800"
        >
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${details.bg} ${details.color}`}>
            <Icon size={48} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Seu perfil é: {result}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">{details.desc}</p>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-8 text-left">
            <div className="flex items-start gap-4">
              <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 p-3 rounded-full shrink-0">
                <PiggyBank size={24} />
              </div>
              <div>
                <h4 className="font-bold mb-1">O Pezzy já sabe disso!</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Agora que conheço seu perfil, minhas sugestões de investimento no chat serão personalizadas para você.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/ai')}
            className="w-full bg-primary hover:bg-primary-hover text-slate-900 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Falar com o Pezzy IA <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full mb-4">
          <PiggyBank size={32} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Descubra seu Perfil de Investidor</h2>
        <p className="text-slate-500 dark:text-slate-400">Responda a 3 perguntas rápidas para o Pezzy te dar dicas melhores.</p>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-500 mb-2 font-medium">
            <span>Pergunta {currentStep + 1} de {questions.length}</span>
            <span>{Math.round(((currentStep) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <motion.div 
              className="bg-primary h-2 rounded-full"
              initial={{ width: `${((currentStep) / questions.length) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-6">{questions[currentStep].question}</h3>
            <div className="space-y-3">
              {questions[currentStep].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option.points)}
                  disabled={isSubmitting}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all disabled:opacity-50"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
