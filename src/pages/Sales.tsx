import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, History, ChevronRight, Check, ZoomIn 
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
    
    // 1. Calcula o valor base arredondado rigidamente para 2 casas decimais
    const baseValue = Math.round((total / intervals.length) * 100) / 100;
    
    // 2. Calcula a diferença exata (os centavos que faltaram ou sobraram)
    const diff = Math.round((total - (baseValue * intervals.length)) * 100) / 100;

    const installments: Installment[] = intervals.map((days, index) => {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + days);
      
      // 3. Adiciona a diferença apenas na primeira parcela (index === 0)
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
      cliente: sale.cliente || '', cotacao: sale.cotacao || '', op_producao: sale.op_producao || '', data_emissao_pedido: sale.data_emissao_pedido || '',
      op_referencia: sale.op_referencia || '', produto: sale.produto || '', peso_solicitado: sale.peso_solicitado?.toString() || '',
      qtd_sacos_solicitado: sale.qtd_sacos_solicitado?.toString() || '', linha_produto: sale.linha_produto || '', data_finalizacao_produto: sale.data_finalizacao_produto || '',
      data_entrega_cliente: sale.data_entrega_cliente || '', ordem_compra: sale.ordem_compra || '', comissao_percentage: sale.comissao_percentage?.toString() || '',
      numero_nf: sale.numero_nf || '', peso_finalizado: sale.peso_finalizado?.toString() || '', qtd_sacos_finalizado: sale.qtd_sacos_finalizado?.toString() || '',
      data_faturamento: sale.data_faturamento || '', valor_total_nf: sale.valor_total_nf?.toString() || '', fator_kilo: sale.fator_kilo?.toString() || '',
      payment_method: sale.payment_method || 'À VISTA', installment_config: '30,60,90'
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
                  <div onClick={() => setViewingImage(saleClientProducts.find(p => p.product_name === formData.produto)?.image_url || null)} className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white flex-shrink-0 cursor-zoom-in relative">
                    <img src={saleClientProducts.find(p => p.product_name === formData.produto)?.image_url} className="w-full h-full object-cover" />
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
              <div className="w-full px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold">{formatCurrency(currentCommissionPreview)}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Fator Kilo</label>
              <div className="w-full px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 font-bold">{formatCurrency(currentFatorKilo)}</div>
            </div>

            <div className="lg:col-span-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Forma de Pagamento</label>
                <div className="flex gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200">
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
          <div className="flex justify-end gap-3">
            {editingSaleId && <button type="button" onClick={() => setEditingSaleId(null)} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold py-3 px-8 rounded-xl">Cancelar</button>}
            <button type="submit" disabled={isAdding} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 disabled:opacity-50">
              {isAdding ? 'Processando...' : <>{editingSaleId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {editingSaleId ? 'Salvar' : 'Registrar'}</>}
            </button>
          </div>
        </form>
      </div>

      {/* Histórico Simplificado - Apenas as Últimas 10 Vendas */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" /> Últimos 10 Pedidos Lançados
          </h2>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
            Cadastro Rápido
          </span>
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
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sales.slice(0, 10).map(sale => (
                <tr key={sale.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900 dark:text-white">{sale.cliente}</div>
                    <div className="text-xs text-zinc-500">{sale.produto}</div>
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
                  <td className="px-6 py-4 text-xs">
                    <button type="button" onClick={() => handleEditClick(sale)} className="p-2 text-indigo-400 hover:text-indigo-500"><Edit2 className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleDeleteSale(sale.id)} className="p-2 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">Nenhum pedido registrado recentemente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de Zoom de Imagens */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div onClick={() => setViewingImage(null)} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className="relative"><img src={viewingImage} className="max-w-full max-h-[85vh] rounded-xl" /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};