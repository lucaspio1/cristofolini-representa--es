import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, ClipboardList, BarChart3, Settings, 
  AlertCircle, ChevronLeft, ChevronRight, Users, LogOut, User, Target // <-- Target adicionado aqui
} from 'lucide-react';
import { useTheme } from './lib/ThemeContext';
import { Sale, Entity, Installment, Tab } from './types';
import { api } from './services/api';

// Componentes
import { Logo } from './components/Logo';
import { ThemeToggle } from './components/ThemeToggle';
import { HomeScreen } from './components/HomeScreen';

// Páginas
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { SalesReport } from './pages/SalesReport';
import { Reports } from './pages/Reports';
import { Registrations } from './pages/Registrations';
import { Login } from './pages/Login';
import { Users as UsersPage } from './pages/Users';
import { Profile } from './pages/Profile';
import { Goals } from './pages/Goals';

export default function App() {
  const { theme } = useTheme();
  
  // Estados de Autenticação
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Estados de Navegação (Para não dar erro no TypeScript, lembre-se de adicionar 'metas' ao type Tab no seu arquivo types.ts)
  const [showHome, setShowHome] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab | 'metas'>('dashboard'); // <-- Aceitando 'metas'
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Estados de Dados
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Entity[]>([]);
  const [productLines, setProductLines] = useState<Entity[]>([]);
  const [allInstallments, setAllInstallments] = useState<Installment[]>([]);
  
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Verifica a sessão ao abrir o site
  useEffect(() => {
    checkSession();
  }, []);

  // 2. Carrega os dados sempre que o usuário logar
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }
    try {
      const res = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setCurrentUser(await res.json());
        setShowHome(true); // Mostra a tela de boas vindas ao logar com sucesso
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const data = await api.fetchAllData();
      setSales(data.salesData);
      setClients(data.clientsData);
      setProductLines(data.linesData);
      setAllInstallments(data.installmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoadingData(false);
    }
  };

  // TELA DE CARREGAMENTO (Verificando Sessão)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <Logo size="normal" />
      </div>
    );
  }

  // SE NÃO ESTIVER LOGADO -> MOSTRA O LOGIN
  if (!currentUser) {
    return <Login onLogin={(user) => { setCurrentUser(user); setShowHome(true); }} />;
  }

  // TELA DE BOAS VINDAS
  if (showHome) {
    return (
      <AnimatePresence mode="wait">
        <HomeScreen onStart={() => setShowHome(false)} />
      </AnimatePresence>
    );
  }

  // TELA DE ERRO NO BANCO DE DADOS
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

   // SISTEMA PRINCIPAL LOGADO
  
  // TRAVA DE SEGURANÇA: SE O USUÁRIO PRECISA MUDAR A SENHA, ESCONDE TUDO E FORÇA A TELA DE PERFIL
  if (currentUser.must_change_password) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-8 h-20 flex items-center justify-between">
          <Logo />
          <button onClick={handleLogout} className="flex items-center gap-2 text-zinc-400 hover:text-red-500 font-bold text-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg">Sair <LogOut className="w-4 h-4" /></button>
        </header>
        <main>
          <Profile currentUser={currentUser} onPasswordChanged={() => setCurrentUser({...currentUser, must_change_password: false})} />
        </main>
      </div>
    );
  }

  // Se não estiver travado, continua a renderização normal
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col lg:flex-row transition-colors duration-300">
      
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 sticky top-0 h-screen z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}>
        <div className={`p-6 flex items-center relative h-24 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Logo collapsed={isCollapsed} />
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 top-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded-full p-1.5 shadow-md z-50 cursor-pointer">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} title={isCollapsed ? "Dashboard" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <LayoutDashboard className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Dashboard</span>}
          </button>
          
          {/* NOVA ABA METAS */}
          <button onClick={() => setActiveTab('metas')} title={isCollapsed ? "Metas Comerciais" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'metas' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <Target className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Metas Comerciais</span>}
          </button>

          <button onClick={() => setActiveTab('sales')} title={isCollapsed ? "Lançar Venda" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'sales' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <ShoppingBag className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Lançar Venda</span>}
          </button>
          <button onClick={() => setActiveTab('sales-report')} title={isCollapsed ? "Relatório Vendas" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'sales-report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <ClipboardList className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Relatório Vendas</span>}
          </button>
          <button onClick={() => setActiveTab('reports')} title={isCollapsed ? "Relatório Financeiro" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <BarChart3 className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Relatório Financeiro</span>}
          </button>
          <button onClick={() => setActiveTab('registrations')} title={isCollapsed ? "Cadastros" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'registrations' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <Settings className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Cadastros</span>}
          </button>
          
          {/* ABA EXCLUSIVA DO ADMINISTRADOR */}
          {currentUser?.role === 'ADMIN' && (
            <button onClick={() => setActiveTab('users')} title={isCollapsed ? "Usuários" : ""} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all mt-4 border border-dashed border-zinc-200 dark:border-zinc-700 ${activeTab === 'users' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
              <Users className="w-5 h-5 shrink-0" />{!isCollapsed && <span>Gerir Usuários</span>}
            </button>
          )}
        </nav>

        <div className="p-4 space-y-4 mb-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'} mb-2`}>
            {!isCollapsed && (
              <div>
                <div className="text-xs font-black text-zinc-900 dark:text-white">{currentUser.name}</div>
                <div className="text-[10px] text-zinc-500 uppercase">{currentUser.role}</div>
              </div>
            )}
          </div>
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between px-2'}`}>
            <ThemeToggle />

            <button onClick={() => setActiveTab('profile' as any)} title="Meu Perfil" className="p-2 text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
              <User className="w-5 h-5" />
            </button>

            <button onClick={handleLogout} title="Sair do Sistema" className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="lg:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Área Principal */}
      <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-full overflow-x-hidden relative">
        {loadingData && (
           <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        )}
        
        {/* Renderização Condicional */}
        {activeTab === 'dashboard' && <Dashboard sales={sales} clients={clients} allInstallments={allInstallments} />}
        {activeTab === 'metas' && <Goals sales={sales} currentUser={currentUser} />} {/* <-- COMPONENTE DE METAS SENDO RENDERIZADO AQUI */}
        {activeTab === 'sales' && <Sales sales={sales} setSales={setSales} clients={clients} productLines={productLines} setAllInstallments={setAllInstallments} />}
        {activeTab === 'sales-report' && <SalesReport sales={sales} setSales={setSales} clients={clients} productLines={productLines} setAllInstallments={setAllInstallments} />}
        {activeTab === 'reports' && <Reports allInstallments={allInstallments} setAllInstallments={setAllInstallments} />}
        {activeTab === 'registrations' && <Registrations clients={clients} setClients={setClients} productLines={productLines} setProductLines={setProductLines} />}
        {activeTab === 'users' && currentUser?.role === 'ADMIN' && <UsersPage currentUser={currentUser} />}
        {activeTab === 'profile' && <Profile currentUser={currentUser} onPasswordChanged={() => {}} />}
      </main>

      {/* Navbar Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-30 px-2 py-3 flex items-center justify-around overflow-x-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-zinc-400'}`}><LayoutDashboard className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Dash</span></button>
        
        {/* BOTÃO MOBILE METAS */}
        <button onClick={() => setActiveTab('metas')} className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === 'metas' ? 'text-indigo-600' : 'text-zinc-400'}`}><Target className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Metas</span></button>

        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === 'sales' ? 'text-indigo-600' : 'text-zinc-400'}`}><ShoppingBag className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Lançar</span></button>
        <button onClick={() => setActiveTab('sales-report')} className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === 'sales-report' ? 'text-indigo-600' : 'text-zinc-400'}`}><ClipboardList className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Vendas</span></button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === 'reports' ? 'text-indigo-600' : 'text-zinc-400'}`}><BarChart3 className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Financ.</span></button>
        
        {/* Se o espaço mobile ficar pequeno, você pode remover ou usar scroll */}
        <button onClick={() => setActiveTab('registrations')} className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === 'registrations' ? 'text-indigo-600' : 'text-zinc-400'}`}><Settings className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Cad.</span></button>
        
        {currentUser?.role === 'ADMIN' && (
           <button onClick={() => setActiveTab('users')} className={`flex flex-col items-center gap-1 min-w-[60px] ${activeTab === 'users' ? 'text-indigo-600' : 'text-zinc-400'}`}><Users className="w-5 h-5" /><span className="text-[9px] font-bold uppercase">Acessos</span></button>
        )}
      </nav>
    </div>
  );
}