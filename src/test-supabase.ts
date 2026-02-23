
import { db } from '../services/store';
import { supabase } from '../services/supabase';

async function runTests() {
  console.log('--- INICIANDO TESTES DE CONEXÃO SUPABASE ---');
  
  const connectionResult = await db.testSupabaseConnection();
  console.log('Resultado do Teste de Conexão:', connectionResult);

  if (connectionResult.success) {
    console.log('Verificando tabelas...');
    const tables = ['soldiers', 'rosters', 'app_settings', 'extra_duty_history'];
    for (const table of tables) {
      if (!supabase) break;
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`Erro na tabela ${table}:`, error.message);
      } else {
        console.log(`Tabela ${table}: OK`);
      }
    }

    console.log('Tentando salvar uma configuração de teste...');
    const currentSettings = db.getSettings();
    try {
      await db.saveSettings({
        ...currentSettings,
        orgName: currentSettings.orgName + ' (TESTE CONEXÃO ' + new Date().toISOString() + ')'
      });
      console.log('Configuração de teste salva com sucesso no Supabase!');
      
      console.log('Tentando salvar um militar de teste...');
      const testSoldier = {
        id: 'test-' + Date.now(),
        name: 'Militar de Teste',
        rank: 'Sd PM' as any,
        role: 'Motorista' as any,
        roleShort: '(M)',
        sector: 'Teste',
        status: 'ATIVO' as any
      };
      await db.saveSoldier(testSoldier);
      console.log('Militar de teste salvo com sucesso!');
      
      // Cleanup
      console.log('Limpando militar de teste...');
      await db.deleteSoldier(testSoldier.id);
      console.log('Militar de teste removido.');
      
    } catch (error) {
      console.error('Erro durante os testes de escrita:', error);
    }
  } else {
    console.error('Falha na conexão. Pulando testes de escrita.');
  }
  
  console.log('--- TESTES FINALIZADOS ---');
}

// Executa após um pequeno delay para garantir que tudo carregou
setTimeout(runTests, 2000);
