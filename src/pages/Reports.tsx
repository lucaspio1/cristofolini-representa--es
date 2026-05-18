import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Search, Check, AlertCircle, History, Layers, DollarSign, TrendingUp } from 'lucide-react';
import { Installment } from '../types';
import { api } from '../services/api';

interface ReportsProps {
  allInstallments: Installment[];
  setAllInstallments: React.Dispatch<React.SetStateAction<Installment[]>>;
}

export const Reports: React.FC<ReportsProps> = ({ allInstallments, setAllInstallments }) => {
  const [reportFilters, setReportFilters] = useState({
    cliente: '',
    nf: '',
    status: 'all' as 'all' | 'PAGO' | 'ATRASADO' | 'PENDENTE',
    startDate: '',
    endDate: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getInstallmentStatus = (inst: Installment) => {
    if (inst.payment_date) return { label: 'PAGO', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    
    const dueDate = new Date(inst.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) return { label: 'ATRASADO', color: 'bg-red-50 text-red-700 border-red-100' };
    return { label: 'PENDENTE', color: 'bg-zinc-50 text-zinc-600 border-zinc-200' };
  };

  const filteredInstallments = allInstallments.filter(inst => {
    const matchesCliente = (inst.cliente || '').toLowerCase().includes(reportFilters.cliente.toLowerCase());
    const matchesNF = (inst.numero_nf || '').toLowerCase().includes(reportFilters.nf.toLowerCase());
    const status = getInstallmentStatus(inst).label;
    const matchesStatus = reportFilters.status === 'all' || status === reportFilters.status;
    
    let matchesDate = true;
    if (reportFilters.startDate) {
      matchesDate = matchesDate && new Date(inst.due_date) >= new Date(reportFilters.startDate);
    }
    if (reportFilters.endDate) {
      const end = new Date(reportFilters.endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(inst.due_date) <= end;
    }
    
    return matchesCliente && matchesNF && matchesStatus && matchesDate;
  });

  const handleUpdateInstallmentPayment = async (installmentId: number, paymentDate: string) => {
    try {
      await api.updateInstallment(installmentId, paymentDate);
      setAllInstallments(prev => prev.map(inst => inst.id === installmentId ? { ...inst, payment_date: paymentDate } : inst));
    } catch (err) {
      alert('Erro ao atualizar pagamento');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white transition-colors">Relatório de Parcelas</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors"><Layers className="w-5 h-5 text-zinc-400 dark:text-zinc-500" /></div>
          </div>
          <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Total Parcelas</div>
          <div className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">{filteredInstallments.length}</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
          </div>
          <div className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">Pagas</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{filteredInstallments.filter(i => i.payment_date).length}</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-red-500/5 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
          </div>
          <div className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.2em] mb-1">Atrasadas</div>
          <div className="text-xl font-black text-red-600 dark:text-red-400 tracking-tighter">{filteredInstallments.filter(i => getInstallmentStatus(i).label === 'ATRASADO').length}</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-amber-500/5 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors"><History className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
          </div>
          <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Pendentes</div>
          <div className="text-xl font-black text-zinc-600 dark:text-zinc-400 tracking-tighter">{filteredInstallments.filter(i => getInstallmentStatus(i).label === 'PENDENTE').length}</div>
        </motion.div>

        <motion.div whileHover={{ y: -4, scale: 1.01 }} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-indigo-500/20 shadow-xl shadow-indigo-500/10 sm:col-span-2 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><DollarSign className="w-32 h-32 text-indigo-600" /></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-indigo-50 rounded-2xl"><DollarSign className="w-6 h-6 text-indigo-600" /></div>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Financeiro Total</div>
            </div>
            <div className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Valor Total</div>
            <div className="text-5xl font-black text-indigo-600 tracking-tighter leading-none">
              {formatCurrency(filteredInstallments.reduce((acc, i) => acc + (Number(i.value) || 0), 0))}
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4, scale: 1.01 }} className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/10 sm:col-span-2 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><TrendingUp className="w-32 h-32 text-emerald-600" /></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Comissões Previstas</div>
            </div>
            <div className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Total Comissão</div>
            <div className="text-5xl font-black text-emerald-600 tracking-tighter leading-none">
              {formatCurrency(filteredInstallments.reduce((acc, i) => acc + ((Number(i.value) || 0) * ((Number(i.comissao_percentage) || 0) / 100)), 0))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Detalhamento de Parcelas
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" placeholder="Filtrar Cliente..." value={reportFilters.cliente}
                  onChange={(e) => setReportFilters({ ...reportFilters, cliente: e.target.value.toUpperCase() })}
                  className="pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-40"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" placeholder="Filtrar NF..." value={reportFilters.nf}
                  onChange={(e) => setReportFilters({ ...reportFilters, nf: e.target.value.toUpperCase() })}
                  className="pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-32"
                />
              </div>
              <select 
                value={reportFilters.status}
                onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value as any })}
                className="px-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="PAGO">PAGO</option>
                <option value="ATRASADO">ATRASADO</option>
                <option value="PENDENTE">PENDENTE</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Período:</span>
              <input 
                type="date" value={reportFilters.startDate} onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 rounded-lg outline-none"
              />
              <span className="text-zinc-400">até</span>
              <input 
                type="date" value={reportFilters.endDate} onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 rounded-lg outline-none"
              />
              {(reportFilters.startDate || reportFilters.endDate) && (
                <button onClick={() => setReportFilters({ ...reportFilters, startDate: '', endDate: '' })} className="text-xs text-indigo-600 font-bold ml-2">Limpar Período</button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">NF</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Parcela</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Vencimento</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Comissão</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredInstallments.map((inst) => (
                <tr key={inst.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                  <td className="px-8 py-5"><div className="font-black text-zinc-900 dark:text-white tracking-tight">{inst.cliente}</div></td>
                  <td className="px-8 py-5"><div className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg w-fit">{inst.numero_nf || '-'}</div></td>
                  <td className="px-8 py-5"><div className="text-xs font-bold text-zinc-400">#{inst.installment_number}</div></td>
                  <td className="px-8 py-5"><div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-300" />{formatDate(inst.due_date)}</div></td>
                  <td className="px-8 py-5"><div className="font-black text-zinc-900 dark:text-white">{formatCurrency(Number(inst.value) || 0)}</div></td>
                  <td className="px-8 py-5"><div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit">{formatCurrency((Number(inst.value) || 0) * ((Number(inst.comissao_percentage) || 0) / 100))}</div></td>
                  <td className="px-8 py-5"><span className={`px-3 py-1 rounded-xl text-[10px] font-black border tracking-widest ${getInstallmentStatus(inst).color}`}>{getInstallmentStatus(inst).label}</span></td>
                  <td className="px-8 py-5">
                    <input 
                      type="date" value={inst.payment_date || ''}
                      onChange={(e) => handleUpdateInstallmentPayment(inst.id!, e.target.value)}
                      className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 outline-none font-medium"
                    />
                  </td>
                </tr>
              ))}
              {filteredInstallments.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-400">Nenhuma parcela encontrada com os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};