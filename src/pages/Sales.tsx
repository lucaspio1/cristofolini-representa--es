import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, History, ChevronRight, Check, ZoomIn, AlertCircle, Calendar 
} from 'lucide-react';
import { Sale, Entity, ClientProduct, Installment } from '../types';

interface SalesProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  clients: Entity[];
  productLines: Entity[];
  setAllInstallments: React.Dispatch<React.SetStateAction<Installment[]>>;
}

export const Sales: React.FC<SalesProps> = ({ sales, setSales, clients, productLines, setAllInstallments }) => {
  const [formData, setFormData] = useState({
    cliente: '', cotacao: '', op_producao: '', data_emissao_pedido: '', 
    op_referencia: '', produto: '', peso_solicitado: '', qtd_sacos_solicitado: '', 
    linha_produto: '', data_finalizacao_produto: '', data_entrega_cliente: '', 
    ordem_compra: '', comissao_percentage: '', numero_nf: '', peso_finalizado: '', 
    qtd_sacos_finalizado: '', data_faturamento: '', valor_total_nf: '', 
    fator_kilo: '', payment_method: 'À VISTA' as 'À VISTA' | 'A PRAZO', installment_config: '30,60,90'
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);
  const [saleClientProducts, setSaleClientProducts] = useState<ClientProduct[]>([]);
  const [previewInstallments, setPreviewInstallments] = useState<Installment[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Estados adicionados para a expansão de parcelas no histórico
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [saleInstallments, setSaleInstallments] = useState<Record<number, Installment[]>>({});

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

  const getInstallmentStatus = (inst: Installment) => {
    if (inst.payment_date) return { label: 'PAGO', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    
    const dueDate = new Date(inst.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) return { label: 'ATRASADO', color: 'bg-red-50 text-red-700 border-red-100' };
    return { label: 'PENDENTE', color: 'bg-zinc-50 text-zinc-600 border-zinc-200' };
  };

  const toggleExpandSale = async (saleId: number) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }

    setExpandedSaleId(saleId);
    if (!saleInstallments[saleId]) {
      try {
        const res = await fetch(`/api/sales/${saleId}/installments`);
        if (res.ok) {
          const data = await res.json();
          setSaleInstallments(prev => ({ ...prev, [saleId]: data }));
        }
      } catch (err) {
        console.error('Erro ao buscar parcelas:', err);
      }
    }
  };

  const handleUpdateInstallmentPayment = async (installmentId: number, saleId: number, paymentDate: string) => {
    try {
      const res = await fetch(`/api/installments/${installmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_date: paymentDate })
      });
      if (res.ok) {
        setSaleInstallments(prev => ({
          ...prev,
          [saleId]: prev[saleId]?.map(inst => inst.id === installmentId ? { ...inst, payment_date: paymentDate } : inst) || []
        }));
        setAllInstallments(prev => prev.map(inst => inst.id === installmentId ? { ...inst, payment_date: paymentDate } : inst));
      }
    } catch (err) {
      alert('Erro ao atualizar pagamento');
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    if (name === 'cliente') {
      if (value) {
        const client = clients.find(c => c.name === value);
        if (client) {
          try {
            const res = await fetch(`/api/clients/${client.id}/products`);
            if (res.ok) setSaleClientProducts(await res.json());
          } catch (err) { console.error(err); }
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

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = [
      { key: 'cliente', label: 'Cliente' }, { key: 'cotacao', label: 'Cotação' }, { key: 'op_producao', label: 'OP de Produção' },
      { key: 'data_emissao_pedido', label: 'Data de Emissão do Pedido' }, { key: 'produto', label: 'Produto' },
      { key: 'peso_solicitado', label: 'Peso Solicitado' }, { key: 'linha_produto', label: 'Linha do Produto' },
      { key: 'data_finalizacao_produto', label: 'Data Finalizada da Produção' }, { key: 'data_entrega_cliente', label: 'Data de Entrega ao Cliente' }
    ];

    const missingFields = requiredFields.filter(f => !formData[f.key as keyof typeof formData]);
    if (missingFields.length > 0) return alert(`Campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);

    setIsAdding(true);
    try {
      const url = editingSaleId ? `/api/sales/${editingSaleId}` : '/api/sales';
      const response = await fetch(url, {
        method: editingSaleId ? 'PUT' : 'POST',
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

      if (!response.ok) throw new Error('Falha ao salvar');
      const savedSale = await response.json();
      
      if (editingSaleId) {
        setSales(sales.map(s => s.id === editingSaleId ? savedSale : s));
        setEditingSaleId(null);
      } else {
        setSales([savedSale, ...sales]);
      }
      
      setFormData({
        cliente: '', cotacao: '', op_producao: '', data_emissao_pedido: '', op_referencia: '', produto: '', peso_solicitado: '', qtd_sacos_solicitado: '', 
        linha_produto: '', data_finalizacao_produto: '', data_entrega_cliente: '', ordem_compra: '', comissao_percentage: '', numero_nf: '', peso_finalizado: '', 
        qtd_sacos_finalizado: '', data_faturamento: '', valor_total_nf: '', fator_kilo: '', payment_method: 'À VISTA', installment_config: '30,60,90'
      });
      setPreviewInstallments([]);
      setSaleClientProducts([]);

      const instRes = await fetch('/api/installments');
      if (instRes.ok) {
        setAllInstallments(await instRes.json());
      }
    } catch (err) { alert(err instanceof Error ? err.message : 'Erro ao salvar'); } finally { setIsAdding(false); }
  };

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Excluir esta venda?')) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      setSales(sales.filter(s => s.id !== id));
      setAllInstallments(prev => prev.filter(i => i.sale_id !== id));
    } catch (err) { alert('Erro ao excluir'); }
  };

  const currentCommissionPreview = (parseFloat(formData.valor_total_nf) || 0) * (parseFloat(formData.comissao_percentage) || 0) / 100;
  const currentFatorKilo = (parseFloat(formData.peso_finalizado) > 0) ? (parseFloat(formData.valor_total_nf) || 0) / parseFloat(formData.peso_finalizado) : 0;

  return (
    <div className="space-y-8">
      {/* Formulário de Venda */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
          {editingSaleId ? <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          {editingSaleId ? 'Editar Pedido / Venda' : 'Registrar Novo Pedido / Venda'}
        </h2>
        <form onSubmit={handleAddSale} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Cliente *</label>
              <select name="cliente" required value={formData.cliente} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors">
                <option value="">Selecione um cliente</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Cotação *</label>
              <input type="text" name="cotacao" required value={formData.cotacao} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">OP Produção *</label>
              <input type="text" name="op_producao" required value={formData.op_producao} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Data Emissão *</label>
              <input type="date" name="data_emissao_pedido" required value={formData.data_emissao_pedido} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">OP Referência</label>
              <input type="text" name="op_referencia" value={formData.op_referencia} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Produto *</label>
              <div className="flex gap-2 items-center">
                <select name="produto" required disabled={!formData.cliente} value={formData.produto} onChange={handleInputChange} className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50">
                  <option value="">{formData.cliente ? 'Selecione um produto' : 'Selecione um cliente primeiro'}</option>
                  {saleClientProducts.map(p => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
                </select>
                {formData.produto && saleClientProducts.find(p => p.product_name === formData.produto)?.image_url && (
                  <div onClick={() => setViewingImage(saleClientProducts.find(p => p.product_name === formData.produto)?.image_url || null)} className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white flex-shrink-0 cursor-zoom-in relative group/img">
                    <img src={saleClientProducts.find(p => p.product_name === formData.produto)?.image_url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 flex items-center justify-center transition-colors">
                      <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Peso (kg) *</label>
              <input type="number" name="peso_solicitado" required value={formData.peso_solicitado} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Qtd Sacos</label>
              <input type="number" name="qtd_sacos_solicitado" value={formData.qtd_sacos_solicitado} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Linha Produto *</label>
              <select name="linha_produto" required value={formData.linha_produto} onChange={handleInputChange} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
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
              <div className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold">{formatCurrency(currentCommissionPreview)}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Fator Kilo</label>
              <div className="w-full px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold">{formatCurrency(currentFatorKilo)}</div>
            </div>

            <div className="lg:col-span-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Forma de Pagamento</label>
                <div className="flex gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <button type="button" onClick={() => handleInputChange({ target: { name: 'payment_method', value: 'À VISTA' } } as any)} className={`px-3 py-1 text-xs font-bold rounded-md ${formData.payment_method === 'À VISTA' ? 'bg-indigo-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>À VISTA</button>
                  <button type="button" onClick={() => handleInputChange({ target: { name: 'payment_method', value: 'A PRAZO' } } as any)} className={`px-3 py-1 text-xs font-bold rounded-md ${formData.payment_method === 'A PRAZO' ? 'bg-indigo-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>A PRAZO</button>
                </div>
              </div>
              {formData.payment_method === 'A PRAZO' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Intervalos (ex: 30,60,90)</label>
                    <input type="text" name="installment_config" value={formData.installment_config} onChange={handleInputChange} className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl outline-none" />
                  </div>
                  {previewInstallments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {previewInstallments.map((inst, idx) => (
                        <div key={idx} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">PARCELA {inst.installment_number}</span>
                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{formatDate(inst.due_date)}</span>
                          </div>
                          <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{formatCurrency(inst.value)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            {editingSaleId && <button type="button" onClick={() => setEditingSaleId(null)} className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold py-3 px-8 rounded-xl transition-all">Cancelar</button>}
            <button type="submit" disabled={isAdding} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
              {isAdding ? 'Processando...' : <>{editingSaleId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {editingSaleId ? 'Salvar' : 'Registrar'}</>}
            </button>
          </div>
        </form>
      </div>

      {/* Histórico e Tabela Estilizada */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Últimos 10 Pedidos Lançados
          </h2>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
            Cadastro Rápido
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 transition-colors">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cliente / Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">OP / NF</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Datas</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Valores</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Comissão</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 transition-colors">
              <AnimatePresence>
                {sales.slice(0, 10).map((sale) => (
                  <React.Fragment key={sale.id}>
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-zinc-900 dark:text-white transition-colors">{sale.cliente || 'Consumidor'}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
                            {sale.produto}
                            {sale.linha_produto && <span> ({sale.linha_produto})</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors ${sale.payment_method === 'A PRAZO' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'}`}>
                              {sale.payment_method}
                            </span>
                            {sale.payment_method === 'A PRAZO' && (
                              <button 
                                type="button"
                                onClick={() => toggleExpandSale(sale.id)}
                                className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 transition-colors"
                              >
                                {expandedSaleId === sale.id ? 'Ocultar Parcelas' : 'Ver Parcelas'}
                                <ChevronRight className={`w-2.5 h-2.5 transition-transform ${expandedSaleId === sale.id ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {sale.op_producao && <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">OP: {sale.op_producao}</div>}
                        {sale.numero_nf && <div className="text-xs text-zinc-500 dark:text-zinc-400 transition-colors">NF: {sale.numero_nf}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {sale.data_emissao_pedido && <div className="text-xs text-zinc-500 dark:text-zinc-400 transition-colors">Emissão: {formatDate(sale.data_emissao_pedido)}</div>}
                        {sale.data_finalizacao_produto && <div className="text-xs text-zinc-500 dark:text-zinc-400 transition-colors">Produção: {formatDate(sale.data_finalizacao_produto)}</div>}
                        {sale.data_entrega_cliente && <div className="text-xs text-zinc-500 dark:text-zinc-400 transition-colors">Entrega: {formatDate(sale.data_entrega_cliente)}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = getSaleStatus(sale);
                          if (!status.label) return null;
                          return (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sale.valor_total_nf > 0 && <div className="font-bold text-zinc-900 dark:text-white transition-colors">{formatCurrency(sale.valor_total_nf)}</div>}
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
                          {sale.peso_finalizado > 0 && (
                            <span className={
                              sale.peso_solicitado > 0 && 
                              Math.abs((sale.peso_finalizado || 0) - sale.peso_solicitado) > (sale.peso_solicitado * 0.1)
                              ? 'text-red-600 dark:text-red-400 font-bold' 
                              : ''
                            }>
                              {sale.peso_finalizado}kg
                            </span>
                          )}
                          {sale.qtd_sacos_finalizado > 0 && <span> / {sale.qtd_sacos_finalizado} sacos</span>}
                        </div>
                        {sale.peso_solicitado > 0 && (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 transition-colors">
                            Solicitado: {sale.peso_solicitado}kg
                            {sale.qtd_sacos_solicitado > 0 && <span> / {sale.qtd_sacos_solicitado} sacos</span>}
                          </div>
                        )}
                        {!(sale.peso_solicitado > 0) && sale.qtd_sacos_solicitado > 0 && (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 transition-colors">
                            Solicitado: {sale.qtd_sacos_solicitado} sacos
                          </div>
                        )}
                        {sale.peso_solicitado > 0 && sale.peso_finalizado > 0 && sale.peso_finalizado < (sale.peso_solicitado * 0.9) && (
                          <div className="text-[9px] text-red-500 dark:text-red-400 font-bold mt-0.5 flex items-center justify-end gap-1 transition-colors">
                            <AlertCircle className="w-2.5 h-2.5" /> Realizar reposição
                          </div>
                        )}
                        {sale.peso_solicitado > 0 && sale.peso_finalizado > 0 && sale.peso_finalizado > (sale.peso_solicitado * 1.1) && (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center justify-end gap-1 leading-tight transition-colors">
                            <AlertCircle className="w-2.5 h-2.5" /> Verificar aceite
                          </div>
                        )}
                        {sale.fator_kilo > 0 && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 transition-colors">Fator: {formatCurrency(sale.fator_kilo)}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sale.valor_total_nf > 0 && sale.comissao_percentage > 0 && <div className="font-bold text-indigo-600 dark:text-indigo-400 transition-colors">{formatCurrency((sale.valor_total_nf * sale.comissao_percentage) / 100)}</div>}
                        {sale.comissao_percentage > 0 && <div className="text-xs text-indigo-400 dark:text-indigo-300 font-medium transition-colors">{sale.comissao_percentage}%</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-all">
                          <button
                            type="button"
                            onClick={() => handleEditClick(sale)}
                            className="p-2 text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            title="Editar pedido"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSale(sale.id)}
                            className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Excluir pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    {/* Linha das Parcelas (Expansível) */}
                    {expandedSaleId === sale.id && (
                      <motion.tr
                        key={`installments-${sale.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-zinc-50/30 dark:bg-zinc-800/20 transition-colors"
                      >
                        <td colSpan={7} className="px-6 py-6">
                          {!saleInstallments[sale.id] ? (
                            <div className="flex items-center justify-center py-8 text-zinc-400 dark:text-zinc-500 gap-3 transition-colors">
                              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Carregando parcelas...</span>
                            </div>
                          ) : saleInstallments[sale.id].length === 0 ? (
                            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 transition-colors">
                              <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-20" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma parcela encontrada</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              {saleInstallments[sale.id].map((inst) => (
                                <motion.div 
                                  key={inst.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md dark:hover:shadow-indigo-900/10 transition-all"
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Parcela {inst.installment_number}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border transition-colors ${getInstallmentStatus(inst).color}`}>
                                      {getInstallmentStatus(inst).label}
                                    </span>
                                  </div>
                                  <div className="text-lg font-black text-zinc-900 dark:text-white mb-1 tracking-tight">{formatCurrency(inst.value)}</div>
                                  
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="flex-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30 transition-colors">
                                      <div className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Comissão ({sale.comissao_percentage}%)</div>
                                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                        {formatCurrency((inst.value * (sale.comissao_percentage || 0)) / 100)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 font-medium">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Vencimento: <span className="text-zinc-900 dark:text-zinc-200">{formatDate(inst.due_date)}</span>
                                  </div>
                                  
                                  <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
                                    <label className="block text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Data de Pagamento</label>
                                    <input 
                                      type="date"
                                      value={inst.payment_date || ''}
                                      onChange={(e) => handleUpdateInstallmentPayment(inst.id!, sale.id, e.target.value)}
                                      className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
                                    />
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )}
                  </React.Fragment>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">Nenhum pedido registrado recentemente.</td></tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de Zoom de Imagens */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div onClick={() => setViewingImage(null)} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out">
            <div className="relative"><img src={viewingImage} className="max-w-full max-h-[85vh] rounded-xl object-contain" /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};