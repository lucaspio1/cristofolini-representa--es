import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, Filter, RefreshCw, Calendar, Download, Edit2, Check, X, ShoppingBag
} from 'lucide-react';
import { Sale, Entity, ClientProduct, Installment } from '../types';

interface SalesReportProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  clients: Entity[];
  productLines: Entity[];
  setAllInstallments: React.Dispatch<React.SetStateAction<Installment[]>>;
}

export const SalesReport: React.FC<SalesReportProps> = ({ sales, setSales, clients, productLines, setAllInstallments }) => {
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estados de Edição (Modal de Formuário)
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saleClientProducts, setSaleClientProducts] = useState<ClientProduct[]>([]);
  const [previewInstallments, setPreviewInstallments] = useState<Installment[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    cliente: '', cotacao: '', op_producao: '', data_emissao_pedido: '', 
    op_referencia: '', produto: '', peso_solicitado: '', qtd_sacos_solicitado: '', 
    linha_produto: '', data_finalizacao_produto: '', data_entrega_cliente: '', 
    ordem_compra: '', comissao_percentage: '', numero_nf: '', peso_finalizado: '', 
    qtd_sacos_finalizado: '', data_faturamento: '', valor_total_nf: '', 
    fator_kilo: '', payment_method: 'À VISTA' as 'À VISTA' | 'A PRAZO', installment_config: '30,60,90'
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR') : '-';
  
  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';
    return dateString.includes('T') ? dateString.split('T')[0] : dateString;
  };

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

  // Ativação do formulário de edição com dados pré-preenchidos e limpos do fuso do MySQL
  const handleEditClick = async (sale: Sale) => {
    setEditingSaleId(sale.id);
    setFormData({
      cliente: sale.cliente || '', 
      cotacao: sale.cotacao || '', 
      op_producao: sale.op_producao || '', 
      data_emissao_pedido: formatDateForInput(sale.data_emissao_pedido),
      op_referencia: sale.op_referencia || '', 
      produto: sale.produto || '', 
      peso_solicitado: sale.peso_solicitado?.toString() || '',
      qtd_sacos_solicitado: sale.qtd_sacos_solicitado?.toString() || '', 
      linha_produto: sale.linha_produto || '', 
      data_finalizacao_produto: formatDateForInput(sale.data_finalizacao_produto),
      data_entrega_cliente: formatDateForInput(sale.data_entrega_cliente), 
      ordem_compra: sale.ordem_compra || '', 
      comissao_percentage: sale.comissao_percentage?.toString() || '',
      numero_nf: sale.numero_nf || '', 
      peso_finalizado: sale.peso_finalizado?.toString() || '', 
      qtd_sacos_finalizado: sale.qtd_sacos_finalizado?.toString() || '',
      data_faturamento: formatDateForInput(sale.data_faturamento), 
      valor_total_nf: sale.valor_total_nf?.toString() || '', 
      fator_kilo: sale.fator_kilo?.toString() || '',
      payment_method: sale.payment_method || 'À VISTA', 
      installment_config: '30,60,90'
    });

    try {
      const res = await fetch(`/api/sales/${sale.id}/installments`);
      if (res.ok) {
        const data = await res.json();
        setPreviewInstallments(data);
        if (data.length > 0 && sale.data_faturamento) {
          const baseDate = new Date(sale.data_faturamento);
          const intervals = data.map((inst: Installment) => Math.round((new Date(inst.due_date).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)));
          setFormData(prev => ({ ...prev, installment_config: intervals.join(',') }));
        }
      }
    } catch (err) { console.error(err); }

    if (sale.cliente) {
      const client = clients.find(c => c.name === sale.cliente);
      if (client) {
        try {
          const res = await fetch(`/api/clients/${client.id}/products`);
          if (res.ok) setSaleClientProducts(await res.json());
        } catch (err) { console.error(err); }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    if (name === 'cliente') {
      if (value) {
        const client = clients.find(c => c.name === value);
        if (client) {
          fetch(`/api/clients/${client.id}/products`)
            .then(res => res.ok ? res.json() : [])
            .then(data => setSaleClientProducts(data))
            .catch(err => console.error(err));
        }
      } else {
        setSaleClientProducts([]);
      }
      setFormData(prev => ({ ...prev, produto: '' }));
    }

    if (['valor_total_nf', 'data_faturamento', 'payment_method', 'installment_config'].includes(name)) {
      calculateInstallments(newFormData);
    }
  };

  const calculateInstallments = (data: typeof formData) => {
    if (data.payment_method !== 'A PRAZO' || !data.valor_total_nf || !data.data_faturamento || !data.installment_config) {
      setPreviewInstallments([]);
      return;
    }
    const total = parseFloat(data.valor_total_nf);
    const intervals = data.installment_config.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (intervals.length === 0) { setPreviewInstallments([]); return; }

    const baseDate = new Date(data.data_faturamento);
    const baseValue = Math.round((total / intervals.length) * 100) / 100;
    const diff = Math.round((total - (baseValue * intervals.length)) * 100) / 100;

    const installments: Installment[] = intervals.map((days, index) => {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + days);
      const finalValue = index === 0 ? Math.round((baseValue + diff) * 100) / 100 : baseValue;
      return { 
        installment_number: index + 1, 
        due_date: dueDate.toISOString().split('T')[0], 
        value: finalValue 
      };
    });
    setPreviewInstallments(installments);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSaleId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/sales/${editingSaleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          peso_solicitado: parseFloat(formData.peso_solicitado) || 0,
          qtd_sacos_solicitado: parseInt(formData.qtd_sacos_solicitado) || 0,
          comissao_percentage: parseFloat(formData.comissao_percentage) || 0,
          peso_finalizado: parseFloat(formData.peso_finalizado) || 0,
          qtd_sacos_finalizado: parseInt(formData.qtd_sacos_finalizado) || 0,
          valor_total_nf: parseFloat(formData.valor_total_nf) || 0,
          fator_kilo: (parseFloat(formData.peso_finalizado) > 0) ? (parseFloat(formData.valor_total_nf) || 0) / parseFloat(formData.peso_finalizado) : 0,
          installments: previewInstallments
        }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar venda');
      const updatedSale = await response.json();
      
      setSales(sales.map(s => s.id === editingSaleId ? updatedSale : s));
      setEditingSaleId(null);

      const instRes = await fetch('/api/installments');
      if (instRes.ok) setAllInstallments(await instRes.json());
    } catch (err) {
      alert('Erro ao salvar modificações da venda');
    } finally {
      setIsSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm(''); setSelectedClient(''); setSelectedLine('');
    setStatusFilter(''); setStartDate(''); setEndDate('');
  };

  // Filtragem Lógica do Relatório
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.op_producao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sale.numero_nf && sale.numero_nf.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          sale.produto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = selectedClient === '' || sale.cliente === selectedClient;
    const matchesLine = selectedLine === '' || sale.linha_produto === selectedLine;
    const matchesStatus = statusFilter === '' || getSaleStatus(sale).label === statusFilter;
    
    let matchesDates = true;
    if (startDate || endDate) {
      const emiDate = sale.data_emissao_pedido ? new Date(sale.data_emissao_pedido.split('T')[0]).getTime() : 0;
      if (startDate) {
        const start = new Date(startDate).getTime();
        if (emiDate < start) matchesDates = false;
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        if (emiDate > end) matchesDates = false;
      }
    }
    return matchesSearch && matchesClient && matchesLine && matchesStatus && matchesDates;
  });

  const currentCommissionPreview = (parseFloat(formData.valor_total_nf) || 0) * (parseFloat(formData.comissao_percentage) || 0) / 100;
  const currentFatorKilo = (parseFloat(formData.peso_finalizado) > 0) ? (parseFloat(formData.valor_total_nf) || 0) / parseFloat(formData.peso_finalizado) : 0;

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Cabeçalho */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Relatório Geral de Vendas
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={clearFilters} className="p-2.5 text-zinc-500 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors"><RefreshCw className="w-4 h-4" /> Limpar</button>
            <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90"><Download className="w-4 h-4" /> Exportar Planilha</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1"><Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="OP, NF ou Produto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium dark:text-white outline-none"><option value="">Todos Clientes</option>{clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          <div><select value={selectedLine} onChange={e => setSelectedLine(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium dark:text-white outline-none"><option value="">Todas Linhas</option>{productLines.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
          <div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium dark:text-white outline-none"><option value="">Todos Status</option><option value="PENDENTE">PENDENTE</option><option value="NO PRAZO">NO PRAZO</option><option value="ALERTA">ALERTA</option><option value="ATRASADO">ATRASADO</option><option value="CUMPRIDO">CUMPRIDO</option></select></div>
          <div className="relative"><Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" /><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-8 pr-2 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-medium dark:text-white outline-none" /></div>
          <div className="relative"><Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" /><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-8 pr-2 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-medium dark:text-white outline-none" /></div>
        </div>
      </div>

      {/* Tabela do Relatório Principal */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Cliente / Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">OP / NF</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Datas</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Valores Totais</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900 dark:text-white">{sale.cliente}</div>
                    <div className="text-xs text-zinc-500">{sale.produto} ({sale.linha_produto})</div>
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
                  <td className="px-6 py-4 text-center">
                    <button type="button" onClick={() => handleEditClick(sale)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Editar Venda"><Edit2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">Nenhuma venda corresponde aos filtros definidos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORMULÁRIO FLUTUANTE EM MODAL (Mesma estrutura visual do criar venda) */}
      <AnimatePresence>
        {editingSaleId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-5xl shadow-2xl flex flex-col relative max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20 shrink-0">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl"><Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                  Editar Lançamento de Venda
                </h3>
                <button type="button" onClick={() => setEditingSaleId(null)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                <form onSubmit={handleUpdateSale} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Cliente *</label>
                      <select name="cliente" required value={formData.cliente} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none">
                        <option value="">Selecione um cliente</option>
                        {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Cotação *</label>
                      <input type="text" name="cotacao" required value={formData.cotacao} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">OP Produção *</label>
                      <input type="text" name="op_producao" required value={formData.op_producao} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Data Emissão *</label>
                      <input type="date" name="data_emissao_pedido" required value={formData.data_emissao_pedido} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">OP Referência</label>
                      <input type="text" name="op_referencia" value={formData.op_referencia} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Produto *</label>
                      <div className="flex gap-2 items-center">
                        <select name="produto" required disabled={!formData.cliente} value={formData.produto} onChange={handleInputChange} className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none disabled:opacity-50">
                          <option value="">{formData.cliente ? 'Selecione um produto' : 'Selecione um cliente'}</option>
                          {saleClientProducts.map(p => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
                        </select>
                        {formData.produto && saleClientProducts.find(p => p.product_name === formData.produto)?.image_url && (
                          <div onClick={() => setViewingImage(saleClientProducts.find(p => p.product_name === formData.produto)?.image_url || null)} className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white cursor-zoom-in flex-shrink-0">
                            <img src={saleClientProducts.find(p => p.product_name === formData.produto)?.image_url} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Peso (kg) *</label>
                      <input type="number" name="peso_solicitado" required value={formData.peso_solicitado} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Qtd Sacos</label>
                      <input type="number" name="qtd_sacos_solicitado" value={formData.qtd_sacos_solicitado} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Linha Produto *</label>
                      <select name="linha_produto" required value={formData.linha_produto} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none">
                        <option value="">Selecione uma linha</option>
                        {productLines.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Data Final. Prod. *</label>
                      <input type="date" name="data_finalizacao_produto" required value={formData.data_finalizacao_produto} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Data Entrega *</label>
                      <input type="date" name="data_entrega_cliente" required value={formData.data_entrega_cliente} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Ordem Compra</label>
                      <input type="text" name="ordem_compra" value={formData.ordem_compra} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Comissão (%)</label>
                      <input type="number" step="0.1" name="comissao_percentage" value={formData.comissao_percentage} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Número NF</label>
                      <input type="text" name="numero_nf" value={formData.numero_nf} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Peso Finalizado</label>
                      <input type="number" step="0.1" name="peso_finalizado" value={formData.peso_finalizado} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Sacos Finalizado</label>
                      <input type="number" name="qtd_sacos_finalizado" value={formData.qtd_sacos_finalizado} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Data Faturamento</label>
                      <input type="date" name="data_faturamento" value={formData.data_faturamento} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Valor Total NF</label>
                      <input type="number" step="0.01" name="valor_total_nf" value={formData.valor_total_nf} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Comissão Prev.</label>
                      <div className="w-full px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold dark:bg-zinc-800">{formatCurrency(currentCommissionPreview)}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Fator Kilo</label>
                      <div className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 font-bold dark:bg-zinc-800">{formatCurrency(currentFatorKilo)}</div>
                    </div>

                    <div className="lg:col-span-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Forma de Pagamento</label>
                        <div className="flex gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <button type="button" onClick={() => handleInputChange({ target: { name: 'payment_method', value: 'À VISTA' } } as any)} className={`px-3 py-1 text-xs font-bold rounded-md ${formData.payment_method === 'À VISTA' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}>À VISTA</button>
                          <button type="button" onClick={() => handleInputChange({ target: { name: 'payment_method', value: 'A PRAZO' } } as any)} className={`px-3 py-1 text-xs font-bold rounded-md ${formData.payment_method === 'A PRAZO' ? 'bg-indigo-600 text-white' : 'text-zinc-500'}`}>A PRAZO</button>
                        </div>
                      </div>
                      {formData.payment_method === 'A PRAZO' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Intervalos (ex: 30,60,90)</label>
                            <input type="text" name="installment_config" value={formData.installment_config} onChange={handleInputChange} className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none" />
                          </div>
                          {previewInstallments.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {previewInstallments.map((inst, idx) => (
                                <div key={idx} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                                  <div className="flex justify-between"><span className="text-[10px] font-bold text-indigo-600">PARCELA {inst.installment_number}</span><span className="text-[10px] text-zinc-400">{formatDate(inst.due_date)}</span></div>
                                  <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{formatCurrency(inst.value)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <button type="button" onClick={() => setEditingSaleId(null)} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold py-3 px-8 rounded-xl transition-colors dark:bg-zinc-800 dark:text-white">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20 transition-all">
                      {isSaving ? 'Salvando...' : <><Check className="w-5 h-5" /> Salvar Modificações</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Lightbox de Zoom */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div onClick={() => setViewingImage(null)} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <img src={viewingImage} className="max-w-full max-h-[85vh] rounded-xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};