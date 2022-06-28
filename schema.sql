DROP TABLE IF EXISTS PUBLIC .briefs;
DROP TABLE IF EXISTS PUBLIC .progress;
DROP TABLE IF EXISTS PUBLIC .verses;
DROP TABLE IF EXISTS PUBLIC .chapters;
DROP TABLE IF EXISTS PUBLIC .books;
DROP TABLE IF EXISTS PUBLIC .steps;
DROP TABLE IF EXISTS PUBLIC .project_roles;
DROP TABLE IF EXISTS PUBLIC .projects;
DROP TABLE IF EXISTS PUBLIC .methods;
DROP TABLE IF EXISTS PUBLIC .users;
DROP TABLE IF EXISTS PUBLIC .role_permissions;
DROP TABLE IF EXISTS PUBLIC .languages;

DROP FUNCTION IF EXISTS PUBLIC .authorize;
DROP FUNCTION IF EXISTS PUBLIC .has_access;
DROP FUNCTION IF EXISTS PUBLIC .can_change_role;

DROP TYPE IF EXISTS PUBLIC .app_permission;
DROP TYPE IF EXISTS PUBLIC .project_role;
DROP TYPE IF EXISTS PUBLIC .project_type;
DROP TYPE IF EXISTS PUBLIC .book_code;

-- Custom types

CREATE TYPE PUBLIC .app_permission AS enum (
  'dictionaries',
  'notes',
  'projects',
  'verses.set',
  'moderator.set',
  'user_projects',
  'project_source',
  'coordinator.set',
  'languages',
  'user_languages'
);


CREATE TYPE PUBLIC .project_role AS enum ('coordinator', 'moderator', 'translator');

CREATE TYPE PUBLIC .project_type AS enum ('obs', 'bible');

CREATE TYPE PUBLIC .book_code AS enum (
  'gen',
  'exo',
  'lev',
  'num',
  'deu',
  'jos',
  'jdg',
  'rut',
  '1sa',
  '2sa',
  '1ki',
  '2ki',
  '1ch',
  '2ch',
  'ezr',
  'neh',
  'est',
  'job',
  'psa',
  'pro',
  'ecc',
  'sng',
  'isa',
  'jer',
  'lam',
  'ezk',
  'dan',
  'hos',
  'jol',
  'amo',
  'oba',
  'jon',
  'mic',
  'nam',
  'hab',
  'zep',
  'hag',
  'zec',
  'mal',
  'mat',
  'mrk',
  'luk',
  'jhn',
  'act',
  'rom',
  '1co',
  '2co',
  'gal',
  'eph',
  'php',
  'col',
  '1th',
  '2th',
  '1ti',
  '2ti',
  'tit',
  'phm',
  'heb',
  'jas',
  '1pe',
  '2pe',
  '1jn',
  '2jn',
  '3jn',
  'jud',
  'rev',
  'obs'
);

-- USERS

CREATE TABLE PUBLIC .users (
  id uuid NOT NULL primary key,
  email text NOT NULL UNIQUE,
  agreement BOOLEAN NOT NULL DEFAULT FALSE,
  confession BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  blocked TIMESTAMP DEFAULT NULL
);

-- ROLE PERMISSIONS

CREATE TABLE PUBLIC .role_permissions (
  id bigint generated BY DEFAULT AS identity primary key,
  role project_role NOT NULL,
  permission app_permission NOT NULL,
  UNIQUE (role, permission)
);

COMMENT ON TABLE PUBLIC .role_permissions IS 'Application permissions for each role.';

-- LANGUAGES

CREATE TABLE PUBLIC .languages (
  id bigint generated BY DEFAULT AS identity primary key,
  eng text NOT NULL,
  code text NOT NULL UNIQUE,
  orig_name text NOT NULL,
  is_GL BOOLEAN NOT NULL DEFAULT FALSE
);

-- METHODS

CREATE TABLE PUBLIC .methods (
  id bigint generated BY DEFAULT AS identity primary key,
  title text NOT NULL
);

-- PROJECTS

CREATE TABLE PUBLIC .projects (
  id bigint generated BY DEFAULT AS identity primary key,
  title text NOT NULL,
  code text NOT NULL,
  language_id bigint references PUBLIC .languages ON
  DELETE
    CASCADE NOT NULL,
    method_id bigint references PUBLIC .methods ON
  DELETE
    CASCADE NOT NULL,
    "type" project_type NOT NULL,
    UNIQUE (code, language_id)
);

-- PROJECT ROLES

CREATE TABLE PUBLIC .project_roles (
  id bigint generated BY DEFAULT AS identity primary key,
  project_id bigint references PUBLIC .projects ON
  DELETE
    CASCADE NOT NULL,
    role project_role NOT NULL,
    user_id uuid references PUBLIC .users ON
  DELETE
    CASCADE NOT NULL,
    UNIQUE (project_id, user_id, role)
);

-- BRIEFS

CREATE TABLE PUBLIC .briefs (
  id bigint generated BY DEFAULT AS identity primary key,
  project_id bigint references PUBLIC .projects ON
  DELETE
    CASCADE NOT NULL UNIQUE,
    "text" text DEFAULT NULL
);

-- STEPS

CREATE TABLE PUBLIC .steps (
  id bigint generated BY DEFAULT AS identity primary key,
  title text NOT NULL,
  method_id bigint REFERENCES PUBLIC .methods ON
  DELETE
    CASCADE NOT NULL,
    config jsonb NOT NULL,
    order_by int2 NOT NULL,
    UNIQUE (method_id, order_by)
);

-- BOOKS

CREATE TABLE PUBLIC .books (
  id bigint generated BY DEFAULT AS identity primary key,
  code book_code NOT NULL,
  project_id bigint references PUBLIC .projects ON
  DELETE
    CASCADE NOT NULL,
    "text" text DEFAULT NULL,
    UNIQUE (project_id, code)
);

COMMENT ON TABLE PUBLIC .books IS 'Подумать о том, что будет если удалить проект. Так как в таблице книги мы хотим хранить текст';

-- CHAPTERS

CREATE TABLE PUBLIC .chapters (
  id bigint generated BY DEFAULT AS identity primary key,
  num int2 NOT NULL,
  book_id bigint REFERENCES PUBLIC .books ON
  DELETE
    CASCADE NOT NULL,
    "text" text DEFAULT NULL,
    UNIQUE (book_id, num)
);

-- VERSES

CREATE TABLE PUBLIC .verses (
  id bigint generated BY DEFAULT AS identity primary key,
  num int2 NOT NULL,
  chapter_id bigint REFERENCES PUBLIC .chapters ON
  DELETE
    CASCADE NOT NULL,
    project_translator_id bigint REFERENCES PUBLIC .project_roles ON
  DELETE
    CASCADE NOT NULL,
    UNIQUE (chapter_id, num)
);

-- PROGRESS

CREATE TABLE PUBLIC .progress (
  id bigint generated BY DEFAULT AS identity primary key,
  verse_id bigint REFERENCES PUBLIC .verses ON
  DELETE
    CASCADE NOT NULL,
    step_id bigint REFERENCES PUBLIC .steps ON
  DELETE
    CASCADE NOT NULL,
    "text" text DEFAULT NULL,
    UNIQUE (verse_id, step_id)
);

-- authorize with role-based access control (RBAC)
CREATE
OR replace FUNCTION PUBLIC .authorize(
  requested_permission app_permission,
  user_id uuid
) returns BOOLEAN LANGUAGE plpgsql security definer AS $$
DECLARE
  bind_permissions INT;

BEGIN
  SELECT
    COUNT(*)
  FROM
    PUBLIC .role_permissions
    INNER JOIN PUBLIC .project_roles ON role_permissions.role = project_roles.role
  WHERE
    role_permissions.permission = authorize.requested_permission
    AND project_roles.user_id = authorize.user_id INTO bind_permissions;

RETURN bind_permissions > 0;

END;

$$;

-- if user can work with site
CREATE
OR replace FUNCTION PUBLIC .has_access(user_id uuid) returns BOOLEAN LANGUAGE plpgsql security definer AS $$
DECLARE
  access INT;

BEGIN
  SELECT
    COUNT(*)
  FROM
    PUBLIC .users
  WHERE
    users.id = has_access.user_id
    AND users.agreement = TRUE
    AND users.confession = TRUE INTO access;

RETURN access > 0;

END;

$$;
-- Редактировать привилегии может координатор и администратор.
-- Координатор может поменять роль на переводчика или модератора.
-- Админ может на координатора, переводчика или модератора.
CREATE
OR replace FUNCTION PUBLIC .can_change_role(role project_role, from_user uuid, to_user uuid) returns BOOLEAN LANGUAGE plpgsql security definer AS $$
DECLARE
  from_user_role project_role;

to_user_role project_role;

BEGIN
  SELECT
    project_roles.role
  FROM
    project_roles
  WHERE
    project_roles.user_id = can_change_role.from_user INTO from_user_role;

SELECT
  project_roles.role
FROM
  project_roles
WHERE
  project_roles.user_id = can_change_role.to_user INTO to_user_role;

IF can_change_role.role = 'moderator'
AND from_user_role = 'coordinator'
AND to_user_role = 'translator' THEN RETURN TRUE;

END IF;

IF can_change_role.role = 'translator'
AND from_user_role = 'coordinator'

AND to_user_role = 'moderator' THEN RETURN TRUE;

END IF;

RETURN FALSE;

END;

$$;

-- Secure the tables
-- Secure users
ALTER TABLE
  PUBLIC .users enable ROW LEVEL security;

DROP POLICY IF EXISTS "Залогиненый юзер может получить список всех юзеров" ON PUBLIC .users;

CREATE policy "Залогиненый юзер может получить список всех юзеров"
ON PUBLIC .users FOR SELECT
TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Создавать может только записи про себя" ON PUBLIC .users;

CREATE policy "Создавать может только записи про себя" ON PUBLIC .users FOR
INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Обновлять может только самого себя" ON PUBLIC .users;

CREATE policy "Обновлять может только самого себя" ON PUBLIC .users FOR
UPDATE
  USING (auth.uid() = id);

-- Secure languages
ALTER TABLE
  PUBLIC .languages enable ROW LEVEL security;

DROP POLICY IF EXISTS "Залогиненый юзер может получить список всех языков" ON PUBLIC .languages;

CREATE policy "Залогиненый юзер может получить список всех языков" ON PUBLIC .languages FOR
SELECT
  TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Создавать может только тот, у кого есть привилегия" ON PUBLIC .languages;

CREATE policy "Создавать может только тот, у кого есть привилегия" ON PUBLIC .languages FOR
INSERT
  WITH CHECK (authorize('languages', auth.uid()));

DROP POLICY IF EXISTS "Обновлять может только тот, у кого есть привилегия" ON PUBLIC .languages;

CREATE policy "Обновлять может только тот, у кого есть привилегия" ON PUBLIC .languages FOR
UPDATE
  USING (authorize('languages', auth.uid()));

DROP POLICY IF EXISTS "Удалять может только тот, у кого есть привилегия" ON PUBLIC .languages;

CREATE policy "Удалять может только тот, у кого есть привилегия" ON PUBLIC .languages FOR
DELETE
  USING (authorize('languages', auth.uid()));

-- Secure project_roles
ALTER TABLE
  PUBLIC .project_roles enable ROW LEVEL security;

DROP POLICY IF EXISTS "Залогиненый юзер может получить список всех ролей любого пользователя" ON PUBLIC .project_roles;

CREATE policy "Залогиненый юзер может получить список всех ролей любого пользователя" ON PUBLIC .project_roles FOR
SELECT
  TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Редактировать привилегии может координатор и администратор. Координатор может поменять роль на переводчика или модератора. Админ может на координатора, переводчика или модератора." ON PUBLIC .project_roles;

-- CREATE policy "Редактировать привилегии может координатор и администратор. Координатор может поменять роль на переводчика или модератора. Админ может на координатора, переводчика или модератора." ON PUBLIC .project_roles FOR
-- UPDATE
--   USING (can_change_role(role, auth.uid(), user_id));
-- Secure role_permissions
ALTER TABLE
  PUBLIC .role_permissions enable ROW LEVEL security;

-- Send "previous data" on change
ALTER TABLE
  PUBLIC .users replica identity full;

ALTER TABLE
  PUBLIC .languages replica identity full;

-- inserts a row into public.users and assigns roles
CREATE
OR replace FUNCTION PUBLIC .handle_new_user() returns TRIGGER LANGUAGE plpgsql security definer AS $$ -- declare is_admin boolean;
BEGIN
  INSERT INTO
    PUBLIC .users (id, email)
  VALUES
    (NEW .id, NEW .email);

RETURN NEW;

END;

$$;

-- trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created after
INSERT
  ON auth.users FOR each ROW EXECUTE PROCEDURE PUBLIC .handle_new_user();

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
BEGIN
;

-- remove the realtime publication
DROP publication IF EXISTS supabase_realtime;

-- re-create the publication but don't enable it for any tables
CREATE publication supabase_realtime;

COMMIT;

-- add tables to the publication
ALTER publication supabase_realtime
ADD
  TABLE PUBLIC .languages;

ALTER publication supabase_realtime
ADD
  TABLE PUBLIC .users;

-- DUMMY DATA
DELETE FROM
  PUBLIC .languages;

INSERT INTO
  PUBLIC .languages (eng, code, orig_name)
VALUES
  ('russian', 'ru', 'русский'),
  ('english', 'en', 'english');

DELETE FROM
  PUBLIC .users;

INSERT INTO
  PUBLIC .users (
    id,
    email,
    agreement,
    confession,
    blocked
  )
VALUES
  (
    '21ae6e79-3f1d-4b87-bcb1-90256f63c167',
    'translator@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    '2b95a8e9-2ee1-41ef-84ec-2403dd87c9f2',
    'coordinator2@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    '2e108465-9c20-46cd-9e43-933730229762',
    'moderator3@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    '54358d8e-0144-47fc-a290-a6882023a3d6',
    'coordinator3@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    '83282f7a-c4b7-4387-97c9-4c356e56af5c',
    'coordinator@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    '8331e952-5771-49a6-a679-c44736f5581b',
    'moderator2@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    'ae891f6d-0f04-4b01-aa15-1ed46d0ef91d',
    'admin2@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    'bba5a95e-33b7-431d-8c43-aedc517a1aa6',
    'translator2@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    'cba74237-0801-4e3b-93f6-012aeab6eb91',
    'admin@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    'e50d5d0a-4fdb-4de3-b431-119e684d775e',
    'moderator@mail.com',
    FALSE,
    FALSE,
    NULL
  ),
  (
    'f193af4d-ca5e-4847-90ef-38f969792dd5',
    'translator3@mail.com',
    FALSE,
    FALSE,
    NULL
  );

DELETE FROM
  PUBLIC .languages;

INSERT INTO
  PUBLIC .languages (eng, code, orig_name)
VALUES
  ('russian', 'ru', 'русский'),
  ('english', 'en', 'english');

DELETE FROM
  PUBLIC .methods;

INSERT INTO
  PUBLIC .methods (title)
VALUES
  ('Vcana Bible'),
  ('Vcana OBS');

DELETE FROM
  PUBLIC .role_permissions;

INSERT INTO
  PUBLIC .role_permissions (role, permission)
VALUES
  ('moderator', 'dictionaries'),
  ('moderator', 'notes'),
  ('coordinator', 'dictionaries'),
  ('coordinator', 'notes'),
  ('coordinator', 'verses.set'),
  ('coordinator', 'moderator.set'),
  ('coordinator', 'user_projects');
