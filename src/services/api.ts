import { Sale, Entity, Installment, ClientProduct } from '../types';

const API_URL = '/api';

export const api = {
  // Dados Iniciais (Dashboard)
  fetchAllData: async () => {
    const [salesRes, clientsRes, linesRes, installmentsRes] = await Promise.all([
      fetch(`${API_URL}/sales`),
      fetch(`${API_URL}/clients`),
      fetch(`${API_URL}/product-lines`),
      fetch(`${API_URL}/installments`)
    ]);

    if (!salesRes.ok || !clientsRes.ok || !linesRes.ok || !installmentsRes.ok) 
      throw new Error('Falha ao carregar dados');

    return {
      salesData: await salesRes.json() as Sale[],
      clientsData: await clientsRes.json() as Entity[],
      linesData: await linesRes.json() as Entity[],
      installmentsData: await installmentsRes.json() as Installment[]
    };
  },

  // Vendas
  saveSale: async (saleData: any, isEditing: boolean, id?: number) => {
    const url = isEditing ? `${API_URL}/sales/${id}` : `${API_URL}/sales`;
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
    if (!res.ok) throw new Error('Falha ao salvar venda');
    return res.json();
  },
  
  deleteSale: async (id: number) => {
    const res = await fetch(`${API_URL}/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir venda');
    return res.json();
  },

  // Cadastros Genéricos (Clientes e Linhas)
  saveEntity: async (type: 'clients' | 'product-lines', data: any, isEditing: boolean, id?: number) => {
    const url = isEditing ? `${API_URL}/${type}/${id}` : `${API_URL}/${type}`;
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao salvar cadastro');
    return res.json();
  },

  deleteEntity: async (type: 'clients' | 'product-lines', id: number) => {
    const res = await fetch(`${API_URL}/${type}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir');
    return res.json();
  },

  // Produtos do Cliente
  getClientProducts: async (clientId: number) => {
    const res = await fetch(`${API_URL}/clients/${clientId}/products`);
    if (!res.ok) throw new Error('Falha ao buscar produtos');
    return res.json() as Promise<ClientProduct[]>;
  },

  // Parcelas
  updateInstallment: async (id: number, paymentDate: string) => {
    const res = await fetch(`${API_URL}/installments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_date: paymentDate })
    });
    if (!res.ok) throw new Error('Falha ao atualizar parcela');
    return res.json();
  }
};