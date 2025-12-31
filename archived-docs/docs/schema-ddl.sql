--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _realtime;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_functions;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: article_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.article_status AS ENUM (
    'draft',
    'pending_review',
    'published'
);


--
-- Name: attendance_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status_enum AS ENUM (
    'present',
    'late',
    'absent_excused',
    'absent_unexcused',
    'no_show',
    'canceled_by_student',
    'canceled_by_instructor',
    'makeup_scheduled',
    'makeup_completed'
);


--
-- Name: booking_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_type AS ENUM (
    'individual',
    'corporate',
    'private group',
    'public group'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'approved',
    'reversed',
    'withheld'
);


--
-- Name: post_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_status AS ENUM (
    'draft',
    'published',
    'archived'
);


--
-- Name: submission_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_type AS ENUM (
    'booking',
    'query',
    'contact',
    'corporate'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin',
    'instructor'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: add_admin_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_admin_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if new.role in ('super_admin', 'admin') and (old.role is null or old.role not in ('super_admin', 'admin')) then
    insert into public.admin_users (user_id)
    values (new.user_id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;


--
-- Name: add_to_admin_users_on_admin_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_to_admin_users_on_admin_role() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- Check if the inserted role_id matches an admin role
  if exists (
    select 1 from public.roles r
    where r.id = new.role_id and lower(r.name) in ('admin', 'super_admin')
  ) then
    -- Insert into admin_users if not already present
    insert into public.admin_users (id, email, role, created_at, updated_at)
    select p.user_id, p.email, r.name, now(), now()
    from public.profiles p
    join public.roles r on r.id = new.role_id
    where p.user_id = new.user_id
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;


--
-- Name: admin_update_user_roles(uuid, text[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_update_user_roles(target_user_id uuid, new_role_names text[], requesting_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

  role_id_var UUID;

  role_name TEXT;

  admin_profile RECORD;

  result_json JSON;

BEGIN

  -- Debug: Log the requesting user ID

  RAISE NOTICE 'Checking admin permissions for user: %', requesting_user_id;

  

  -- Check if the requesting user exists and is an admin or super_admin

  SELECT user_id, role, is_active INTO admin_profile

  FROM profiles 

  WHERE user_id = requesting_user_id;

  

  -- Debug: Log what we found

  RAISE NOTICE 'Found profile: user_id=%, role=%, is_active=%', 

    admin_profile.user_id, admin_profile.role, admin_profile.is_active;

  

  -- Check if user exists

  IF admin_profile.user_id IS NULL THEN

    RAISE EXCEPTION 'User profile not found for user_id: %', requesting_user_id;

  END IF;

  

  -- Check if user is active

  IF admin_profile.is_active IS FALSE THEN

    RAISE EXCEPTION 'User account is not active';

  END IF;

  

  -- Check if user has admin or super_admin role

  IF admin_profile.role NOT IN ('admin', 'super_admin') THEN

    RAISE EXCEPTION 'Insufficient permissions: Admin or Super Admin role required. Current role: %', 

      COALESCE(admin_profile.role, 'NULL');

  END IF;

  

  RAISE NOTICE 'Admin check passed. Updating roles for user: %', target_user_id;

  

  -- Delete existing roles for the target user

  DELETE FROM user_roles WHERE user_id = target_user_id;

  RAISE NOTICE 'Deleted existing roles for user: %', target_user_id;

  

  -- Insert new roles

  FOREACH role_name IN ARRAY new_role_names

  LOOP

    -- Get the role ID for this role name

    SELECT id INTO role_id_var 

    FROM roles 

    WHERE name = role_name;

    

    RAISE NOTICE 'Processing role: %, found role_id: %', role_name, role_id_var;

    

    -- If role exists, insert the user_role record

    IF role_id_var IS NOT NULL THEN

      INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)

      VALUES (target_user_id, role_id_var, requesting_user_id, NOW());

      

      RAISE NOTICE 'Inserted role: % for user: %', role_name, target_user_id;

    ELSE

      RAISE NOTICE 'Role not found: %', role_name;

    END IF;

  END LOOP;

  

  -- Return success response

  SELECT json_build_object(

    'success', true,

    'message', 'User roles updated successfully',

    'user_id', target_user_id,

    'new_roles', new_role_names,

    'requesting_user', requesting_user_id

  ) INTO result_json;

  

  RAISE NOTICE 'Role update completed successfully';

  RETURN result_json;

  

EXCEPTION

  WHEN OTHERS THEN

    RAISE EXCEPTION 'Error updating user roles: %', SQLERRM;

END;

$$;


--
-- Name: assign_default_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_default_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default role ID
  SELECT id INTO default_role_id FROM roles WHERE name = 'user' LIMIT 1;
  
  IF default_role_id IS NOT NULL THEN
    -- Insert default role for new user
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.user_id, default_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail profile creation
    RAISE WARNING 'Error assigning default role to user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$$;


--
-- Name: assign_default_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_default_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  user_role_id uuid;
BEGIN
  -- Get the id of the 'user' role
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'user' LIMIT 1;
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role_id, assigned_at)
  VALUES (NEW.user_id, user_role_id, now());
  RETURN NEW;
END;
$$;


--
-- Name: can_manage_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_roles() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN has_role('super_admin');
END;
$$;


--
-- Name: check_admin_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_admin_access() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    -- Check admin_users table (legacy method)
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
    OR 
    -- Check user_roles table (new method)
    has_role('admin') 
    OR 
    has_role('super_admin')
  );
END;
$$;


--
-- Name: check_admin_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_admin_role() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$

  SELECT EXISTS (

    SELECT 1 FROM user_roles ur

    WHERE ur.user_id = auth.uid()

    AND ur.role_id IN (

      SELECT id FROM roles WHERE name IN ('admin', 'super_admin')

    )

  );

$$;


--
-- Name: check_admin_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_admin_role(check_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = check_user_id 
    AND role = 'admin'
  );
$$;


--
-- Name: check_can_manage_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_can_manage_roles() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  );
END;
$$;


--
-- Name: check_is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Check admin_users table first
  IF EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.email() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN true;
  END IF;

  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;


--
-- Name: check_user_accounts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_accounts() RETURNS TABLE(total_auth_users integer, total_profiles integer, missing_profiles integer, admin_users integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::INTEGER,
    (SELECT COUNT(*) FROM profiles)::INTEGER,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.id IS NULL)::INTEGER,
    (SELECT COUNT(*) FROM admin_users)::INTEGER;
END;
$$;


--
-- Name: check_user_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_roles() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name = ANY(ARRAY['admin', 'super_admin', 'energy_exchange_lead'])
    )
$$;


--
-- Name: convert_assignment_to_timezone(date, time without time zone, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.convert_assignment_to_timezone(assignment_date date, assignment_time time without time zone, stored_timezone text, target_timezone text) RETURNS timestamp with time zone
    LANGUAGE plpgsql
    AS $$

BEGIN

  -- Combine date and time in stored timezone, then convert to target timezone

  RETURN (assignment_date + assignment_time) AT TIME ZONE stored_timezone AT TIME ZONE target_timezone;

END;

$$;


--
-- Name: create_profile_after_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_profile_after_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


--
-- Name: create_profile_and_role_after_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_profile_and_role_after_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  user_role_id uuid;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);

  -- Get the id of the 'user' role
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'user' LIMIT 1;

  -- Insert into user_roles
  IF user_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, user_role_id);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: debug_is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_is_admin() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE 

    current_user_id uuid;

    role_count integer;

    user_role_count integer;

    has_admin_role boolean;

BEGIN

    -- Get current user ID

    current_user_id := auth.uid();

    

    -- Check if we can count roles table

    SELECT COUNT(*) INTO role_count FROM roles;

    

    -- Check if we can count user_roles table

    SELECT COUNT(*) INTO user_role_count FROM user_roles;

    

    -- Check if user has admin role

    SELECT EXISTS (

        SELECT 1 

        FROM user_roles ur

        JOIN roles r ON ur.role_id = r.id

        WHERE ur.user_id = current_user_id

        AND r.name IN ('admin', 'super_admin')

    ) INTO has_admin_role;

    

    RETURN format('User ID: %s, Roles count: %s, User_roles count: %s, Has admin: %s', 

                  current_user_id, role_count, user_role_count, has_admin_role);

                  

EXCEPTION WHEN OTHERS THEN

    RETURN 'Error: ' || SQLERRM || ' - Detail: ' || SQLSTATE;

END;

$$;


--
-- Name: debug_user_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_user_data() RETURNS TABLE(auth_users_count integer, profiles_count integer, user_roles_count integer, admin_users_count integer, missing_profiles_count integer, missing_roles_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::INTEGER AS auth_users_count,
    (SELECT COUNT(*) FROM profiles)::INTEGER AS profiles_count,
    (SELECT COUNT(*) FROM user_roles)::INTEGER AS user_roles_count,
    (SELECT COUNT(*) FROM admin_users)::INTEGER AS admin_users_count,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.id IS NULL)::INTEGER AS missing_profiles_count,
    (SELECT COUNT(*) FROM profiles p LEFT JOIN user_roles ur ON p.user_id = ur.user_id WHERE ur.user_id IS NULL)::INTEGER AS missing_roles_count;
END;
$$;


--
-- Name: diagnose_user_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.diagnose_user_signup() RETURNS TABLE(auth_users_count bigint, profiles_count bigint, user_roles_count bigint, users_without_profiles bigint, profiles_without_roles bigint, last_user_email text, last_profile_email text, trigger_exists boolean, profile_policies text[])
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users),
    (SELECT COUNT(*) FROM profiles),
    (SELECT COUNT(*) FROM user_roles),
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.id IS NULL),
    (SELECT COUNT(*) FROM profiles p LEFT JOIN user_roles ur ON p.user_id = ur.user_id WHERE ur.user_id IS NULL),
    (SELECT email::text FROM auth.users ORDER BY created_at DESC LIMIT 1),
    (SELECT email::text FROM profiles ORDER BY created_at DESC LIMIT 1),
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'),
    ARRAY(SELECT policyname::text FROM pg_policies WHERE tablename = 'profiles');
END;
$$;


--
-- Name: fix_admin_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fix_admin_user() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_admin_email TEXT := 'gourab.master@gmail.com';
    v_user_id UUID;
    v_profile_id UUID;
BEGIN
    -- Insert or update admin user
    INSERT INTO admin_users (email, role) 
    VALUES (v_admin_email, 'super_admin')
    ON CONFLICT (email) DO UPDATE SET
      role = 'super_admin',
      updated_at = now();
      
    -- Get user ID if exists
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = v_admin_email;
    
    -- If user exists, ensure they have a profile
    IF v_user_id IS NOT NULL THEN
        SELECT id INTO v_profile_id FROM profiles WHERE user_id = v_user_id;
        
        IF v_profile_id IS NULL THEN
            INSERT INTO profiles (user_id, email, full_name, role)
            VALUES (v_user_id, v_admin_email, 'Admin User', 'admin');
            RAISE NOTICE 'Created profile for admin user: %', v_admin_email;
        ELSE
            UPDATE profiles 
            SET role = 'admin', updated_at = now()
            WHERE user_id = v_user_id;
            RAISE NOTICE 'Updated profile for admin user: %', v_admin_email;
        END IF;
    END IF;
END;
$$;


--
-- Name: generate_booking_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_booking_id() RETURNS text
    LANGUAGE plpgsql
    AS $$

DECLARE

    new_id text;

    exists boolean;

BEGIN

    LOOP

        -- Generate booking ID: YOG-YYYYMMDD-XXXX format

        new_id := 'YOG-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

        

        -- Check if this ID already exists

        SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_id = new_id) INTO exists;

        

        -- If unique, exit loop

        IF NOT exists THEN

            EXIT;

        END IF;

    END LOOP;

    

    RETURN new_id;

END;

$$;


--
-- Name: FUNCTION generate_booking_id(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.generate_booking_id() IS 'Generates unique booking IDs in YOG-YYYYMMDD-XXXX format';


--
-- Name: generate_slug(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_slug(title text) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$;


--
-- Name: get_booking_details(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_booking_details(booking_id_param text) RETURNS TABLE(booking_id text, client_name text, client_email text, client_phone text, requested_class text, requested_date text, requested_time text, experience_level text, special_requests text, booking_status text, has_assignment boolean, assignment_date text, assignment_time text, assigned_instructor text)
    LANGUAGE plpgsql
    AS $$

BEGIN

    RETURN QUERY

    SELECT 

        ba.booking_id,

        (ba.first_name || ' ' || ba.last_name) as client_name,

        ba.email as client_email,

        ba.phone as client_phone,

        ba.requested_class,

        ba.requested_date,

        ba.requested_time,

        ba.experience_level,

        ba.special_requests,

        ba.booking_status,

        (ba.assignment_id IS NOT NULL) as has_assignment,

        ba.assigned_date as assignment_date,

        (ba.assigned_start_time || ' - ' || ba.assigned_end_time) as assignment_time,

        ba.assigned_instructor_name as assigned_instructor

    FROM booking_assignments ba

    WHERE ba.booking_id = booking_id_param;

END;

$$;


--
-- Name: get_highest_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_highest_user_role(user_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  highest_role text;
BEGIN
  -- Priority order: super_admin > admin > instructor > mantra_curator > user
  SELECT 
    CASE
      WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'super_admin') THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'admin') THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'instructor') THEN 'instructor'
      WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'mantra_curator') THEN 'mantra_curator'
      WHEN EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = 'user') THEN 'user'
      ELSE 'user'
    END INTO highest_role;
  
  RETURN highest_role;
END;
$_$;


--
-- Name: get_instructors(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_instructors() RETURNS TABLE(user_id uuid, full_name text)
    LANGUAGE plpgsql
    AS $$

BEGIN

  RETURN QUERY

  SELECT u.id, p.full_name

  FROM users u

  JOIN profiles p ON u.id = p.user_id

  JOIN user_roles ur ON u.id = ur.user_id

  JOIN roles r ON ur.role_id = r.id

  WHERE r.name IN ('instructor', 'yoga_acharya');

END;

$$;


--
-- Name: get_user_profiles_for_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_profiles_for_admin() RETURNS TABLE(id uuid, user_id uuid, full_name text, phone text, bio text, experience_level text, created_at timestamp with time zone, updated_at timestamp with time zone, email text, user_created_at timestamp with time zone, user_roles text[])
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.phone,
    p.bio,
    get_highest_user_role(p.user_id) as experience_level, -- Use highest role
    p.created_at,
    p.updated_at,
    p.email,
    u.created_at as user_created_at,
    ARRAY(
      SELECT r.name 
      FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = p.user_id
    ) as user_roles
  FROM profiles p
  LEFT JOIN auth.users u ON p.user_id = u.id
  ORDER BY p.created_at DESC;
END;
$$;


--
-- Name: get_user_roles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_roles() RETURNS TABLE(role_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT r.name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();
END;
$$;


--
-- Name: get_users_with_roles(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_users_with_roles(role_names text[]) RETURNS TABLE(id uuid, email text, raw_user_meta_data jsonb, user_roles text[])
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    ARRAY_AGG(r.name) as user_roles
  FROM auth.users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN roles r ON ur.role_id = r.id
  WHERE r.name = ANY(role_names)
  GROUP BY u.id, u.email, u.raw_user_meta_data
  HAVING COUNT(r.name) > 0;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Insert profile directly without checking if it exists
  -- This is simpler and less error-prone
  BEGIN
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RAISE NOTICE 'Created profile for new user: %', NEW.email;
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, which is fine
      RAISE NOTICE 'Profile already exists for user: %', NEW.email;
    WHEN others THEN
      -- Log the error but don't block user creation
      RAISE WARNING 'Error creating profile for user %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  user_role_id uuid;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Get the id of the 'user' role
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'user' LIMIT 1;

  -- Insert into user_roles
  IF user_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, user_role_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: has_role(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(role_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  RETURN EXISTS (

    SELECT 1 

    FROM profiles p

    JOIN user_roles ur ON p.user_id = ur.user_id

    JOIN roles r ON ur.role_id = r.id

    WHERE p.user_id = auth.uid() 

    AND r.name = role_name

  );

END;

$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$

  SELECT EXISTS (

    SELECT 1

    FROM user_roles ur

    JOIN roles r ON r.id = ur.role_id

    WHERE ur.user_id = auth.uid()

      AND r.name IN ('admin','super_admin')

  );

$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(uid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$

begin

  return exists (

    select 1 from public.user_roles ur

    join public.roles r on ur.role_id = r.id

    where ur.user_id = uid

    and r.name in ('admin', 'super_admin')

  );

end;

$$;


--
-- Name: is_admin_or_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_super_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select role in ('admin', 'super admin')
  from public.profiles
  where user_id = (select auth.uid());
$$;


--
-- Name: is_admin_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_user() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

    -- First try role-based check

    IF EXISTS (

        SELECT 1 

        FROM user_roles ur

        JOIN roles r ON ur.role_id = r.id

        WHERE ur.user_id = auth.uid()

        AND r.name IN ('admin', 'super_admin')

    ) THEN

        RETURN true;

    END IF;

    

    -- Fallback to email check for known admins

    IF (auth.jwt() ->> 'email') = 'gourab.master@gmail.com' THEN

        RETURN true;

    END IF;

    

    RETURN false;

EXCEPTION WHEN OTHERS THEN

    -- If role check fails, try email fallback

    RETURN (auth.jwt() ->> 'email') = 'gourab.master@gmail.com';

END;

$$;


--
-- Name: is_mantra_curator(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_mantra_curator() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN has_role('mantra_curator');
END;
$$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE
    AS $$

  SELECT EXISTS (

    SELECT 1

    FROM user_roles ur

    JOIN roles r ON r.id = ur.role_id

    WHERE ur.user_id = auth.uid()

      AND r.name = 'super_admin'

  );

$$;


--
-- Name: lock_past_class_attendance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lock_past_class_attendance() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_count integer;

BEGIN

  UPDATE public.class_assignments ca

  SET attendance_locked = true

  WHERE attendance_locked = false

    AND (

      (

        -- Construct naive timestamp (date + end_time) then interpret in stored timezone

        ((ca.date::text || ' ' || ca.end_time::text)::timestamp AT TIME ZONE ca.timezone)

        + INTERVAL '30 minutes'

      ) < now()

    );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;

END;

$$;


--
-- Name: promote_from_waitlist(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.promote_from_waitlist() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  waitlist_entry RECORD;
BEGIN
  -- Only run when a booking is cancelled
  IF TG_OP = 'UPDATE' AND OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
    -- Get the first person on the waitlist for this class
    SELECT * INTO waitlist_entry
    FROM waitlist
    WHERE scheduled_class_id = NEW.scheduled_class_id
    ORDER BY position ASC
    LIMIT 1;
    
    IF FOUND THEN
      -- Create a booking for the waitlisted person
      INSERT INTO class_bookings (
        user_id,
        scheduled_class_id,
        first_name,
        last_name,
        email,
        phone,
        booking_status
      ) VALUES (
        waitlist_entry.user_id,
        waitlist_entry.scheduled_class_id,
        'Waitlist',
        'User',
        waitlist_entry.email,
        waitlist_entry.phone,
        'confirmed'
      );
      
      -- Remove from waitlist
      DELETE FROM waitlist WHERE id = waitlist_entry.id;
      
      -- Update positions for remaining waitlist entries
      UPDATE waitlist 
      SET position = position - 1
      WHERE scheduled_class_id = waitlist_entry.scheduled_class_id
        AND position > waitlist_entry.position;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: remove_admin_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_admin_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if old.role in ('super_admin', 'admin') and new.role not in ('super_admin', 'admin') then
    delete from public.admin_users where user_id = old.user_id;
  end if;
  return new;
end;
$$;


--
-- Name: set_article_author(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_article_author() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    NEW.author_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: set_booking_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_booking_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    IF NEW.booking_id IS NULL THEN

        NEW.booking_id := generate_booking_id();

    END IF;

    RETURN NEW;

END;

$$;


--
-- Name: set_class_attendance_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_class_attendance_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$$;


--
-- Name: set_class_ratings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_class_ratings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$$;


--
-- Name: set_contact_message_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_contact_message_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: sync_admin_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_admin_users() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- On INSERT: Add to admin_users if role is admin/super_admin and not already present
  if tg_op = 'INSERT' then
    if exists (
      select 1 from public.roles r where r.id = new.role_id and r.name in ('admin', 'super_admin')
    ) then
      insert into public.admin_users (id, email)
      select new.user_id, p.email
      from public.profiles p
      where p.user_id = new.user_id
        and not exists (
          select 1 from public.admin_users au where au.id = new.user_id
        );
    end if;
    return new;
  end if;

  -- On UPDATE: Handle role changes
  if tg_op = 'UPDATE' then
    -- If role changed to admin/super_admin, add to admin_users if not present
    if exists (
      select 1 from public.roles r where r.id = new.role_id and r.name in ('admin', 'super_admin')
    ) and not exists (
      select 1 from public.roles r where r.id = old.role_id and r.name in ('admin', 'super_admin')
    ) then
      insert into public.admin_users (id, email)
      select new.user_id, p.email
      from public.profiles p
      where p.user_id = new.user_id
        and not exists (
          select 1 from public.admin_users au where au.id = new.user_id
        );
    end if;
    -- If role changed from admin/super_admin to non-admin, remove if no more admin roles
    if exists (
      select 1 from public.roles r where r.id = old.role_id and r.name in ('admin', 'super_admin')
    ) and not exists (
      select 1 from public.roles r where r.id = new.role_id and r.name in ('admin', 'super_admin')
    ) then
      if not exists (
        select 1 from public.user_roles ur
        join public.roles r on ur.role_id = r.id
        where ur.user_id = old.user_id and r.name in ('admin', 'super_admin')
      ) then
        delete from public.admin_users where id = old.user_id;
      end if;
    end if;
    return new;
  end if;

  -- On DELETE: Remove from admin_users if user has no more admin/super_admin roles
  if tg_op = 'DELETE' then
    if exists (
      select 1 from public.roles r where r.id = old.role_id and r.name in ('admin', 'super_admin')
    ) then
      if not exists (
        select 1 from public.user_roles ur
        join public.roles r on ur.role_id = r.id
        where ur.user_id = old.user_id and r.name in ('admin', 'super_admin')
      ) then
        delete from public.admin_users where id = old.user_id;
      end if;
    end if;
    return old;
  end if;

  return null;
end;
$$;


--
-- Name: sync_missing_profiles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_missing_profiles() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_record RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_user_record IN 
        SELECT 
            u.id, 
            u.email, 
            u.raw_user_meta_data->>'full_name' as full_name
        FROM 
            auth.users u
        LEFT JOIN 
            profiles p ON u.id = p.user_id
        WHERE 
            p.id IS NULL
    LOOP
        BEGIN
            INSERT INTO profiles (
                user_id, 
                email, 
                full_name
            ) 
            VALUES (
                v_user_record.id, 
                v_user_record.email, 
                COALESCE(v_user_record.full_name, v_user_record.email)
            );
            v_count := v_count + 1;
        EXCEPTION WHEN others THEN
            RAISE WARNING 'Error syncing profile for user %: %', v_user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Created % missing profile(s)', v_count;
END;
$$;


--
-- Name: trg_add_to_admin_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_add_to_admin_users() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$

begin

  if new.role in ('admin', 'super_admin') then

    insert into admin_users (id)

    values (new.user_id)

    on conflict (id) do nothing;

  end if;

  return new;

end;

$$;


--
-- Name: uid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT auth.uid();
$$;


--
-- Name: update_article_view_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_article_view_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE articles 
  SET view_count = (
    SELECT COUNT(*) 
    FROM article_views 
    WHERE article_id = NEW.article_id
  )
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$;


--
-- Name: update_class_assignments_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_class_assignments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_class_bookings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_class_bookings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_class_packages_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_class_packages_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_class_participant_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_class_participant_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase count for new confirmed booking
    IF NEW.booking_status = 'confirmed' THEN
      UPDATE scheduled_classes 
      SET current_participants = current_participants + 1
      WHERE id = NEW.scheduled_class_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status != 'confirmed' THEN
      -- Booking was cancelled or changed from confirmed
      UPDATE scheduled_classes 
      SET current_participants = current_participants - 1
      WHERE id = NEW.scheduled_class_id;
    ELSIF OLD.booking_status != 'confirmed' AND NEW.booking_status = 'confirmed' THEN
      -- Booking was confirmed
      UPDATE scheduled_classes 
      SET current_participants = current_participants + 1
      WHERE id = NEW.scheduled_class_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease count for deleted confirmed booking
    IF OLD.booking_status = 'confirmed' THEN
      UPDATE scheduled_classes 
      SET current_participants = current_participants - 1
      WHERE id = OLD.scheduled_class_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: update_instructor_availability_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_instructor_availability_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = now();

    RETURN NEW;

END;

$$;


--
-- Name: update_newsletters_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_newsletters_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_scheduled_classes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_scheduled_classes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_packages_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_packages_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_preferences_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_preferences_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: upsert_attendance(uuid, uuid, public.attendance_status_enum, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_attendance(p_assignment_id uuid, p_member_id uuid, p_status public.attendance_status_enum, p_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_id uuid;

BEGIN

  -- Authorization: instructor of class OR admin

  IF NOT (

    EXISTS (

      SELECT 1 FROM public.class_assignments ca

      WHERE ca.id = p_assignment_id

        AND ca.instructor_id = auth.uid()

        AND ca.attendance_locked = false

    ) OR public.is_admin()

  ) THEN

    RAISE EXCEPTION 'Not authorized to modify attendance for this class';

  END IF;



  INSERT INTO public.class_attendance (assignment_id, member_id, status, notes, marked_by)

  VALUES (p_assignment_id, p_member_id, p_status, p_notes, auth.uid())

  ON CONFLICT (assignment_id, member_id)

  DO UPDATE SET status = EXCLUDED.status,

                notes = COALESCE(EXCLUDED.notes, public.class_attendance.notes),

                marked_by = auth.uid(),

                marked_at = now()

  RETURNING id INTO v_id;



  RETURN v_id;

END;

$$;


--
-- Name: upsert_class_rating(uuid, smallint, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_class_rating(p_assignment_id uuid, p_rating smallint, p_comment text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_id uuid;

BEGIN

  IF NOT (auth.role() = 'authenticated') THEN

    RAISE EXCEPTION 'Authentication required';

  END IF;



  -- Validate rating range

  IF p_rating < 1 OR p_rating > 5 THEN

    RAISE EXCEPTION 'Rating must be between 1 and 5';

  END IF;



  -- Ensure user attended & class ended

  IF NOT EXISTS (

    SELECT 1

    FROM public.class_assignments ca

    JOIN public.class_attendance att ON att.assignment_id = ca.id

    WHERE ca.id = p_assignment_id

      AND att.member_id = auth.uid()

      AND att.status IN ('present','late','makeup_completed')

      AND ( ( (ca.date::text || ' ' || ca.end_time::text)::timestamp AT TIME ZONE ca.timezone ) <= now() )

  ) THEN

    RAISE EXCEPTION 'Cannot rate class: attendance requirement not met or class not finished';

  END IF;



  INSERT INTO public.class_ratings (assignment_id, member_id, rating, comment)

  VALUES (p_assignment_id, auth.uid(), p_rating, p_comment)

  ON CONFLICT (assignment_id, member_id)

  DO UPDATE SET rating = EXCLUDED.rating,

                comment = COALESCE(EXCLUDED.comment, public.class_ratings.comment),

                updated_at = now()

  RETURNING id INTO v_id;



  RETURN v_id;

END;

$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: -
--

CREATE FUNCTION supabase_functions.http_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0,
    broadcast_adapter character varying(255) DEFAULT 'phoenix'::character varying
);


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: assignment_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    booking_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    class_name text NOT NULL,
    instructor text NOT NULL,
    class_date date DEFAULT CURRENT_DATE NOT NULL,
    class_time text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    experience_level text DEFAULT 'beginner'::text NOT NULL,
    special_requests text DEFAULT ''::text,
    emergency_contact text,
    emergency_phone text,
    status text DEFAULT 'confirmed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    instructor_id uuid,
    booking_type text DEFAULT 'individual'::text NOT NULL,
    company_name text,
    job_title text,
    company_size text,
    industry text,
    website text,
    participants_count integer,
    work_location text,
    preferred_days text[],
    preferred_times text[],
    session_frequency text,
    program_duration text,
    budget_range text,
    goals text,
    current_wellness_programs text,
    space_available text,
    equipment_needed boolean DEFAULT false,
    package_type text,
    timezone text,
    country text,
    price numeric(10,2),
    currency text DEFAULT 'USD'::text,
    payment_status text DEFAULT 'pending'::text,
    session_duration integer,
    booking_notes text,
    cancellation_reason text,
    cancelled_at timestamp with time zone,
    class_package_id uuid,
    booking_id text,
    CONSTRAINT check_booking_type CHECK ((booking_type = ANY (ARRAY['individual'::text, 'corporate'::text, 'private_group'::text, 'public_group'::text]))),
    CONSTRAINT check_payment_status CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]))),
    CONSTRAINT check_status CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'rescheduled'::text])))
);


--
-- Name: COLUMN bookings.booking_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bookings.booking_id IS 'Unique booking ID in format YOG-YYYYMMDD-XXXX';


--
-- Name: class_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    member_id uuid NOT NULL,
    status public.attendance_status_enum NOT NULL,
    notes text,
    marked_by uuid DEFAULT auth.uid() NOT NULL,
    marked_at timestamp with time zone DEFAULT now() NOT NULL,
    makeup_of_assignment_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_assignment_roster_v; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.admin_assignment_roster_v AS
 SELECT ab.assignment_id,
    b.booking_id,
    b.user_id AS member_id,
    ((b.first_name || ' '::text) || b.last_name) AS full_name,
    b.email,
    att.status,
    att.marked_at,
    att.marked_by
   FROM ((public.assignment_bookings ab
     JOIN public.bookings b ON ((b.booking_id = ab.booking_id)))
     LEFT JOIN public.class_attendance att ON (((att.assignment_id = ab.assignment_id) AND (att.member_id = b.user_id))));


--
-- Name: admin_class_overview_v; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.admin_class_overview_v AS
SELECT
    NULL::uuid AS assignment_id,
    NULL::uuid AS instructor_id,
    NULL::date AS date,
    NULL::time without time zone AS start_time,
    NULL::time without time zone AS end_time,
    NULL::text AS class_status,
    NULL::public.payment_status AS payment_status,
    NULL::numeric(10,2) AS final_payment_amount,
    NULL::text AS class_type_name,
    NULL::text AS class_type_description,
    NULL::text AS class_type_difficulty,
    NULL::integer AS class_type_duration,
    NULL::text AS schedule_type,
    NULL::text AS timezone,
    NULL::bigint AS attended_count,
    NULL::bigint AS no_show_count,
    NULL::bigint AS absent_count,
    NULL::numeric AS avg_rating,
    NULL::bigint AS ratings_submitted;


--
-- Name: admin_class_overview_mv; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.admin_class_overview_mv AS
 SELECT assignment_id,
    instructor_id,
    date,
    start_time,
    end_time,
    class_status,
    payment_status,
    final_payment_amount,
    class_type_name,
    class_type_description,
    class_type_difficulty,
    class_type_duration,
    schedule_type,
    timezone,
    attended_count,
    no_show_count,
    absent_count,
    avg_rating,
    ratings_submitted
   FROM public.admin_class_overview_v
  WITH NO DATA;


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: article_moderation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_moderation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid,
    action character varying(20) NOT NULL,
    moderated_by uuid,
    moderated_at timestamp with time zone DEFAULT now(),
    comment text
);


--
-- Name: article_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    fingerprint text NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    preview_text text NOT NULL,
    image_url text,
    video_url text,
    category text DEFAULT 'general'::text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    status text DEFAULT 'draft'::text NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    author_id uuid,
    moderated_at timestamp with time zone,
    moderated_by uuid,
    moderation_status text
);


--
-- Name: assignment_bookings_view_roster; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.assignment_bookings_view_roster AS
 SELECT ab.assignment_id,
    b.booking_id,
    b.user_id,
    ((b.first_name || ' '::text) || b.last_name) AS full_name,
    b.email,
    ca.status,
    ca.notes,
    ca.marked_at
   FROM ((public.assignment_bookings ab
     JOIN public.bookings b ON ((b.booking_id = ab.booking_id)))
     LEFT JOIN public.class_attendance ca ON (((ca.assignment_id = ab.assignment_id) AND (ca.member_id = b.user_id))));


--
-- Name: class_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scheduled_class_id uuid,
    instructor_id uuid NOT NULL,
    assigned_by uuid,
    payment_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status,
    notes text,
    assigned_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    class_type_id uuid,
    date date,
    start_time time without time zone,
    end_time time without time zone,
    schedule_type text DEFAULT 'weekly'::text,
    class_status text DEFAULT 'scheduled'::text,
    payment_date date,
    instructor_status text DEFAULT 'pending'::text,
    instructor_response_at timestamp with time zone,
    instructor_remarks text,
    rejection_reason text,
    payment_type character varying(50) DEFAULT 'per_class'::character varying,
    package_id uuid,
    timezone text DEFAULT 'Asia/Kolkata'::text,
    created_in_timezone text DEFAULT 'Asia/Kolkata'::text,
    assignment_method text DEFAULT 'manual'::text,
    recurrence_days integer[],
    parent_assignment_id uuid,
    booking_type text DEFAULT 'individual'::text,
    override_payment_amount numeric(10,2),
    attendance_locked boolean DEFAULT false NOT NULL,
    actual_start_time timestamp with time zone,
    actual_end_time timestamp with time zone,
    rescheduled_to_id uuid,
    rescheduled_from_id uuid,
    class_package_id uuid,
    CONSTRAINT check_booking_type CHECK ((booking_type = ANY (ARRAY['individual'::text, 'corporate'::text, 'private_group'::text, 'public_group'::text]))),
    CONSTRAINT chk_class_assignments_schedule_or_package CHECK ((((scheduled_class_id IS NOT NULL) AND (class_package_id IS NULL)) OR ((scheduled_class_id IS NULL) AND (class_package_id IS NOT NULL)))),
    CONSTRAINT chk_class_assignments_type_or_package CHECK ((((class_type_id IS NOT NULL) AND (package_id IS NULL)) OR ((class_type_id IS NULL) AND (package_id IS NOT NULL)))),
    CONSTRAINT class_assignments_assignment_method_check CHECK ((assignment_method = ANY (ARRAY['manual'::text, 'weekly_recurrence'::text, 'auto_distribute'::text]))),
    CONSTRAINT class_assignments_class_status_check CHECK ((class_status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'not_conducted'::text]))),
    CONSTRAINT class_assignments_instructor_status_check CHECK ((instructor_status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'rescheduled'::text]))),
    CONSTRAINT class_assignments_schedule_type_check CHECK ((schedule_type = ANY (ARRAY['adhoc'::text, 'weekly'::text, 'monthly'::text, 'crash'::text])))
);


--
-- Name: COLUMN class_assignments.schedule_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_assignments.schedule_type IS 'Type of class schedule: adhoc (one-time), weekly (recurring weekly), monthly (recurring monthly), package (part of a package)';


--
-- Name: COLUMN class_assignments.timezone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_assignments.timezone IS 'Timezone in which the class was scheduled (e.g., Asia/Kolkata)';


--
-- Name: COLUMN class_assignments.created_in_timezone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_assignments.created_in_timezone IS 'Timezone of the user who created this assignment';


--
-- Name: COLUMN class_assignments.assignment_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_assignments.assignment_method IS 'How this assignment was created: manual, weekly_recurrence, or auto_distribute';


--
-- Name: COLUMN class_assignments.recurrence_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_assignments.recurrence_days IS 'Array of weekdays (0=Sunday, 6=Saturday) for recurring assignments';


--
-- Name: COLUMN class_assignments.parent_assignment_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_assignments.parent_assignment_id IS 'References parent assignment for bulk operations';


--
-- Name: class_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    class_count integer NOT NULL,
    price numeric(10,2) NOT NULL,
    validity_days integer DEFAULT 90,
    class_type_restrictions uuid[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type text,
    duration text,
    course_type text,
    is_archived boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    CONSTRAINT class_packages_course_type_check CHECK ((course_type = ANY (ARRAY['regular'::text, 'crash'::text]))),
    CONSTRAINT class_packages_duration_check CHECK ((duration ~ '^[0-9]+ (week|month|day)s?$'::text))
);


--
-- Name: class_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    difficulty_level text DEFAULT 'beginner'::text,
    price numeric(10,2) DEFAULT 0.00,
    duration_minutes integer DEFAULT 60,
    max_participants integer DEFAULT 20,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_archived boolean DEFAULT false,
    archived_at timestamp with time zone,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    updated_by uuid DEFAULT auth.uid() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    phone text,
    bio text,
    role text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    specialties text[],
    experience_years integer DEFAULT 0,
    certification text,
    avatar_url text,
    is_active boolean DEFAULT true,
    badges jsonb,
    address text,
    location text,
    certifications text[],
    languages text[] DEFAULT ARRAY['English'::text],
    teaching_philosophy text,
    achievements text[],
    social_media jsonb DEFAULT '{}'::jsonb,
    hourly_rate numeric(10,2),
    years_of_experience integer,
    education text[],
    website_url text,
    instagram_handle text,
    facebook_profile text,
    linkedin_profile text,
    youtube_channel text,
    availability_schedule jsonb DEFAULT '{}'::jsonb,
    preferred_contact_method text DEFAULT 'email'::text,
    emergency_contact jsonb DEFAULT '{}'::jsonb,
    date_of_birth date,
    gender text,
    nationality text,
    time_zone text DEFAULT 'UTC'::text,
    profile_visibility text DEFAULT 'public'::text,
    profile_completed boolean DEFAULT false,
    last_active timestamp with time zone DEFAULT now(),
    verification_status text DEFAULT 'pending'::text
);


--
-- Name: assignments_with_timezone; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.assignments_with_timezone AS
 SELECT ca.id,
    ca.scheduled_class_id,
    ca.instructor_id,
    ca.assigned_by,
    ca.payment_amount,
    ca.payment_status,
    ca.notes,
    ca.assigned_at,
    ca.created_at,
    ca.updated_at,
    ca.class_type_id,
    ca.date,
    ca.start_time,
    ca.end_time,
    ca.schedule_type,
    ca.class_status,
    ca.payment_date,
    ca.instructor_status,
    ca.instructor_response_at,
    ca.instructor_remarks,
    ca.rejection_reason,
    ca.payment_type,
    ca.package_id,
    ca.timezone,
    ca.created_in_timezone,
    ca.assignment_method,
    ca.recurrence_days,
    ca.parent_assignment_id,
    ((ca.date + ca.start_time) AT TIME ZONE ca.timezone) AS start_datetime_utc,
    ((ca.date + ca.end_time) AT TIME ZONE ca.timezone) AS end_datetime_utc,
    ct.name AS class_type_name,
    cp.name AS package_name,
    cp.class_count AS package_class_count,
    p.full_name AS instructor_name
   FROM (((public.class_assignments ca
     LEFT JOIN public.class_types ct ON ((ca.class_type_id = ct.id)))
     LEFT JOIN public.class_packages cp ON ((ca.package_id = cp.id)))
     LEFT JOIN public.profiles p ON ((ca.instructor_id = p.user_id)));


--
-- Name: VIEW assignments_with_timezone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.assignments_with_timezone IS 'View showing assignments with timezone-converted datetime fields';


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon_url text,
    description text
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    author_id uuid,
    author_name text DEFAULT 'Admin'::text NOT NULL,
    category text DEFAULT 'Practice'::text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    image_url text,
    featured boolean DEFAULT false,
    status public.post_status DEFAULT 'draft'::public.post_status,
    read_time text,
    meta_description text,
    meta_keywords text[],
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: business_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: class_assignment_financials; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.class_assignment_financials AS
 SELECT id,
    instructor_id,
    date,
    start_time,
    end_time,
    schedule_type,
    class_status,
    payment_status,
    payment_amount,
    override_payment_amount,
    COALESCE(override_payment_amount, payment_amount) AS final_payment_amount
   FROM public.class_assignments ca;


--
-- Name: class_assignment_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_assignment_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    package_id uuid,
    class_type_id uuid,
    instructor_id uuid NOT NULL,
    weekdays integer[] NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    payment_amount numeric DEFAULT 0,
    payment_type text DEFAULT 'per_class'::text,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


--
-- Name: TABLE class_assignment_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.class_assignment_templates IS 'Templates for weekly recurring assignment patterns';


--
-- Name: class_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    scheduled_class_id uuid,
    profile_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    emergency_contact text,
    emergency_phone text,
    special_requests text DEFAULT ''::text,
    payment_status text DEFAULT 'pending'::text,
    booking_status text DEFAULT 'confirmed'::text,
    booking_date timestamp with time zone DEFAULT now(),
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT class_bookings_booking_status_check CHECK ((booking_status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'attended'::text, 'no_show'::text]))),
    CONSTRAINT class_bookings_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text, 'failed'::text])))
);


--
-- Name: class_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    user_id uuid,
    scheduled_class_id uuid NOT NULL,
    instructor_rating integer,
    class_rating integer,
    difficulty_rating integer,
    would_recommend boolean,
    feedback_text text,
    suggestions text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT class_feedback_class_rating_check CHECK (((class_rating >= 1) AND (class_rating <= 5))),
    CONSTRAINT class_feedback_difficulty_rating_check CHECK (((difficulty_rating >= 1) AND (difficulty_rating <= 5))),
    CONSTRAINT class_feedback_instructor_rating_check CHECK (((instructor_rating >= 1) AND (instructor_rating <= 5)))
);


--
-- Name: class_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    member_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT class_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: class_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_type_id uuid,
    instructor_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    max_participants integer DEFAULT 20,
    is_active boolean DEFAULT true,
    effective_from date DEFAULT CURRENT_DATE,
    effective_until date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_recurring boolean DEFAULT true,
    schedule_type text DEFAULT 'weekly'::text,
    location text,
    payment_amount numeric(10,2),
    payment_type character varying(50) DEFAULT 'per_class'::character varying,
    class_status character varying(20) DEFAULT 'active'::character varying,
    created_by uuid,
    start_date date,
    end_date date,
    end_time time without time zone,
    notes text,
    CONSTRAINT class_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT class_schedules_schedule_type_check CHECK ((schedule_type = ANY (ARRAY['weekly'::text, 'adhoc'::text]))),
    CONSTRAINT class_schedules_status_check CHECK (((class_status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('cancelled'::character varying)::text, ('completed'::character varying)::text])))
);


--
-- Name: COLUMN class_schedules.instructor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.class_schedules.instructor_id IS 'Instructor assigned to this schedule template. NULL if no instructor assigned yet.';


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT ''::text,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


--
-- Name: form_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public.submission_type NOT NULL,
    data jsonb NOT NULL,
    user_email text,
    user_name text,
    user_phone text,
    status text DEFAULT 'new'::text,
    notes text,
    processed_by uuid,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: instructor_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instructor_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_until date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT instructor_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: instructor_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_type_id uuid,
    schedule_type text NOT NULL,
    rate_amount numeric NOT NULL,
    effective_from date DEFAULT CURRENT_DATE,
    effective_until date,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category text,
    rate_amount_usd numeric(10,2),
    package_id uuid,
    CONSTRAINT rates_type_or_package_check CHECK ((((class_type_id IS NOT NULL) AND (package_id IS NULL)) OR ((class_type_id IS NULL) AND (package_id IS NOT NULL)) OR ((class_type_id IS NULL) AND (package_id IS NULL))))
);


--
-- Name: instructor_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructor_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instructor_id uuid,
    student_id uuid,
    booking_id uuid,
    rating integer,
    review text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT instructor_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: instructor_upcoming_classes_v; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.instructor_upcoming_classes_v AS
SELECT
    NULL::uuid AS assignment_id,
    NULL::uuid AS instructor_id,
    NULL::date AS date,
    NULL::time without time zone AS start_time,
    NULL::time without time zone AS end_time,
    NULL::text AS schedule_type,
    NULL::text AS class_status,
    NULL::public.payment_status AS payment_status,
    NULL::numeric(10,2) AS payment_amount,
    NULL::numeric(10,2) AS override_payment_amount,
    NULL::numeric(10,2) AS final_payment_amount,
    NULL::text AS timezone,
    NULL::boolean AS attendance_locked,
    NULL::bigint AS present_count,
    NULL::bigint AS no_show_count,
    NULL::numeric AS avg_rating,
    NULL::bigint AS rating_count;


--
-- Name: manual_class_selections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manual_class_selections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_batch_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    package_id uuid,
    class_type_id uuid,
    instructor_id uuid NOT NULL,
    payment_amount numeric DEFAULT 0,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE manual_class_selections; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.manual_class_selections IS 'Individual manual selections for calendar-based assignment creation';


--
-- Name: newsletter_send_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_send_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    newsletter_id uuid NOT NULL,
    total_recipients integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    errors jsonb DEFAULT '[]'::jsonb NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    subscribed_at timestamp with time zone DEFAULT now(),
    unsubscribed_at timestamp with time zone,
    status text DEFAULT 'active'::text
);


--
-- Name: newsletter_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text NOT NULL,
    subscribed boolean DEFAULT true,
    subscribed_at timestamp with time zone DEFAULT now(),
    unsubscribed_at timestamp with time zone
);


--
-- Name: newsletters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    subject text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    sent_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    customizations jsonb DEFAULT '{}'::jsonb NOT NULL,
    template text,
    template_type text,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    error_message text,
    CONSTRAINT newsletters_template_type_check CHECK ((template_type = ANY (ARRAY['html'::text, 'markdown'::text, 'plain_text'::text])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['article_approved'::text, 'article_rejected'::text, 'class_booked'::text, 'class_cancelled'::text, 'class_reminder'::text, 'system'::text])))
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_payment_method_id text NOT NULL,
    type text NOT NULL,
    last_four text,
    brand text,
    exp_month integer,
    exp_year integer,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    rating integer NOT NULL,
    fingerprint text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referee_email text NOT NULL,
    referee_id uuid,
    referral_code text NOT NULL,
    status text DEFAULT 'pending'::text,
    reward_amount numeric(10,2),
    reward_granted boolean DEFAULT false,
    expires_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT referrals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'expired'::text])))
);


--
-- Name: role_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_modules (
    id bigint NOT NULL,
    role text NOT NULL,
    module_id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL
);


--
-- Name: role_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.role_modules ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.role_modules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: scheduled_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_type_id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    max_participants integer NOT NULL,
    current_participants integer DEFAULT 0,
    status text DEFAULT 'scheduled'::text,
    meeting_link text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scheduled_classes_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    billing_interval text DEFAULT 'monthly'::text,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_name text NOT NULL,
    metric_value numeric(15,2) NOT NULL,
    metric_type text NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    subscription_id uuid,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text,
    status text DEFAULT 'pending'::text,
    payment_method text,
    stripe_payment_intent_id text,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    billing_plan_type text DEFAULT 'one_time'::text,
    billing_period_month date,
    category text,
    CONSTRAINT transactions_billing_plan_type_check CHECK ((billing_plan_type = ANY (ARRAY['one_time'::text, 'monthly'::text, 'crash_course'::text]))),
    CONSTRAINT transactions_category_check CHECK (((category IS NULL) OR (category = ANY (ARRAY['class_booking'::text, 'subscription'::text, 'instructor_payment'::text, 'maintenance'::text, 'other'::text])))),
    CONSTRAINT transactions_payment_method_check CHECK (((payment_method IS NULL) OR (payment_method = ANY (ARRAY['upi'::text, 'neft'::text, 'net_banking'::text, 'credit_card'::text, 'debit_card'::text, 'cheque'::text, 'demand_draft'::text, 'cash'::text, 'bank_transfer'::text, 'manual'::text]))))
);


--
-- Name: transactions_with_user; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.transactions_with_user AS
 SELECT t.id,
    t.user_id,
    t.subscription_id,
    t.amount,
    t.currency,
    t.status,
    t.payment_method,
    t.stripe_payment_intent_id,
    t.description,
    t.created_at,
    t.updated_at,
    t.billing_plan_type,
    t.billing_period_month,
    t.category,
    u.email AS user_email,
    COALESCE((u.raw_user_meta_data ->> 'full_name'::text), split_part((u.email)::text, '@'::text, 1)) AS user_full_name
   FROM (public.transactions t
     LEFT JOIN auth.users u ON ((u.id = t.user_id)));


--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    activity_type text NOT NULL,
    entity_type text,
    entity_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_engagement_metrics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_engagement_metrics AS
 SELECT p.user_id,
    p.email,
    p.full_name,
    count(b.id) AS total_bookings,
    (0)::bigint AS attended_classes,
    (0)::bigint AS articles_viewed,
    GREATEST(p.created_at, p.updated_at) AS last_activity,
        CASE
            WHEN (p.updated_at >= (CURRENT_DATE - '7 days'::interval)) THEN 'active'::text
            WHEN (p.updated_at >= (CURRENT_DATE - '30 days'::interval)) THEN 'inactive'::text
            ELSE 'dormant'::text
        END AS engagement_status
   FROM (public.profiles p
     LEFT JOIN public.bookings b ON ((p.user_id = b.user_id)))
  GROUP BY p.user_id, p.email, p.full_name, p.created_at, p.updated_at;


--
-- Name: user_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    package_id uuid NOT NULL,
    classes_remaining integer NOT NULL,
    purchased_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    reminder_time_minutes integer DEFAULT 60,
    preferred_class_types uuid[] DEFAULT '{}'::uuid[],
    preferred_instructors uuid[] DEFAULT '{}'::uuid[],
    preferred_times jsonb DEFAULT '{}'::jsonb,
    timezone text DEFAULT 'UTC'::text,
    language text DEFAULT 'en'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    plan_id uuid,
    status text DEFAULT 'active'::text,
    started_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    scheduled_class_id uuid NOT NULL,
    "position" integer NOT NULL,
    email text NOT NULL,
    phone text,
    notification_sent boolean DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: yoga_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yoga_queries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    message text NOT NULL,
    experience_level text DEFAULT 'beginner'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    response text DEFAULT ''::text,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2025_08_16; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_16 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_17; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_17 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_18; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_18 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_19; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_19 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_20; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_20 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_21; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_21 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_08_22; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_08_22 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.hooks (
    id bigint NOT NULL,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);


--
-- Name: TABLE hooks; Type: COMMENT; Schema: supabase_functions; Owner: -
--

COMMENT ON TABLE supabase_functions.hooks IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: -
--

CREATE SEQUENCE supabase_functions.hooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: -
--

ALTER SEQUENCE supabase_functions.hooks_id_seq OWNED BY supabase_functions.hooks.id;


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.migrations (
    version text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: messages_2025_08_16; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_16 FOR VALUES FROM ('2025-08-16 00:00:00') TO ('2025-08-17 00:00:00');


--
-- Name: messages_2025_08_17; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_17 FOR VALUES FROM ('2025-08-17 00:00:00') TO ('2025-08-18 00:00:00');


--
-- Name: messages_2025_08_18; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_18 FOR VALUES FROM ('2025-08-18 00:00:00') TO ('2025-08-19 00:00:00');


--
-- Name: messages_2025_08_19; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_19 FOR VALUES FROM ('2025-08-19 00:00:00') TO ('2025-08-20 00:00:00');


--
-- Name: messages_2025_08_20; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_20 FOR VALUES FROM ('2025-08-20 00:00:00') TO ('2025-08-21 00:00:00');


--
-- Name: messages_2025_08_21; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_21 FOR VALUES FROM ('2025-08-21 00:00:00') TO ('2025-08-22 00:00:00');


--
-- Name: messages_2025_08_22; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_08_22 FOR VALUES FROM ('2025-08-22 00:00:00') TO ('2025-08-23 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks ALTER COLUMN id SET DEFAULT nextval('supabase_functions.hooks_id_seq'::regclass);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: article_moderation_logs article_moderation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_moderation_logs
    ADD CONSTRAINT article_moderation_logs_pkey PRIMARY KEY (id);


--
-- Name: article_views article_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_views
    ADD CONSTRAINT article_views_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: assignment_bookings assignment_bookings_assignment_id_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_bookings
    ADD CONSTRAINT assignment_bookings_assignment_id_booking_id_key UNIQUE (assignment_id, booking_id);


--
-- Name: assignment_bookings assignment_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_bookings
    ADD CONSTRAINT assignment_bookings_pkey PRIMARY KEY (id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: bookings bookings_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_id_key UNIQUE (booking_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: business_settings business_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_settings
    ADD CONSTRAINT business_settings_key_key UNIQUE (key);


--
-- Name: business_settings business_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_settings
    ADD CONSTRAINT business_settings_pkey PRIMARY KEY (id);


--
-- Name: class_assignment_templates class_assignment_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignment_templates
    ADD CONSTRAINT class_assignment_templates_pkey PRIMARY KEY (id);


--
-- Name: class_assignments class_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_pkey PRIMARY KEY (id);


--
-- Name: class_attendance class_attendance_assignment_id_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_assignment_id_member_id_key UNIQUE (assignment_id, member_id);


--
-- Name: class_attendance class_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_pkey PRIMARY KEY (id);


--
-- Name: class_bookings class_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_bookings
    ADD CONSTRAINT class_bookings_pkey PRIMARY KEY (id);


--
-- Name: class_feedback class_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_feedback
    ADD CONSTRAINT class_feedback_pkey PRIMARY KEY (id);


--
-- Name: class_packages class_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_packages
    ADD CONSTRAINT class_packages_pkey PRIMARY KEY (id);


--
-- Name: class_ratings class_ratings_assignment_id_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_ratings
    ADD CONSTRAINT class_ratings_assignment_id_member_id_key UNIQUE (assignment_id, member_id);


--
-- Name: class_ratings class_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_ratings
    ADD CONSTRAINT class_ratings_pkey PRIMARY KEY (id);


--
-- Name: class_schedules class_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT class_schedules_pkey PRIMARY KEY (id);


--
-- Name: class_types class_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_types
    ADD CONSTRAINT class_types_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: form_submissions form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submissions
    ADD CONSTRAINT form_submissions_pkey PRIMARY KEY (id);


--
-- Name: instructor_availability instructor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT instructor_availability_pkey PRIMARY KEY (id);


--
-- Name: instructor_rates instructor_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_rates
    ADD CONSTRAINT instructor_rates_pkey PRIMARY KEY (id);


--
-- Name: instructor_rates instructor_rates_unique_per_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_rates
    ADD CONSTRAINT instructor_rates_unique_per_type UNIQUE (class_type_id, package_id, category, schedule_type);


--
-- Name: instructor_ratings instructor_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_ratings
    ADD CONSTRAINT instructor_ratings_pkey PRIMARY KEY (id);


--
-- Name: manual_class_selections manual_class_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_class_selections
    ADD CONSTRAINT manual_class_selections_pkey PRIMARY KEY (id);


--
-- Name: newsletter_send_logs newsletter_send_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_send_logs
    ADD CONSTRAINT newsletter_send_logs_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscriptions newsletter_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscriptions
    ADD CONSTRAINT newsletter_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscriptions newsletter_subscriptions_user_id_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscriptions
    ADD CONSTRAINT newsletter_subscriptions_user_id_email_key UNIQUE (user_id, email);


--
-- Name: newsletters newsletters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletters
    ADD CONSTRAINT newsletters_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_unique UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: ratings ratings_article_id_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_article_id_fingerprint_key UNIQUE (article_id, fingerprint);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referral_code_key UNIQUE (referral_code);


--
-- Name: role_modules role_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT role_modules_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: scheduled_classes scheduled_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_classes
    ADD CONSTRAINT scheduled_classes_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: system_metrics system_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_metrics
    ADD CONSTRAINT system_metrics_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: user_packages user_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_packages
    ADD CONSTRAINT user_packages_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: waitlist waitlist_user_id_scheduled_class_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_user_id_scheduled_class_id_key UNIQUE (user_id, scheduled_class_id);


--
-- Name: yoga_queries yoga_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yoga_queries
    ADD CONSTRAINT yoga_queries_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_16 messages_2025_08_16_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_16
    ADD CONSTRAINT messages_2025_08_16_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_17 messages_2025_08_17_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_17
    ADD CONSTRAINT messages_2025_08_17_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_18 messages_2025_08_18_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_18
    ADD CONSTRAINT messages_2025_08_18_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_19 messages_2025_08_19_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_19
    ADD CONSTRAINT messages_2025_08_19_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_20 messages_2025_08_20_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_20
    ADD CONSTRAINT messages_2025_08_20_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_21 messages_2025_08_21_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_21
    ADD CONSTRAINT messages_2025_08_21_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_08_22 messages_2025_08_22_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_08_22
    ADD CONSTRAINT messages_2025_08_22_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks
    ADD CONSTRAINT hooks_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: admin_users_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_users_id_idx ON public.admin_users USING btree (id);


--
-- Name: article_views_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_views_article_id_idx ON public.article_views USING btree (article_id);


--
-- Name: article_views_fingerprint_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_views_fingerprint_idx ON public.article_views USING btree (fingerprint);


--
-- Name: articles_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_category_idx ON public.articles USING btree (category);


--
-- Name: articles_published_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_published_at_idx ON public.articles USING btree (published_at);


--
-- Name: articles_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_status_idx ON public.articles USING btree (status);


--
-- Name: class_assignments_assigned_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_assignments_assigned_at_idx ON public.class_assignments USING btree (assigned_at);


--
-- Name: class_assignments_instructor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_assignments_instructor_id_idx ON public.class_assignments USING btree (instructor_id);


--
-- Name: class_assignments_payment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_assignments_payment_status_idx ON public.class_assignments USING btree (payment_status);


--
-- Name: class_assignments_scheduled_class_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_assignments_scheduled_class_id_idx ON public.class_assignments USING btree (scheduled_class_id);


--
-- Name: class_bookings_booking_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_bookings_booking_status_idx ON public.class_bookings USING btree (booking_status);


--
-- Name: class_bookings_payment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_bookings_payment_status_idx ON public.class_bookings USING btree (payment_status);


--
-- Name: class_bookings_scheduled_class_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_bookings_scheduled_class_id_idx ON public.class_bookings USING btree (scheduled_class_id);


--
-- Name: class_bookings_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_bookings_user_id_idx ON public.class_bookings USING btree (user_id);


--
-- Name: class_feedback_instructor_rating_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_feedback_instructor_rating_idx ON public.class_feedback USING btree (instructor_rating);


--
-- Name: class_feedback_scheduled_class_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX class_feedback_scheduled_class_id_idx ON public.class_feedback USING btree (scheduled_class_id);


--
-- Name: idx_article_moderation_logs_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_moderation_logs_article_id ON public.article_moderation_logs USING btree (article_id, moderated_at DESC);


--
-- Name: idx_article_moderation_logs_moderated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_moderation_logs_moderated_by ON public.article_moderation_logs USING btree (moderated_by);


--
-- Name: idx_articles_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_author_id ON public.articles USING btree (author_id);


--
-- Name: idx_articles_status_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_articles_status_created_at ON public.articles USING btree (status, created_at DESC);


--
-- Name: idx_assignment_bookings_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_bookings_assignment_id ON public.assignment_bookings USING btree (assignment_id);


--
-- Name: idx_assignment_bookings_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignment_bookings_booking_id ON public.assignment_bookings USING btree (booking_id);


--
-- Name: idx_bookings_booking_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_booking_id ON public.bookings USING btree (booking_id);


--
-- Name: idx_bookings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_created_at ON public.bookings USING btree (created_at);


--
-- Name: idx_bookings_email_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_email_status ON public.bookings USING btree (email, status);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_id_status ON public.bookings USING btree (user_id, status);


--
-- Name: idx_class_assignments_assignment_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_assignments_assignment_method ON public.class_assignments USING btree (assignment_method);


--
-- Name: idx_class_assignments_instructor_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_assignments_instructor_date ON public.class_assignments USING btree (instructor_id, date);


--
-- Name: idx_class_assignments_package_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_assignments_package_id ON public.class_assignments USING btree (package_id);


--
-- Name: idx_class_assignments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_assignments_parent_id ON public.class_assignments USING btree (parent_assignment_id);


--
-- Name: idx_class_assignments_recurrence_days; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_assignments_recurrence_days ON public.class_assignments USING gin (recurrence_days);


--
-- Name: idx_class_assignments_reschedule_chain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_assignments_reschedule_chain ON public.class_assignments USING btree (rescheduled_from_id, rescheduled_to_id);


--
-- Name: idx_class_assignments_timezone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_assignments_timezone ON public.class_assignments USING btree (timezone);


--
-- Name: idx_class_attendance_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_attendance_assignment ON public.class_attendance USING btree (assignment_id);


--
-- Name: idx_class_attendance_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_attendance_member ON public.class_attendance USING btree (member_id);


--
-- Name: idx_class_attendance_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_attendance_status ON public.class_attendance USING btree (status);


--
-- Name: idx_class_ratings_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_ratings_assignment ON public.class_ratings USING btree (assignment_id);


--
-- Name: idx_class_ratings_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_ratings_member ON public.class_ratings USING btree (member_id);


--
-- Name: idx_class_ratings_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_ratings_rating ON public.class_ratings USING btree (rating);


--
-- Name: idx_class_schedules_unassigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_schedules_unassigned ON public.class_schedules USING btree (id) WHERE (instructor_id IS NULL);


--
-- Name: idx_class_types_active_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_types_active_archived ON public.class_types USING btree (is_active, is_archived);


--
-- Name: idx_class_types_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_types_archived ON public.class_types USING btree (is_archived);


--
-- Name: idx_contact_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_messages_user_id ON public.contact_messages USING btree (user_id);


--
-- Name: idx_manual_selections_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_selections_batch_id ON public.manual_class_selections USING btree (assignment_batch_id);


--
-- Name: idx_manual_selections_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_selections_date ON public.manual_class_selections USING btree (date);


--
-- Name: idx_manual_selections_instructor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_manual_selections_instructor_id ON public.manual_class_selections USING btree (instructor_id);


--
-- Name: idx_newsletter_send_logs_nid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_send_logs_nid ON public.newsletter_send_logs USING btree (newsletter_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_roles_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_name ON public.roles USING btree (name);


--
-- Name: idx_templates_instructor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_instructor_id ON public.class_assignment_templates USING btree (instructor_id);


--
-- Name: idx_templates_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_is_active ON public.class_assignment_templates USING btree (is_active);


--
-- Name: idx_templates_weekdays; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_weekdays ON public.class_assignment_templates USING gin (weekdays);


--
-- Name: idx_user_roles_assigned_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_assigned_by ON public.user_roles USING btree (assigned_by);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: instructor_availability_instructor_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX instructor_availability_instructor_day_idx ON public.instructor_availability USING btree (instructor_id, day_of_week);


--
-- Name: newsletter_subscriptions_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX newsletter_subscriptions_email_idx ON public.newsletter_subscriptions USING btree (email);


--
-- Name: newsletter_subscriptions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX newsletter_subscriptions_user_id_idx ON public.newsletter_subscriptions USING btree (user_id);


--
-- Name: payment_methods_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_methods_user_id_idx ON public.payment_methods USING btree (user_id);


--
-- Name: ratings_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ratings_article_id_idx ON public.ratings USING btree (article_id);


--
-- Name: ratings_fingerprint_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ratings_fingerprint_idx ON public.ratings USING btree (fingerprint);


--
-- Name: referrals_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_code_idx ON public.referrals USING btree (referral_code);


--
-- Name: referrals_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referrals_status_idx ON public.referrals USING btree (status);


--
-- Name: scheduled_classes_instructor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scheduled_classes_instructor_id_idx ON public.scheduled_classes USING btree (instructor_id);


--
-- Name: scheduled_classes_start_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scheduled_classes_start_time_idx ON public.scheduled_classes USING btree (start_time);


--
-- Name: scheduled_classes_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scheduled_classes_status_idx ON public.scheduled_classes USING btree (status);


--
-- Name: system_metrics_metric_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_metrics_metric_name_idx ON public.system_metrics USING btree (metric_name);


--
-- Name: system_metrics_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX system_metrics_period_idx ON public.system_metrics USING btree (period_start, period_end);


--
-- Name: user_activity_activity_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_activity_activity_type_idx ON public.user_activity USING btree (activity_type);


--
-- Name: user_activity_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_activity_created_at_idx ON public.user_activity USING btree (created_at);


--
-- Name: user_activity_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_activity_user_id_idx ON public.user_activity USING btree (user_id);


--
-- Name: user_packages_user_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_packages_user_active_idx ON public.user_packages USING btree (user_id, is_active);


--
-- Name: user_preferences_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_preferences_user_id_idx ON public.user_preferences USING btree (user_id);


--
-- Name: user_roles_role_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_role_id_idx ON public.user_roles USING btree (role_id);


--
-- Name: user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_user_id_idx ON public.user_roles USING btree (user_id);


--
-- Name: user_roles_user_id_role_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_roles_user_id_role_id_idx ON public.user_roles USING btree (user_id, role_id);


--
-- Name: waitlist_class_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX waitlist_class_position_idx ON public.waitlist USING btree (scheduled_class_id, "position");


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name);


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id);


--
-- Name: messages_2025_08_16_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_16_pkey;


--
-- Name: messages_2025_08_17_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_17_pkey;


--
-- Name: messages_2025_08_18_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_18_pkey;


--
-- Name: messages_2025_08_19_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_19_pkey;


--
-- Name: messages_2025_08_20_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_20_pkey;


--
-- Name: messages_2025_08_21_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_21_pkey;


--
-- Name: messages_2025_08_22_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_08_22_pkey;


--
-- Name: admin_class_overview_v _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.admin_class_overview_v AS
 SELECT ca.id AS assignment_id,
    ca.instructor_id,
    ca.date,
    ca.start_time,
    ca.end_time,
    ca.class_status,
    ca.payment_status,
    COALESCE(ca.override_payment_amount, ca.payment_amount) AS final_payment_amount,
    ct.name AS class_type_name,
    ct.description AS class_type_description,
    ct.difficulty_level AS class_type_difficulty,
    ct.duration_minutes AS class_type_duration,
    ca.schedule_type,
    ca.timezone,
    count(att.id) FILTER (WHERE (att.status = ANY (ARRAY['present'::public.attendance_status_enum, 'late'::public.attendance_status_enum, 'makeup_completed'::public.attendance_status_enum]))) AS attended_count,
    count(att.id) FILTER (WHERE (att.status = 'no_show'::public.attendance_status_enum)) AS no_show_count,
    count(att.id) FILTER (WHERE (att.status = ANY (ARRAY['absent_excused'::public.attendance_status_enum, 'absent_unexcused'::public.attendance_status_enum]))) AS absent_count,
    avg(cr.rating) AS avg_rating,
    count(cr.id) AS ratings_submitted
   FROM (((public.class_assignments ca
     LEFT JOIN public.class_types ct ON ((ca.class_type_id = ct.id)))
     LEFT JOIN public.class_attendance att ON ((att.assignment_id = ca.id)))
     LEFT JOIN public.class_ratings cr ON ((cr.assignment_id = ca.id)))
  GROUP BY ca.id, ct.name, ct.description, ct.difficulty_level, ct.duration_minutes;


--
-- Name: instructor_upcoming_classes_v _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.instructor_upcoming_classes_v AS
 SELECT ca.id AS assignment_id,
    ca.instructor_id,
    ca.date,
    ca.start_time,
    ca.end_time,
    ca.schedule_type,
    ca.class_status,
    ca.payment_status,
    ca.payment_amount,
    ca.override_payment_amount,
    COALESCE(ca.override_payment_amount, ca.payment_amount) AS final_payment_amount,
    ca.timezone,
    ca.attendance_locked,
    COALESCE(sum(((att.status = ANY (ARRAY['present'::public.attendance_status_enum, 'late'::public.attendance_status_enum, 'makeup_completed'::public.attendance_status_enum])))::integer), (0)::bigint) AS present_count,
    COALESCE(sum(((att.status = 'no_show'::public.attendance_status_enum))::integer), (0)::bigint) AS no_show_count,
    COALESCE(avg(NULLIF(cr.rating, 0)), (0)::numeric) AS avg_rating,
    count(cr.id) AS rating_count
   FROM ((public.class_assignments ca
     LEFT JOIN public.class_attendance att ON ((att.assignment_id = ca.id)))
     LEFT JOIN public.class_ratings cr ON ((cr.assignment_id = ca.id)))
  WHERE ((ca.date >= CURRENT_DATE) AND (ca.date <= (CURRENT_DATE + '60 days'::interval)))
  GROUP BY ca.id;


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


--
-- Name: bookings booking_id_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER booking_id_trigger BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_id();


--
-- Name: articles ensure_article_author_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ensure_article_author_trigger BEFORE INSERT ON public.articles FOR EACH ROW EXECUTE FUNCTION public.set_article_author();


--
-- Name: class_bookings promote_from_waitlist_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER promote_from_waitlist_trigger AFTER UPDATE ON public.class_bookings FOR EACH ROW EXECUTE FUNCTION public.promote_from_waitlist();


--
-- Name: contact_messages set_user_id_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_user_id_trigger BEFORE INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_contact_message_user_id();


--
-- Name: user_roles sync_admin_users_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_admin_users_trigger AFTER INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.sync_admin_users();


--
-- Name: user_roles trg_add_to_admin_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_add_to_admin_users AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.add_to_admin_users_on_admin_role();


--
-- Name: class_attendance trg_class_attendance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_class_attendance_updated_at BEFORE UPDATE ON public.class_attendance FOR EACH ROW EXECUTE FUNCTION public.set_class_attendance_updated_at();


--
-- Name: class_ratings trg_class_ratings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_class_ratings_updated_at BEFORE UPDATE ON public.class_ratings FOR EACH ROW EXECUTE FUNCTION public.set_class_ratings_updated_at();


--
-- Name: user_roles trg_sync_admin_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_admin_users AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.sync_admin_users();


--
-- Name: admin_users update_admin_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: article_views update_article_view_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_article_view_count_trigger AFTER INSERT ON public.article_views FOR EACH ROW EXECUTE FUNCTION public.update_article_view_count();


--
-- Name: articles update_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings update_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: class_assignments update_class_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_assignments_updated_at BEFORE UPDATE ON public.class_assignments FOR EACH ROW EXECUTE FUNCTION public.update_class_assignments_updated_at();


--
-- Name: class_bookings update_class_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_bookings_updated_at BEFORE UPDATE ON public.class_bookings FOR EACH ROW EXECUTE FUNCTION public.update_class_bookings_updated_at();


--
-- Name: class_packages update_class_packages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_packages_updated_at BEFORE UPDATE ON public.class_packages FOR EACH ROW EXECUTE FUNCTION public.update_class_packages_updated_at();


--
-- Name: class_schedules update_class_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_schedules_updated_at BEFORE UPDATE ON public.class_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: class_types update_class_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_types_updated_at BEFORE UPDATE ON public.class_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instructor_availability update_instructor_availability_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_instructor_availability_updated_at BEFORE UPDATE ON public.instructor_availability FOR EACH ROW EXECUTE FUNCTION public.update_instructor_availability_updated_at();


--
-- Name: newsletters update_newsletters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON public.newsletters FOR EACH ROW EXECUTE FUNCTION public.update_newsletters_updated_at();


--
-- Name: class_bookings update_participant_count_on_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participant_count_on_delete AFTER DELETE ON public.class_bookings FOR EACH ROW EXECUTE FUNCTION public.update_class_participant_count();


--
-- Name: class_bookings update_participant_count_on_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participant_count_on_insert AFTER INSERT ON public.class_bookings FOR EACH ROW EXECUTE FUNCTION public.update_class_participant_count();


--
-- Name: class_bookings update_participant_count_on_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_participant_count_on_update AFTER UPDATE ON public.class_bookings FOR EACH ROW EXECUTE FUNCTION public.update_class_participant_count();


--
-- Name: roles update_roles_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_roles_modtime BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_roles_updated_at();


--
-- Name: scheduled_classes update_scheduled_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_classes_updated_at BEFORE UPDATE ON public.scheduled_classes FOR EACH ROW EXECUTE FUNCTION public.update_scheduled_classes_updated_at();


--
-- Name: subscription_plans update_subscription_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_packages update_user_packages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_packages_updated_at BEFORE UPDATE ON public.user_packages FOR EACH ROW EXECUTE FUNCTION public.update_user_packages_updated_at();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_user_preferences_updated_at();


--
-- Name: user_subscriptions update_user_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: article_moderation_logs article_moderation_logs_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_moderation_logs
    ADD CONSTRAINT article_moderation_logs_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: article_moderation_logs article_moderation_logs_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_moderation_logs
    ADD CONSTRAINT article_moderation_logs_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.profiles(user_id);


--
-- Name: article_views article_views_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_views
    ADD CONSTRAINT article_views_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(user_id);


--
-- Name: articles articles_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES auth.users(id);


--
-- Name: assignment_bookings assignment_bookings_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_bookings
    ADD CONSTRAINT assignment_bookings_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.class_assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_bookings assignment_bookings_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_bookings
    ADD CONSTRAINT assignment_bookings_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- Name: bookings bookings_class_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_class_package_id_fkey FOREIGN KEY (class_package_id) REFERENCES public.class_packages(id);


--
-- Name: bookings bookings_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(user_id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: class_assignments class_assignments_class_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_class_package_id_fkey FOREIGN KEY (class_package_id) REFERENCES public.class_packages(id);


--
-- Name: class_assignments class_assignments_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id);


--
-- Name: class_assignments class_assignments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.class_packages(id);


--
-- Name: class_assignments class_assignments_rescheduled_from_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_rescheduled_from_fk FOREIGN KEY (rescheduled_from_id) REFERENCES public.class_assignments(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;


--
-- Name: class_assignments class_assignments_rescheduled_to_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_rescheduled_to_fk FOREIGN KEY (rescheduled_to_id) REFERENCES public.class_assignments(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;


--
-- Name: class_assignments class_assignments_scheduled_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT class_assignments_scheduled_class_id_fkey FOREIGN KEY (scheduled_class_id) REFERENCES public.class_schedules(id);


--
-- Name: class_attendance class_attendance_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.class_assignments(id) ON DELETE CASCADE;


--
-- Name: class_attendance class_attendance_makeup_of_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_makeup_of_assignment_id_fkey FOREIGN KEY (makeup_of_assignment_id) REFERENCES public.class_assignments(id) ON DELETE SET NULL;


--
-- Name: class_attendance class_attendance_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_attendance
    ADD CONSTRAINT class_attendance_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: class_bookings class_bookings_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_bookings
    ADD CONSTRAINT class_bookings_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(user_id);


--
-- Name: class_bookings class_bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_bookings
    ADD CONSTRAINT class_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: class_feedback class_feedback_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_feedback
    ADD CONSTRAINT class_feedback_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.class_bookings(id);


--
-- Name: class_feedback class_feedback_scheduled_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_feedback
    ADD CONSTRAINT class_feedback_scheduled_class_id_fkey FOREIGN KEY (scheduled_class_id) REFERENCES public.scheduled_classes(id);


--
-- Name: class_feedback class_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_feedback
    ADD CONSTRAINT class_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: class_ratings class_ratings_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_ratings
    ADD CONSTRAINT class_ratings_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.class_assignments(id) ON DELETE CASCADE;


--
-- Name: class_ratings class_ratings_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_ratings
    ADD CONSTRAINT class_ratings_member_id_fkey FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: class_schedules class_schedules_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT class_schedules_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id) ON DELETE CASCADE;


--
-- Name: class_schedules class_schedules_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT class_schedules_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: class_types class_types_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_types
    ADD CONSTRAINT class_types_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: class_types class_types_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_types
    ADD CONSTRAINT class_types_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: class_assignments fk_class_assignments_assigned_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT fk_class_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: class_assignments fk_class_assignments_instructor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignments
    ADD CONSTRAINT fk_class_assignments_instructor FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: class_schedules fk_class_schedules_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT fk_class_schedules_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: instructor_rates fk_created_by_auth_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_rates
    ADD CONSTRAINT fk_created_by_auth_users FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: instructor_availability instructor_availability_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_availability
    ADD CONSTRAINT instructor_availability_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: instructor_rates instructor_rates_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_rates
    ADD CONSTRAINT instructor_rates_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id);


--
-- Name: instructor_rates instructor_rates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_rates
    ADD CONSTRAINT instructor_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: instructor_rates instructor_rates_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_rates
    ADD CONSTRAINT instructor_rates_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.class_packages(id);


--
-- Name: instructor_ratings instructor_ratings_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_ratings
    ADD CONSTRAINT instructor_ratings_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: instructor_ratings instructor_ratings_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_ratings
    ADD CONSTRAINT instructor_ratings_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(user_id);


--
-- Name: instructor_ratings instructor_ratings_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructor_ratings
    ADD CONSTRAINT instructor_ratings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(user_id);


--
-- Name: manual_class_selections manual_selections_class_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_class_selections
    ADD CONSTRAINT manual_selections_class_type_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id);


--
-- Name: manual_class_selections manual_selections_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_class_selections
    ADD CONSTRAINT manual_selections_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: manual_class_selections manual_selections_instructor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_class_selections
    ADD CONSTRAINT manual_selections_instructor_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id);


--
-- Name: manual_class_selections manual_selections_package_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manual_class_selections
    ADD CONSTRAINT manual_selections_package_fkey FOREIGN KEY (package_id) REFERENCES public.class_packages(id);


--
-- Name: newsletter_subscriptions newsletter_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscriptions
    ADD CONSTRAINT newsletter_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: newsletters newsletters_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletters
    ADD CONSTRAINT newsletters_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES auth.users(id);


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id);


--
-- Name: scheduled_classes scheduled_classes_class_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_classes
    ADD CONSTRAINT scheduled_classes_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id);


--
-- Name: scheduled_classes scheduled_classes_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_classes
    ADD CONSTRAINT scheduled_classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: class_assignment_templates templates_class_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignment_templates
    ADD CONSTRAINT templates_class_type_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id);


--
-- Name: class_assignment_templates templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignment_templates
    ADD CONSTRAINT templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: class_assignment_templates templates_instructor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignment_templates
    ADD CONSTRAINT templates_instructor_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id);


--
-- Name: class_assignment_templates templates_package_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_assignment_templates
    ADD CONSTRAINT templates_package_fkey FOREIGN KEY (package_id) REFERENCES public.class_packages(id);


--
-- Name: transactions transactions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: user_packages user_packages_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_packages
    ADD CONSTRAINT user_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.class_packages(id);


--
-- Name: user_packages user_packages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_packages
    ADD CONSTRAINT user_packages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: waitlist waitlist_scheduled_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_scheduled_class_id_fkey FOREIGN KEY (scheduled_class_id) REFERENCES public.scheduled_classes(id);


--
-- Name: waitlist waitlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: users Anyone can insert (for signup); Type: POLICY; Schema: auth; Owner: -
--

CREATE POLICY "Anyone can insert (for signup)" ON auth.users FOR INSERT TO anon WITH CHECK (true);


--
-- Name: users Authenticated users can delete their own row; Type: POLICY; Schema: auth; Owner: -
--

CREATE POLICY "Authenticated users can delete their own row" ON auth.users FOR DELETE TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: users Authenticated users can select their own row; Type: POLICY; Schema: auth; Owner: -
--

CREATE POLICY "Authenticated users can select their own row" ON auth.users FOR SELECT TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: users Authenticated users can update their own row; Type: POLICY; Schema: auth; Owner: -
--

CREATE POLICY "Authenticated users can update their own row" ON auth.users FOR UPDATE TO authenticated USING ((id = ( SELECT auth.uid() AS uid))) WITH CHECK ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: class_bookings Admins can manage all bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all bookings" ON public.class_bookings TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: class_assignments Admins can manage all class assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all class assignments" ON public.class_assignments TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: class_schedules Admins can manage all class schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all class schedules" ON public.class_schedules TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: instructor_availability Admins can manage all instructor availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all instructor availability" ON public.instructor_availability TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: yoga_queries Admins can manage all queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all queries" ON public.yoga_queries TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: referrals Admins can manage all referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all referrals" ON public.referrals TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: form_submissions Admins can manage all submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all submissions" ON public.form_submissions TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: class_assignment_templates Admins can manage all templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all templates" ON public.class_assignment_templates USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'yoga_acharya'::text]))))));


--
-- Name: user_packages Admins can manage all user packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all user packages" ON public.user_packages TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: waitlist Admins can manage all waitlist entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all waitlist entries" ON public.waitlist TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: articles Admins can manage articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage articles" ON public.articles TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: class_types Admins can manage class types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage class types" ON public.class_types TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.email = auth.email()) AND (admin_users.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.admin_users
  WHERE ((admin_users.email = auth.email()) AND (admin_users.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) OR (EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])))))));


--
-- Name: instructor_rates Admins can manage instructor rates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage instructor rates" ON public.instructor_rates TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: newsletter_subscribers Admins can manage newsletter subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage newsletter subscribers" ON public.newsletter_subscribers TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: newsletters Admins can manage newsletters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage newsletters" ON public.newsletters TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: class_packages Admins can manage packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage packages" ON public.class_packages TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.roles USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.user_id = auth.uid()) AND (p.role = 'admin'::text)))));


--
-- Name: scheduled_classes Admins can manage scheduled classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage scheduled classes" ON public.scheduled_classes TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: subscription_plans Admins can manage subscription plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: user_subscriptions Admins can manage subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: system_metrics Admins can manage system metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage system metrics" ON public.system_metrics TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: transactions Admins can manage transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage transactions" ON public.transactions TO authenticated USING (public.check_is_admin()) WITH CHECK (public.check_is_admin());


--
-- Name: user_activity Admins can read all activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all activity" ON public.user_activity FOR SELECT TO authenticated USING (public.check_is_admin());


--
-- Name: class_feedback Admins can read all feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all feedback" ON public.class_feedback FOR SELECT TO authenticated USING (public.check_is_admin());


--
-- Name: profiles Admins can read all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (( SELECT (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)));


--
-- Name: user_subscriptions Admins can read all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING (public.check_is_admin());


--
-- Name: transactions Admins can read all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.check_is_admin());


--
-- Name: article_views Admins can read article views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read article views" ON public.article_views FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: payment_methods Admins can read payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read payment methods" ON public.payment_methods FOR SELECT TO authenticated USING (public.check_is_admin());


--
-- Name: bookings Admins can view all bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'yoga_acharya'::text]))))));


--
-- Name: manual_class_selections Admins can view all manual selections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all manual selections" ON public.manual_class_selections FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'yoga_acharya'::text]))))));


--
-- Name: yoga_queries Admins can view all queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all queries" ON public.yoga_queries FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: newsletter_subscriptions Admins can view all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all subscriptions" ON public.newsletter_subscriptions FOR SELECT TO authenticated USING (public.check_is_admin());


--
-- Name: user_roles Admins view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (profiles.is_active = true)))));


--
-- Name: class_types Allow all users to view class types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all users to view class types" ON public.class_types FOR SELECT USING (true);


--
-- Name: class_types Allow anon read access to class_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon read access to class_types" ON public.class_types FOR SELECT TO authenticated, anon USING (true);


--
-- Name: profiles Allow anon read access to instructor profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anon read access to instructor profiles" ON public.profiles FOR SELECT TO authenticated, anon USING (true);


--
-- Name: class_schedules Allow delete for admin roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for admin roles" ON public.class_schedules FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'instructor'::text, 'yoga_acharya'::text]))))));


--
-- Name: class_schedules Allow insert for admin roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for admin roles" ON public.class_schedules FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'instructor'::text, 'yoga_acharya'::text]))))));


--
-- Name: admin_users Allow owner delete for triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner delete for triggers" ON public.admin_users FOR DELETE USING (true);


--
-- Name: admin_users Allow owner insert for triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow owner insert for triggers" ON public.admin_users FOR INSERT WITH CHECK (true);


--
-- Name: instructor_ratings Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.instructor_ratings FOR SELECT TO authenticated USING (true);


--
-- Name: role_modules Allow read for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read for authenticated users" ON public.role_modules FOR SELECT TO authenticated USING (true);


--
-- Name: class_schedules Allow update for admin roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for admin roles" ON public.class_schedules FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'instructor'::text, 'yoga_acharya'::text]))))));


--
-- Name: class_bookings Anonymous users can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anonymous users can create bookings" ON public.class_bookings FOR INSERT TO anon WITH CHECK (true);


--
-- Name: yoga_queries Anyone can create yoga queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create yoga queries" ON public.yoga_queries FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: article_views Anyone can insert article views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert article views" ON public.article_views FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: ratings Anyone can manage their own ratings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can manage their own ratings" ON public.ratings TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: class_types Anyone can read active class types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active class types" ON public.class_types FOR SELECT USING ((is_active = true));


--
-- Name: class_packages Anyone can read active packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active packages" ON public.class_packages FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: subscription_plans Anyone can read active subscription plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read active subscription plans" ON public.subscription_plans FOR SELECT USING ((is_active = true));


--
-- Name: business_settings Anyone can read business settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read business settings" ON public.business_settings FOR SELECT USING (true);


--
-- Name: instructor_availability Anyone can read instructor availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read instructor availability" ON public.instructor_availability FOR SELECT TO authenticated, anon USING ((is_available = true));


--
-- Name: articles Anyone can read published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read published articles" ON public.articles FOR SELECT TO authenticated, anon USING ((status = 'published'::text));


--
-- Name: blog_posts Anyone can read published posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read published posts" ON public.blog_posts FOR SELECT USING ((status = 'published'::public.post_status));


--
-- Name: roles Anyone can read roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT TO authenticated, anon USING (true);


--
-- Name: scheduled_classes Anyone can read scheduled classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read scheduled classes" ON public.scheduled_classes FOR SELECT TO authenticated, anon USING ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text])));


--
-- Name: newsletter_subscribers Anyone can subscribe to newsletter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);


--
-- Name: articles Authenticated Users can manage their own articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated Users can manage their own articles" ON public.articles TO authenticated USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));


--
-- Name: admin_users Authenticated can read admin_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read admin_users" ON public.admin_users FOR SELECT TO authenticated USING (true);


--
-- Name: class_types Authorized roles can delete class types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can delete class types" ON public.class_types FOR DELETE USING (((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'yoga_acharya'::text]))))) OR (created_by = auth.uid())));


--
-- Name: transactions Authorized roles can delete transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can delete transactions" ON public.transactions FOR DELETE TO authenticated USING (public.check_user_roles());


--
-- Name: class_types Authorized roles can insert class types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can insert class types" ON public.class_types FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'yoga_acharya'::text]))))) AND (created_by = auth.uid()) AND (updated_by = auth.uid())));


--
-- Name: transactions Authorized roles can insert transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (public.check_user_roles());


--
-- Name: class_types Authorized roles can manage class types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can manage class types" ON public.class_types FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'yoga_acharya'::text]))))));


--
-- Name: class_types Authorized roles can update class types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can update class types" ON public.class_types FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'yoga_acharya'::text]))))) OR (created_by = auth.uid()))) WITH CHECK (((created_by = auth.uid()) AND (updated_by = auth.uid())));


--
-- Name: transactions Authorized roles can update transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (public.check_user_roles()) WITH CHECK (public.check_user_roles());


--
-- Name: transactions Authorized roles can view transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authorized roles can view transactions" ON public.transactions FOR SELECT TO authenticated USING (public.check_user_roles());


--
-- Name: class_schedules Enable delete for users with management roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for users with management roles" ON public.class_schedules FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'instructor'::text, 'yoga_acharya'::text]))))));


--
-- Name: class_schedules Enable insert for users with management roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for users with management roles" ON public.class_schedules FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'instructor'::text, 'yoga_acharya'::text]))))));


--
-- Name: class_schedules Enable update for users with management roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users with management roles" ON public.class_schedules FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'instructor'::text, 'yoga_acharya'::text]))))));


--
-- Name: roles Everyone can read roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read roles" ON public.roles FOR SELECT USING (true);


--
-- Name: class_assignment_templates Instructors can view own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Instructors can view own templates" ON public.class_assignment_templates FOR SELECT USING ((instructor_id = auth.uid()));


--
-- Name: class_assignments Instructors can view their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Instructors can view their own assignments" ON public.class_assignments FOR SELECT TO authenticated USING ((auth.uid() = instructor_id));


--
-- Name: class_schedules Public can read active class schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read active class schedules" ON public.class_schedules FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: form_submissions Public users can create submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public users can create submissions" ON public.form_submissions FOR INSERT TO anon WITH CHECK (true);


--
-- Name: roles Roles are publicly viewable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Roles are publicly viewable" ON public.roles FOR SELECT USING (true);


--
-- Name: admin_users Service role can manage admin_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage admin_users" ON public.admin_users TO service_role USING (true) WITH CHECK (true);


--
-- Name: profiles Service role can manage profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage profiles" ON public.profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_roles Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.user_roles USING (true) WITH CHECK (true);


--
-- Name: roles Super admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage roles" ON public.roles TO authenticated USING (public.check_can_manage_roles()) WITH CHECK (public.check_can_manage_roles());


--
-- Name: user_activity System can insert activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert activity" ON public.user_activity FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: notifications System can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: user_packages System can insert user packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert user packages" ON public.user_packages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: referrals Users can create referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK ((auth.uid() = referrer_id));


--
-- Name: form_submissions Users can create submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create submissions" ON public.form_submissions FOR INSERT WITH CHECK (true);


--
-- Name: class_bookings Users can create their own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own bookings" ON public.class_bookings FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: instructor_rates Users can manage own rates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own rates" ON public.instructor_rates TO authenticated USING ((created_by = auth.uid())) WITH CHECK ((created_by = auth.uid()));


--
-- Name: class_feedback Users can manage their own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own feedback" ON public.class_feedback TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: payment_methods Users can manage their own payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can manage their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own preferences" ON public.user_preferences TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: newsletter_subscriptions Users can manage their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own subscriptions" ON public.newsletter_subscriptions TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: waitlist Users can manage their own waitlist entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own waitlist entries" ON public.waitlist TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_activity Users can read their own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own activity" ON public.user_activity FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can read their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: transactions Users can read their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own transactions" ON public.transactions FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: class_bookings Users can update their own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own bookings" ON public.class_bookings FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_packages Users can update their own packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own packages" ON public.user_packages FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: manual_class_selections Users can view own manual selections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own manual selections" ON public.manual_class_selections FOR SELECT USING ((created_by = auth.uid()));


--
-- Name: class_bookings Users can view their own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own bookings" ON public.class_bookings FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_packages Users can view their own packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own packages" ON public.user_packages FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: yoga_queries Users can view their own queries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own queries" ON public.yoga_queries FOR SELECT TO authenticated USING ((email = auth.email()));


--
-- Name: referrals Users can view their own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT TO authenticated USING (((auth.uid() = referrer_id) OR (auth.uid() = referee_id)));


--
-- Name: waitlist Users can view their own waitlist entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own waitlist entries" ON public.waitlist FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_roles Users view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: class_assignments Yoga acharyas can view and manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Yoga acharyas can view and manage assignments" ON public.class_assignments TO authenticated USING (((auth.uid() = instructor_id) OR (EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'yoga_acharya'::text)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['yoga_acharya'::text, 'admin'::text, 'super_admin'::text]))))));


--
-- Name: contact_messages admin_email_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_email_access ON public.contact_messages TO authenticated USING (((auth.jwt() ->> 'email'::text) = 'gourab.master@gmail.com'::text)) WITH CHECK (((auth.jwt() ->> 'email'::text) = 'gourab.master@gmail.com'::text));


--
-- Name: admin_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings admins_manage_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admins_manage_all ON public.bookings TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: contact_messages allow_contact_submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_contact_submissions ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: article_moderation_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.article_moderation_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: article_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_users authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read ON public.admin_users FOR SELECT TO authenticated USING (true);


--
-- Name: bookings authenticated_users_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_users_insert_own ON public.bookings FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: bookings authenticated_users_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_users_select_own ON public.bookings FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: article_moderation_logs author_select_own_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY author_select_own_logs ON public.article_moderation_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.articles
  WHERE ((articles.id = article_moderation_logs.article_id) AND (articles.author_id = auth.uid())))));


--
-- Name: contact_messages auto_admin_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auto_admin_access ON public.contact_messages TO authenticated USING (public.check_admin_role()) WITH CHECK (public.check_admin_role());


--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: business_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: class_assignment_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_assignment_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: class_attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: class_bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: class_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: class_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: class_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: class_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: class_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: class_attendance del_attendance_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY del_attendance_admin ON public.class_attendance FOR DELETE USING (public.is_admin());


--
-- Name: instructor_rates delete_instructor_rates_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_instructor_rates_policy ON public.instructor_rates FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: newsletters delete_newsletters_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_newsletters_policy ON public.newsletters FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: form_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: class_attendance ins_attendance_instructor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_attendance_instructor ON public.class_attendance FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.class_assignments ca
  WHERE ((ca.id = class_attendance.assignment_id) AND (ca.instructor_id = auth.uid()) AND (ca.attendance_locked = false)))) OR public.is_admin()));


--
-- Name: class_ratings ins_class_ratings_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_class_ratings_member ON public.class_ratings FOR INSERT WITH CHECK (((member_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.class_assignments ca
  WHERE ((ca.id = class_ratings.assignment_id) AND ((((((ca.date)::text || ' '::text) || (ca.end_time)::text))::timestamp without time zone AT TIME ZONE ca.timezone) <= now())))) AND (EXISTS ( SELECT 1
   FROM public.class_attendance att
  WHERE ((att.assignment_id = class_ratings.assignment_id) AND (att.member_id = auth.uid()) AND (att.status = ANY (ARRAY['present'::public.attendance_status_enum, 'late'::public.attendance_status_enum, 'makeup_completed'::public.attendance_status_enum])))))));


--
-- Name: instructor_rates insert_instructor_rates_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_instructor_rates_policy ON public.instructor_rates FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: newsletter_send_logs insert_newsletter_send_logs_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_newsletter_send_logs_policy ON public.newsletter_send_logs FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: newsletters insert_newsletters_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insert_newsletters_policy ON public.newsletters FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: instructor_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: instructor_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instructor_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: manual_class_selections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.manual_class_selections ENABLE ROW LEVEL SECURITY;

--
-- Name: class_ratings mod_ratings_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mod_ratings_admin ON public.class_ratings USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: newsletter_send_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_send_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: role_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: article_moderation_logs sangha_guide_insert_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sangha_guide_insert_logs ON public.article_moderation_logs FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM ((public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
     JOIN public.profiles p ON ((ur.user_id = p.user_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'sangha_guide'::text) AND (p.is_active = true)))));


--
-- Name: articles sangha_guide_read_all_articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sangha_guide_read_all_articles ON public.articles FOR SELECT USING (public.has_role('sangha_guide'::text));


--
-- Name: article_moderation_logs sangha_guide_select_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sangha_guide_select_logs ON public.article_moderation_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM ((public.user_roles ur
     JOIN public.roles r ON ((ur.role_id = r.id)))
     JOIN public.profiles p ON ((ur.user_id = p.user_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = 'sangha_guide'::text) AND (p.is_active = true)))));


--
-- Name: articles sangha_guide_update_articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sangha_guide_update_articles ON public.articles FOR UPDATE USING (public.has_role('sangha_guide'::text)) WITH CHECK (public.has_role('sangha_guide'::text));


--
-- Name: scheduled_classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_classes ENABLE ROW LEVEL SECURITY;

--
-- Name: class_assignments sel_assignment_instructor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_assignment_instructor ON public.class_assignments FOR SELECT USING (((instructor_id = auth.uid()) OR public.is_admin()));


--
-- Name: class_attendance sel_attendance_instructor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_attendance_instructor ON public.class_attendance FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.class_assignments ca
  WHERE ((ca.id = class_attendance.assignment_id) AND (ca.instructor_id = auth.uid())))) OR public.is_admin()));


--
-- Name: class_attendance sel_attendance_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_attendance_member ON public.class_attendance FOR SELECT USING ((member_id = auth.uid()));


--
-- Name: class_ratings sel_ratings_instructor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_ratings_instructor ON public.class_ratings FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.class_assignments ca
  WHERE ((ca.id = class_ratings.assignment_id) AND (ca.instructor_id = auth.uid())))) OR public.is_admin() OR (member_id = auth.uid())));


--
-- Name: instructor_rates select_instructor_rates_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_instructor_rates_policy ON public.instructor_rates FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: newsletters select_newsletters_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY select_newsletters_policy ON public.newsletters FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: admin_users service_role_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_access ON public.admin_users TO service_role USING (true) WITH CHECK (true);


--
-- Name: contact_messages simple_admin_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY simple_admin_access ON public.contact_messages TO authenticated USING (true) WITH CHECK (true);


--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: system_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: class_assignments upd_assignment_instructor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_assignment_instructor ON public.class_assignments FOR UPDATE USING (((instructor_id = auth.uid()) OR public.is_admin())) WITH CHECK (((instructor_id = auth.uid()) OR public.is_admin()));


--
-- Name: class_attendance upd_attendance_instructor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_attendance_instructor ON public.class_attendance FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.class_assignments ca
  WHERE ((ca.id = class_attendance.assignment_id) AND (ca.instructor_id = auth.uid()) AND (ca.attendance_locked = false)))) OR public.is_admin())) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.class_assignments ca
  WHERE ((ca.id = class_attendance.assignment_id) AND (ca.instructor_id = auth.uid()) AND (ca.attendance_locked = false)))) OR public.is_admin()));


--
-- Name: class_ratings upd_class_ratings_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY upd_class_ratings_member ON public.class_ratings FOR UPDATE USING (((member_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.class_attendance att
  WHERE ((att.assignment_id = class_ratings.assignment_id) AND (att.member_id = auth.uid()) AND (att.status = ANY (ARRAY['present'::public.attendance_status_enum, 'late'::public.attendance_status_enum, 'makeup_completed'::public.attendance_status_enum]))))))) WITH CHECK (((member_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.class_attendance att
  WHERE ((att.assignment_id = class_ratings.assignment_id) AND (att.member_id = auth.uid()) AND (att.status = ANY (ARRAY['present'::public.attendance_status_enum, 'late'::public.attendance_status_enum, 'makeup_completed'::public.attendance_status_enum])))))));


--
-- Name: instructor_rates update_instructor_rates_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_instructor_rates_policy ON public.instructor_rates FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: newsletters update_newsletters_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_newsletters_policy ON public.newsletters FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));


--
-- Name: user_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: user_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages users_own_messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_messages ON public.contact_messages FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: waitlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

--
-- Name: yoga_queries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yoga_queries ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Allow auth users to upload 1oj01fe_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow auth users to upload 1oj01fe_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'avatars'::text) AND (owner = ( SELECT auth.uid() AS uid))));


--
-- Name: objects Allow authenticated users to upload their avatar 1oj01fe_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to upload their avatar 1oj01fe_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'avatars'::text));


--
-- Name: objects Allow authenticated users to upload their avatar 1oj01fe_1; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated users to upload their avatar 1oj01fe_1" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'avatars'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: objects llow all users to view avatars 1oj01fe_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "llow all users to view avatars 1oj01fe_0" ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text));


--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

