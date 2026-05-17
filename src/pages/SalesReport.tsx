import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Search, Filter, Layers, X, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { Sale, Entity, Installment } from '../types';

interface SalesReportProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  productLines: Entity[];
  setAllInstallments: React.Dispatch<React.SetStateAction<Installment[]>>;
}

export const SalesReport: React.FC<SalesReportProps> = ({ sales, setSales, productLines, setAllInstallments }) => {
  const [filters, setFilters] = useState({ search: '', status: 'all', line: 'all' });
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [saleInstallments, setSaleInstallments] = useState<Record<number, Installment[]>>({});

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : '-';

  const getSaleStatus = (sale: Sale) => {
    if (sale.numero_nf && sale.numero_nf.trim() !== '') return { label: 'CUMPRIDO', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (!sale.data_finalizacao_produto) return { label: 'PENDENTE', color: 'bg-zinc-50 text-zinc-600 border-zinc-200' };

    const [year, month, day] = sale.data_finalizacao_produto.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'ATRASADO', color: 'bg-red-50 text-red-700 border-red-100' };
    if (diffDays > 5) return { label: 'NO PRAZO', color: 'bg-blue-50 text-blue-700 border-blue-100' };
    return { label: 'ALERTA', color: 'bg-amber-50 text-amber-700 border-amber-100' };
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Excluir esta venda definitivamente?')) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      setSales(sales.filter(s => s.id !== id));
      setAllInstallments(prev => prev.filter(i => i.sale_id !== id));
    } catch (err) { alert('Erro ao excluir venda'); }
  };

  const toggleExpandSale = async (saleId: number) => {
    if (expandedSaleId === saleId) { setExpandedSaleId(null); return; }
    setExpandedSaleId(saleId);
    if (!saleInstallments[saleId]) {
      try {
        const res = await fetch(`/api/sales/${saleId}/installments`);
        if (res.ok) {
          const data = await res.json();
          setSaleInstallments(prev => ({ ...prev, [saleId]: data }));
        }
      } catch (err) { console.error(err); }
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = (sale.cliente?.toLowerCase() || '').includes(filters.search.toLowerCase()) || 
                          (sale.produto?.toLowerCase() || '').includes(filters.search.toLowerCase()) || 
                          (sale.op_producao?.toLowerCase() || '').includes(filters.search.toLowerCase()) || 
                          (sale.numero_nf?.toLowerCase() || '').includes(filters.search.toLowerCase());
    const status = getSaleStatus(sale).label;
    const matchesStatus = filters.status === 'all' || status === filters.status;
    const matchesLine = filters.line === 'all' || sale.linha_produto === filters.line;
    return matchesSearch && matchesStatus && matchesLine;
  });

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> Relatório Geral de Vendas
            </h2>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
              {filteredSales.length} de {sales.length} Pedidos encontrados
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Buscar por cliente, produto, OP ou NF..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none text-zinc-900 dark:text-white" />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none text-zinc-900 dark:text-white">
                <option value="all">Todos Status</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="ALERTA">Alerta</option>
                <option value="NO PRAZO">No Prazo</option>
                <option value="CUMPRIDO">Cumprido</option>
              </select>
            </div>
            <div className="relative">
              <Layers className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select value={filters.line} onChange={e => setFilters(p => ({ ...p, line: e.target.value }))} className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none text-zinc-900 dark:text-white">
                <option value="all">Todas Linhas</option>
                {productLines.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <button onClick={() => setFilters({ search: '', status: 'all', line: 'all' })} className="text-sm font-medium text-indigo-600 flex items-center justify-center gap-1 hover:text-indigo-700">
              <X className="w-4 h-4" /> Limpar Filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Cliente / Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">OP / NF</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Datas</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Valores</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Comissão</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredSales.map(sale => (
                <React.Fragment key={sale.id}>
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 dark:text-white">{sale.cliente}</div>
                      <div className="text-xs text-zinc-500">{sale.produto} ({sale.linha_produto})</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border dark:border-zinc-700 dark:text-zinc-400">{sale.payment_method}</span>
                        {sale.payment_method === 'A PRAZO' && (
                          <button onClick={() => toggleExpandSale(sale.id)} className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                            {expandedSaleId === sale.id ? 'Ocultar' : 'Ver Parcelas'} <ChevronRight className={`w-2.5 h-2.5 transform transition-transform ${expandedSaleId === sale.id ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      OP: {sale.op_producao}<br/>
                      <span className="text-xs text-zinc-500 font-medium">NF: {sale.numero_nf || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">
                      Emissão: {formatDate(sale.data_emissao_pedido)}<br/>
                      Prod: {formatDate(sale.data_finalizacao_produto)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getSaleStatus(sale).color}`}>
                        {getSaleStatus(sale).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold dark:text-white">{formatCurrency(sale.valor_total_nf)}</div>
                      <div className="text-xs text-zinc-500">{sale.peso_finalizado || 0}kg / {sale.qtd_sacos_finalizado || 0} sc</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(sale.commission_value)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteSale(sale.id)} className="p-2 text-red-400 hover:text-red-500 transition-colors" title="Excluir Venda">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Sub-tabela expansível de parcelas da venda */}
                  {expandedSaleId === sale.id && saleInstallments[sale.id] && (
                    <tr>
                      <td colSpan={7} className="px-8 py-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-l-4 border-indigo-500">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          {saleInstallments[sale.id].map((inst) => (
                            <div key={inst.id} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm">
                              <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">Parcela #{inst.installment_number}</div>
                              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">{formatCurrency(inst.value)}</div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">Vence em: {formatDate(inst.due_date)}</div>
                              <div className="mt-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${inst.payment_date ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                  {inst.payment_date ? `Pago em ${formatDate(inst.payment_date)}` : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">Nenhuma venda encontrada com os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};