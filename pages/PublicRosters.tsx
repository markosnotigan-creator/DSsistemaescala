
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/store';
import { Roster } from '../types';
import { FileText, Calendar, Clock, Eye, Search, ArrowLeft, ShieldAlert, Loader2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { PrintPreview } from '../components/pdf/PrintPreview';
import { ServiceCycleSimulator } from '../components/simulator/ServiceCycleSimulator';
import { motion, AnimatePresence } from 'motion/react';

export const PublicRosters: React.FC = () => {
  const navigate = useNavigate();
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRoster, setViewingRoster] = useState<Roster | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const settings = db.getSettings();

  useEffect(() => {
    const initialRosters = db.getRosters();
    setRosters(initialRosters);
    setLoading(initialRosters.length === 0);
    
    const unsubscribe = db.subscribe(() => {
      const updatedRosters = db.getRosters();
      setRosters(updatedRosters);
      setLoading(false);
    });

    const timer = setTimeout(() => setLoading(false), 5000);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const [selectedRosterIds, setSelectedRosterIds] = useState<Record<string, string>>({});

  const groupedRosters = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    // 1. Filter by search term first
    const searched = rosters.filter(r => 
      r.title.toLowerCase().includes(term) || 
      new Date(r.startDate).toLocaleDateString().includes(term)
    );

    // 2. Group by category
    const grouped: Record<string, Roster[]> = {};
    searched.forEach(r => {
      if (!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    });

    // 3. Define the specific order requested
    const categoryOrder = ['cat_adm', 'cat_amb', 'cat_ast', 'cat_odo', 'cat_psi', 'cat_extra'];
    
    const groups: { categoryId: string, categoryName: string, rosters: Roster[] }[] = [];
    
    categoryOrder.forEach(catId => {
      if (grouped[catId]) {
        const sorted = grouped[catId].sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        const categoryName = settings.rosterCategories.find(c => c.id === catId)?.name || 'Geral';
        groups.push({
          categoryId: catId,
          categoryName,
          rosters: sorted.slice(0, 2)
        });
      }
    });
    return groups;
  }, [rosters, searchTerm, settings.rosterCategories]);

  // Reset index when search changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchTerm]);

  const nextSlide = () => {
    if (currentIndex < groupedRosters.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/login')} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-pm-900 dark:text-white uppercase tracking-tight">Consulta de Escalas</h1>
            <p className="text-[10px] text-pm-500 dark:text-gray-400 font-bold uppercase tracking-widest">Acesso Público • 2 Últimas por Categoria</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-pm-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-pm-100 dark:border-slate-700">
          <button 
            onClick={() => setShowSimulator(true)}
            className="flex items-center space-x-2 text-pm-700 dark:text-pm-300 hover:text-pm-900 dark:hover:text-white transition-all"
          >
            <Users size={18}/>
            <span className="text-[10px] font-black uppercase">Simulador</span>
          </button>
          <div className="w-px h-4 bg-pm-200 dark:bg-slate-700" />
          <ShieldAlert className="text-pm-600 dark:text-pm-400" size={18}/>
          <span className="text-[10px] font-black text-pm-700 dark:text-pm-300 uppercase">Somente Visualização</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
          <input 
            className="w-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 font-bold text-sm outline-none focus:border-pm-500 transition-all shadow-sm dark:text-white"
            placeholder="Pesquisar escala..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Carousel Section */}
        <div className="flex-1 flex flex-col justify-center relative min-h-[400px]">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={48} className="mx-auto text-pm-500 animate-spin mb-4"/>
              <p className="font-black text-gray-400 uppercase text-sm">Sincronizando dados...</p>
            </div>
          ) : groupedRosters.length > 0 ? (
            <div className="relative w-full overflow-visible">
              {/* Navigation Buttons */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-10">
                <button 
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                  className={`p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 transition-all ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'hover:scale-110 active:scale-95'}`}
                >
                  <ChevronLeft size={24} className="text-pm-600 dark:text-pm-400" />
                </button>
              </div>
              
              <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 z-10">
                <button 
                  onClick={nextSlide}
                  disabled={currentIndex === groupedRosters.length - 1}
                  className={`p-3 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 transition-all ${currentIndex === groupedRosters.length - 1 ? 'opacity-0 pointer-events-none' : 'hover:scale-110 active:scale-95'}`}
                >
                  <ChevronRight size={24} className="text-pm-600 dark:text-pm-400" />
                </button>
              </div>

              {/* Carousel Container */}
              <div className="flex justify-center items-center">
                <div className="w-full max-w-md overflow-hidden py-10 px-4">
                  <motion.div 
                    className="flex"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -50) nextSlide();
                      if (info.offset.x > 50) prevSlide();
                    }}
                    animate={{ x: `calc(-${currentIndex * 100}% - ${currentIndex * 24}px)` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ gap: '24px' }}
                  >
                    {groupedRosters.map((group, idx) => {
                      const selectedRosterId = selectedRosterIds[group.categoryId] || group.rosters[0].id;
                      const selectedRoster = group.rosters.find(r => r.id === selectedRosterId);
                      
                      return (
                        <motion.div 
                          key={group.categoryId}
                          className="min-w-full"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ 
                            opacity: currentIndex === idx ? 1 : 0.4,
                            scale: currentIndex === idx ? 1 : 0.9,
                            rotateY: currentIndex === idx ? 0 : (idx < currentIndex ? 15 : -15)
                          }}
                          transition={{ duration: 0.4 }}
                        >
                          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col h-[420px] relative overflow-hidden group">
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pm-500/5 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110" />
                            
                            <div className="flex-1 space-y-6">
                              <div className="w-16 h-16 rounded-2xl bg-pm-50 dark:bg-slate-800 flex items-center justify-center text-pm-600 dark:text-pm-400 border border-pm-100 dark:border-slate-700 shadow-inner">
                                <FileText size={32}/>
                              </div>
                              
                              <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-pm-100 dark:bg-pm-900/30 text-pm-700 dark:text-pm-300 text-[10px] font-black uppercase tracking-widest mb-3">
                                  {group.categoryName}
                                </span>
                                
                                {/* Selector for rosters */}
                                <div className="flex gap-2 mb-4">
                                  {group.rosters.map(r => (
                                    <button
                                      key={r.id}
                                      onClick={() => setSelectedRosterIds(prev => ({ ...prev, [group.categoryId]: r.id }))}
                                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${selectedRosterId === r.id ? 'bg-pm-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}
                                    >
                                      {new Date(r.startDate).toLocaleDateString()}
                                    </button>
                                  ))}
                                </div>

                                <h4 className="text-2xl font-black text-pm-900 dark:text-white uppercase leading-tight line-clamp-2">
                                  {selectedRoster?.title}
                                </h4>
                              </div>

                              <div className="space-y-3 pt-2">
                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-bold">
                                  <Calendar size={18} className="mr-3 text-pm-500" />
                                  <span>{selectedRoster ? `${new Date(selectedRoster.startDate).toLocaleDateString()} a ${new Date(selectedRoster.endDate).toLocaleDateString()}` : ''}</span>
                                </div>
                                <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs font-medium">
                                  <Clock size={16} className="mr-3" />
                                  <span>Criada em {selectedRoster?.creationDate ? new Date(selectedRoster.creationDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => selectedRoster && setViewingRoster(selectedRoster)}
                              className="w-full bg-pm-700 hover:bg-pm-800 text-white py-4 rounded-2xl transition-all flex items-center justify-center font-black text-sm uppercase shadow-lg shadow-pm-500/20 active:scale-95 group-hover:translate-y-[-4px]"
                            >
                              <Eye size={20} className="mr-2"/> <span>Visualizar Escala</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>

              {/* Indicators */}
              <div className="flex justify-center items-center space-x-2 mt-8">
                {groupedRosters.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentIndex === idx ? 'w-8 bg-pm-600' : 'w-2 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-slate-800 max-w-lg mx-auto w-full">
              <FileText size={64} className="mx-auto text-gray-200 dark:text-slate-800 mb-4"/>
              <p className="font-black text-gray-400 dark:text-gray-600 uppercase text-sm">Nenhuma escala recente encontrada</p>
              <p className="text-xs text-gray-400 mt-1">Tente pesquisar por outro termo ou data.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center bg-transparent">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistema de Escalas DS/PMCE • v2.0</p>
      </footer>

      {/* Print Preview Modal */}
      {viewingRoster && (
        <PrintPreview roster={viewingRoster} onClose={() => setViewingRoster(null)} />
      )}

      {/* Simulator Modal */}
      {showSimulator && (
        <ServiceCycleSimulator onClose={() => setShowSimulator(false)} />
      )}
    </div>
  );
};
