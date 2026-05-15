import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

interface HomeScreenProps {
  onStart: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 bg-white dark:bg-zinc-950 z-50 flex flex-col items-center justify-center p-6 overflow-hidden transition-colors duration-300"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.15, 0.1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400 rounded-full blur-[120px]" 
        />
      </div>

      <div className="absolute top-6 right-6 z-[60]">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        <motion.div 
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-16"
        >
          <Logo size="large" />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-8 w-full"
        >
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
              Gestão de Vendas <br/>
              <span className="text-indigo-600 dark:text-indigo-400">& Comissões</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">
              Sistema inteligente para controle de pedidos, faturamento e produtividade.
            </p>
          </div>

          <motion.button 
            onClick={onStart}
            whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
            className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-xl shadow-2xl shadow-zinc-900/30 dark:shadow-white/10 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 group overflow-hidden relative"
          >
            <span className="relative z-10">Acessar Sistema</span>
            <ChevronRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-8 text-center">
        <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold tracking-[0.3em] uppercase">
          © 2026 Cristofolini Representações
        </p>
      </motion.div>
    </motion.div>
  );
};