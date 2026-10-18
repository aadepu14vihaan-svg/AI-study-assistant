-- Smart School: AI-Powered Personalized Learning Platform
-- Supabase Schema & Row Level Security (RLS) Policies
-- Safe to run multiple times (idempotent migrations)

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Enhanced Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  grade text default 'Class 10',
  school_name text default 'Delhi Public School',
  country text default 'India',
  state text default 'Telangana',
  education_board text default 'CBSE', -- CBSE, ICSE, IB, Cambridge, State Board
  state_board_name text,               -- Telangana, Andhra Pradesh, Maharashtra, etc.
  preferred_language text default 'English',
  subjects jsonb default '["Mathematics", "Science", "Social Science", "English", "Computer Science"]'::jsonb,
  academic_goals text default 'Scoring 95%+ in Board Examinations',
  onboarding_completed boolean default true,
  current_term text default 'Academic Year 2024–25',
  target_gpa numeric(3,2) default 3.90,
  streak_days integer default 7,
  honor_roll_rank integer default 4,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safe migrations to add new columns if profiles table already existed
alter table public.profiles add column if not exists grade text default 'Class 10';
alter table public.profiles add column if not exists school_name text default 'Delhi Public School';
alter table public.profiles add column if not exists country text default 'India';
alter table public.profiles add column if not exists state text default 'Telangana';
alter table public.profiles add column if not exists education_board text default 'CBSE';
alter table public.profiles add column if not exists state_board_name text;
alter table public.profiles add column if not exists preferred_language text default 'English';
alter table public.profiles add column if not exists subjects jsonb default '["Mathematics", "Science", "Social Science", "English", "Computer Science"]'::jsonb;
alter table public.profiles add column if not exists academic_goals text default 'Scoring 95%+ in Board Examinations';
alter table public.profiles add column if not exists preferred_study_times text default 'Evening (5:00 PM – 8:00 PM)';
alter table public.profiles add column if not exists learning_preferences jsonb default '["Visual diagrams & concept maps", "Step-by-step problem walkthroughs"]'::jsonb;
alter table public.profiles add column if not exists onboarding_completed boolean default true;

-- Enable RLS for profiles
alter table public.profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view their own profile') then
    create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update their own profile') then
    create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert their own profile') then
    create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- 3. Courses / Subjects Table
create table if not exists public.courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  code text not null,
  title text not null,
  instructor text not null,
  email text,
  room text,
  office_hours text,
  credits numeric(3,1) default 4.0,
  grade_pct numeric(4,1) default 92.0,
  grade_letter text default 'A',
  progress_pct integer default 60,
  accent_color text default 'primary',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.courses enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Students can view their own courses') then
    create policy "Students can view their own courses" on public.courses for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can insert their own courses') then
    create policy "Students can insert their own courses" on public.courses for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can update their own courses') then
    create policy "Students can update their own courses" on public.courses for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can delete their own courses') then
    create policy "Students can delete their own courses" on public.courses for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Assignments / Homework Table
create table if not exists public.assignments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id uuid references public.courses on delete set null,
  course_name text not null,
  title text not null,
  description text,
  status text not null check (status in ('todo', 'in_progress', 'under_review', 'completed')),
  priority text not null check (priority in ('urgent', 'high', 'medium', 'low')),
  due_date timestamp with time zone not null,
  est_hours numeric(3,1) default 1.5,
  completed boolean default false,
  score numeric(5,1),
  max_score numeric(5,1) default 100.0,
  grade_badge text,
  subtasks jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assignments enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Students can view their own homework') then
    create policy "Students can view their own homework" on public.assignments for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can insert their own homework') then
    create policy "Students can insert their own homework" on public.assignments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can update their own homework') then
    create policy "Students can update their own homework" on public.assignments for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can delete their own homework') then
    create policy "Students can delete their own homework" on public.assignments for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 5. AI Study Notes Table
create table if not exists public.study_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  grade text not null,
  board text not null,
  subject text not null,
  chapter text not null,
  title text not null,
  note_length text default 'standard',
  content jsonb not null,
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.study_notes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Students can view their own notes') then
    create policy "Students can view their own notes" on public.study_notes for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can insert their own notes') then
    create policy "Students can insert their own notes" on public.study_notes for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can update their own notes') then
    create policy "Students can update their own notes" on public.study_notes for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can delete their own notes') then
    create policy "Students can delete their own notes" on public.study_notes for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 6. Quiz Attempts Table
create table if not exists public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject text not null,
  chapter text not null,
  grade text not null,
  board text not null,
  difficulty text default 'medium',
  score numeric(5,1) not null,
  total_questions integer not null,
  correct_count integer not null,
  time_taken_seconds integer default 0,
  weak_topics jsonb default '[]'::jsonb,
  questions_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_attempts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Students can view their own quizzes') then
    create policy "Students can view their own quizzes" on public.quiz_attempts for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can insert their own quizzes') then
    create policy "Students can insert their own quizzes" on public.quiz_attempts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can delete their own quizzes') then
    create policy "Students can delete their own quizzes" on public.quiz_attempts for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 7. Focus Sessions Table
create table if not exists public.study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  subject text not null,
  chapter text,
  planned_minutes integer not null,
  actual_minutes integer not null,
  completed boolean default true,
  interrupted boolean default false,
  took_quiz boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.study_sessions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Students can view their own study sessions') then
    create policy "Students can view their own study sessions" on public.study_sessions for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can insert their own study sessions') then
    create policy "Students can insert their own study sessions" on public.study_sessions for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 8. Saved Educational Resources Table
create table if not exists public.saved_resources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  subject text not null,
  chapter text not null,
  resource_type text not null,
  url text not null,
  publisher text,
  is_official boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.saved_resources enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Students can view saved resources') then
    create policy "Students can view saved resources" on public.saved_resources for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can save resources') then
    create policy "Students can save resources" on public.saved_resources for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Students can remove saved resources') then
    create policy "Students can remove saved resources" on public.saved_resources for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 9. Trigger to auto-create profile on auth.users sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, email, full_name, avatar_url, grade, school_name, education_board, state, preferred_language, onboarding_completed
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'grade', 'Class 10'),
    coalesce(new.raw_user_meta_data->>'school_name', 'Delhi Public School'),
    coalesce(new.raw_user_meta_data->>'education_board', 'CBSE'),
    coalesce(new.raw_user_meta_data->>'state', 'Telangana'),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'English'),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
