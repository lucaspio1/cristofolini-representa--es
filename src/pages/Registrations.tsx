import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Plus, Edit2, Trash2, Users, Layers, Search, 
  Check, X, Package, ShoppingBag, ChevronRight, ZoomIn 
} from 'lucide-react';
import { Entity, ClientProduct } from '../types';

interface RegistrationsProps {
  clients: Entity[];
  setClients: React.Dispatch<React.SetStateAction<Entity[]>>;
  productLines: Entity[];
  setProductLines: React.Dispatch<React.SetStateAction<Entity[]>>;
}

export const Registrations: React.FC<RegistrationsProps> = ({ clients, setClients, productLines, setProductLines }) => {
  const [regName, setRegName] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regEndereco, setRegEndereco] = useState('');
  const [regResponsavel, setRegResponsavel] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regType, setRegType] = useState<'clients' | 'product-lines'>('clients');
  const [selectedClient, setSelectedClient] = useState<Entity | null>(null);
  const [clientProducts, setClientProducts] = useState<ClientProduct[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [lineSearch, setLineSearch] = useState('');
  
  const [editingEntity, setEditingEntity] = useState<{ id: number, name: string, type: 'clients' | 'product-lines', cnpj?: string, endereco?: string, responsavel?: string, telefone?: string, email?: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ id: number, name: string, image_url?: string } | null>(null);
  const [editingProductImage, setEditingProductImage] = useState<File | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const registrationFormRef = useRef<HTMLDivElement>(null);

  const clearRegistrationForm = () => {
    setRegName(''); setRegCnpj(''); setRegEndereco(''); setRegResponsavel(''); setRegTelefone(''); setRegEmail('');
    setSelectedClient(null); setClientProducts([]);
  };

  const handleSelectClient = async (client: Entity) => {
    setSelectedClient(client);
    setRegName(client.name); setRegCnpj(client.cnpj || ''); setRegEndereco(client.endereco || '');
    setRegResponsavel(client.responsavel || ''); setRegTelefone(client.telefone || ''); setRegEmail(client.email || '');
    setRegType('clients');
    registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const res = await fetch(`/api/clients/${client.id}/products`);
      if (res.ok) setClientProducts(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleAddRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName) return;

    try {
      const body: any = { name: regName.toUpperCase() };
      if (regType === 'clients') {
        body.cnpj = regCnpj; body.endereco = regEndereco; body.responsavel = regResponsavel;
        body.telefone = regTelefone; body.email = regEmail;
      }
      const method = (regType === 'clients' && selectedClient) ? 'PUT' : 'POST';
      const url = (regType === 'clients' && selectedClient) ? `/api/clients/${selectedClient.id}` : `/api/${regType}`;

      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Falha ao salvar');
      
      const newItem = await response.json();
      if (regType === 'clients') {
        if (selectedClient) {
          setClients(clients.map(c => c.id === newItem.id ? newItem : c));
          setSelectedClient(newItem);
        } else setClients([newItem, ...clients]);
      } else setProductLines([newItem, ...productLines]);
      
      if (!selectedClient) clearRegistrationForm();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handleDeleteRegistration = async (type: typeof regType, id: number) => {
    if (!confirm('Excluir este cadastro?')) return;
    try {
      const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      if (type === 'clients') {
        setClients(clients.filter(c => c.id !== id));
        if (selectedClient?.id === id) { setSelectedClient(null); setClientProducts([]); }
      } else setProductLines(productLines.filter(l => l.id !== id));
    } catch (err) { alert('Erro ao excluir'); }
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    try {
      const body: any = { name: editingEntity.name.toUpperCase() };
      if (editingEntity.type === 'clients') {
        body.cnpj = editingEntity.cnpj; body.telefone = editingEntity.telefone;
      }
      const res = await fetch(`/api/${editingEntity.type}/${editingEntity.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Falha ao atualizar');
      const updated = await res.json();
      if (editingEntity.type === 'clients') {
        setClients(clients.map(c => c.id === updated.id ? updated : c));
      } else setProductLines(productLines.map(l => l.id === updated.id ? updated : l));
      setEditingEntity(null);
    } catch (err) { alert('Erro ao atualizar'); }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData(); formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: newProductName.toUpperCase(), image_url: imageUrl }),
      });
      if (!res.ok) throw new Error('Erro');
      setClientProducts([...clientProducts, await res.json()]);
      setNewProductName(''); setNewProductImage(null);
    } catch (err) { alert('Erro ao salvar produto'); }
  };

  const handleUpdateClientProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      let imageUrl = editingProduct.image_url;
      if (editingProductImage) imageUrl = await uploadImage(editingProductImage);
      const res = await fetch(`/api/client-products/${editingProduct.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: editingProduct.name.toUpperCase(), image_url: imageUrl })
      });
      if (!res.ok) throw new Error('Erro');
      const updated = await res.json();
      setClientProducts(clientProducts.map(p => p.id === updated.id ? updated : p));
      setEditingProduct(null); setEditingProductImage(null);
    } catch (err) { alert('Erro'); }
  };

  const handleDeleteClientProduct = async (id: number) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      await fetch(`/api/client-products/${id}`, { method: 'DELETE' });
      setClientProducts(clientProducts.filter(p => p.id !== id));
    } catch (err) { alert('Erro'); }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Cadastros</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Gerencie clientes e linhas de produtos.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col items-end"><span className="text-[10px] text-zinc-400">CLIENTES</span><span className="text-sm font-black dark:text-white">{clients.length}</span></div>
          <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
          <div className="flex flex-col items-end"><span className="text-[10px] text-zinc-400">LINHAS</span><span className="text-sm font-black dark:text-white">{productLines.length}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Formulário lateral */}
        <div ref={registrationFormRef} className="xl:col-span-4 space-y-6 sticky top-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                    {selectedClient ? <Edit2 className="w-6 h-6 text-indigo-600" /> : <Plus className="w-6 h-6 text-indigo-600" />}
                  </div>
                  {selectedClient ? 'Editar Cadastro' : 'Novo Cadastro'}
                </h2>
                {selectedClient && <button onClick={clearRegistrationForm} className="text-[10px] text-indigo-600 font-black px-3 py-1.5 bg-indigo-50 rounded-full">Limpar</button>}
              </div>

              <form onSubmit={handleAddRegistration} className="space-y-6">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                    <button type="button" onClick={() => setRegType('clients')} className={`py-2.5 text-xs font-black rounded-xl ${regType === 'clients' ? 'bg-white dark:bg-zinc-700 text-indigo-600' : 'text-zinc-500'}`}>CLIENTE</button>
                    <button type="button" onClick={() => setRegType('product-lines')} className={`py-2.5 text-xs font-black rounded-xl ${regType === 'product-lines' ? 'bg-white dark:bg-zinc-700 text-indigo-600' : 'text-zinc-500'}`}>LINHA PROD.</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="NOME / RAZÃO SOCIAL" className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none dark:text-white font-bold" />
                </div>
                {regType === 'clients' && (
                  <div className="space-y-5">
                    <input type="text" required value={regCnpj} onChange={e => setRegCnpj(e.target.value)} placeholder="CNPJ" className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none dark:text-white" />
                    <input type="text" required value={regEndereco} onChange={e => setRegEndereco(e.target.value)} placeholder="ENDEREÇO COMPLETO" className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none dark:text-white" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" required value={regResponsavel} onChange={e => setRegResponsavel(e.target.value)} placeholder="RESPONSÁVEL" className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none dark:text-white" />
                      <input type="text" required value={regTelefone} onChange={e => setRegTelefone(e.target.value)} placeholder="TELEFONE" className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none dark:text-white" />
                    </div>
                    <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="E-MAIL" className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none dark:text-white" />
                  </div>
                )}
                <button type="submit" className="w-full bg-zinc-900 dark:bg-indigo-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3">
                  <Check className="w-6 h-6" /> {selectedClient ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </form>

              {/* Gestão de Produtos do Cliente */}
              {selectedClient && (
                <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-bold dark:text-white mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-indigo-600" /> Produtos: {selectedClient.name}</h4>
                  <form onSubmit={handleAddClientProduct} className="flex gap-2 mb-4">
                    <input type="text" required value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Novo produto..." className="flex-1 px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 rounded-lg outline-none dark:text-white" />
                    <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg"><Plus className="w-4 h-4" /></button>
                  </form>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {clientProducts.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                        {editingProduct?.id === p.id ? (
                          <form onSubmit={handleUpdateClientProduct} className="flex gap-2">
                            <input value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="px-2 py-1 bg-white dark:bg-zinc-900 text-xs dark:text-white" />
                            <button type="submit"><Check className="w-4 h-4 text-emerald-500" /></button>
                            <button type="button" onClick={() => setEditingProduct(null)}><X className="w-4 h-4 text-red-500" /></button>
                          </form>
                        ) : (
                          <>
                            <span className="text-xs font-medium dark:text-white">{p.product_name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingProduct({ id: p.id, name: p.product_name, image_url: p.image_url })}><Edit2 className="w-3 h-3 text-indigo-400" /></button>
                              <button onClick={() => handleDeleteClientProduct(p.id)}><Trash2 className="w-3 h-3 text-red-400" /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listas de Clientes e Linhas */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Lista de Clientes */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50">
              <h4 className="font-black text-lg dark:text-white mb-4">Clientes</h4>
              <input type="text" placeholder="Buscar cliente..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-zinc-800 rounded-xl outline-none dark:text-white" />
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[45rem] overflow-y-auto">
              {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => handleSelectClient(c)} className={`p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 ${selectedClient?.id === c.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}>
                  <div className="font-black dark:text-white">{c.name}</div>
                  <div className="text-xs text-zinc-500 mt-1">{c.cnpj} | {c.responsavel}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Linhas */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50">
              <h4 className="font-black text-lg dark:text-white mb-4">Linhas de Produto</h4>
              <input type="text" placeholder="Buscar linha..." value={lineSearch} onChange={e => setLineSearch(e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-zinc-800 rounded-xl outline-none dark:text-white" />
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[45rem] overflow-y-auto">
              {productLines.filter(l => l.name.toLowerCase().includes(lineSearch.toLowerCase())).map(l => (
                <div key={l.id} className="p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <span className="font-black dark:text-white">{l.name}</span>
                  <button onClick={() => handleDeleteRegistration('product-lines', l.id)}><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Imagem */}
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