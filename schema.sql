-- ==========================================
-- AdAgent AI - Supabase Database Schema
-- ==========================================
-- This SQL script sets up the PostgreSQL tables for user profiles, campaigns,
-- and chat history, complete with Row Level Security (RLS) and automatic profile copy triggers.
-- Run this in your Supabase SQL Editor.

-- Drop existing triggers and functions if they already exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;
drop table if exists chat_messages;
drop table if exists campaigns;
drop table if exists profiles;

-- 1. Create Profiles Table (Collects signup metadata like name/email)
create table profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text not null,
    email text not null,
    updated_at timestamp with time zone default now()
);

-- Enable RLS for Profiles
alter table profiles enable row level security;

-- RLS Policies for Profiles
create policy "Public profiles are viewable by everyone"
on profiles for select
using (true);

create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);

-- Trigger Function to copy auth user metadata to public profiles on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, email)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create the trigger on auth.users table
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- 2. Create Campaigns Table
create table campaigns (
    id bigint generated always as identity primary key,
    user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
    name text not null,
    platform text not null check (platform in ('meta', 'google', 'tiktok', 'linkedin')),
    status text not null check (status in ('active', 'paused', 'draft')) default 'active',
    budget numeric not null default 0,
    impressions integer not null default 0,
    clicks integer not null default 0,
    conversions integer not null default 0,
    roi numeric not null default 0,
    ctr numeric not null default 0,
    spend numeric not null default 0,
    date_created date not null default current_date
);

-- Enable RLS for Campaigns
alter table campaigns enable row level security;

-- Create RLS Policies for Campaigns
create policy "Users can view their own campaigns" 
on campaigns for select 
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own campaigns" 
on campaigns for insert 
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own campaigns" 
on campaigns for update 
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own campaigns" 
on campaigns for delete 
to authenticated
using (auth.uid() = user_id);


-- 3. Create Chat Messages Table (for persisting AI Copilot chat)
create table chat_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
    sender text not null check (sender in ('bot', 'user')),
    text text not null,
    actions jsonb default null,
    time text not null,
    created_at timestamp with time zone not null default now()
);

-- Enable RLS for Chat Messages
alter table chat_messages enable row level security;

-- Create RLS Policies for Chat Messages
create policy "Users can view their own chat messages" 
on chat_messages for select 
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own chat messages" 
on chat_messages for insert 
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own chat messages" 
on chat_messages for delete 
to authenticated
using (auth.uid() = user_id);
