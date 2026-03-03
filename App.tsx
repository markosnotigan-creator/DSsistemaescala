
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './pages/Dashboard';
import { Personnel } from './pages/Personnel';
import { RosterManager } from './pages/RosterManager';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { LocalLogin } from './components/auth/LocalLogin';
import { db } from './services/store';
import { User } from './types';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(db.getCurrentUser());

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Subscribe to auth changes (Local Store + Supabase)
    const unsubscribe = db.subscribe(() => {
      setUser(db.getCurrentUser());
    });
    
    // Check initial session from Supabase
    import('./services/supabase').then(({ supabase }) => {
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
             // Sync Supabase session to local store format
             const user: User = {
                id: session.user.id,
                username: session.user.email || 'Administrador',
                role: session.user.email?.toLowerCase().includes('operador') ? 'USER' : 'ADMIN'
             };
             sessionStorage.setItem('current_user', JSON.stringify(user));
             setUser(user);
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
             const user: User = {
                id: session.user.id,
                username: session.user.email || 'Administrador',
                role: session.user.email?.toLowerCase().includes('operador') ? 'USER' : 'ADMIN'
             };
             sessionStorage.setItem('current_user', JSON.stringify(user));
             setUser(user);
          } else {
             sessionStorage.removeItem('current_user');
             setUser(null);
          }
        });
        
        return () => subscription.unsubscribe();
      }
    });

    return unsubscribe;
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

  if (!user) {
    return <LocalLogin />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            <Dashboard />
          </Layout>
        } />

        <Route path="/personnel" element={
          <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            <Personnel />
          </Layout>
        } />

        <Route path="/rosters" element={
          <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            <RosterManager />
          </Layout>
        } />

        <Route path="/reports" element={
          <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            <Reports />
          </Layout>
        } />

        <Route path="/settings" element={
          user.role === 'ADMIN' ? (
            <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
              <Settings />
            </Layout>
          ) : <Navigate to="/" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
