import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, DollarSign, TrendingUp, Calendar, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface Goal {
  id?: number;
  year: number;
  month: number;
  goal_tons: number;
  goal_revenue: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Goals: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingMonth, setSavingMonth] = useState<number | null>(null);
  
  // Estado para armazenar os valores digitados para os 12 meses
  const [monthlyInputs, setMonthlyInputs] = useState<Record<number, { tons: string; revenue: string }>>(
    MONTHS.reduce((acc, _, index) => ({ ...acc, [index + 1]: { tons: '', revenue: '' } }), {})
  );

  // Carregar as metas do ano selecionado
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data: Goal[] = await res.json();
        
        // Filtrar as metas do ano selecionado e preencher os inputs
        const yearGoals = data.filter(g => g.year === selectedYear);
        
        const updatedInputs = MONTHS.reduce((acc, _, index) => {
          const monthNum = index + 1;
          const foundGoal = yearGoals.find(g => g.month === monthNum);
          return {
            ...acc,
            [monthNum]: {
              tons: foundGoal ? foundGoal.goal_tons.toString() : '',
              revenue: foundGoal ? foundGoal.goal_revenue.toString() : ''
            }
          };
        }, {});
        
        setMonthlyInputs(updatedInputs);
      }
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [selectedYear]);

  const handleInputChange = (month: number, field: 'tons' | 'revenue', value: string) => {
    setMonthlyInputs(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value
      }
    }));
  };

  const handleSaveGoal = async (month: number) => {
    setSavingMonth(month);
    const inputs = monthlyInputs[month];
    
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: month,
          goal_tons: parseFloat(inputs.tons) || 0,
          goal_revenue: parseFloat(inputs.revenue) || 0
        })
      });

      if (!response.ok) throw new Error('Falha ao salvar meta');
      
      // Feedback rápido ou recarga opcional
      await fetchGoals();
    } catch (err) {
      alert('Erro ao salvar a meta do mês');
    } finally {
      setSavingMonth(null);
    }
  };

  // Cálculos dos Totais Anuais para os Cards de Cima
  const totalAnnualTons = Object.values(monthlyInputs).reduce((acc, curr) => acc + (parseFloat(curr.tons) || 0), 0);
  const totalAnnualRevenue = Object.values(monthlyInputs).reduce((acc, curr) => acc + (parseFloat(curr.revenue) || 0), 0);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-8">
      {/* Cabeçalho e Seletor de Ano */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Definição de Metas Comerciais</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Estabeleça os objetivos de volume e faturamento da Cristofolini</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
              <option key={y} value={y}>Ano Comercial: {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Resumo Anual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meta Anual de Volume</span>
            <div className="text-2xl font-black text-zinc-900 dark:text-white">
              {totalAnnualTons.toLocaleString('pt-BR')} <span className="text-sm font-normal text-zinc-500">kg</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meta Anual de Receita</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(totalAnnualRevenue)}
            </div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid com os 12 Meses */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400 gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Sincronizando metas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {MONTHS.map((monthName, index) => {
              const monthNum = index + 1;
              const isSaving = savingMonth === monthNum;
              
              return (
                <motion.div
                  key={monthNum}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 transition-colors">
                    <span className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight text-sm">
                      {monthName}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                      {monthNum.toString().padStart(2, '0')}/{selectedYear}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Meta de Volume (kg)</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 50000"
                        value={monthlyInputs[monthNum].tons}
                        onChange={(e) => handleInputChange(monthNum, 'tons', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Meta de Faturamento (R$)</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 125000"
                        value={monthlyInputs[monthNum].revenue}
                        onChange={(e) => handleInputChange(monthNum, 'revenue', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveGoal(monthNum)}
                      disabled={isSaving}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {isSaving ? 'Salvando...' : 'Atualizar Meta'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};