
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/store';
import { Roster } from '../types';
import { FileText, Calendar, Clock, Eye, Search, ArrowLeft, ShieldAlert, Loader2, ChevronLeft, ChevronRight, Users, Calculator, X } from 'lucide-react';
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
  const [showCalc, setShowCalc] = useState(false);
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcEndDate, setCalcEndDate] = useState('');
  const [calcDays, setCalcDays] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);
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
          rosters: catId === 'cat_extra' ? sorted : sorted.slice(0, 2)
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
            onClick={() => setShowCalc(true)}
            className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-all mr-2"
          >
            <Calculator size={18}/>
            <span className="text-[10px] font-black uppercase">Calculadora</span>
          </button>
          <div className="w-px h-4 bg-pm-200 dark:bg-slate-700" />
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
                          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col min-h-[420px] relative overflow-hidden group">
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
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {group.categoryId === 'cat_extra' ? (
                                    <div className="w-full flex flex-col gap-2">
                                      <input 
                                        type="date"
                                        className="w-full border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2 font-bold text-pm-900 dark:text-white outline-none focus:border-pm-500 transition-all text-sm"
                                        value={selectedRoster ? selectedRoster.startDate : ''}
                                        onChange={(e) => {
                                          const selectedDate = e.target.value;
                                          const foundRoster = group.rosters.find(r => r.startDate === selectedDate);
                                          if (foundRoster) {
                                            setSelectedRosterIds(prev => ({ ...prev, [group.categoryId]: foundRoster.id }));
                                          } else {
                                            alert("Nenhuma escala encontrada para esta data.");
                                          }
                                        }}
                                      />
                                      <div className="flex flex-wrap gap-2">
                                        {group.rosters.slice(0, 6).map(r => (
                                          <button
                                            key={r.id}
                                            onClick={() => setSelectedRosterIds(prev => ({ ...prev, [group.categoryId]: r.id }))}
                                            className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${selectedRosterId === r.id ? 'bg-pm-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}
                                          >
                                            {new Date(r.startDate).toLocaleDateString()}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    group.rosters.map(r => (
                                      <button
                                        key={r.id}
                                        onClick={() => setSelectedRosterIds(prev => ({ ...prev, [group.categoryId]: r.id }))}
                                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${selectedRosterId === r.id ? 'bg-pm-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}
                                      >
                                        {new Date(r.startDate).toLocaleDateString()}
                                      </button>
                                    ))
                                  )}
                                </div>

                                <h4 className="text-2xl font-black text-pm-900 dark:text-white uppercase leading-tight line-clamp-2">
                                  {selectedRoster?.title}
                                </h4>
                              </div>

                              <div className="space-y-3 pt-2">
                                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-bold">
                                  <Calendar size={18} className="mr-3 text-pm-500" />
                                  <span>{selectedRoster ? (group.categoryId === 'cat_extra' ? new Date(selectedRoster.startDate).toLocaleDateString() : `${new Date(selectedRoster.startDate).toLocaleDateString()} a ${new Date(selectedRoster.endDate).toLocaleDateString()}`) : ''}</span>
                                </div>
                                <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs font-medium">
                                  <Clock size={16} className="mr-3" />
                                  <span>Criada em {selectedRoster?.creationDate ? new Date(selectedRoster.creationDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => selectedRoster && setViewingRoster(selectedRoster)}
                              className="w-full bg-pm-700 hover:bg-pm-800 text-white py-4 rounded-2xl transition-all flex items-center justify-center font-black text-sm uppercase shadow-lg shadow-pm-500/20 active:scale-95 group-hover:translate-y-[-4px] mt-6 shrink-0"
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

      {/* Modal Calculadora */}
      {showCalc && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="font-black text-pm-900 dark:text-white flex items-center uppercase tracking-tight">
                <Calculator size={18} className="mr-2 text-pm-600" />
                Calculadora entre Períodos
              </h3>
              <button onClick={() => setShowCalc(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Inicial</label>
                <input 
                  type="date" 
                  className="w-full border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-pm-900 dark:text-white outline-none focus:border-pm-500 transition-all"
                  value={calcStartDate}
                  onChange={e => setCalcStartDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Final</label>
                  <input 
                    type="date" 
                    className="w-full border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-pm-900 dark:text-white outline-none focus:border-pm-500 transition-all"
                    value={calcEndDate}
                    onChange={e => {
                      setCalcEndDate(e.target.value);
                      if (e.target.value) setCalcDays('');
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Qtd. Dias</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 40"
                    className="w-full border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-3 font-bold text-pm-900 dark:text-white outline-none focus:border-pm-500 transition-all"
                    value={calcDays}
                    onChange={e => {
                      setCalcDays(e.target.value);
                      if (e.target.value) setCalcEndDate('');
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setCalcStartDate('');
                    setCalcEndDate('');
                    setCalcDays('');
                    setCalcResult(null);
                  }}
                  className="w-1/3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-black uppercase py-3 rounded-xl transition-all active:scale-95"
                >
                  Limpar
                </button>
                <button 
                  onClick={() => {
                    if (!calcStartDate) {
                      alert("Por favor, selecione a data inicial.");
                      return;
                    }
                    const start = new Date(calcStartDate + 'T12:00:00');
                    let end = new Date(start.getTime());
                    let totalDays = 0;
                    let returnDate = new Date(start.getTime());

                    if (calcDays && !isNaN(parseInt(calcDays))) {
                      totalDays = parseInt(calcDays);
                      end.setDate(start.getDate() + totalDays - 1);
                      returnDate.setDate(start.getDate() + totalDays);
                    } else if (calcEndDate) {
                      end = new Date(calcEndDate + 'T12:00:00');
                      if (end < start) {
                        alert("A data final não pode ser anterior à data inicial.");
                        return;
                      }
                      const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
                      const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
                      totalDays = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
                      returnDate = new Date(end.getTime());
                      returnDate.setDate(end.getDate() + 1);
                    } else {
                      alert("Informe a data final ou a quantidade de dias.");
                      return;
                    }

                    let d1 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    let d2 = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());

                    let totalMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                    
                    if (d2.getDate() < d1.getDate()) {
                        totalMonths -= 1;
                    }

                    let tempDate = new Date(d1.getFullYear(), d1.getMonth() + totalMonths, d1.getDate());
                    let expectedMonth = (d1.getMonth() + totalMonths) % 12;
                    if (expectedMonth < 0) expectedMonth += 12;
                    
                    if (tempDate.getMonth() !== expectedMonth) {
                        tempDate = new Date(d1.getFullYear(), d1.getMonth() + totalMonths + 1, 0);
                    }

                    const utcTemp = Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
                    const utcD2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
                    let remainingDays = Math.floor((utcD2 - utcTemp) / (1000 * 60 * 60 * 24));

                    let semesters = Math.floor(totalMonths / 6);
                    let remainingMonths = totalMonths % 6;

                    const exactPeriodDisplay = [];
                    if (semesters > 0) exactPeriodDisplay.push(`${semesters} semestre${semesters > 1 ? 's' : ''}`);
                    if (remainingMonths > 0) exactPeriodDisplay.push(`${remainingMonths} ${remainingMonths > 1 ? 'meses' : 'mês'}`);
                    if (remainingDays > 0) exactPeriodDisplay.push(`${remainingDays} dia${remainingDays > 1 ? 's' : ''}`);
                    
                    const periodString = exactPeriodDisplay.length > 0 ? exactPeriodDisplay.join(', ') : '0 dias';

                    setCalcResult({
                      start,
                      end,
                      totalDays,
                      periodString,
                      returnDate
                    });
                  }}
                  className="w-2/3 bg-pm-600 hover:bg-pm-700 text-white font-black uppercase py-3 rounded-xl transition-all shadow-lg shadow-pm-500/30 active:scale-95"
                >
                  Calcular
                </button>
              </div>

              {calcResult && (
                <div className="mt-4 p-4 bg-pm-50 dark:bg-slate-800/80 border border-pm-100 dark:border-slate-700 rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center border-b border-red-200/50 dark:border-red-900/50 pb-2">
                    <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">Período Completo</span>
                    <span className="font-black text-red-600 dark:text-red-400 text-sm">
                      {calcResult.start.toLocaleDateString('pt-BR')} a {calcResult.end.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-pm-200/50 dark:border-slate-600 pb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total de Dias</span>
                    <span className="font-black text-pm-900 dark:text-white text-sm">{calcResult.totalDays} dias</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-pm-200/50 dark:border-slate-600 pb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tempo Exato</span>
                    <span className="font-black text-pm-900 dark:text-white text-sm text-right">
                      {calcResult.periodString}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-green-100 dark:bg-green-900/30 p-2 rounded-lg border border-green-200 dark:border-green-800/50">
                    <span className="text-xs font-black text-green-800 dark:text-green-400 uppercase">Data de Retorno</span>
                    <span className="font-black text-green-900 dark:text-green-300 text-lg">
                      {calcResult.returnDate.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
