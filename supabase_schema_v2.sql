-- 1. Tabela de Perfis (Profiles)
-- Esta tabela armazena informações adicionais dos usuários autenticados
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'operador', 'visualizador')) NOT NULL DEFAULT 'visualizador',
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança para Profiles
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Apenas Admins podem ver todos os perfis
CREATE POLICY "Admins podem ver todos os perfis" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apenas Admins podem atualizar perfis
CREATE POLICY "Admins podem atualizar perfis" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Função para criar perfil automaticamente após o cadastro (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'visualizador');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função acima
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Atualizar políticas das tabelas existentes para usar o role do profile
-- Exemplo para a tabela 'soldiers'
ALTER TABLE soldiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver militares" ON soldiers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins e Operadores podem inserir militares" ON soldiers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'operador')
    )
  );

CREATE POLICY "Admins e Operadores podem atualizar militares" ON soldiers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'operador')
    )
  );

CREATE POLICY "Apenas Admins podem deletar militares" ON soldiers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Repetir lógica similar para 'rosters', 'app_settings' e 'extra_duty_history'
-- Rosters
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos autenticados podem ver escalas" ON rosters FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins e Operadores podem gerenciar escalas" ON rosters FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'operador'))
);

-- Settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos autenticados podem ver config" ON app_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas Admins podem alterar config" ON app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
