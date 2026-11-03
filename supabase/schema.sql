-- 영어 단어장 DB 스키마
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run 하면 됩니다.
-- 여러 번 실행해도 안전합니다 (이미 있으면 건너뜀).

create table if not exists public.words (
  id               uuid primary key default gen_random_uuid(),
  word             text not null,                 -- 영어 단어 또는 짧은 표현
  meaning          text not null,                 -- 뜻. 여러 개면 쉼표로 구분 (첫 번째가 대표 뜻)
  example          text,                          -- 예문 (없으면 빈칸 문제는 안 나옴)
  level            int  not null default 0 check (level between 0 and 5),  -- 숙련도, 5 = 졸업
  next_review_at   timestamptz not null default now(),
  correct_count    int  not null default 0,
  wrong_count      int  not null default 0,
  last_reviewed_at timestamptz,
  first_studied_at timestamptz,                   -- 처음 학습한 시각 (null = 아직 새 단어)
  created_at       timestamptz not null default now()
);

-- 같은 단어를 대소문자만 다르게 두 번 넣지 못하게
create unique index if not exists words_word_lower_key on public.words (lower(word));
create index if not exists words_due_idx on public.words (level, next_review_at);

create table if not exists public.study_logs (
  id            uuid primary key default gen_random_uuid(),
  word_id       uuid not null references public.words(id) on delete cascade,
  question_type text not null,
  is_correct    boolean not null,
  answered_at   timestamptz not null default now()
);

create index if not exists study_logs_answered_idx on public.study_logs (answered_at);
create index if not exists study_logs_word_idx on public.study_logs (word_id);

-- 상황별 회화 연습 기록 (연속 학습 일수와 기록 화면에 사용)
create table if not exists public.scenario_runs (
  id          uuid primary key default gen_random_uuid(),
  scenario_id text not null,
  correct     int  not null,   -- 처음 시도에 맞힌 내 대사 수
  total       int  not null,   -- 내 대사 수
  finished_at timestamptz not null default now()
);

create index if not exists scenario_runs_finished_idx on public.scenario_runs (finished_at);

-- RLS를 켜고 정책은 만들지 않습니다.
-- → 브라우저에서 anon/publishable key로는 이 테이블에 접근할 수 없고,
--   서버(Next.js)가 service role / secret key로만 읽고 씁니다.
alter table public.words enable row level security;
alter table public.study_logs enable row level security;
alter table public.scenario_runs enable row level security;
