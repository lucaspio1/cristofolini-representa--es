import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { LayoutDashboard, ShoppingBag, BarChart3, Settings, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from './lib/ThemeContext';
import { Sale, Entity, Installment, Tab } from './types';
import { api } from './services/api';

// Importação dos Componentes
import { Logo } from './components/Logo';
import { ThemeToggle } from './components/ThemeToggle';
import { HomeScreen } from './components/HomeScreen';

// Importação das Páginas
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Reports } from './pages/Reports';
import { Registrations } from './pages/Registrations';

export default function App() {
  const { theme } = useTheme();
  const [showHome, setShowHome] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Novo Estado do Menu Lateral
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Estados Globais
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Entity[]>([]);
  const [productLines, setProductLines] = useState<Entity[]>([]);
  const [allInstallments, setAllInstallments] = useState<Installment[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const data = await api.fetchAllData();
      setSales(data.salesData);
      setClients(data.clientsData);
      setProductLines(data.linesData);
      setAllInstallments(data.installmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Telas de Carregamento e Erro
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <Logo size="normal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-red-200 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erro ao carregar o sistema</h2>
          <p className="text-zinc-500 mb-6">{error}</p>
          <button onClick={loadInitialData} className="px-6 py-3 bg-zinc-900 text-white rounded-xl">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  if (showHome) {
    return (
      <AnimatePresence mode="wait">
        <HomeScreen onStart={() => setShowHome(false)} />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col lg:flex-row transition-colors duration-300">
      
      {/* Sidebar Desktop com lógica de recolhimento */}
      <aside 
        className={`hidden lg:flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 sticky top-0 h-screen z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}
      >
        <div className={`p-6 flex items-center relative h-24 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Logo collapsed={isCollapsed} />
          
          {/* Botão para encolher/expandir */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3.5 top-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full p-1.5 shadow-md transition-colors z-50 cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            title={isCollapsed ? "Dashboard" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">Dashboard</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('sales')} 
            title={isCollapsed ? "Vendas" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'sales' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">Vendas</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('reports')} 
            title={isCollapsed ? "Relatórios" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">Relatórios</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('registrations')} 
            title={isCollapsed ? "Cadastros" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'registrations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">Cadastros</span>}
          </button>
        </nav>

        <div className="p-4 space-y-4 mb-4 overflow-hidden">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'} transition-all`}>
            {!isCollapsed && <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap">Aparência</span>}
            <ThemeToggle />
          </div>
          
          {!isCollapsed && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-colors animate-in fade-in zoom-in-95 duration-300">
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Hoje</div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className="mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Desenvolvedor</div>
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">Diego Oliveira - STC</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="lg:hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 px-4 h-16 flex items-center justify-between transition-colors">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Área Principal (Conteúdo Dinâmico) */}
      <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-full overflow-x-hidden">
        {activeTab === 'dashboard' && <Dashboard sales={sales} clients={clients} allInstallments={allInstallments} />}
        {activeTab === 'sales' && <Sales sales={sales} setSales={setSales} clients={clients} productLines={productLines} />}
        {activeTab === 'reports' && <Reports allInstallments={allInstallments} setAllInstallments={setAllInstallments} />}
        {activeTab === 'registrations' && <Registrations clients={clients} setClients={setClients} productLines={productLines} setProductLines={setProductLines} />}
      </main>

      {/* Navbar Mobile (Bottom) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 z-30 px-6 py-3 flex items-center justify-between transition-colors">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`}><LayoutDashboard className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Dash</span></button>
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 ${activeTab === 'sales' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`}><ShoppingBag className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Vendas</span></button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`}><BarChart3 className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Relat.</span></button>
        <button onClick={() => setActiveTab('registrations')} className={`flex flex-col items-center gap-1 ${activeTab === 'registrations' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`}><Settings className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tighter">Cad.</span></button>
      </nav>

    </div>
  );
}