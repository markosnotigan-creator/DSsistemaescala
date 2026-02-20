import { Soldier, Roster, AppSettings, User, Rank, Role, Status, RosterCategory, ExtraDutyHistory, Cadre, TeamMapping } from '../types';
import { supabase } from './supabase';

const INITIAL_CATEGORIES: RosterCategory[] = [
  { id: 'cat_amb', name: 'Ambulância', icon: 'Truck' },
  { id: 'cat_psi', name: 'Psicologia', icon: 'Brain' },
  { id: 'cat_ast', name: 'Assistencial', icon: 'HeartPulse' },
  { id: 'cat_adm', name: 'Administrativo', icon: 'Briefcase' },
  { id: 'cat_extra', name: 'Escala Extra / Voluntária', icon: 'Star' }
];

const INITIAL_TEAM_MAPPINGS: TeamMapping[] = [
  { teamName: 'ALFA', shiftName: 'TURMA 01' },
  { teamName: 'BRAVO', shiftName: 'TURMA 01' },
  { teamName: 'CHARLIE', shiftName: 'TURMA 02' },
  { teamName: 'DELTA', shiftName: 'TURMA 02' }
];

const INITIAL_SETTINGS: AppSettings = {
  orgName: 'DIRETORIA DE SAÚDE – PMCE',
  directorName: 'FRANCISCO ÉLITON ARAÚJO',
  directorRank: 'Cel PM',
  directorRole: 'Diretor de Saúde - DS/PMCE',
  directorMatricula: 'M.F 108.819-1-9',
  shiftCycleRefDate: '2024-01-01',
  logoLeft: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Bras%C3%A3o_da_Pol%C3%ADcia_Militar_do_Cear%C3%A1.png', 
  logoRight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Bras%C3%A3o_do_Cear%C3%A1.svg/512px-Bras%C3%A3o_do_Cear%C3%A1.svg.png', 
  showLogoLeft: true,
  showLogoRight: true,
  city: 'Fortaleza-CE',
  showPhoneInPrint: true,
  rosterCategories: INITIAL_CATEGORIES,
  teamMappings: INITIAL_TEAM_MAPPINGS
};

const INITIAL_SOLDIERS: Soldier[] = [
  { id: '1', name: 'Cruz', rank: Rank.SUBTEN, cadre: Cadre.QOPPM, role: Role.FISCAL_MOTORISTA, roleShort: '(F.M)', sector: 'Ambulância', team: 'ALFA', status: Status.ATIVO, phone: '98651.4680', availableForExtra: true, orderExtra: 1 },
  { id: '2', name: 'Virginia', rank: Rank.TEN_1, cadre: Cadre.QOAPM, role: Role.FISCAL, roleShort: '(F)', sector: 'Ambulância', team: 'BRAVO', status: Status.ATIVO, phone: '88 99335.6947', availableForExtra: true, orderExtra: 2 },
  { id: '3', name: 'Ricardo', rank: Rank.SGT_1, cadre: Cadre.QOPPM, role: Role.FISCAL, roleShort: '(F)', sector: 'Ambulância', team: 'CHARLIE', status: Status.ATIVO, matricula: '20126', phone: '98838-4022', availableForExtra: true, orderExtra: 3 },
  { id: '20', name: 'Maria', rank: Rank.SD, cadre: Cadre.QOPPM, role: Role.ENFERMEIRO, roleShort: '(1)', sector: 'Ambulância', team: 'TURMA 01', status: Status.ATIVO, matricula: '36.113', phone: '98180-1288', availableForExtra: true, orderExtra: 4 }
];

class StoreService {
  private listeners: (() => void)[] = [];
  
  constructor() {
    // Inicialização puramente local
    this.initSupabaseSync();
  }

  // --- LOCAL STORE LOGIC ---

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private getLocal<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private setLocal(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
    this.notify();
  }

  // --- SUPABASE SYNC LOGIC ---

  private async initSupabaseSync() {
    if (!supabase) return;

    try {
      // Sync Soldiers
      const { data: soldiersData } = await supabase.from('soldiers').select('data');
      if (soldiersData && soldiersData.length > 0) {
        const soldiers = soldiersData.map((row: any) => row.data);
        this.setLocal('soldiers', soldiers);
      }

      // Sync Rosters
      const { data: rostersData } = await supabase.from('rosters').select('data');
      if (rostersData && rostersData.length > 0) {
        const rosters = rostersData.map((row: any) => row.data);
        this.setLocal('rosters', rosters);
      }

      // Sync Settings
      const { data: settingsData } = await supabase.from('app_settings').select('data').limit(1);
      if (settingsData && settingsData.length > 0) {
        this.setLocal('app_settings', settingsData[0].data);
      }

      // Sync Extra Duty History
      const { data: historyData } = await supabase.from('extra_duty_history').select('data');
      if (historyData && historyData.length > 0) {
        const history = historyData.map((row: any) => row.data);
        this.setLocal('extra_duty_history', history);
      }

    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  }

  // --- PUBLIC API ---

  getSettings(): AppSettings {
    const stored = this.getLocal<AppSettings>('app_settings');
    const defaults = INITIAL_SETTINGS;
    
    if (!stored) {
        this.setLocal('app_settings', defaults);
        return defaults;
    }
    
    // Garantias de compatibilidade e valores default para evitar uncontrolled inputs
    return {
      ...defaults,
      ...stored,
      // Ensure specific fields are never undefined
      orgName: stored.orgName || defaults.orgName,
      directorName: stored.directorName || defaults.directorName,
      directorRank: stored.directorRank || defaults.directorRank,
      directorRole: stored.directorRole || defaults.directorRole,
      directorMatricula: stored.directorMatricula || defaults.directorMatricula,
      city: stored.city || defaults.city,
      logoLeft: stored.logoLeft || defaults.logoLeft,
      logoRight: stored.logoRight || defaults.logoRight,
      // Boolean fields need careful handling (false is valid)
      showLogoLeft: stored.showLogoLeft !== undefined ? stored.showLogoLeft : defaults.showLogoLeft,
      showLogoRight: stored.showLogoRight !== undefined ? stored.showLogoRight : defaults.showLogoRight,
      showPhoneInPrint: stored.showPhoneInPrint !== undefined ? stored.showPhoneInPrint : defaults.showPhoneInPrint,
      // Arrays
      rosterCategories: stored.rosterCategories || defaults.rosterCategories,
      teamMappings: stored.teamMappings || defaults.teamMappings
    };
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.setLocal('app_settings', settings);
    if (supabase) {
      // Delete old settings to keep only one active configuration row
      await supabase.from('app_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      await supabase.from('app_settings').insert({ data: settings });
    }
  }

  getSoldiers(): Soldier[] {
    const stored = this.getLocal<Soldier[]>('soldiers');
    if (!stored || stored.length === 0) {
        this.setLocal('soldiers', INITIAL_SOLDIERS);
        return INITIAL_SOLDIERS;
    }
    return stored;
  }

  async saveSoldier(soldier: Soldier): Promise<void> {
    const soldiers = this.getSoldiers();
    const index = soldiers.findIndex(s => s.id === soldier.id);
    if (index >= 0) soldiers[index] = soldier; else soldiers.push(soldier);
    
    this.setLocal('soldiers', soldiers);

    if (supabase) {
      // Upsert based on ID stored in the JSON data column requires a unique constraint or manual check
      // For simplicity in this migration, we delete and insert. 
      // In a real production app, we would use a proper relational schema.
      // Here we simulate document store behavior:
      
      // First try to delete if exists (by matching ID inside JSON is hard in simple SQL without specific index)
      // So we will just rely on the client-side ID for now and assume we are syncing the whole object.
      // Ideally, we should have a column 'ref_id' in the table.
      
      // Let's use a simpler approach: Delete all and re-insert is too heavy.
      // Let's try to find the row with this data->id.
      
      // Actually, for this migration to be robust without changing schema too much:
      // We will add a 'ref_id' column to the schema in a future step if performance is bad.
      // For now, let's just insert a new record for every save is bad.
      
      // Better approach:
      // We will use the 'id' column of the table as the soldier.id if possible, but soldier.id is string (maybe not UUID).
      // Let's just fetch all, find the one to update, and update it.
      
      const { data } = await supabase.from('soldiers').select('id, data');
      const existing = data?.find((row: any) => row.data.id === soldier.id);
      
      if (existing) {
        await supabase.from('soldiers').update({ data: soldier, updated_at: new Date() }).eq('id', existing.id);
      } else {
        await supabase.from('soldiers').insert({ data: soldier });
      }
    }
  }

  async deleteSoldier(id: string): Promise<void> {
    this.setLocal('soldiers', this.getSoldiers().filter(s => s.id !== id));
    
    if (supabase) {
      const { data } = await supabase.from('soldiers').select('id, data');
      const existing = data?.find((row: any) => row.data.id === id);
      if (existing) {
        await supabase.from('soldiers').delete().eq('id', existing.id);
      }
    }
  }

  getRosters(): Roster[] {
    return this.getLocal<Roster[]>('rosters') || [];
  }

  async saveRoster(roster: Roster): Promise<void> {
    const rosters = this.getRosters();
    const index = rosters.findIndex(r => r.id === roster.id);
    if (index >= 0) rosters[index] = roster; else rosters.push(roster);
    
    this.setLocal('rosters', rosters);

    if (supabase) {
      const { data } = await supabase.from('rosters').select('id, data');
      const existing = data?.find((row: any) => row.data.id === roster.id);
      
      if (existing) {
        await supabase.from('rosters').update({ data: roster, updated_at: new Date() }).eq('id', existing.id);
      } else {
        await supabase.from('rosters').insert({ data: roster });
      }
    }
  }

  async deleteRoster(id: string): Promise<void> {
    this.setLocal('rosters', this.getRosters().filter(r => r.id !== id));

    if (supabase) {
      const { data } = await supabase.from('rosters').select('id, data');
      const existing = data?.find((row: any) => row.data.id === id);
      if (existing) {
        await supabase.from('rosters').delete().eq('id', existing.id);
      }
    }
  }
  
  // --- EXTRA DUTY HISTORY ---
  getExtraDutyHistory(): ExtraDutyHistory[] {
    return this.getLocal<ExtraDutyHistory[]>('extra_duty_history') || [];
  }

  async saveExtraDutyHistory(record: ExtraDutyHistory): Promise<void> {
    const history = this.getExtraDutyHistory();
    history.push(record);
    
    this.setLocal('extra_duty_history', history);

    if (supabase) {
      await supabase.from('extra_duty_history').insert({ data: record });
    }
  }

  getCurrentUser(): User {
    return this.getLocal<User>('current_user') || { username: 'admin', role: 'ADMIN' };
  }

  login(role: 'ADMIN' | 'USER'): void {
    this.setLocal('current_user', { username: role === 'ADMIN' ? 'Administrador' : 'Visualizador', role });
  }
  
  // --- GERENCIAMENTO DE SENHA ---
  getAdminPassword(): string {
    const pwd = localStorage.getItem('admin_password');
    return pwd || '123456';
  }

  setAdminPassword(newPassword: string): void {
    localStorage.setItem('admin_password', newPassword);
  }

  // --- DEBUG / TEST ---
  async testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Cliente Supabase não inicializado. Verifique as variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).' };
    }
    try {
      // Tenta uma leitura simples (head) apenas para verificar conexão
      const { error } = await supabase.from('app_settings').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return { success: true, message: 'Conexão com Supabase estabelecida com sucesso!' };
    } catch (e: any) {
      return { success: false, message: `Erro ao conectar: ${e.message || 'Erro desconhecido'}` };
    }
  }
}

export const db = new StoreService();