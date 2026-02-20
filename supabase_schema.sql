-- Tabela de Militares (Soldiers)
create table if not exists soldiers (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Escalas (Rosters)
create table if not exists rosters (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Configurações (Settings)
create table if not exists app_settings (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Histórico de Escala Extra
create table if not exists extra_duty_history (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table soldiers enable row level security;
alter table rosters enable row level security;
alter table app_settings enable row level security;
alter table extra_duty_history enable row level security;

-- Políticas de Acesso (Permitir tudo para usuários autenticados ou anônimos com a chave pública)
-- ATENÇÃO: Em produção, você deve restringir isso para usuários autenticados.
create policy "Enable read access for all users" on soldiers for select using (true);
create policy "Enable insert access for all users" on soldiers for insert with check (true);
create policy "Enable update access for all users" on soldiers for update using (true);
create policy "Enable delete access for all users" on soldiers for delete using (true);

create policy "Enable read access for all users" on rosters for select using (true);
create policy "Enable insert access for all users" on rosters for insert with check (true);
create policy "Enable update access for all users" on rosters for update using (true);
create policy "Enable delete access for all users" on rosters for delete using (true);

create policy "Enable read access for all users" on app_settings for select using (true);
create policy "Enable insert access for all users" on app_settings for insert with check (true);
create policy "Enable update access for all users" on app_settings for update using (true);
create policy "Enable delete access for all users" on app_settings for delete using (true);

create policy "Enable read access for all users" on extra_duty_history for select using (true);
create policy "Enable insert access for all users" on extra_duty_history for insert with check (true);
create policy "Enable update access for all users" on extra_duty_history for update using (true);
create policy "Enable delete access for all users" on extra_duty_history for delete using (true);
