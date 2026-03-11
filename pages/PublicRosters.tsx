
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/store';
import { Roster } from '../types';
import { FileText, Calendar, Clock, Eye, Search, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { PrintPreview } from '../components/pdf/PrintPreview';

export const PublicRosters: React.FC = () => {
  const navigate = useNavigate();
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRoster, setViewingRoster] = useState<Roster | null>(null);
  const settings = db.getSettings();

  useEffect(() => {
    // Load rosters
    const initialRosters = db.getRosters();
    setRosters(initialRosters);
    
    // If we have no rosters, we might still be syncing
    if (initialRosters.length === 0) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    
    // Subscribe to changes
    const unsubscribe = db.subscribe(() => {
      const updatedRosters = db.getRosters();
      setRosters(updatedRosters);
      setLoading(false);
    });

    // Timeout to stop loading if nothing found after 5 seconds
    const timer = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const filteredRosters = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const term = searchTerm.toLowerCase();
    
    return rosters
      .filter(r => {
        const rosterDate = new Date(r.endDate);
        // Filter for last week (ended in the last 7 days or ending in the future)
        const isRecent = rosterDate >= oneWeekAgo;
        const matchesSearch = r.title.toLowerCase().includes(term) || 
                            new Date(r.startDate).toLocaleDateString().includes(term);
        return isRecent && matchesSearch;
      })
      .sort((a, b) => new Date(b.creationDate || 0).getTime() - new Date(a.creationDate || 0).getTime());
  }, [rosters, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/login')} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-pm-900 dark:text-white uppercase tracking-tight">Consulta de Escalas</h1>
            <p className="text-[10px] text-pm-500 dark:text-gray-400 font-bold uppercase tracking-widest">Acesso Público • Últimos 7 Dias</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-pm-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-pm-100 dark:border-slate-700">
          <ShieldAlert className="text-pm-600 dark:text-pm-400" size={18}/>
          <span className="text-[10px] font-black text-pm-700 dark:text-pm-300 uppercase">Somente Visualização</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
          <input 
            className="w-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm outline-none focus:border-pm-500 transition-all shadow-sm dark:text-white"
            placeholder="Pesquisar por título da escala ou data (ex: 11/03)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Rosters List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={48} className="mx-auto text-pm-500 animate-spin mb-4"/>
              <p className="font-black text-gray-400 uppercase text-sm">Sincronizando dados...</p>
            </div>
          ) : filteredRosters.length > 0 ? (
            filteredRosters.map(roster => {
              const category = settings.rosterCategories.find(c => c.id === roster.type);
              return (
                <div key={roster.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md hover:border-pm-300 transition-all group flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-pm-50 dark:bg-slate-800 flex items-center justify-center text-pm-600 dark:text-pm-400 border border-pm-100 dark:border-slate-700">
                      <FileText size={28}/>
                    </div>
                    <div>
                      <h4 className="font-black text-pm-900 dark:text-white uppercase text-base mb-1">{roster.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <span className="flex items-center bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 uppercase text-[10px] font-black">
                          {category?.name || 'Geral'}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1.5 text-pm-400"/> 
                          {new Date(roster.startDate).toLocaleDateString()} a {new Date(roster.endDate).toLocaleDateString()}
                        </span>
                        <span className="hidden sm:flex items-center">
                          <Clock size={14} className="mr-1.5 text-pm-400"/>
                          Criada em {roster.creationDate ? new Date(roster.creationDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingRoster(roster)}
                    className="bg-pm-700 hover:bg-pm-800 text-white px-6 py-3 rounded-xl transition-all flex items-center font-black text-xs uppercase shadow-lg active:scale-95"
                  >
                    <Eye size={18} className="mr-2"/> <span>Visualizar</span>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
              <FileText size={64} className="mx-auto text-gray-200 dark:text-slate-800 mb-4"/>
              <p className="font-black text-gray-400 dark:text-gray-600 uppercase text-sm">Nenhuma escala recente encontrada</p>
              <p className="text-xs text-gray-400 mt-1">Tente pesquisar por outro termo ou data.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistema de Escalas DS/PMCE • v2.0</p>
      </footer>

      {/* Print Preview Modal */}
      {viewingRoster && (
        <PrintPreview roster={viewingRoster} onClose={() => setViewingRoster(null)} />
      )}
    </div>
  );
};
