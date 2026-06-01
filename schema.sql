-- ==========================================
-- AdAgent AI - Supabase Database Schema
-- ==========================================
-- This SQL script sets up the PostgreSQL tables for campaigns and chat history
-- with Row Level Security (RLS) policies enabled.
-- Run this in your Supabase SQL Editor.

-- Drop tables if they already exist
drop table if exists chat_messages;
drop table if exists campaigns;

-- 1. Create Campaigns Table
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

-- Enable Row Level Security for Campaigns
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


-- 2. Create Chat Messages Table (for persisting AI Copilot chat)
create table chat_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
    sender text not null check (sender in ('bot', 'user')),
    text text not null,
    actions jsonb default null,
    time text not null, -- formatted time, e.g. "10:00 AM"
    created_at timestamp with time zone not null default now()
);

-- Enable Row Level Security for Chat Messages
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


-- 3. Seed Default Data Helper Function (Optional trigger or manual execution)
-- After user signup, you can pre-seed their account with default mock campaigns using this format:
-- insert into campaigns (user_id, name, platform, status, budget, impressions, clicks, conversions, roi, ctr, spend, date_created)
-- values 
-- (auth.uid(), 'EcoBottle - Meta Conversion Ad', 'meta', 'active', 1250, 48900, 3410, 184, 3.12, 6.97, 840, '2026-05-15'),
-- (auth.uid(), 'SaaS Platform - Google Search Lead Gen', 'google', 'active', 2400, 72100, 5890, 312, 2.85, 8.16, 1450, '2026-05-20'),
-- (auth.uid(), 'Summer Fashion - TikTok Dynamic Catalog', 'tiktok', 'paused', 800, 112000, 2100, 42, 1.45, 1.87, 520, '2026-05-28'),
-- (auth.uid(), 'Enterprise Cloud - LinkedIn Sponsored Content', 'linkedin', 'draft', 1500, 0, 0, 0, 0, 0, 0, '2026-06-01');
