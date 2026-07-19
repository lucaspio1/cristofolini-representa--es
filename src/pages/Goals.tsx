import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, DollarSign, TrendingUp, Calendar, Check, X, Edit2, ShieldAlert } from 'lucide-react';
import { Sale } from '../types';

interface Goal {
  id?: number;
  year: number;
  month: number;
  goal_tons: number;
  goal_revenue: number;
}

interface GoalsProps {
  sales: Sale[];
  currentUser: any; // Recebemos o utilizador atual para validar as permissões
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Goals: React.FC<GoalsProps> = ({ sales, currentUser }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Controlo de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [monthlyInputs, setMonthlyInputs] = useState<Record<number, { tons: string; revenue: string }>>(
    MONTHS.reduce((acc, _, index) => ({ ...acc, [index + 1]: { tons: '', revenue: '' } }), {})
  );

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data: Goal[] = await res.json();
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
    setIsEditing(false); // Sai do modo de edição se trocar de ano
  }, [selectedYear]);

  const handleInputChange = (month: number, field: 'tons' | 'revenue', value: string) => {
    setMonthlyInputs(prev => ({
      ...prev, [month]: { ...prev[month], [field]: value }
    }));
  };

  // Salva todas as metas de uma só vez
  const handleSaveAllGoals = async () => {
    setIsSaving(true);
    try {
      const promises = MONTHS.map((_, index) => {
        const monthNum = index + 1;
        const inputs = monthlyInputs[monthNum];
        return fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: selectedYear, month: monthNum,
            goal_tons: parseFloat(inputs.tons) || 0,
            goal_revenue: parseFloat(inputs.revenue) || 0
          })
        });
      });

      await Promise.all(promises);
      await fetchGoals();
      setIsEditing(false); // Sai do modo de edição após salvar com sucesso
    } catch (err) {
      alert('Erro ao guardar as metas. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const getMonthRealized = (month: number) => {
    return sales.reduce((acc, sale) => {
      const dateString = sale.data_faturamento || sale.data_finalizacao_produto || sale.data_emissao_pedido || sale.sale_date;
      if (!dateString) return acc;

      let saleYear, saleMonth;
      if (dateString.includes('T')) {
        const d = new Date(dateString);
        saleYear = d.getFullYear();
        saleMonth = d.getMonth() + 1;
      } else {
        const parts = dateString.split('-');
        saleYear = parseInt(parts[0]);
        saleMonth = parseInt(parts[1]);
      }

      if (saleMonth === month && saleYear === selectedYear) {
        acc.weight += Number(sale.peso_finalizado || 0);
        acc.revenue += Number(sale.valor_total_nf || 0);
      }
      return acc;
    }, { weight: 0, revenue: 0 });
  };

  // Regra de Cores para as Percentagens (Idêntico ao monolítico)
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (progress >= 80) return 'text-amber-600 dark:text-amber-400 font-bold';
    if (progress > 0) return 'text-red-600 dark:text-red-400 font-bold';
    return 'text-zinc-400';
  };

  const totalAnnualTons = Object.values(monthlyInputs).reduce((acc, curr) => acc + (parseFloat(curr.tons) || 0), 0);
  const totalAnnualRevenue = Object.values(monthlyInputs).reduce((acc, curr) => acc + (parseFloat(curr.revenue) || 0), 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl"><Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Metas Comerciais</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Acompanhamento de volume e faturamento</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Calendar className="w-4 h-4 text-zinc-400 ml-2" />
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-2 py-1.5 bg-transparent text-zinc-900 dark:text-white font-bold outline-none cursor-pointer text-sm">
              {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Botão de Edição Restrito ao Administrador */}
          {currentUser?.role === 'ADMIN' ? (
            !isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity text-sm">
                <Edit2 className="w-4 h-4" /> Editar Metas
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsEditing(false); fetchGoals(); }} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm">
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button onClick={handleSaveAllGoals} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSaving ? 'Salvando...' : 'Salvar Tudo'}
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-400">
              <ShieldAlert className="w-3.5 h-3.5" /> Modo Leitura
            </div>
          )}
        </div>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meta Anual Volume</span>
            <div className="text-2xl font-black text-zinc-900 dark:text-white">{totalAnnualTons.toLocaleString('pt-BR')} <span className="text-sm font-normal text-zinc-500">kg</span></div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meta Anual Receita</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalAnnualRevenue)}</div>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><DollarSign className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Tabela de Metas (Estilo Monolítico) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-wider">Mês</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-wider text-right">Meta (Kg)</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-wider text-right">Realizado (Kg)</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-wider text-right">% Vol</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-wider text-right">Meta (R$)</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-wider text-right">Realizado (R$)</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-wider text-right">% Fat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {MONTHS.map((monthName, index) => {
                  const monthNum = index + 1;
                  const goalTons = parseFloat(monthlyInputs[monthNum].tons) || 0;
                  const goalRevenue = parseFloat(monthlyInputs[monthNum].revenue) || 0;
                  
                  const realized = getMonthRealized(monthNum);
                  const weightProgress = goalTons > 0 ? (realized.weight / goalTons) * 100 : 0;
                  const revenueProgress = goalRevenue > 0 ? (realized.revenue / goalRevenue) * 100 : 0;

                  return (
                    <motion.tr 
                      key={monthNum}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-3 font-bold text-zinc-900 dark:text-zinc-200 text-sm">
                        {monthName}
                      </td>
                      
                      {/* Coluna Meta Volume */}
                      <td className="px-6 py-3 text-right">
                        {isEditing ? (
                          <input 
                            type="number" value={monthlyInputs[monthNum].tons} 
                            onChange={(e) => handleInputChange(monthNum, 'tons', e.target.value)}
                            className="w-24 px-2 py-1 text-right bg-white dark:bg-zinc-950 border border-indigo-300 dark:border-indigo-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {goalTons > 0 ? goalTons.toLocaleString('pt-BR') : '-'}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3 text-right text-sm font-bold text-zinc-900 dark:text-zinc-200">
                        {realized.weight > 0 ? realized.weight.toLocaleString('pt-BR') : '-'}
                      </td>

                      <td className={`px-6 py-3 text-right text-sm ${getProgressColor(weightProgress)}`}>
                        {goalTons > 0 ? `${weightProgress.toFixed(1)}%` : '-'}
                      </td>

                      {/* Coluna Meta Receita */}
                      <td className="px-6 py-3 text-right">
                        {isEditing ? (
                          <input 
                            type="number" value={monthlyInputs[monthNum].revenue} 
                            onChange={(e) => handleInputChange(monthNum, 'revenue', e.target.value)}
                            className="w-32 px-2 py-1 text-right bg-white dark:bg-zinc-950 border border-indigo-300 dark:border-indigo-700 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {goalRevenue > 0 ? formatCurrency(goalRevenue) : '-'}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3 text-right text-sm font-bold text-zinc-900 dark:text-zinc-200">
                        {realized.revenue > 0 ? formatCurrency(realized.revenue) : '-'}
                      </td>

                      <td className={`px-6 py-3 text-right text-sm ${getProgressColor(revenueProgress)}`}>
                        {goalRevenue > 0 ? `${revenueProgress.toFixed(1)}%` : '-'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};