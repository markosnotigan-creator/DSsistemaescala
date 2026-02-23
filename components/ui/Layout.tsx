
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  LogOut, 
  ShieldAlert,
  Scale,
  LayoutDashboard,
  Download,
  Moon,
  Sun,
  FileText
} from 'lucide-react';
import { db } from '../../services/store';

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, isDarkMode, toggleTheme }) => {
  const user = db.getCurrentUser();
  const location = useLocation();
  const activePage = location.pathname;

  const isAdmin = user.role === 'ADMIN';
  const isOperator = isAdmin || user.role === 'USER'; // Adjusting logic for simplified roles
  
  const signOut = () => {
    localStorage.removeItem('current_user');
    window.location.href = '/';
  };
  
  // Estado para o evento de instalação (PWA)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link
      to={to}
      className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200
        ${activePage === to 
          ? 'bg-pm-700 text-white border-r-4 border-gov-yellow shadow-inner' 
          : 'text-pm-100 hover:bg-pm-800 hover:text-white'}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  const getPageTitle = () => {
    switch (activePage) {
      case '/': return 'Visão Geral do Efetivo';
      case '/personnel': return 'Cadastro de Militares';
      case '/rosters': return 'Gerenciamento de Escalas';
      case '/reports': return 'Relatórios e Estatísticas';
      case '/settings': return 'Configurações do Sistema';
      default: return 'Sistema de Escalas';
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-200 print:h-auto print:overflow-visible">
      {/* Sidebar */}
      <aside className="w-64 bg-pm-900 dark:bg-slate-950 text-white flex flex-col shadow-2xl z-20 transition-colors duration-200 no-print">
        <div className="p-6 flex items-center space-x-3 border-b border-pm-700 dark:border-slate-800 bg-pm-950/30">
          <div className="bg-gov-yellow p-1.5 rounded-lg">
            <ShieldAlert className="text-pm-900" size={28} />
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight tracking-tighter text-white">Escalas DS</h1>
            <p className="text-[9px] text-pm-300 uppercase font-bold tracking-widest">PMCE - Saúde</p>
          </div>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Painel Principal" />
          {isOperator && <NavItem to="/rosters" icon={Scale} label="Gerenciar Escalas" />}
          <NavItem to="/personnel" icon={Users} label="Efetivo (Militares)" />
          <NavItem to="/reports" icon={FileText} label="Relatórios" />
          {isAdmin && <NavItem to="/settings" icon={Settings} label="Configurações" />}
        </nav>

        <div className="p-4 bg-pm-800/50 dark:bg-slate-900/50 mt-auto border-t border-pm-700 dark:border-slate-800 space-y-3">
          {/* Botão de Instalação PWA */}
          {showInstallBtn && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs uppercase font-black transition-all shadow-lg active:scale-95 animate-pulse"
            >
              <Download size={16} />
              <span>Instalar no PC</span>
            </button>
          )}

          <div className="flex items-center space-x-3 p-2 bg-pm-900/50 dark:bg-slate-950/50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-pm-600 dark:bg-slate-700 border-2 border-pm-500 dark:border-slate-600 flex items-center justify-center font-black text-white shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{user.username}</p>
              <p className="text-[10px] text-pm-400 font-bold uppercase tracking-tighter">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={signOut} 
            className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-xs uppercase font-black transition-all shadow-lg active:scale-95"
          >
            <LogOut size={16} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:h-auto">
        <header className="bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center px-6 justify-between z-10 border-b border-gray-200 dark:border-slate-700 transition-colors duration-200 no-print">
          <h2 className="text-xl font-black text-pm-900 dark:text-white uppercase tracking-tight">
            {getPageTitle()}
          </h2>
          
          <div className="flex items-center space-x-4">
             {/* Dark Mode Toggle */}
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-600"
              title={isDarkMode ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
             >
                {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-pm-600" />}
             </button>

             <div className="text-xs font-bold text-pm-400 dark:text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-700 px-4 py-2 rounded-full border dark:border-slate-600">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 bg-slate-50/50 dark:bg-slate-900 transition-colors duration-200 print:overflow-visible print:h-auto print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
};
