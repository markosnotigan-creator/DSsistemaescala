
import React, { useState, useMemo } from 'react';
import { db } from '../services/store';
import { 
  FileText, 
  Printer, 
  Users, 
  Calendar, 
  TrendingUp, 
  Filter, 
  Download, 
  ChevronRight,
  Search,
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { Rank, Role, Status, Soldier, Roster, Shift } from '../types';

type ReportType = 'personnel' | 'shifts' | 'absences' | 'extra_duty';

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('Todos');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const soldiers = db.getSoldiers();
  const rosters = db.getRosters();
  const history = db.getExtraDutyHistory();

  const sectors = useMemo(() => {
    const s = new Set(soldiers.map(sol => sol.sector));
    return ['Todos', ...Array.from(s)];
  }, [soldiers]);

  const filteredSoldiers = useMemo(() => {
    return soldiers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (s.matricula && s.matricula.includes(searchTerm));
      const matchesSector = filterSector === 'Todos' || s.sector === filterSector;
      return matchesSearch && matchesSector;
    });
  }, [soldiers, searchTerm, filterSector]);

  const shiftStats = useMemo(() => {
    const stats: Record<string, { count: number, name: string, rank: string }> = {};
    
    rosters.forEach(roster => {
      // Check if roster is within date range
      const rStart = new Date(roster.startDate);
      const rEnd = new Date(roster.endDate);
      const filterStart = new Date(dateRange.start);
      const filterEnd = new Date(dateRange.end);

      if (rStart <= filterEnd && rEnd >= filterStart) {
        roster.shifts.forEach(shift => {
          const sDate = new Date(shift.date);
          if (sDate >= filterStart && sDate <= filterEnd) {
            if (!stats[shift.soldierId]) {
              const sol = soldiers.find(s => s.id === shift.soldierId);
              stats[shift.soldierId] = { 
                count: 0, 
                name: sol?.name || 'Desconhecido', 
                rank: sol?.rank || '' 
              };
            }
            stats[shift.soldierId].count++;
          }
        });
      }
    });

    return Object.entries(stats)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, data]) => ({ id, ...data }));
  }, [rosters, soldiers, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-pm-100 dark:bg-pm-900/30 p-3 rounded-xl text-pm-700 dark:text-pm-400">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-pm-900 dark:text-white uppercase tracking-tighter">Relatórios Gerenciais</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Análise de dados e exportação</p>
            </div>
          </div>
          
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 bg-pm-900 hover:bg-pm-950 text-white px-6 py-3 rounded-xl font-black uppercase text-sm shadow-lg transition-all active:scale-95"
          >
            <Printer size={18} />
            <span>Imprimir Relatório</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <button 
            onClick={() => setActiveReport('personnel')}
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${activeReport === 'personnel' ? 'border-pm-600 bg-pm-50 dark:bg-pm-900/20 text-pm-900 dark:text-white' : 'border-gray-100 dark:border-slate-800 hover:border-pm-200 text-gray-600 dark:text-gray-400'}`}
          >
            <Users size={20} />
            <span className="font-bold uppercase text-xs">Efetivo Geral</span>
          </button>
          <button 
            onClick={() => setActiveReport('shifts')}
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${activeReport === 'shifts' ? 'border-pm-600 bg-pm-50 dark:bg-pm-900/20 text-pm-900 dark:text-white' : 'border-gray-100 dark:border-slate-800 hover:border-pm-200 text-gray-600 dark:text-gray-400'}`}
          >
            <Clock size={20} />
            <span className="font-bold uppercase text-xs">Produtividade (Plantões)</span>
          </button>
          <button 
            onClick={() => setActiveReport('absences')}
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${activeReport === 'absences' ? 'border-pm-600 bg-pm-50 dark:bg-pm-900/20 text-pm-900 dark:text-white' : 'border-gray-100 dark:border-slate-800 hover:border-pm-200 text-gray-600 dark:text-gray-400'}`}
          >
            <AlertCircle size={20} />
            <span className="font-bold uppercase text-xs">Afastamentos / LTS</span>
          </button>
          <button 
            onClick={() => setActiveReport('extra_duty')}
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${activeReport === 'extra_duty' ? 'border-pm-600 bg-pm-50 dark:bg-pm-900/20 text-pm-900 dark:text-white' : 'border-gray-100 dark:border-slate-800 hover:border-pm-200 text-gray-600 dark:text-gray-400'}`}
          >
            <TrendingUp size={20} />
            <span className="font-bold uppercase text-xs">Escalas Extras</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800 flex flex-wrap items-center gap-4 no-print">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou matrícula..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-pm-500 outline-none dark:text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select 
            className="bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm py-2 px-4 focus:ring-2 focus:ring-pm-500 outline-none dark:text-white font-bold"
            value={filterSector}
            onChange={e => setFilterSector(e.target.value)}
          >
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {activeReport === 'shifts' && (
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="date" 
              className="bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-pm-500 outline-none dark:text-white"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="text-gray-400">até</span>
            <input 
              type="date" 
              className="bg-gray-50 dark:bg-slate-800 border-none rounded-lg text-sm py-2 px-3 focus:ring-2 focus:ring-pm-500 outline-none dark:text-white"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none">
        {/* Print Header */}
        <div className="hidden print:block p-8 border-b-2 border-pm-900 mb-6">
           <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Bras%C3%A3o_da_Pol%C3%ADcia_Militar_do_Cear%C3%A1.png" className="h-16 w-16 object-contain" alt="PMCE" />
                 <div>
                    <h1 className="text-lg font-black uppercase leading-tight">Polícia Militar do Ceará</h1>
                    <h2 className="text-md font-bold uppercase text-gray-700">Diretoria de Saúde - DS</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase">Relatório de {
                      activeReport === 'personnel' ? 'Efetivo Geral' : 
                      activeReport === 'shifts' ? 'Produtividade de Plantões' : 
                      activeReport === 'absences' ? 'Afastamentos e LTS' : 'Escalas Extras'
                    }</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold uppercase text-gray-400">Emitido em:</p>
                 <p className="text-xs font-black">{new Date().toLocaleString('pt-BR')}</p>
              </div>
           </div>
        </div>

        <div className="p-6">
          {activeReport === 'personnel' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <h4 className="text-lg font-black text-pm-900 dark:text-white uppercase tracking-tighter">Listagem de Efetivo</h4>
                <span className="text-xs font-bold text-gray-500 uppercase">Total: {filteredSoldiers.length} Militares</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 no-print">
                 <div className="bg-pm-50 dark:bg-pm-900/20 p-4 rounded-2xl border border-pm-100 dark:border-pm-900/30">
                    <p className="text-[10px] font-black text-pm-600 dark:text-pm-400 uppercase mb-1">Efetivo Ativo</p>
                    <p className="text-3xl font-black text-pm-900 dark:text-white">{soldiers.filter(s => s.status === Status.ATIVO).length}</p>
                 </div>
                 <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                    <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase mb-1">Em Férias</p>
                    <p className="text-3xl font-black text-orange-900 dark:text-white">{soldiers.filter(s => s.status === Status.FERIAS).length}</p>
                 </div>
                 <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase mb-1">Afastados/LTS</p>
                    <p className="text-3xl font-black text-red-900 dark:text-white">{soldiers.filter(s => s.status !== Status.ATIVO && s.status !== Status.FERIAS).length}</p>
                 </div>
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Total Geral</p>
                    <p className="text-3xl font-black text-blue-900 dark:text-white">{soldiers.length}</p>
                 </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Posto/Grad</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Nome de Guerra</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Matrícula</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Setor/Equipe</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Função</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {filteredSoldiers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-xs font-bold text-gray-700 dark:text-gray-300">{s.rank}</td>
                      <td className="p-3 text-xs font-black text-pm-900 dark:text-white uppercase">{s.name}</td>
                      <td className="p-3 text-xs font-mono text-gray-500 dark:text-gray-400">{s.matricula || '-'}</td>
                      <td className="p-3 text-xs font-bold text-gray-600 dark:text-gray-400">{s.sector} {s.team ? `(${s.team})` : ''}</td>
                      <td className="p-3 text-xs font-bold text-gray-600 dark:text-gray-400">{s.role}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          s.status === Status.ATIVO ? 'bg-green-100 text-green-700' : 
                          s.status === Status.FERIAS ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'shifts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <h4 className="text-lg font-black text-pm-900 dark:text-white uppercase tracking-tighter">Produtividade por Militar</h4>
                <span className="text-xs font-bold text-gray-500 uppercase">Período: {new Date(dateRange.start).toLocaleDateString()} a {new Date(dateRange.end).toLocaleDateString()}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 no-print">
                 <div className="bg-pm-50 dark:bg-pm-900/20 p-4 rounded-2xl border border-pm-100 dark:border-pm-900/30">
                    <p className="text-[10px] font-black text-pm-600 dark:text-pm-400 uppercase mb-1">Total de Plantões</p>
                    <p className="text-3xl font-black text-pm-900 dark:text-white">{shiftStats.reduce((acc, curr) => acc + curr.count, 0)}</p>
                 </div>
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Média por Militar</p>
                    <p className="text-3xl font-black text-blue-900 dark:text-white">
                      {shiftStats.length > 0 ? (shiftStats.reduce((acc, curr) => acc + curr.count, 0) / shiftStats.length).toFixed(1) : 0}
                    </p>
                 </div>
                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                    <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase mb-1">Militares Atuantes</p>
                    <p className="text-3xl font-black text-green-900 dark:text-white">{shiftStats.length}</p>
                 </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Posto/Grad</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Nome de Guerra</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400 text-center">Total de Plantões</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400 text-center">Carga Horária Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {shiftStats.map(stat => (
                    <tr key={stat.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-xs font-bold text-gray-700 dark:text-gray-300">{stat.rank}</td>
                      <td className="p-3 text-xs font-black text-pm-900 dark:text-white uppercase">{stat.name}</td>
                      <td className="p-3 text-sm font-black text-center text-pm-700 dark:text-pm-400">{stat.count}</td>
                      <td className="p-3 text-xs font-bold text-center text-gray-500 dark:text-gray-400">{stat.count * 24}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'absences' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <h4 className="text-lg font-black text-pm-900 dark:text-white uppercase tracking-tighter">Militares Afastados / LTS / Férias</h4>
                <span className="text-xs font-bold text-gray-500 uppercase">Total: {soldiers.filter(s => s.status !== Status.ATIVO).length} Afastamentos</span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 mb-6 no-print">
                 <div className="flex items-center space-x-3">
                    <AlertCircle className="text-amber-600" size={24} />
                    <div>
                       <h5 className="font-bold text-amber-900 dark:text-amber-200 text-sm uppercase">Atenção ao Efetivo</h5>
                       <p className="text-xs text-amber-800 dark:text-amber-300">
                          Existem {soldiers.filter(s => s.status !== Status.ATIVO).length} militares fora de escala no momento. 
                          Certifique-se de que as substituições foram realizadas nas escalas vigentes.
                       </p>
                    </div>
                 </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Militar</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Motivo</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Início</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Término</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {soldiers.filter(s => s.status !== Status.ATIVO).map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{s.rank}</div>
                        <div className="text-xs font-black text-pm-900 dark:text-white uppercase">{s.name}</div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          s.status === Status.FERIAS ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-bold text-gray-600 dark:text-gray-400">{s.absenceStartDate ? new Date(s.absenceStartDate).toLocaleDateString() : '-'}</td>
                      <td className="p-3 text-xs font-bold text-gray-600 dark:text-gray-400">{s.absenceEndDate ? new Date(s.absenceEndDate).toLocaleDateString() : '-'}</td>
                      <td className="p-3 text-xs italic text-gray-500 dark:text-gray-500">{s.folgaReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReport === 'extra_duty' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <h4 className="text-lg font-black text-pm-900 dark:text-white uppercase tracking-tighter">Histórico de Escalas Extras</h4>
                <span className="text-xs font-bold text-gray-500 uppercase">Total: {history.length} Registros</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Data da Escala</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Militares Escalados</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400 text-center">Qtd</th>
                    <th className="p-3 text-[10px] font-black uppercase text-pm-600 dark:text-pm-400">Data de Geração</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {history.sort((a, b) => new Date(b.rosterDate).getTime() - new Date(a.rosterDate).getTime()).map(h => (
                    <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-xs font-black text-pm-900 dark:text-white">{new Date(h.rosterDate).toLocaleDateString()}</td>
                      <td className="p-3 text-xs text-gray-600 dark:text-gray-400 leading-tight">
                        {h.soldierNames.join(', ')}
                      </td>
                      <td className="p-3 text-xs font-black text-center text-pm-700 dark:text-pm-400">{h.amount}</td>
                      <td className="p-3 text-[10px] font-bold text-gray-400 dark:text-gray-500">{new Date(h.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Print Footer */}
        <div className="hidden print:block p-12 mt-12">
           <div className="flex justify-around items-center">
              <div className="text-center border-t border-black pt-2 w-64">
                 <p className="text-[10px] font-black uppercase">Responsável pela Emissão</p>
                 <p className="text-[9px] text-gray-500 uppercase">Escalas DS/PMCE</p>
              </div>
              <div className="text-center border-t border-black pt-2 w-64">
                 <p className="text-[10px] font-black uppercase">Visto da Diretoria</p>
                 <p className="text-[9px] text-gray-500 uppercase">DS/PMCE</p>
              </div>
           </div>
        </div>
      </div>

      {/* CSS for printing */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
};
