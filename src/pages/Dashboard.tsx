import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, TrendingUp, DollarSign, 
  Package, BarChart3, PieChart as PieChartIcon, Users, Check 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Sale, Entity, Installment } from '../types';

interface DashboardProps {
  sales: Sale[];
  clients: Entity[];
  allInstallments: Installment[];
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, clients, allInstallments }) => {
  const [dashFilters, setDashFilters] = useState({
    year: new Date().getFullYear().toString(),
    month: 'all',
    cliente: 'all'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const dashboardSales = sales.filter(sale => {
    if (!sale.sale_date || isNaN(new Date(sale.sale_date).getTime())) return false;
    const saleDate = new Date(sale.sale_date);
    const matchesYear = saleDate.getFullYear().toString() === dashFilters.year;
    const matchesMonth = dashFilters.month === 'all' || (saleDate.getMonth() + 1).toString() === dashFilters.month;
    const matchesCliente = dashFilters.cliente === 'all' || sale.cliente === dashFilters.cliente;
    return matchesYear && matchesMonth && matchesCliente;
  });

  const dashboardInstallments = allInstallments.filter(inst => {
    if (!inst.payment_date || isNaN(new Date(inst.payment_date).getTime())) return false;
    const payDate = new Date(inst.payment_date);
    const matchesYear = payDate.getFullYear().toString() === dashFilters.year;
    const matchesMonth = dashFilters.month === 'all' || (payDate.getMonth() + 1).toString() === dashFilters.month;
    const matchesCliente = dashFilters.cliente === 'all' || inst.cliente === dashFilters.cliente;
    return matchesYear && matchesMonth && matchesCliente;
  });

  const weightData = [
    { name: 'Solicitado', value: dashboardSales.reduce((acc, s) => acc + (Number(s.peso_solicitado) || 0), 0) },
    { name: 'Finalizado', value: dashboardSales.reduce((acc, s) => acc + (Number(s.peso_finalizado) || 0), 0) }
  ];

  const commissionReceived = dashboardInstallments.reduce((acc, inst) => {
    const commission = (inst.value * (inst.comissao_percentage || 0)) / 100;
    return acc + commission;
  }, 0);

  const clientKgMap: Record<string, number> = {};
  dashboardSales.forEach(s => {
    clientKgMap[s.cliente] = (clientKgMap[s.cliente] || 0) + (Number(s.peso_finalizado) || 0);
  });
  const top10ClientsKg = Object.entries(clientKgMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const clientRevenueMap: Record<string, number> = {};
  dashboardSales.forEach(s => {
    clientRevenueMap[s.cliente] = (clientRevenueMap[s.cliente] || 0) + (Number(s.valor_total_nf) || 0);
  });
  const top10ClientsRevenue = Object.entries(clientRevenueMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const lineDistributionMap: Record<string, number> = {};
  dashboardSales.forEach(s => {
    lineDistributionMap[s.linha_produto] = (lineDistributionMap[s.linha_produto] || 0) + 1;
  });
  const lineDistributionData = Object.entries(lineDistributionMap)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Visão geral do seu desempenho comercial.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none flex items-center gap-1 transition-colors">
          <select 
            value={dashFilters.year}
            onChange={(e) => setDashFilters({ ...dashFilters, year: e.target.value })}
            className="px-3 py-1.5 bg-transparent text-sm font-bold text-zinc-900 dark:text-white outline-none cursor-pointer"
          >
            {sales.length === 0 && <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>}
            {Array.from(new Set(sales.filter(s => s.sale_date).map(s => new Date(s.sale_date).getFullYear().toString()))).sort().reverse().map(year => (
              <option key={year} value={year} className="dark:bg-zinc-900">{year}</option>
            ))}
          </select>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <select 
            value={dashFilters.month}
            onChange={(e) => setDashFilters({ ...dashFilters, month: e.target.value })}
            className="px-3 py-1.5 bg-transparent text-sm font-bold text-zinc-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="all" className="dark:bg-zinc-900">Todos os Meses</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString()} className="dark:bg-zinc-900">
                {new Date(2000, i).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
          <select 
            value={dashFilters.cliente}
            onChange={(e) => setDashFilters({ ...dashFilters, cliente: e.target.value })}
            className="px-3 py-1.5 bg-transparent text-sm font-bold text-zinc-900 dark:text-white outline-none cursor-pointer max-w-[150px]"
          >
            <option value="all" className="dark:bg-zinc-900">Todos Clientes</option>
            {clients.map(c => <option key={c.id} value={c.name} className="dark:bg-zinc-900">{c.name}</option>)}
          </select>
        </div>
      </div>

      {dashboardSales.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none text-center transition-colors">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
          </div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Nenhum dado encontrado</h3>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-xs mx-auto">Não existem vendas registradas para os filtros selecionados.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/30 dark:shadow-none relative overflow-hidden group transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <ShoppingBag className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Total Pedidos</span>
                </div>
                <div className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{dashboardSales.length}</div>
                <div className="mt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 w-fit px-3 py-1 rounded-full"><TrendingUp className="w-3 h-3" /><span>No período</span></div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/30 dark:shadow-none relative overflow-hidden group transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <TrendingUp className="w-20 h-20 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"><TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Faturamento</span>
                </div>
                <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{formatCurrency(dashboardSales.reduce((acc, s) => acc + (Number(s.valor_total_nf) || 0), 0))}</div>
                <div className="mt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 w-fit px-3 py-1 rounded-full"><TrendingUp className="w-3 h-3" /><span>Valor total NF</span></div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/30 dark:shadow-none relative overflow-hidden group transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <DollarSign className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Comissão Recebida</span>
                </div>
                <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{formatCurrency(commissionReceived)}</div>
                <div className="mt-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 w-fit px-3 py-1 rounded-full"><Check className="w-3 h-3" /><span>Efetivamente pago</span></div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/30 dark:shadow-none relative overflow-hidden group transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <Package className="w-20 h-20 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><Package className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Peso Total</span>
                </div>
                <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
                  {(dashboardSales.reduce((acc, s) => acc + (Number(s.peso_finalizado) || 0), 0)).toLocaleString('pt-BR')} 
                  <span className="text-lg ml-1 text-zinc-400 dark:text-zinc-500">kg</span>
                </div>
                <div className="mt-6 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 w-fit px-3 py-1 rounded-full"><Package className="w-3 h-3" /><span>Finalizado</span></div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-colors">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                  Peso Solicitado vs. Finalizado
                </h3>
                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Métricas de Produção</div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={window.document.documentElement.classList.contains('dark') ? '#27272a' : '#f3f4f6'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa', fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-colors">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><PieChartIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                  Distribuição por Linha
                </h3>
                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Mix de Produtos</div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lineDistributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                      {lineDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-colors">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"><Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                  Top 10 Clientes (Peso)
                </h3>
                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Volume por Cliente</div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10ClientsKg} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={window.document.documentElement.classList.contains('dark') ? '#27272a' : '#f3f4f6'} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 700 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 700 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none transition-colors">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"><TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                  Top 10 Clientes (Faturamento)
                </h3>
                <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Receita por Cliente</div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10ClientsRevenue} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={window.document.documentElement.classList.contains('dark') ? '#27272a' : '#f3f4f6'} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 700 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 700 }} width={100} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};