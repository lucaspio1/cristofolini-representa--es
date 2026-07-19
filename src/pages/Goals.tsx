import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, DollarSign, TrendingUp, Calendar, Check, X, Edit2, ShieldAlert, RefreshCw, BarChart3 } from 'lucide-react';
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
  currentUser: any;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Goals: React.FC<GoalsProps> = ({ sales, currentUser }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Controle de Edição e Salvamento Sequencial
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // O estado agora armazena strings formatadas com pontos para melhor legibilidade visual
  const [monthlyInputs, setMonthlyInputs] = useState<Record<number, { tons: string; revenue: string }>>(
    MONTHS.reduce((acc, _, index) => ({ ...acc, [index + 1]: { tons: '', revenue: '' } }), {})
  );

  // Auxiliares de Formatação para digitação amigável de números grandes
  const formatUserTyping = (value: string) => {
    const onlyDigits = value.replace(/\D/g, '');
    if (!onlyDigits) return '';
    return Number(onlyDigits).toLocaleString('pt-BR');
  };

  const parseFormattedToNumber = (value: string) => {
    const cleanString = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanString) || 0;
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        
        // Garante que os dados recebidos são uma lista válida antes de filtrar
        const safeData: Goal[] = Array.isArray(data) ? data : [];
        const yearGoals = safeData.filter(g => g.year === selectedYear);
        
        const updatedInputs = MONTHS.reduce((acc, _, index) => {
          const monthNum = index + 1;
          const foundGoal = yearGoals.find(g => g.month === monthNum);
          return {
            ...acc,
            [monthNum]: {
              // Já carrega do banco aplicando a formatação visual bonita por padrão
              tons: foundGoal ? Number(foundGoal.goal_tons).toLocaleString('pt-BR') : '',
              revenue: foundGoal ? Number(foundGoal.goal_revenue).toLocaleString('pt-BR') : ''
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
    setIsEditing(false);
  }, [selectedYear]);

  const handleInputChange = (month: number, field: 'tons' | 'revenue', value: string) => {
    setMonthlyInputs(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: formatUserTyping(value) // Formata com pontos de milhar em tempo real
      }
    }));
  };

  // SALVAMENTO SEQUENCIAL: Evita travamento e tela branca no MySQL
  const handleSaveAllGoals = async () => {
    setIsSaving(true);
    try {
      // Salva de forma ordenada mês por mês para não sobrecarregar as travas de índice do banco
      for (let index = 0; index < MONTHS.length; index++) {
        const monthNum = index + 1;
        const inputs = monthlyInputs[monthNum];

        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: selectedYear,
            month: monthNum,
            goal_tons: parseFormattedToNumber(inputs.tons),
            goal_revenue: parseFormattedToNumber(inputs.revenue)
          })
        });
      }

      await fetchGoals();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as metas com segurança. Verifique a conexão.');
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

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (progress >= 80) return 'text-amber-600 dark:text-amber-400 font-bold';
    if (progress > 0) return 'text-red-600 dark:text-red-400 font-bold';
    return 'text-zinc-400 dark:text-zinc-500';
  };

  // Cálculos Anuais de Metas
  const totalAnnualTonsGoal = Object.values(monthlyInputs).reduce((acc, curr) => acc + parseFormattedToNumber(curr.tons), 0);
  const totalAnnualRevenueGoal = Object.values(monthlyInputs).reduce((acc, curr) => acc + parseFormattedToNumber(curr.revenue), 0);

  // Cálculos Anuais do Realizado Totalizador (Soma de todos os meses do ano selecionado)
  const totalAnnualRealized = MONTHS.reduce((acc, _, index) => {
    const monthRealized = getMonthRealized(index + 1);
    acc.weight += monthRealized.weight;
    acc.revenue += monthRealized.revenue;
    return acc;
  }, { weight: 0, revenue: 0 });

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Controle */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Metas Comerciais</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Gerenciamento de diretrizes e faturamento anual</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Calendar className="w-4 h-4 text-zinc-400 ml-2" />
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-2 py-1.5 bg-transparent text-zinc-900 dark:text-white font-bold outline-none cursor-pointer text-sm bg-white dark:bg-zinc-900 rounded-lg">
              {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {currentUser?.role === 'ADMIN' ? (
            !isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-all text-sm cursor-pointer shadow-sm">
                <Edit2 className="w-4 h-4" /> Editar Metas
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsEditing(false); fetchGoals(); }} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm cursor-pointer">
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button onClick={handleSaveAllGoals} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 cursor-pointer shadow-md">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSaving ? 'Salvando...' : 'Salvar Tudo'}
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 select-none">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" /> Apenas Leitura
            </div>
          )}
        </div>
      </div>

      {/* Grid de Cards de Resumo Integrados: Meta do lado do Realizado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Bloco de Volume */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Meta Anual Volume</span>
            <div className="text-xl font-black text-zinc-900 dark:text-white">{totalAnnualTonsGoal.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">kg</span></div>
          </div>
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 rounded-xl"><Target className="w-5 h-5" /></div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">Volume Já Realizado</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalAnnualRealized.weight.toLocaleString('pt-BR')} <span className="text-xs font-normal text-zinc-400">kg</span></div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
        </div>

        {/* Bloco de Receita */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Meta Anual Receita</span>
            <div className="text-xl font-black text-zinc-900 dark:text-white">{formatCurrency(totalAnnualRevenueGoal)}</div>
          </div>
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 rounded-xl"><DollarSign className="w-5 h-5" /></div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Faturamento Realizado</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalAnnualRealized.revenue)}</div>
          </div>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><BarChart3 className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Tabela Estruturada com Colunas Fixas de Tamanho Definido */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            {/* O uso de table-fixed garante que as colunas fiquem perfeitamente travadas */}
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-zinc-50/60 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 select-none">
                  <th className="w-[16%] px-6 py-4 text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Mês</th>
                  <th className="w-[14%] px-6 py-4 text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">Meta (Kg)</th>
                  <th className="w-[14%] px-6 py-4 text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">Realizado (Kg)</th>
                  <th className="w-[12%] px-6 py-4 text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">% Vol</th>
                  <th className="w-[16%] px-6 py-4 text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">Meta (R$)</th>
                  <th className="w-[14%] px-6 py-4 text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">Realizado (R$)</th>
                  <th className="w-[12%] px-6 py-4 text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">% Fat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {MONTHS.map((monthName, index) => {
                  const monthNum = index + 1;
                  const goalTons = parseFormattedToNumber(monthlyInputs[monthNum].tons);
                  const goalRevenue = parseFormattedToNumber(monthlyInputs[monthNum].revenue);
                  
                  const realized = getMonthRealized(monthNum);
                  const weightProgress = goalTons > 0 ? (realized.weight / goalTons) * 100 : 0;
                  const revenueProgress = goalRevenue > 0 ? (realized.revenue / goalRevenue) * 100 : 0;

                  return (
                    <tr key={monthNum} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-zinc-900 dark:text-zinc-200 text-sm truncate">
                        {monthName}
                      </td>
                      
                      {/* Meta Kg */}
                      <td className="px-6 py-3.5 text-right">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={monthlyInputs[monthNum].tons} 
                            onChange={(e) => handleInputChange(monthNum, 'tons', e.target.value)}
                            className="w-full max-w-[120px] px-2 py-1 text-right bg-zinc-50 dark:bg-zinc-950 border border-indigo-300 dark:border-indigo-800 rounded-lg text-sm outline-none font-bold focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                          />
                        ) : (
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {goalTons > 0 ? goalTons.toLocaleString('pt-BR') : '-'}
                          </span>
                        )}
                      </td>

                      {/* Realizado Kg */}
                      <td className="px-6 py-3.5 text-right text-sm font-bold text-zinc-800 dark:text-zinc-300 truncate">
                        {realized.weight > 0 ? realized.weight.toLocaleString('pt-BR') : '-'}
                      </td>

                      {/* % Progresso Vol */}
                      <td className={`px-6 py-3.5 text-right text-sm ${getProgressColor(weightProgress)}`}>
                        {goalTons > 0 ? `${weightProgress.toFixed(1)}%` : '-'}
                      </td>

                      {/* Meta R$ */}
                      <td className="px-6 py-3.5 text-right">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={monthlyInputs[monthNum].revenue} 
                            onChange={(e) => handleInputChange(monthNum, 'revenue', e.target.value)}
                            className="w-full max-w-[140px] px-2 py-1 text-right bg-zinc-50 dark:bg-zinc-950 border border-indigo-300 dark:border-indigo-800 rounded-lg text-sm outline-none font-bold focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
                          />
                        ) : (
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {goalRevenue > 0 ? formatCurrency(goalRevenue) : '-'}
                          </span>
                        )}
                      </td>

                      {/* Realizado R$ */}
                      <td className="px-6 py-3.5 text-right text-sm font-bold text-zinc-800 dark:text-zinc-300 truncate">
                        {realized.revenue > 0 ? formatCurrency(realized.revenue) : '-'}
                      </td>

                      {/* % Progresso Fat */}
                      <td className={`px-6 py-3.5 text-right text-sm ${getProgressColor(revenueProgress)}`}>
                        {goalRevenue > 0 ? `${revenueProgress.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
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