import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Eye, EyeOff, ShieldCheck, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pm-900 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-transparent dark:border-slate-800">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-pm-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-pm-800 dark:text-pm-200 shadow-inner">
            <ShieldCheck size={40} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-pm-900 dark:text-white mb-2">Escalas DS/PMCE</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Sistema Profissional de Gerenciamento</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-pm-500 transition-all dark:bg-slate-800 dark:text-white"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 pl-10 pr-10 outline-none focus:ring-2 focus:ring-pm-500 transition-all dark:bg-slate-800 dark:text-white"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm font-bold">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pm-700 hover:bg-pm-800 disabled:bg-pm-400 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg flex justify-center items-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Entrar no Sistema</span>}
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-400 border-t dark:border-slate-800 pt-4">
          Acesso restrito. Versão Profissional 2.0.0
        </p>
      </div>
    </div>
  );
};
