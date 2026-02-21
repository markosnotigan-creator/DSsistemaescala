
import React, { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout.tsx';
import { Dashboard } from './pages/Dashboard';
import { Personnel } from './pages/Personnel';
import { RosterManager } from './pages/RosterManager';
import { Settings } from './pages/Settings';
import { db } from './services/store';
import { Lock, ArrowLeft, ShieldCheck, Eye, EyeOff, KeyRound, Mail, Phone, HelpCircle, X, Moon, Sun } from 'lucide-react';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Login State
  const [isLoginAdmin, setIsLoginAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Recovery Modal State
  const [showRecovery, setShowRecovery] = useState(false);

  // Load Theme from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogin = async (role: 'ADMIN' | 'USER') => {
    if (role === 'ADMIN') {
      const isValid = await db.verifyAdminPassword(password);
      if (isValid) {
        db.login(role);
        setIsAuthenticated(true);
      } else {
        setError('Senha incorreta. Verifique suas credenciais.');
      }
    } else {
      db.login(role);
      setIsAuthenticated(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin('ADMIN');
    }
  };

  const handleRecoverWhatsApp = () => {
    const phone = "5585988504361";
    const message = `SOLICITAÇÃO DE RECUPERAÇÃO DE SENHA\n\nOlá, esqueci a senha do sistema Escalas DS.\n\nPor favor, entre em contato para realizar o reset da senha administrativa.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleRecoverEmail = () => {
    const email = "marcos_notigan@hotmail.com";
    const subject = "Recuperação de Senha - Escalas DS";
    const body = `Olá,\n\nEstou solicitando a recuperação da senha administrativa do sistema Escalas DS.\n\nPor favor, informe os procedimentos para reset de senha.`;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-pm-900 dark:bg-slate-950 flex items-center justify-center p-4 relative">
        {/* Theme Toggle on Login Screen */}
        <button 
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-full bg-pm-800 text-pm-100 hover:bg-pm-700 transition-colors z-20"
          title="Alternar Tema"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transition-all duration-300 relative overflow-hidden border border-transparent dark:border-slate-800">
          
          <div className="mb-6 flex justify-center relative z-10">
             <div className="w-20 h-20 bg-pm-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-pm-800 dark:text-pm-200 shadow-inner">
               {isLoginAdmin ? <Lock size={40} /> : <span className="text-4xl">👮</span>}
             </div>
          </div>
          
          <h1 className="text-2xl font-bold text-pm-900 dark:text-white mb-2 relative z-10">Escalas DS/PMCE</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 relative z-10">Sistema de Gerenciamento de Escalas</p>
          
          {!isLoginAdmin ? (
            <div className="space-y-4 relative z-10">
              <button 
                onClick={() => setIsLoginAdmin(true)}
                className="w-full bg-pm-700 hover:bg-pm-800 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
              >
                <ShieldCheck size={20} />
                <span>Acesso Administrativo</span>
              </button>
              <button 
                onClick={() => handleLogin('USER')}
                className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2"
              >
                <span>Acesso Visualizador</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left relative z-10 animate-in fade-in slide-in-from-right-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha do Administrador</label>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className={`w-full border rounded-lg p-3 pr-10 outline-none focus:ring-2 focus:ring-pm-500 transition-all dark:bg-slate-800 dark:text-white ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-slate-700'}`}
                    placeholder="Digite a senha..."
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}
                
                <div className="text-right mt-2">
                  <button 
                    onClick={() => setShowRecovery(true)}
                    className="text-xs text-pm-600 dark:text-pm-400 font-bold hover:underline hover:text-pm-800 flex items-center justify-end w-full"
                  >
                    <HelpCircle size={12} className="mr-1"/> Esqueci a Senha
                  </button>
                </div>
              </div>

              <button 
                onClick={() => handleLogin('ADMIN')}
                className="w-full bg-pm-700 hover:bg-pm-800 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg flex justify-center"
              >
                Entrar
              </button>
              
              <button 
                onClick={() => { setIsLoginAdmin(false); setPassword(''); setError(''); }}
                className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 text-sm flex items-center justify-center space-x-1"
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>
            </div>
          )}

          <p className="mt-8 text-xs text-gray-400 border-t dark:border-slate-800 pt-4 relative z-10">
            {isLoginAdmin ? 'Acesso restrito a oficiais e sargentantes.' : 'Versão Web 1.2.0'}
          </p>

          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-slate-800 rounded-bl-full -mr-16 -mt-16 z-0 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-pm-50 dark:bg-slate-800 rounded-tr-full -ml-12 -mb-12 z-0 opacity-50"></div>
        </div>

        {/* Modal de Recuperação de Senha */}
        {showRecovery && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 border border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-2">
                   <h3 className="font-black text-pm-900 dark:text-white uppercase text-lg flex items-center">
                     <KeyRound size={20} className="mr-2 text-gov-yellow"/> Recuperar Senha
                   </h3>
                   <button onClick={() => setShowRecovery(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                   Selecione um dos canais abaixo. O sistema irá gerar uma mensagem automática contendo sua senha atual recuperada do banco de dados.
                </p>

                <div className="space-y-3">
                   <button 
                     onClick={handleRecoverWhatsApp}
                     className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center shadow-md transition-all active:scale-95"
                   >
                      <Phone size={20} className="mr-2"/> Enviar para WhatsApp
                   </button>
                   <button 
                     onClick={handleRecoverEmail}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center shadow-md transition-all active:scale-95"
                   >
                      <Mail size={20} className="mr-2"/> Enviar para E-mail
                   </button>
                </div>

                <div className="mt-4 text-center">
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                     Contatos cadastrados: <br/>marcos_notigan@hotmail.com <br/> (85) 98850-4361
                   </p>
                </div>
             </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'personnel' && <Personnel />}
      {activePage === 'rosters' && <RosterManager />}
      {activePage === 'settings' && <Settings />}
    </Layout>
  );
}

export default App;
