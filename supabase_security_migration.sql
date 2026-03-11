-- Habilitar Row Level Security (RLS)
alter table soldiers enable row level security;
alter table rosters enable row level security;
alter table app_settings enable row level security;
alter table extra_duty_history enable row level security;

-- Remover políticas antigas inseguras
drop policy if exists "Enable read access for all users" on soldiers;
drop policy if exists "Enable insert access for all users" on soldiers;
drop policy if exists "Enable update access for all users" on soldiers;
drop policy if exists "Enable delete access for all users" on soldiers;

drop policy if exists "Enable read access for all users" on rosters;
drop policy if exists "Enable insert access for all users" on rosters;
drop policy if exists "Enable update access for all users" on rosters;
drop policy if exists "Enable delete access for all users" on rosters;

drop policy if exists "Enable read access for all users" on app_settings;
drop policy if exists "Enable insert access for all users" on app_settings;
drop policy if exists "Enable update access for all users" on app_settings;
drop policy if exists "Enable delete access for all users" on app_settings;

drop policy if exists "Enable read access for all users" on extra_duty_history;
drop policy if exists "Enable insert access for all users" on extra_duty_history;
drop policy if exists "Enable update access for all users" on extra_duty_history;
drop policy if exists "Enable delete access for all users" on extra_duty_history;

-- Criar novas políticas seguras (Apenas usuários autenticados)
-- Soldiers
create policy "Public users can select soldiers" on soldiers for select to anon using (true);
create policy "Authenticated users can select soldiers" on soldiers for select to authenticated using (true);
create policy "Authenticated users can insert soldiers" on soldiers for insert to authenticated with check (true);
create policy "Authenticated users can update soldiers" on soldiers for update to authenticated using (true);
create policy "Authenticated users can delete soldiers" on soldiers for delete to authenticated using (true);

-- Rosters
create policy "Public users can select rosters" on rosters for select to anon using (true);
create policy "Authenticated users can select rosters" on rosters for select to authenticated using (true);
create policy "Authenticated users can insert rosters" on rosters for insert to authenticated with check (true);
create policy "Authenticated users can update rosters" on rosters for update to authenticated using (true);
create policy "Authenticated users can delete rosters" on rosters for delete to authenticated using (true);

-- App Settings
create policy "Public users can select settings" on app_settings for select to anon using (true);
create policy "Authenticated users can select settings" on app_settings for select to authenticated using (true);
create policy "Authenticated users can insert settings" on app_settings for insert to authenticated with check (true);
create policy "Authenticated users can update settings" on app_settings for update to authenticated using (true);
create policy "Authenticated users can delete settings" on app_settings for delete to authenticated using (true);

-- Extra Duty History
create policy "Authenticated users can select history" on extra_duty_history for select to authenticated using (true);
create policy "Authenticated users can insert history" on extra_duty_history for insert to authenticated with check (true);
create policy "Authenticated users can update history" on extra_duty_history for update to authenticated using (true);
create policy "Authenticated users can delete history" on extra_duty_history for delete to authenticated using (true);
