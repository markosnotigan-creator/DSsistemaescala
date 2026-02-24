import React, { useState } from 'react';
import { db } from '../../services/store';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const LocalLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset Password States
  const [isResetting, setIsResetting] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isValid = await db.verifyAdminPassword(password);
      if (isValid) {
        db.login('ADMIN');
      } else {
        setError('Senha incorreta');
      }
    } catch (err) {
      setError('Erro ao verificar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const isKeyValid = db.verifyRecoveryKey(recoveryKey);
      if (isKeyValid) {
        await db.resetAdminPassword(newPassword);
        setSuccess('Senha alterada com sucesso! Faça login com a nova senha.');
        setTimeout(() => {
            setIsResetting(false);
            setSuccess('');
            setRecoveryKey('');
            setNewPassword('');
            setConfirmNewPassword('');
        }, 2000);
      } else {
        setError('Chave Mestra inválida');
      }
    } catch (err) {
      setError('Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (isResetting) {
    return (
        <div className="min-h-screen bg-pm-900 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-transparent dark:border-slate-800 animate-in fade-in zoom-in duration-300">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
                <Lock size={40} />
              </div>
            </div>
    
            <h1 className="text-2xl font-bold text-pm-900 dark:text-white mb-2">Recuperação de Senha</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Insira a Chave Mestra para redefinir a senha de administrador.</p>
    
            <form onSubmit={handleResetPassword} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Chave Mestra</label>
                <input
                  type="password"
                  required
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500 transition-all dark:bg-slate-800 dark:text-white"
                  placeholder="Digite a chave de segurança"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nova Senha</label>
                <input
                  type="password"
                  required
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-pm-500 transition-all dark:bg-slate-800 dark:text-white"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-pm-500 transition-all dark:bg-slate-800 dark:text-white"
                  placeholder="Repita a nova senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
    
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm font-bold">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm font-bold">
                  <ShieldCheck size={16} />
                  <span>{success}</span>
                </div>
              )}
    
              <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetting(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg flex justify-center items-center space-x-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Redefinir</span>}
                  </button>
              </div>
            </form>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-pm-900 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-transparent dark:border-slate-800">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-pm-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-pm-800 dark:text-pm-200 shadow-inner">
            <ShieldCheck size={40} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-pm-900 dark:text-white mb-2">Escalas DS/PMCE</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Acesso Restrito</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 pl-10 pr-10 outline-none focus:ring-2 focus:ring-pm-500 transition-all dark:bg-slate-800 dark:text-white"
                placeholder="Digite a senha"
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
            <div className="text-right mt-1">
                <button 
                    type="button" 
                    onClick={() => setIsResetting(true)}
                    className="text-xs text-pm-600 hover:text-pm-800 dark:text-pm-400 dark:hover:text-pm-300 font-semibold"
                >
                    Esqueci a senha
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
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Entrar</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
