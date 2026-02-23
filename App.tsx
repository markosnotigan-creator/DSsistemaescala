
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/ui/Layout.tsx';
import { Dashboard } from './pages/Dashboard';
import { Personnel } from './pages/Personnel';
import { RosterManager } from './pages/RosterManager';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
          <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            <Settings />
          </Layout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
