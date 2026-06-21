create table if not exists wear_logs (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null    default now(),
  user_id    uuid        not null    references auth.users(id) on delete cascade,
  worn_date  date        not null    default current_date,
  item_ids   text[]      not null    default '{}',
  outfit_id  uuid        references outfits(id) on delete set null,
  source     text        not null    default 'manual' -- 'today_ai' | 'studio_collage' | 'manual'
);

alter table wear_logs enable row level security;

create policy "Users can manage own wear_logs"
  on wear_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index wear_logs_user_date_idx on wear_logs (user_id, worn_date desc);
create index wear_logs_user_id_idx   on wear_logs (user_id);
