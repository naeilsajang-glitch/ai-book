-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Books Table
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- Optional, for linking to Supabase Auth user if needed later
  title text not null,
  file_path text not null, -- Path in Supabase Storage
  status text not null default 'processing', -- processing, ready, failed
  error_message text,
  file_hash text unique, -- For deduplication
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents Table (Vector Store)
create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768) -- Gemini 2.5 Flash / text-embedding-004 size
);

-- Personas Table
create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  role_name text,
  system_prompt text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql stable as $$
begin
  return query(
    select
      documents.id,
      documents.content,
      documents.metadata,
      1 - (documents.embedding <=> query_embedding) as similarity
    from documents
    where 1 - (documents.embedding <=> query_embedding) > match_threshold
    and documents.metadata @> filter
    order by documents.embedding <=> query_embedding
    limit match_count
  );
end;
$$;

-- Chat Messages Table
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  user_id uuid, -- Optional or Linked to Auth
  role text not null, -- 'user', 'assistant'
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);