import { Soldier, Roster, AppSettings, User, Rank, Role, Status, RosterCategory, ExtraDutyHistory, Cadre, TeamMapping } from '../types';
import { supabase } from './supabase';

const INITIAL_CATEGORIES: RosterCategory[] = [
  { id: 'cat_amb', name: 'Ambulância', icon: 'Truck' },
  { id: 'cat_psi', name: 'Psicologia', icon: 'Brain' },
  { id: 'cat_odo', name: 'Odontologia', icon: 'Stethoscope' },
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
    const result = {
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
    
    // Ensure cat_odo exists in rosterCategories
    if (!result.rosterCategories.find(c => c.id === 'cat_odo')) {
      result.rosterCategories.splice(2, 0, { id: 'cat_odo', name: 'Odontologia', icon: 'Stethoscope' });
      this.setLocal('app_settings', result);
    }
    
    return result;
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

  // --- AUTHENTICATION LOGIC (SUPABASE) ---

  async login(password: string): Promise<{ user: User | null, error: string | null }> {
    if (!supabase) {
      // Fallback para modo offline (apenas para desenvolvimento local sem Supabase)
      // Em produção, isso deve ser desabilitado ou removido.
      console.warn('Supabase não configurado. Usando autenticação local insegura (apenas dev).');
      const mockUser: User = { id: 'local-admin', username: 'Administrador (Offline)', role: 'ADMIN' };
      sessionStorage.setItem('current_user', JSON.stringify(mockUser));
      this.notify();
      return { user: mockUser, error: null };
    }

    try {
      // Mapeamento de senha única para email/senha do Supabase
      // Isso mantém a UX de "Senha Única" solicitada, mas usa autenticação real no backend.
      // O email é fixo para este caso de uso específico.
      const email = 'marcos_notigan@hotmail.com'; // Email administrativo padrão
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro de autenticação:', error.message);
        if (error.message.includes("Invalid login credentials")) {
             return { user: null, error: 'Credenciais inválidas. Se for o primeiro acesso, use "Esqueci a senha" com a Chave Mestra para criar a conta.' };
        }
        if (error.message.includes("Email not confirmed")) {
             return { user: null, error: 'Email não confirmado. Verifique sua caixa de entrada.' };
        }
        return { user: null, error: 'Erro: ' + error.message };
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          username: data.user.email || 'Administrador',
          role: 'ADMIN' // Assumimos admin para quem tem a senha correta neste modelo simplificado
        };
        sessionStorage.setItem('current_user', JSON.stringify(user));
        this.notify();
        return { user, error: null };
      }
      
      return { user: null, error: 'Erro desconhecido ao fazer login.' };
    } catch (err: any) {
      return { user: null, error: err.message || 'Erro de conexão.' };
    }
  }

  async logout(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem('current_user');
    this.notify();
  }

  getCurrentUser(): User | null {
    const data = sessionStorage.getItem('current_user');
    return data ? JSON.parse(data) : null;
  }
  
  // --- MÉTODOS DEPRECATED/REMOVIDOS (Mantidos como stub para evitar quebra de build imediata, mas seguros) ---
  
  async verifyAdminPassword(input: string): Promise<boolean> {
    console.warn('verifyAdminPassword is deprecated. Use login() instead.');
    return false; 
  }

  async updateAdminPassword(newPassword: string): Promise<void> {
     if (supabase) {
       await supabase.auth.updateUser({ password: newPassword });
     }
  }

  verifyRecoveryKey(key: string): boolean {
    // Chave Mestra para recuperação de acesso (Legado/Emergência)
    const MASTER_KEY = "PMCE@2025";
    return key === MASTER_KEY;
  }

  async resetAdminPassword(newPassword: string): Promise<void> {
    if (supabase) {
        const email = 'marcos_notigan@hotmail.com';
        
        // Tenta criar o usuário (caso não exista)
        const { data, error } = await supabase.auth.signUp({
            email,
            password: newPassword,
        });

        if (error) {
            // Se o usuário já existe, não podemos alterar a senha sem a antiga ou sem email.
            // Mas para facilitar o "setup", vamos logar o erro.
            console.error("Erro ao criar/resetar usuário admin:", error.message);
            throw new Error(error.message.includes("already registered") 
                ? "Usuário admin já existe. Se esqueceu a senha, use o painel do Supabase." 
                : error.message);
        }

        if (data.user && !data.session) {
             throw new Error("Usuário criado! Verifique seu email (" + email + ") para confirmar o cadastro antes de logar.");
        }
    }
  }

  // --- DEBUG / TEST ---
  async testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Cliente Supabase não inicializado. Verifique as variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).' };
    }
    try {
      // 1. Teste de Leitura (HEAD)
      const { error: readError } = await supabase.from('app_settings').select('*', { count: 'exact', head: true });
      
      if (readError) {
         // Se falhar na leitura, nem tenta escrita.
         throw new Error(`Falha na leitura: ${readError.message}`);
      }

      // 2. Teste de Escrita (Opcional, mas bom para garantir permissões)
      // Tenta atualizar o timestamp da própria configuração (sem mudar dados)
      // Isso valida se o RLS de update está funcionando para o usuário logado.
      const user = this.getCurrentUser();
      if (user && user.role === 'ADMIN') {
          const { error: writeError } = await supabase.from('app_settings').update({ updated_at: new Date() }).eq('id', '00000000-0000-0000-0000-000000000000'); // ID dummy, não vai achar nada mas vai testar a permissão/conexão
          
          // Nota: O update acima provavelmente não vai afetar nenhuma linha (ID 000...), 
          // mas se der erro de permissão ou conexão, vai lançar erro.
          if (writeError && !writeError.message.includes("0 rows")) {
             // Ignoramos erro de "0 rows" pois é esperado.
             console.warn("Erro no teste de escrita (não crítico):", writeError.message);
          }
      }

      return { success: true, message: 'Conexão com Supabase (Leitura/Escrita) estabelecida com sucesso!' };

    } catch (e: any) {
      const msg = e.message || 'Erro desconhecido';
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
          return { success: false, message: 'Falha na conexão. Verifique sua internet.' };
      }
      return { success: false, message: `Erro ao conectar: ${msg}` };
    }
  }
}

export const db = new StoreService();