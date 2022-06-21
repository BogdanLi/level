--
-- For use with https://github.com/supabase/supabase/tree/master/examples/nextjs-slack-clone
--

-- Custom types
create type public.app_permission as enum ('dictionaries','notes','projects','verses.set','moderator.set','user_projects','project_source','coordinator.set','languages','user_languages');
create type public.app_role as enum ('admin', 'coordinator','moderator','translator');

-- USERS
create table public.users (
  id          uuid not null primary key, -- UUID from auth.users
  email       text not null unique,
  agreement   boolean not null default false,
  confession  boolean not null default false,
  blocked     timestamp default null
);

-- USER ROLES
create table public.user_roles (
  id        bigint generated by default as identity primary key,
  user_id   uuid references public.users on delete cascade not null,
  role      app_role not null,
  unique (user_id, role)
);
comment on table public.user_roles is 'Application roles for each user.';

-- ROLE PERMISSIONS
create table public.role_permissions (
  id           bigint generated by default as identity primary key,
  role         app_role not null,
  permission   app_permission not null,
  unique (role, permission)
);
comment on table public.role_permissions is 'Application permissions for each role.';

-- LANGUAGES
create table public.languages (
  id           bigint generated by default as identity primary key,
  eng          text not null,
  code         text not null unique,
  orig_name    text not null
);


-- authorize with role-based access control (RBAC)
-- https://supabase.com/docs/reference/javascript/rpc
create function public.authorize(
  requested_permission app_permission,
  user_id uuid
)
returns boolean
language plpgsql
security definer
as $$
  declare
    bind_permissions int;
  begin
    select
      count(*)
    from public.role_permissions
    inner join public.user_roles on role_permissions.role = user_roles.role
    where
      role_permissions.permission = authorize.requested_permission and
      user_roles.user_id = authorize.user_id
    into bind_permissions;

    return bind_permissions > 0;
  end;
$$;

-- if user can work with site
create function public.has_access(
  user_id uuid
)
returns boolean
language plpgsql
security definer
as $$
  declare
    access int;
  begin
    select
      count(*)
    from public.users
    where
      users.id = has_access.user_id
      AND users.agreement = true
      AND users.confession = true
    into access;

    return access > 0;
  end;
$$;

-- Secure the tables
alter table public.users
  enable row level security;
alter table public.languages
  enable row level security;
alter table public.user_roles
  enable row level security;
alter table public.role_permissions
  enable row level security;

create policy "Allow logged-in read access" on public.users
  for select using (auth.role() = 'authenticated');
create policy "Allow individual insert access" on public.users
  for insert with check (auth.uid() = id);
create policy "Allow individual update access" on public.users
  for update using ( auth.uid() = id );

create policy "Allow everyone read access" on public.languages
  for select using (true);
create policy "Allow individual insert access" on public.languages
  for insert with check (authorize('languages', auth.uid()));
create policy "Allow individual update access" on public.languages
  for update using (authorize('languages', auth.uid()));
create policy "Allow individual delete access" on public.languages
  for delete using (authorize('languages', auth.uid()));

create policy "Allow individual read access" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "Allow change role" on public.user_roles
  for update using (authorize('coordinator.set', auth.uid()));

-- Send "previous data" on change
alter table public.users
  replica identity full;
alter table public.languages
  replica identity full;


-- inserts a row into public.users and assigns roles
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
  -- declare is_admin boolean;
  begin
    insert into public.users (id, email)
    values (new.id, new.email);

    insert into public.user_roles (user_id, role) values (new.id, 'translator');

    return new;
  end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */

begin;
  -- remove the realtime publication
  drop publication if exists supabase_realtime;

  -- re-create the publication but don't enable it for any tables
  create publication supabase_realtime;
commit;

-- add tables to the publication

alter publication supabase_realtime add table public.languages;
alter publication supabase_realtime add table public.users;

-- DUMMY DATA
insert into public.languages (eng, code, orig_name)
values
    ('russian', 'ru', 'русский'),
    ('english', 'en', 'english');

insert into public.role_permissions (role, permission)
values
('moderator','dictionaries'),
('moderator','notes'),
('coordinator','dictionaries'),
('coordinator','notes'),
('coordinator','verses.set'),
('coordinator','moderator.set'),
('coordinator','user_projects'),
('admin','dictionaries'),
('admin','notes'),
('admin','verses.set'),
('admin','moderator.set'),
('admin','user_projects'),
('admin','projects'),
('admin','project_source'),
('admin','coordinator.set'),
('admin','languages'),
('admin','user_languages');