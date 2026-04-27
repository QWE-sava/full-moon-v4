-- 拡張機能（UUID生成用）
create extension if not exists "pgcrypto";

-- visitors テーブル
create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  face_hash text unique not null,
  created_at timestamptz not null default now()
);

-- clubs テーブル
create table public.clubs (
  id serial primary key,
  name text unique not null,
  votes_count integer not null default 0
);

-- votes テーブル
create table public.votes (
  id serial primary key,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  club_id integer not null references public.clubs(id) on delete cascade,
  constraint votes_visitor_unique unique (visitor_id)
);

-- votes_count を原子的にインクリメントする関数
create or replace function public.increment_club_votes(p_club_id integer)
returns void
language plpgsql
as $$
begin
  update public.clubs
  set votes_count = votes_count + 1
  where id = p_club_id;
end;
$$;

-- テストデータの投入
insert into public.clubs (name) values ('テニス部'), ('サッカー部'), ('吹奏楽部'), ('茶道部'), ('コンピュータ部');
