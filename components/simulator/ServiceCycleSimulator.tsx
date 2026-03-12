import React, { useState, useMemo } from 'react';
import { db } from '../../services/store';
import { Soldier } from '../../types';
import { Calendar, X, Users, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SimulatorProps {
  onClose: () => void;
}

export const ServiceCycleSimulator: React.FC<SimulatorProps> = ({ onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const soldiers = db.getSoldiers();
  const rosters = db.getRosters();
  const settings = db.getSettings();

  const getCycleIndex = (targetDateStr: string, refDateStr: string) => {
    const refDate = new Date(refDateStr + 'T12:00:00');
    const targetDate = new Date(targetDateStr + 'T12:00:00');
    
    if (isNaN(refDate.getTime()) || isNaN(targetDate.getTime())) return 0;

    const diffTime = targetDate.getTime() - refDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return ((diffDays % 4) + 4) % 4;
  };

  const simResult = useMemo(() => {
    const targetDate = new Date(selectedDate + 'T12:00:00');
    const targetDateStr = selectedDate; 
    const refDateStr = settings.shiftCycleRefDate;

    if (isNaN(targetDate.getTime())) return null;

    const cycleIndex = getCycleIndex(targetDateStr, refDateStr);
    
    const teams24Defs = [
      { name: 'ALFA', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },   
      { name: 'BRAVO', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' }, 
      { name: 'CHARLIE', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' }, 
      { name: 'DELTA', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' }    
    ];

    const teams2x2Defs = [
      { name: 'TURMA 01', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
      { name: 'TURMA 02', color: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' }
    ];

    const currentTeam24Info = teams24Defs[cycleIndex];
    const mapping = settings.teamMappings?.find(m => m.teamName === currentTeam24Info.name);
    const team2x2Name = mapping ? mapping.shiftName : ((cycleIndex === 0 || cycleIndex === 1) ? 'TURMA 01' : 'TURMA 02');
    const currentTeam2x2Info = teams2x2Defs.find(t => t.name === team2x2Name) || teams2x2Defs[0];

    const activeRoster = rosters
      .sort((a,b) => new Date(b.creationDate || 0).getTime() - new Date(a.creationDate || 0).getTime())
      .find(r => 
         r.type === 'cat_amb' &&
         targetDateStr >= r.startDate && 
         targetDateStr <= r.endDate
      );

    let members24: Soldier[] = [];
    let members2x2: Soldier[] = [];
    let source = '';
    let isProjection = false;

    if (activeRoster) {
        source = 'ESCALA GERADA';
        const shifts = activeRoster.shifts.filter(s => s.date === targetDateStr);
        const section0 = activeRoster.sections?.[0];
        const section1 = activeRoster.sections?.[1];
        
        const rowIdsSec0 = section0 ? section0.rows.map(r => r.id) : [];
        const rowIdsSec1 = section1 ? section1.rows.map(r => r.id) : [];

        members24 = shifts
            .filter(s => rowIdsSec0.includes(s.period))
            .map(s => soldiers.find(sold => sold.id === s.soldierId))
            .filter(Boolean) as Soldier[];

        members2x2 = shifts
            .filter(s => rowIdsSec1.includes(s.period))
            .map(s => soldiers.find(sold => sold.id === s.soldierId))
            .filter(Boolean) as Soldier[];
    } else {
        const lastRoster = rosters
           .filter(r => r.type === 'cat_amb')
           .sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

        if (lastRoster) {
           source = 'PROJEÇÃO';
           isProjection = true;

           const projected24h: Record<number, Set<string>> = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };
           const projected2x2: Record<number, Set<string>> = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };

           const section0 = lastRoster.sections?.[0];
           const section1 = lastRoster.sections?.[1];
           const rowIdsSec0 = section0 ? section0.rows.map(r => r.id) : [];
           const rowIdsSec1 = section1 ? section1.rows.map(r => r.id) : [];

           lastRoster.shifts.forEach(shift => {
               if (!shift.soldierId) return;
               const idx = getCycleIndex(shift.date, refDateStr);
               if (rowIdsSec0.includes(shift.period)) {
                   projected24h[idx].add(shift.soldierId);
               }
               if (rowIdsSec1.includes(shift.period)) {
                   projected2x2[idx].add(shift.soldierId);
               }
           });

           const projIds24 = Array.from(projected24h[cycleIndex] || []);
           const projIds2x2 = Array.from(projected2x2[cycleIndex] || []);

           members24 = projIds24
            .map(id => soldiers.find(s => s.id === id))
            .filter(s => s && s.status === 'Ativo' && s.team === currentTeam24Info.name) as Soldier[];
           
           members2x2 = projIds2x2
            .map(id => soldiers.find(s => s.id === id))
            .filter(s => s && s.status === 'Ativo' && s.team?.toUpperCase().includes('TURMA')) as Soldier[];

           if (members24.length === 0) {
              members24 = soldiers.filter(s => s.team === currentTeam24Info.name && s.status === 'Ativo');
           }
           if (members2x2.length === 0) {
              members2x2 = soldiers.filter(s => s.team === currentTeam2x2Info.name && s.status === 'Ativo');
           }
        } else {
           source = 'CADASTRO';
           members24 = soldiers.filter(s => s.team === currentTeam24Info.name && s.status === 'Ativo');
           members2x2 = soldiers.filter(s => s.team === currentTeam2x2Info.name && s.status === 'Ativo');
        }
    }

    const getRolePriority = (role: string, is24h: boolean) => {
        const r = (role || '').toLowerCase();
        if (is24h) {
            if (r.includes('fiscal')) return 1;
            if (r.includes('enfermeiro')) return 2;
            if (r.includes('motorista')) return 3;
            return 4;
        } else {
            if (r.includes('enfermeiro')) return 1;
            if (r.includes('motorista')) return 2;
            return 3;
        }
    };

    members24.sort((a, b) => getRolePriority(a.role, true) - getRolePriority(b.role, true));
    members2x2.sort((a, b) => getRolePriority(a.role, false) - getRolePriority(b.role, false));

    return { team24: currentTeam24Info, members24, team2x2: currentTeam2x2Info, members2x2, source, isProjection };
  }, [selectedDate, rosters, soldiers, settings]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 dark:border-slate-800"
      >
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-black text-pm-900 dark:text-white uppercase">Simulador de Ciclo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-pm-600 dark:text-pm-400 uppercase mb-2">Data da Escala</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-pm-400" size={18}/>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 font-bold text-sm outline-none focus:border-pm-500 transition-all dark:text-white"
                />
              </div>
            </div>
            {simResult && (
              <div className={`px-4 py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${
                simResult.isProjection ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'
              }`}>
                {simResult.isProjection ? <Search size={14}/> : <Users size={14}/>}
                Origem: {simResult.source}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {simResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border-2 ${simResult.team24.color} relative overflow-hidden flex flex-col`}>
                  <div className="absolute top-0 right-0 bg-white/30 dark:bg-black/30 px-3 py-1 rounded-bl-lg text-[10px] font-black uppercase">BLOCO #1 (24h)</div>
                  <div className="font-black text-lg border-b border-black/10 dark:border-white/10 mb-3 pb-2 uppercase tracking-tighter">
                    EQUIPE {simResult.team24.name}
                  </div>
                  <div className="space-y-2 flex-1">
                    {simResult.members24.length > 0 ? simResult.members24.map((s: Soldier, i: number) => (
                      <div key={s.id + i} className="text-sm font-bold flex items-center p-2 rounded-lg bg-white/40 dark:bg-black/20">
                        <div className="w-6 text-[10px] opacity-50 mr-2 uppercase tracking-wider">
                          {i + 1}º
                        </div>
                        <div className="flex-1 truncate">
                            {s.rank} {s.matricula ? s.matricula + ' ' : ''}{s.name} <span className="text-[10px] opacity-60">({s.role || 'Sem função'})</span>
                        </div>
                      </div>
                    )) : (
                      <div className="flex items-center justify-center h-full text-center p-4 opacity-50 font-bold uppercase text-xs border border-dashed border-black/20 dark:border-white/20 rounded-lg">
                          Nenhum militar previsto
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border-2 ${simResult.team2x2.color} relative overflow-hidden flex flex-col`}>
                  <div className="absolute top-0 right-0 bg-white/30 dark:bg-black/30 px-3 py-1 rounded-bl-lg text-[10px] font-black uppercase">BLOCO #2 (2x2)</div>
                  <div className="font-black text-lg border-b border-black/10 dark:border-white/10 mb-3 pb-2 uppercase tracking-tighter">
                    {simResult.team2x2.name}
                  </div>
                  <div className="space-y-2 flex-1">
                    {simResult.members2x2.length > 0 ? simResult.members2x2.map((s: Soldier, i: number) => (
                      <div key={s.id + i} className="text-sm font-bold flex items-center p-2 rounded-lg bg-white/40 dark:bg-black/20">
                        <div className="w-6 text-[10px] opacity-50 mr-2 uppercase tracking-wider">
                          {i + 1}º
                        </div>
                        <div className="flex-1 truncate">
                          {s.rank} {s.matricula ? s.matricula + ' ' : ''}{s.name} <span className="text-[10px] opacity-60">({s.role || 'Sem função'})</span>
                        </div>
                      </div>
                    )) : (
                      <div className="flex items-center justify-center h-full text-center p-4 opacity-50 font-bold uppercase text-xs border border-dashed border-black/20 dark:border-white/20 rounded-lg">
                          Nenhum militar previsto
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase">
                Nenhum policial escalado nesta data.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
