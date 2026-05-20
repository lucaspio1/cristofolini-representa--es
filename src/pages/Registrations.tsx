import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Plus, Edit2, Trash2, Users, Layers, Search, 
  Check, X, ShoppingBag
} from 'lucide-react';
import { Entity, ClientProduct } from '../types';

interface RegistrationsProps {
  clients: Entity[];
  setClients: React.Dispatch<React.SetStateAction<Entity[]>>;
  productLines: Entity[];
  setProductLines: React.Dispatch<React.SetStateAction<Entity[]>>;
}

export const Registrations: React.FC<RegistrationsProps> = ({ clients, setClients, productLines, setProductLines }) => {
  const [viewMode, setViewMode] = useState<'clients' | 'product-lines'>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sistema de Notificações (Toast)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Some após 3 segundos
  };
  
  // Estados do Formulário Geral
  const [regName, setRegName] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regEndereco, setRegEndereco] = useState('');
  const [regResponsavel, setRegResponsavel] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  
  const [regType, setRegType] = useState<'clients' | 'product-lines'>('clients');
  const [selectedClient, setSelectedClient] = useState<Entity | null>(null);
  
  // Estados de Produtos (Filhos do Cliente)
  const [clientProducts, setClientProducts] = useState<ClientProduct[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  
  const [editingProduct, setEditingProduct] = useState<{ id: number, name: string, image_url?: string } | null>(null);
  const [editingProductImage, setEditingProductImage] = useState<File | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const openNewModal = () => {
    setRegName(''); setRegCnpj(''); setRegEndereco(''); setRegResponsavel(''); setRegTelefone(''); setRegEmail('');
    setSelectedClient(null); setClientProducts([]);
    setRegType(viewMode);
    setIsModalOpen(true);
  };

  const handleEditClient = async (client: Entity) => {
    setSelectedClient(client);
    setRegName(client.name); setRegCnpj(client.cnpj || ''); setRegEndereco(client.endereco || '');
    setRegResponsavel(client.responsavel || ''); setRegTelefone(client.telefone || ''); setRegEmail(client.email || '');
    setRegType('clients');
    setIsModalOpen(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/products`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) setClientProducts(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleEditLine = (line: Entity) => {
    setSelectedClient(line);
    setRegName(line.name);
    setRegType('product-lines');
    setIsModalOpen(true);
  };

  const handleSaveRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName) return;

    try {
      const isEditing = !!selectedClient;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/${regType}/${selectedClient.id}` : `/api/${regType}`;
      
      const body: any = regType === 'clients' ? {
        name: regName.toUpperCase(), cnpj: regCnpj, endereco: regEndereco,
        responsavel: regResponsavel, telefone: regTelefone, email: regEmail
      } : {
        name: regName.toUpperCase()
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Falha ao salvar');
      
      const savedItem = await response.json();
      
      if (regType === 'clients') {
        if (isEditing) setClients(clients.map(c => c.id === savedItem.id ? savedItem : c));
        else setClients([savedItem, ...clients]);
        setSelectedClient(savedItem);
        showToast('Cliente salvo com sucesso!');
      } else {
        if (isEditing) setProductLines(productLines.map(l => l.id === savedItem.id ? savedItem : l));
        else setProductLines([savedItem, ...productLines]);
        setIsModalOpen(false);
        showToast('Linha de produto salva com sucesso!');
      }
      
    } catch (err) { 
      showToast('Erro ao salvar as informações.', 'error'); 
    }
  };

  const handleDeleteRegistration = async (type: 'clients' | 'product-lines', id: number) => {
    if (!confirm('Excluir este cadastro definitivamente?')) return;
    try {
      const res = await fetch(`/api/${type}/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (!res.ok) throw new Error('Falha ao excluir');
      if (type === 'clients') setClients(clients.filter(c => c.id !== id));
      else setProductLines(productLines.filter(l => l.id !== id));
      showToast('Registro excluído com sucesso!');
    } catch (err) { 
      showToast('Erro ao excluir o registro.', 'error'); 
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData(); formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, 
        body: formData 
      });
      if (res.ok) return (await res.json()).imageUrl;
    } catch (err) { console.error(err); }
    return null;
  };

  const handleAddClientProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newProductName) return;
    try {
      let imageUrl = newProductImage ? await uploadImage(newProductImage) : null;
      const res = await fetch(`/api/clients/${selectedClient.id}/products`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ product_name: newProductName.toUpperCase(), image_url: imageUrl }),
      });
      if (!res.ok) throw new Error('Erro');
      setClientProducts([...clientProducts, await res.json()]);
      setNewProductName(''); setNewProductImage(null);
      showToast('Produto salvo com sucesso!');
    } catch (err) { 
      showToast('Erro ao salvar produto.', 'error'); 
    }
  };

  const handleUpdateClientProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      let imageUrl = editingProduct.image_url;
      if (editingProductImage) imageUrl = await uploadImage(editingProductImage);
      const res = await fetch(`/api/client-products/${editingProduct.id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ product_name: editingProduct.name.toUpperCase(), image_url: imageUrl })
      });
      if (!res.ok) throw new Error('Erro');
      const updated = await res.json();
      setClientProducts(clientProducts.map(p => p.id === updated.id ? updated : p));
      setEditingProduct(null); setEditingProductImage(null);
      showToast('Produto atualizado com sucesso!');
    } catch (err) { 
      showToast('Erro ao atualizar produto.', 'error'); 
    }
  };

  const handleDeleteClientProduct = async (id: number) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      await fetch(`/api/client-products/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      setClientProducts(clientProducts.filter(p => p.id !== id));
      showToast('Produto excluído com sucesso!');
    } catch (err) { 
      showToast('Erro ao excluir produto.', 'error'); 
    }
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.cnpj && c.cnpj.includes(searchQuery)));
  const filteredLines = productLines.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 relative">
      {/* Container de Notificações Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
          >
            {toast.type === 'success' ? (
              <div className="bg-white/20 p-1 rounded-full"><Check className="w-5 h-5" /></div>
            ) : (
              <div className="bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></div>
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" /> Gestão de Cadastros
            </h2>
            <button onClick={openNewModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
              <Plus className="w-5 h-5" /> Novo Cadastro
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full sm:w-auto">
              <button onClick={() => setViewMode('clients')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'clients' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}><Users className="w-4 h-4" /> Clientes</button>
              <button onClick={() => setViewMode('product-lines')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'product-lines' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}><Layers className="w-4 h-4" /> Linhas de Produto</button>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder={`Buscar ${viewMode === 'clients' ? 'cliente...' : 'linha...'}`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">{viewMode === 'clients' ? 'Nome / Razão Social' : 'Descrição da Linha'}</th>
                {viewMode === 'clients' && <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">CNPJ/CPF</th>}
                {viewMode === 'clients' && <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Contato</th>}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {viewMode === 'clients' ? (
                filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4"><div className="font-bold text-zinc-900 dark:text-white">{c.name}</div><div className="text-xs text-zinc-500">{c.endereco || '-'}</div></td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">{c.cnpj || '-'}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300"><div>{c.responsavel || '-'}</div><div className="text-xs text-zinc-500">{c.telefone || '-'}</div></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditClient(c)} className="p-2 text-indigo-400 hover:text-indigo-600" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteRegistration('clients', c.id)} className="p-2 text-red-400 hover:text-red-600" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredLines.map(l => (
                  <tr key={l.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">{l.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditLine(l)} className="p-2 text-indigo-400 hover:text-indigo-600" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteRegistration('product-lines', l.id)} className="p-2 text-red-400 hover:text-red-600" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
              {((viewMode === 'clients' && filteredClients.length === 0) || (viewMode === 'product-lines' && filteredLines.length === 0)) && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-400 font-medium">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-3xl shadow-2xl flex flex-col relative max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20 shrink-0">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                    {selectedClient ? <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  {selectedClient ? 'Editar Cadastro' : 'Novo Cadastro'}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                {!selectedClient && (
                  <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-8 shrink-0">
                    <button type="button" onClick={() => setRegType('clients')} className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all ${regType === 'clients' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500'}`}>CLIENTE</button>
                    <button type="button" onClick={() => setRegType('product-lines')} className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all ${regType === 'product-lines' ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500'}`}>LINHA DE PRODUTO</button>
                  </div>
                )}

                <form onSubmit={handleSaveRegistration} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{regType === 'clients' ? 'Razão Social / Nome' : 'Nome da Linha de Produto'} *</label>
                    <input 
                      type="text" 
                      required 
                      value={regName} 
                      onChange={e => setRegName(e.target.value.toUpperCase())} 
                      placeholder={regType === 'clients' ? "Ex: EMPRESA SILVA REPRESENTACOES LTDA" : "Ex: LINHA PREMIUM"}
                      className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600" 
                    />
                  </div>
                  
                  {regType === 'clients' && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CNPJ</label>
                        <input 
                          type="text" 
                          value={regCnpj} 
                          onChange={e => setRegCnpj(e.target.value.toUpperCase())} 
                          placeholder="Ex: 00.000.000/0001-00"
                          className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Endereço Completo</label>
                        <input 
                          type="text" 
                          value={regEndereco} 
                          onChange={e => setRegEndereco(e.target.value.toUpperCase())} 
                          placeholder="Ex: RUA DAS FLORES, 123 - CENTRO, FLORIANÓPOLIS/SC"
                          className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600" 
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Responsável</label>
                          <input 
                            type="text" 
                            value={regResponsavel} 
                            onChange={e => setRegResponsavel(e.target.value.toUpperCase())} 
                            placeholder="Ex: JOÃO DA SILVA"
                            className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Telefone</label>
                          <input 
                            type="text" 
                            value={regTelefone} 
                            onChange={e => setRegTelefone(e.target.value.toUpperCase())} 
                            placeholder="Ex: (48) 90000-0000"
                            className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">E-mail</label>
                        <input 
                          type="email" 
                          value={regEmail} 
                          onChange={e => setRegEmail(e.target.value.toUpperCase())} 
                          placeholder="EX: CONTATO@EMPRESA.COM.BR"
                          className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600" 
                        />
                      </div>
                    </div>
                  )}
                  
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20">
                    <Check className="w-5 h-5" /> {selectedClient ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                  </button>
                </form>

                {selectedClient && regType === 'clients' && (
                  <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black text-lg dark:text-white flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-indigo-600" /> Produtos do Cliente</h4>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full">{clientProducts.length} itens</span>
                    </div>
                    
                    <form onSubmit={handleAddClientProduct} className="flex gap-2 mb-6">
                      <input 
                        type="text" 
                        required 
                        value={newProductName} 
                        onChange={e => setNewProductName(e.target.value.toUpperCase())} 
                        placeholder="Ex: CAIXA PERSONALIZADA..." 
                        className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400/70 dark:placeholder:text-zinc-600" 
                      />
                      <div className="space-y-1">
                         <label className="text-xs font-bold text-zinc-500 uppercase">Imagem</label>
                         <input type="file" accept="image/*" onChange={(e) => setNewProductImage(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 transition-transform"><Plus className="w-5 h-5" /></button>
                    </form>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {clientProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          {editingProduct?.id === p.id ? (
                            <form onSubmit={handleUpdateClientProduct} className="flex flex-col sm:flex-row gap-2 w-full sm:items-center">
                              <input value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value.toUpperCase() })} className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-lg outline-none text-sm font-bold dark:text-white border border-zinc-200 dark:border-zinc-700" />
                              <input type="file" accept="image/*" onChange={e => setEditingProductImage(e.target.files ? e.target.files[0] : null)} className="w-full sm:w-36 text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
                              <div className="flex gap-1 justify-end mt-2 sm:mt-0">
                                <button type="submit" className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                <button type="button" onClick={() => { setEditingProduct(null); setEditingProductImage(null); }} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.product_name} className="w-8 h-8 rounded-md object-cover cursor-pointer hover:opacity-80" onClick={() => setViewingImage(p.image_url || null)} />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-zinc-400" /></div>
                                )}
                                <span className="text-sm font-bold dark:text-white">{p.product_name}</span>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setEditingProduct({ id: p.id, name: p.product_name, image_url: p.image_url })} className="p-2 text-indigo-400 hover:text-indigo-600 bg-white dark:bg-zinc-900 rounded-lg shadow-sm"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteClientProduct(p.id)} className="p-2 text-red-400 hover:text-red-600 bg-white dark:bg-zinc-900 rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingImage && (
          <motion.div onClick={() => setViewingImage(null)} className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4">
            <img src={viewingImage} className="max-w-full max-h-[85vh] rounded-xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};