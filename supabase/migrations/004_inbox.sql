-- =============================================================================
-- ZimConnect — Inbox / Messaging Migration (idempotent)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. conversations table
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id          uuid        primary key default gen_random_uuid(),
  listing_id  uuid        references public.listings(id) on delete set null,
  buyer_id    uuid        not null references auth.users(id) on delete cascade,
  seller_id   uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint  conversations_unique unique (listing_id, buyer_id, seller_id)
);

create index if not exists idx_conversations_buyer  on public.conversations(buyer_id,  updated_at desc);
create index if not exists idx_conversations_seller on public.conversations(seller_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- 2. messages table
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references auth.users(id) on delete cascade,
  body            text        not null check (char_length(body) between 1 and 2000),
  is_read         boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at asc);
create index if not exists idx_messages_unread       on public.messages(conversation_id, is_read) where is_read = false;

-- ---------------------------------------------------------------------------
-- 3. Trigger — bump conversations.updated_at on new message
-- ---------------------------------------------------------------------------
create or replace function public.bump_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversation on public.messages;
create trigger trg_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_updated_at();

-- ---------------------------------------------------------------------------
-- 4. RLS — conversations
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;

drop policy if exists "conversations: participants select" on public.conversations;
drop policy if exists "conversations: buyer insert"       on public.conversations;

create policy "conversations: participants select"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "conversations: buyer insert"
  on public.conversations for insert
  with check (auth.uid() = buyer_id);

-- ---------------------------------------------------------------------------
-- 5. RLS — messages
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists "messages: participants select"  on public.messages;
drop policy if exists "messages: participants insert"  on public.messages;
drop policy if exists "messages: recipient mark read"  on public.messages;

create policy "messages: participants select"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "messages: participants insert"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "messages: recipient mark read"
  on public.messages for update
  using (
    auth.uid() != sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  )
  with check (is_read = true);
