export interface Sale {
  id: number;
  cliente: string;
  cotacao: string;
  op_producao: string;
  data_emissao_pedido: string;
  op_referencia: string;
  produto: string;
  peso_solicitado: number;
  qtd_sacos_solicitado: number;
  linha_produto: string;
  data_finalizacao_produto: string;
  data_entrega_cliente: string;
  ordem_compra: string;
  comissao_percentage: number;
  numero_nf: string;
  peso_finalizado: number;
  qtd_sacos_finalizado: number;
  data_faturamento: string;
  valor_total_nf: number;
  fator_kilo: number;
  commission_value: number;
  payment_method: 'À VISTA' | 'A PRAZO';
  sale_date: string;
}

export interface Installment {
  id?: number;
  sale_id?: number;
  installment_number: number;
  due_date: string;
  value: number;
  payment_date?: string | null;
  cliente?: string;
  numero_nf?: string;
  comissao_percentage?: number;
}

export interface Entity {
  id: number;
  name: string;
  cnpj?: string;
  endereco?: string;
  responsavel?: string;
  telefone?: string;
  email?: string;
}

export interface ClientProduct {
  id: number;
  client_id: number;
  product_name: string;
  image_url?: string;
}

export type Tab = 'dashboard' | 'sales' | 'sales-report' | 'reports' | 'registrations';