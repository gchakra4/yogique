

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."article_status" AS ENUM (
    'draft',
    'pending_review',
    'published'
);


ALTER TYPE "public"."article_status" OWNER TO "postgres";


CREATE TYPE "public"."attendance_status_enum" AS ENUM (
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


ALTER TYPE "public"."attendance_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."booking_type" AS ENUM (
    'individual',
    'corporate',
    'private group',
    'public group'
);


ALTER TYPE "public"."booking_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'approved',
    'reversed',
    'withheld'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."post_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."post_status" OWNER TO "postgres";


CREATE TYPE "public"."submission_type" AS ENUM (
    'booking',
    'query',
    'contact',
    'corporate'
);


ALTER TYPE "public"."submission_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'admin',
    'instructor'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_admin_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."add_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_to_admin_users_on_admin_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."add_to_admin_users_on_admin_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_user_roles"("target_user_id" "uuid", "new_role_names" "text"[], "requesting_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."admin_update_user_roles"("target_user_id" "uuid", "new_role_names" "text"[], "requesting_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_default_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."assign_default_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_default_user_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."assign_default_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_roles"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN has_role('super_admin');
END;
$$;


ALTER FUNCTION "public"."can_manage_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_admin_access"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."check_admin_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_admin_role"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_id IN (
      SELECT id FROM roles WHERE name IN ('admin', 'super_admin')
    )
  );
$$;


ALTER FUNCTION "public"."check_admin_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_admin_role"("check_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = check_user_id 
    AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."check_admin_role"("check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_can_manage_roles"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."check_can_manage_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."check_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_accounts"() RETURNS TABLE("total_auth_users" integer, "total_profiles" integer, "missing_profiles" integer, "admin_users" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."check_user_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_roles"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name = ANY(ARRAY['admin', 'super_admin', 'energy_exchange_lead'])
    )
$$;


ALTER FUNCTION "public"."check_user_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."convert_assignment_to_timezone"("assignment_date" "date", "assignment_time" time without time zone, "stored_timezone" "text", "target_timezone" "text") RETURNS timestamp with time zone
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Combine date and time in stored timezone, then convert to target timezone
  RETURN (assignment_date + assignment_time) AT TIME ZONE stored_timezone AT TIME ZONE target_timezone;
END;
$$;


ALTER FUNCTION "public"."convert_assignment_to_timezone"("assignment_date" "date", "assignment_time" time without time zone, "stored_timezone" "text", "target_timezone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_after_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_profile_after_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_and_role_after_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."create_profile_and_role_after_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_is_admin"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."debug_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_user_data"() RETURNS TABLE("auth_users_count" integer, "profiles_count" integer, "user_roles_count" integer, "admin_users_count" integer, "missing_profiles_count" integer, "missing_roles_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."debug_user_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diagnose_user_signup"() RETURNS TABLE("auth_users_count" bigint, "profiles_count" bigint, "user_roles_count" bigint, "users_without_profiles" bigint, "profiles_without_roles" bigint, "last_user_email" "text", "last_profile_email" "text", "trigger_exists" boolean, "profile_policies" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."diagnose_user_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fix_admin_user"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."fix_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_booking_id"() RETURNS "text"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."generate_booking_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_booking_id"() IS 'Generates unique booking IDs in YOG-YYYYMMDD-XXXX format';



CREATE OR REPLACE FUNCTION "public"."generate_slug"("title" "text") RETURNS "text"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."generate_slug"("title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_booking_details"("booking_id_param" "text") RETURNS TABLE("booking_id" "text", "client_name" "text", "client_email" "text", "client_phone" "text", "requested_class" "text", "requested_date" "text", "requested_time" "text", "experience_level" "text", "special_requests" "text", "booking_status" "text", "has_assignment" boolean, "assignment_date" "text", "assignment_time" "text", "assigned_instructor" "text")
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_booking_details"("booking_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_highest_user_role"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_highest_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructors"() RETURNS TABLE("user_id" "uuid", "full_name" "text")
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_instructors"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profiles_for_admin"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "full_name" "text", "phone" "text", "bio" "text", "experience_level" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "email" "text", "user_created_at" timestamp with time zone, "user_roles" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_user_profiles_for_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles"() RETURNS TABLE("role_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT r.name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_user_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_with_roles"("role_names" "text"[]) RETURNS TABLE("id" "uuid", "email" "text", "raw_user_meta_data" "jsonb", "user_roles" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_users_with_roles"("role_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."has_role"("role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin','super_admin')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."is_admin"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_super_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select role in ('admin', 'super admin')
  from public.profiles
  where user_id = (select auth.uid());
$$;


ALTER FUNCTION "public"."is_admin_or_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_mantra_curator"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN has_role('mantra_curator');
END;
$$;


ALTER FUNCTION "public"."is_mantra_curator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND r.name = 'super_admin'
    );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_past_class_attendance"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."lock_past_class_attendance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_from_waitlist"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."promote_from_waitlist"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_admin_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if old.role in ('super_admin', 'admin') and new.role not in ('super_admin', 'admin') then
    delete from public.admin_users where user_id = old.user_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."remove_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_article_author"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    NEW.author_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_article_author"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_booking_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.booking_id IS NULL THEN
        NEW.booking_id := generate_booking_id();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_booking_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_class_attendance_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_class_attendance_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_class_ratings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_class_ratings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_contact_message_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_contact_message_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_admin_users"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."sync_admin_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_missing_profiles"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."sync_missing_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_add_to_admin_users"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."trg_add_to_admin_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT auth.uid();
$$;


ALTER FUNCTION "public"."uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_article_view_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_article_view_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_class_assignments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_class_assignments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_class_bookings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_class_bookings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_class_packages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_class_packages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_class_participant_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_class_participant_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_instructor_availability_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_instructor_availability_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_newsletters_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_newsletters_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_roles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_roles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_scheduled_classes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_scheduled_classes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_packages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_packages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_attendance"("p_assignment_id" "uuid", "p_member_id" "uuid", "p_status" "public"."attendance_status_enum", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."upsert_attendance"("p_assignment_id" "uuid", "p_member_id" "uuid", "p_status" "public"."attendance_status_enum", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_class_rating"("p_assignment_id" "uuid", "p_rating" smallint, "p_comment" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."upsert_class_rating"("p_assignment_id" "uuid", "p_rating" smallint, "p_comment" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assignment_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "booking_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assignment_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "class_name" "text" NOT NULL,
    "instructor" "text" NOT NULL,
    "class_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "class_time" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "experience_level" "text" DEFAULT 'beginner'::"text" NOT NULL,
    "special_requests" "text" DEFAULT ''::"text",
    "emergency_contact" "text",
    "emergency_phone" "text",
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "instructor_id" "uuid",
    "booking_type" "text" DEFAULT 'individual'::"text" NOT NULL,
    "company_name" "text",
    "job_title" "text",
    "company_size" "text",
    "industry" "text",
    "website" "text",
    "participants_count" integer,
    "work_location" "text",
    "preferred_days" "text"[],
    "preferred_times" "text"[],
    "session_frequency" "text",
    "program_duration" "text",
    "budget_range" "text",
    "goals" "text",
    "current_wellness_programs" "text",
    "space_available" "text",
    "equipment_needed" boolean DEFAULT false,
    "package_type" "text",
    "timezone" "text",
    "country" "text",
    "price" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "session_duration" integer,
    "booking_notes" "text",
    "cancellation_reason" "text",
    "cancelled_at" timestamp with time zone,
    "class_package_id" "uuid",
    "booking_id" "text",
    CONSTRAINT "check_booking_type" CHECK (("booking_type" = ANY (ARRAY['individual'::"text", 'corporate'::"text", 'private_group'::"text", 'public_group'::"text"]))),
    CONSTRAINT "check_payment_status" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "check_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text", 'rescheduled'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."booking_id" IS 'Unique booking ID in format YOG-YYYYMMDD-XXXX';



CREATE TABLE IF NOT EXISTS "public"."class_attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "status" "public"."attendance_status_enum" NOT NULL,
    "notes" "text",
    "marked_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "marked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "makeup_of_assignment_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."class_attendance" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_assignment_roster_v" AS
 SELECT "ab"."assignment_id",
    "b"."booking_id",
    "b"."user_id" AS "member_id",
    (("b"."first_name" || ' '::"text") || "b"."last_name") AS "full_name",
    "b"."email",
    "att"."status",
    "att"."marked_at",
    "att"."marked_by"
   FROM (("public"."assignment_bookings" "ab"
     JOIN "public"."bookings" "b" ON (("b"."booking_id" = "ab"."booking_id")))
     LEFT JOIN "public"."class_attendance" "att" ON ((("att"."assignment_id" = "ab"."assignment_id") AND ("att"."member_id" = "b"."user_id"))));


ALTER VIEW "public"."admin_assignment_roster_v" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_class_overview_v" AS
SELECT
    NULL::"uuid" AS "assignment_id",
    NULL::"uuid" AS "instructor_id",
    NULL::"date" AS "date",
    NULL::time without time zone AS "start_time",
    NULL::time without time zone AS "end_time",
    NULL::"text" AS "class_status",
    NULL::"public"."payment_status" AS "payment_status",
    NULL::numeric(10,2) AS "final_payment_amount",
    NULL::"text" AS "class_type_name",
    NULL::"text" AS "class_type_description",
    NULL::"text" AS "class_type_difficulty",
    NULL::integer AS "class_type_duration",
    NULL::"text" AS "schedule_type",
    NULL::"text" AS "timezone",
    NULL::bigint AS "attended_count",
    NULL::bigint AS "no_show_count",
    NULL::bigint AS "absent_count",
    NULL::numeric AS "avg_rating",
    NULL::bigint AS "ratings_submitted";


ALTER VIEW "public"."admin_class_overview_v" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."admin_class_overview_mv" AS
 SELECT "assignment_id",
    "instructor_id",
    "date",
    "start_time",
    "end_time",
    "class_status",
    "payment_status",
    "final_payment_amount",
    "class_type_name",
    "class_type_description",
    "class_type_difficulty",
    "class_type_duration",
    "schedule_type",
    "timezone",
    "attended_count",
    "no_show_count",
    "absent_count",
    "avg_rating",
    "ratings_submitted"
   FROM "public"."admin_class_overview_v"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."admin_class_overview_mv" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."article_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_id" "uuid",
    "action" character varying(20) NOT NULL,
    "moderated_by" "uuid",
    "moderated_at" timestamp with time zone DEFAULT "now"(),
    "comment" "text"
);


ALTER TABLE "public"."article_moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."article_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_id" "uuid" NOT NULL,
    "fingerprint" "text" NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."article_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "preview_text" "text" NOT NULL,
    "image_url" "text",
    "video_url" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "view_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    "author_id" "uuid",
    "moderated_at" timestamp with time zone,
    "moderated_by" "uuid",
    "moderation_status" "text"
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."assignment_bookings_view_roster" AS
 SELECT "ab"."assignment_id",
    "b"."booking_id",
    "b"."user_id",
    (("b"."first_name" || ' '::"text") || "b"."last_name") AS "full_name",
    "b"."email",
    "ca"."status",
    "ca"."notes",
    "ca"."marked_at"
   FROM (("public"."assignment_bookings" "ab"
     JOIN "public"."bookings" "b" ON (("b"."booking_id" = "ab"."booking_id")))
     LEFT JOIN "public"."class_attendance" "ca" ON ((("ca"."assignment_id" = "ab"."assignment_id") AND ("ca"."member_id" = "b"."user_id"))));


ALTER VIEW "public"."assignment_bookings_view_roster" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scheduled_class_id" "uuid",
    "instructor_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "payment_amount" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "notes" "text",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "class_type_id" "uuid",
    "date" "date",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "schedule_type" "text" DEFAULT 'weekly'::"text",
    "class_status" "text" DEFAULT 'scheduled'::"text",
    "payment_date" "date",
    "instructor_status" "text" DEFAULT 'pending'::"text",
    "instructor_response_at" timestamp with time zone,
    "instructor_remarks" "text",
    "rejection_reason" "text",
    "payment_type" character varying(50) DEFAULT 'per_class'::character varying,
    "package_id" "uuid",
    "timezone" "text" DEFAULT 'Asia/Kolkata'::"text",
    "created_in_timezone" "text" DEFAULT 'Asia/Kolkata'::"text",
    "assignment_method" "text" DEFAULT 'manual'::"text",
    "recurrence_days" integer[],
    "parent_assignment_id" "uuid",
    "booking_type" "text" DEFAULT 'individual'::"text",
    "override_payment_amount" numeric(10,2),
    "attendance_locked" boolean DEFAULT false NOT NULL,
    "actual_start_time" timestamp with time zone,
    "actual_end_time" timestamp with time zone,
    "rescheduled_to_id" "uuid",
    "rescheduled_from_id" "uuid",
    "class_package_id" "uuid",
    "assignment_code" character varying(32) DEFAULT "substring"(("gen_random_uuid"())::"text", 1, 8) NOT NULL,
    "zoom_meeting" "jsonb",
    CONSTRAINT "check_booking_type" CHECK (("booking_type" = ANY (ARRAY['individual'::"text", 'corporate'::"text", 'private_group'::"text", 'public_group'::"text"]))),
    CONSTRAINT "chk_class_assignments_schedule_or_package" CHECK (((("scheduled_class_id" IS NOT NULL) AND ("class_package_id" IS NULL)) OR (("scheduled_class_id" IS NULL) AND ("class_package_id" IS NOT NULL)))),
    CONSTRAINT "chk_class_assignments_type_or_package" CHECK (((("class_type_id" IS NOT NULL) AND ("package_id" IS NULL)) OR (("class_type_id" IS NULL) AND ("package_id" IS NOT NULL)))),
    CONSTRAINT "class_assignments_assignment_method_check" CHECK (("assignment_method" = ANY (ARRAY['manual'::"text", 'weekly_recurrence'::"text", 'auto_distribute'::"text"]))),
    CONSTRAINT "class_assignments_class_status_check" CHECK (("class_status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'not_conducted'::"text"]))),
    CONSTRAINT "class_assignments_instructor_status_check" CHECK (("instructor_status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'rescheduled'::"text"]))),
    CONSTRAINT "class_assignments_schedule_type_check" CHECK (("schedule_type" = ANY (ARRAY['adhoc'::"text", 'weekly'::"text", 'monthly'::"text", 'crash'::"text"])))
);


ALTER TABLE "public"."class_assignments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."class_assignments"."schedule_type" IS 'Type of class schedule: adhoc (one-time), weekly (recurring weekly), monthly (recurring monthly), package (part of a package)';



COMMENT ON COLUMN "public"."class_assignments"."timezone" IS 'Timezone in which the class was scheduled (e.g., Asia/Kolkata)';



COMMENT ON COLUMN "public"."class_assignments"."created_in_timezone" IS 'Timezone of the user who created this assignment';



COMMENT ON COLUMN "public"."class_assignments"."assignment_method" IS 'How this assignment was created: manual, weekly_recurrence, or auto_distribute';



COMMENT ON COLUMN "public"."class_assignments"."recurrence_days" IS 'Array of weekdays (0=Sunday, 6=Saturday) for recurring assignments';



COMMENT ON COLUMN "public"."class_assignments"."parent_assignment_id" IS 'References parent assignment for bulk operations';



COMMENT ON COLUMN "public"."class_assignments"."assignment_code" IS 'Short human-friendly assignment code (shared for a batch of assignments).';



CREATE TABLE IF NOT EXISTS "public"."class_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "class_count" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "validity_days" integer DEFAULT 90,
    "class_type_restrictions" "uuid"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "text",
    "duration" "text",
    "course_type" "text",
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "class_packages_course_type_check" CHECK (("course_type" = ANY (ARRAY['regular'::"text", 'crash'::"text"]))),
    CONSTRAINT "class_packages_duration_check" CHECK (("duration" ~ '^[0-9]+ (week|month|day)s?$'::"text"))
);


ALTER TABLE "public"."class_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "difficulty_level" "text" DEFAULT 'beginner'::"text",
    "price" numeric(10,2) DEFAULT 0.00,
    "duration_minutes" integer DEFAULT 60,
    "max_participants" integer DEFAULT 20,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "updated_by" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."class_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "bio" "text",
    "role" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "specialties" "text"[],
    "experience_years" integer DEFAULT 0,
    "certification" "text",
    "avatar_url" "text",
    "is_active" boolean DEFAULT true,
    "badges" "jsonb",
    "address" "text",
    "location" "text",
    "certifications" "text"[],
    "languages" "text"[] DEFAULT ARRAY['English'::"text"],
    "teaching_philosophy" "text",
    "achievements" "text"[],
    "social_media" "jsonb" DEFAULT '{}'::"jsonb",
    "hourly_rate" numeric(10,2),
    "years_of_experience" integer,
    "education" "text"[],
    "website_url" "text",
    "instagram_handle" "text",
    "facebook_profile" "text",
    "linkedin_profile" "text",
    "youtube_channel" "text",
    "availability_schedule" "jsonb" DEFAULT '{}'::"jsonb",
    "preferred_contact_method" "text" DEFAULT 'email'::"text",
    "emergency_contact" "jsonb" DEFAULT '{}'::"jsonb",
    "date_of_birth" "date",
    "gender" "text",
    "nationality" "text",
    "time_zone" "text" DEFAULT 'UTC'::"text",
    "profile_visibility" "text" DEFAULT 'public'::"text",
    "profile_completed" boolean DEFAULT false,
    "last_active" timestamp with time zone DEFAULT "now"(),
    "verification_status" "text" DEFAULT 'pending'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."assignments_with_timezone" AS
 SELECT "ca"."id",
    "ca"."scheduled_class_id",
    "ca"."instructor_id",
    "ca"."assigned_by",
    "ca"."payment_amount",
    "ca"."payment_status",
    "ca"."notes",
    "ca"."assigned_at",
    "ca"."created_at",
    "ca"."updated_at",
    "ca"."class_type_id",
    "ca"."date",
    "ca"."start_time",
    "ca"."end_time",
    "ca"."schedule_type",
    "ca"."class_status",
    "ca"."payment_date",
    "ca"."instructor_status",
    "ca"."instructor_response_at",
    "ca"."instructor_remarks",
    "ca"."rejection_reason",
    "ca"."payment_type",
    "ca"."package_id",
    "ca"."timezone",
    "ca"."created_in_timezone",
    "ca"."assignment_method",
    "ca"."recurrence_days",
    "ca"."parent_assignment_id",
    (("ca"."date" + "ca"."start_time") AT TIME ZONE "ca"."timezone") AS "start_datetime_utc",
    (("ca"."date" + "ca"."end_time") AT TIME ZONE "ca"."timezone") AS "end_datetime_utc",
    "ct"."name" AS "class_type_name",
    "cp"."name" AS "package_name",
    "cp"."class_count" AS "package_class_count",
    "p"."full_name" AS "instructor_name"
   FROM ((("public"."class_assignments" "ca"
     LEFT JOIN "public"."class_types" "ct" ON (("ca"."class_type_id" = "ct"."id")))
     LEFT JOIN "public"."class_packages" "cp" ON (("ca"."package_id" = "cp"."id")))
     LEFT JOIN "public"."profiles" "p" ON (("ca"."instructor_id" = "p"."user_id")));


ALTER VIEW "public"."assignments_with_timezone" OWNER TO "postgres";


COMMENT ON VIEW "public"."assignments_with_timezone" IS 'View showing assignments with timezone-converted datetime fields';



CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "icon_url" "text",
    "description" "text"
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "author_id" "uuid",
    "author_name" "text" DEFAULT 'Admin'::"text" NOT NULL,
    "category" "text" DEFAULT 'Practice'::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "image_url" "text",
    "featured" boolean DEFAULT false,
    "status" "public"."post_status" DEFAULT 'draft'::"public"."post_status",
    "read_time" "text",
    "meta_description" "text",
    "meta_keywords" "text"[],
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_settings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."class_assignment_financials" AS
 SELECT "id",
    "instructor_id",
    "date",
    "start_time",
    "end_time",
    "schedule_type",
    "class_status",
    "payment_status",
    "payment_amount",
    "override_payment_amount",
    COALESCE("override_payment_amount", "payment_amount") AS "final_payment_amount"
   FROM "public"."class_assignments" "ca";


ALTER VIEW "public"."class_assignment_financials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_assignment_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "package_id" "uuid",
    "class_type_id" "uuid",
    "instructor_id" "uuid" NOT NULL,
    "weekdays" integer[] NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "timezone" "text" DEFAULT 'Asia/Kolkata'::"text" NOT NULL,
    "payment_amount" numeric DEFAULT 0,
    "payment_type" "text" DEFAULT 'per_class'::"text",
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."class_assignment_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."class_assignment_templates" IS 'Templates for weekly recurring assignment patterns';



CREATE TABLE IF NOT EXISTS "public"."class_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "scheduled_class_id" "uuid",
    "profile_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "emergency_contact" "text",
    "emergency_phone" "text",
    "special_requests" "text" DEFAULT ''::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "booking_status" "text" DEFAULT 'confirmed'::"text",
    "booking_date" timestamp with time zone DEFAULT "now"(),
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "class_bookings_booking_status_check" CHECK (("booking_status" = ANY (ARRAY['confirmed'::"text", 'cancelled'::"text", 'attended'::"text", 'no_show'::"text"]))),
    CONSTRAINT "class_bookings_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'refunded'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."class_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "scheduled_class_id" "uuid" NOT NULL,
    "instructor_rating" integer,
    "class_rating" integer,
    "difficulty_rating" integer,
    "would_recommend" boolean,
    "feedback_text" "text",
    "suggestions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "class_feedback_class_rating_check" CHECK ((("class_rating" >= 1) AND ("class_rating" <= 5))),
    CONSTRAINT "class_feedback_difficulty_rating_check" CHECK ((("difficulty_rating" >= 1) AND ("difficulty_rating" <= 5))),
    CONSTRAINT "class_feedback_instructor_rating_check" CHECK ((("instructor_rating" >= 1) AND ("instructor_rating" <= 5)))
);


ALTER TABLE "public"."class_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "class_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."class_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_type_id" "uuid",
    "instructor_id" "uuid",
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "max_participants" integer DEFAULT 20,
    "is_active" boolean DEFAULT true,
    "effective_from" "date" DEFAULT CURRENT_DATE,
    "effective_until" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_recurring" boolean DEFAULT true,
    "schedule_type" "text" DEFAULT 'weekly'::"text",
    "location" "text",
    "payment_amount" numeric(10,2),
    "payment_type" character varying(50) DEFAULT 'per_class'::character varying,
    "class_status" character varying(20) DEFAULT 'active'::character varying,
    "created_by" "uuid",
    "start_date" "date",
    "end_date" "date",
    "end_time" time without time zone,
    "notes" "text",
    CONSTRAINT "class_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "class_schedules_schedule_type_check" CHECK (("schedule_type" = ANY (ARRAY['weekly'::"text", 'adhoc'::"text"]))),
    CONSTRAINT "class_schedules_status_check" CHECK ((("class_status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'cancelled'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."class_schedules" OWNER TO "postgres";


COMMENT ON COLUMN "public"."class_schedules"."instructor_id" IS 'Instructor assigned to this schedule template. NULL if no instructor assigned yet.';



CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" DEFAULT ''::"text",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."contact_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."submission_type" NOT NULL,
    "data" "jsonb" NOT NULL,
    "user_email" "text",
    "user_name" "text",
    "user_phone" "text",
    "status" "text" DEFAULT 'new'::"text",
    "notes" "text",
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_available" boolean DEFAULT true,
    "effective_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_until" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "instructor_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."instructor_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_type_id" "uuid",
    "schedule_type" "text" NOT NULL,
    "rate_amount" numeric NOT NULL,
    "effective_from" "date" DEFAULT CURRENT_DATE,
    "effective_until" "date",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    "rate_amount_usd" numeric(10,2),
    "package_id" "uuid",
    CONSTRAINT "rates_type_or_package_check" CHECK (((("class_type_id" IS NOT NULL) AND ("package_id" IS NULL)) OR (("class_type_id" IS NULL) AND ("package_id" IS NOT NULL)) OR (("class_type_id" IS NULL) AND ("package_id" IS NULL))))
);


ALTER TABLE "public"."instructor_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid",
    "student_id" "uuid",
    "booking_id" "uuid",
    "rating" integer,
    "review" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "instructor_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."instructor_ratings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."instructor_upcoming_classes_v" AS
SELECT
    NULL::"uuid" AS "assignment_id",
    NULL::"uuid" AS "instructor_id",
    NULL::"date" AS "date",
    NULL::time without time zone AS "start_time",
    NULL::time without time zone AS "end_time",
    NULL::"text" AS "schedule_type",
    NULL::"text" AS "class_status",
    NULL::"public"."payment_status" AS "payment_status",
    NULL::numeric(10,2) AS "payment_amount",
    NULL::numeric(10,2) AS "override_payment_amount",
    NULL::numeric(10,2) AS "final_payment_amount",
    NULL::"text" AS "timezone",
    NULL::boolean AS "attendance_locked",
    NULL::bigint AS "present_count",
    NULL::bigint AS "no_show_count",
    NULL::numeric AS "avg_rating",
    NULL::bigint AS "rating_count";


ALTER VIEW "public"."instructor_upcoming_classes_v" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_class_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_batch_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "timezone" "text" DEFAULT 'Asia/Kolkata'::"text" NOT NULL,
    "package_id" "uuid",
    "class_type_id" "uuid",
    "instructor_id" "uuid" NOT NULL,
    "payment_amount" numeric DEFAULT 0,
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manual_class_selections" OWNER TO "postgres";


COMMENT ON TABLE "public"."manual_class_selections" IS 'Individual manual selections for calendar-based assignment creation';



CREATE TABLE IF NOT EXISTS "public"."newsletter_send_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "newsletter_id" "uuid" NOT NULL,
    "total_recipients" integer DEFAULT 0 NOT NULL,
    "sent_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "errors" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."newsletter_send_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "subscribed_at" timestamp with time zone DEFAULT "now"(),
    "unsubscribed_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "timezone" "text"
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "subscribed" boolean DEFAULT true,
    "subscribed_at" timestamp with time zone DEFAULT "now"(),
    "unsubscribed_at" timestamp with time zone
);


ALTER TABLE "public"."newsletter_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "sent_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customizations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "template" "text",
    "template_type" "text",
    "sent_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "error_message" "text",
    CONSTRAINT "newsletters_template_type_check" CHECK (("template_type" = ANY (ARRAY['html'::"text", 'markdown'::"text", 'plain_text'::"text"])))
);


ALTER TABLE "public"."newsletters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['article_approved'::"text", 'article_rejected'::"text", 'class_booked'::"text", 'class_cancelled'::"text", 'class_reminder'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_payment_method_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "last_four" "text",
    "brand" "text",
    "exp_month" integer,
    "exp_year" integer,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "fingerprint" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referee_email" "text" NOT NULL,
    "referee_id" "uuid",
    "referral_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "reward_amount" numeric(10,2),
    "reward_granted" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_modules" (
    "id" bigint NOT NULL,
    "role" "text" NOT NULL,
    "module_id" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."role_modules" OWNER TO "postgres";


ALTER TABLE "public"."role_modules" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."role_modules_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "class_type_id" "uuid" NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "max_participants" integer NOT NULL,
    "current_participants" integer DEFAULT 0,
    "status" "text" DEFAULT 'scheduled'::"text",
    "meeting_link" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scheduled_classes_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."scheduled_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "billing_interval" "text" DEFAULT 'monthly'::"text",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(15,2) NOT NULL,
    "metric_type" "text" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subscription_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "payment_method" "text",
    "stripe_payment_intent_id" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "billing_plan_type" "text" DEFAULT 'one_time'::"text",
    "billing_period_month" "date",
    "category" "text",
    "user_email" "text",
    "user_full_name" "text",
    CONSTRAINT "transactions_billing_plan_type_check" CHECK (("billing_plan_type" = ANY (ARRAY['one_time'::"text", 'monthly'::"text", 'crash_course'::"text"]))),
    CONSTRAINT "transactions_category_check" CHECK ((("category" IS NULL) OR ("category" = ANY (ARRAY['class_booking'::"text", 'subscription'::"text", 'instructor_payment'::"text", 'maintenance'::"text", 'other'::"text"])))),
    CONSTRAINT "transactions_payment_method_check" CHECK ((("payment_method" IS NULL) OR ("payment_method" = ANY (ARRAY['upi'::"text", 'neft'::"text", 'net_banking'::"text", 'credit_card'::"text", 'debit_card'::"text", 'cheque'::"text", 'demand_draft'::"text", 'cash'::"text", 'bank_transfer'::"text", 'manual'::"text"]))))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."transactions_with_user" AS
 SELECT "t"."id",
    "t"."user_id",
    "t"."subscription_id",
    "t"."amount",
    "t"."currency",
    "t"."status",
    "t"."payment_method",
    "t"."stripe_payment_intent_id",
    "t"."description",
    "t"."created_at",
    "t"."updated_at",
    "t"."billing_plan_type",
    "t"."billing_period_month",
    "t"."category",
    "t"."user_email",
    "t"."user_full_name",
    COALESCE("t"."user_email", ("u"."email")::"text") AS "payer_email",
    COALESCE("t"."user_full_name", "p"."full_name", NULLIF(("u"."raw_user_meta_data" ->> 'full_name'::"text"), ''::"text")) AS "payer_full_name"
   FROM (("public"."transactions" "t"
     LEFT JOIN "auth"."users" "u" ON (("t"."user_id" = "u"."id")))
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "t"."user_id")));


ALTER VIEW "public"."transactions_with_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "activity_type" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_engagement_metrics" AS
 SELECT "p"."user_id",
    "p"."email",
    "p"."full_name",
    "count"("b"."id") AS "total_bookings",
    (0)::bigint AS "attended_classes",
    (0)::bigint AS "articles_viewed",
    GREATEST("p"."created_at", "p"."updated_at") AS "last_activity",
        CASE
            WHEN ("p"."updated_at" >= (CURRENT_DATE - '7 days'::interval)) THEN 'active'::"text"
            WHEN ("p"."updated_at" >= (CURRENT_DATE - '30 days'::interval)) THEN 'inactive'::"text"
            ELSE 'dormant'::"text"
        END AS "engagement_status"
   FROM ("public"."profiles" "p"
     LEFT JOIN "public"."bookings" "b" ON (("p"."user_id" = "b"."user_id")))
  GROUP BY "p"."user_id", "p"."email", "p"."full_name", "p"."created_at", "p"."updated_at";


ALTER VIEW "public"."user_engagement_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "package_id" "uuid" NOT NULL,
    "classes_remaining" integer NOT NULL,
    "purchased_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "sms_notifications" boolean DEFAULT false,
    "reminder_time_minutes" integer DEFAULT 60,
    "preferred_class_types" "uuid"[] DEFAULT '{}'::"uuid"[],
    "preferred_instructors" "uuid"[] DEFAULT '{}'::"uuid"[],
    "preferred_times" "jsonb" DEFAULT '{}'::"jsonb",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "language" "text" DEFAULT 'en'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scheduled_class_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "notification_sent" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."yoga_queries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "message" "text" NOT NULL,
    "experience_level" "text" DEFAULT 'beginner'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "response" "text" DEFAULT ''::"text",
    "responded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."yoga_queries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoom_tokens" (
    "id" "text" DEFAULT 'server_token'::"text" NOT NULL,
    "access_token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."zoom_tokens" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_moderation_logs"
    ADD CONSTRAINT "article_moderation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_views"
    ADD CONSTRAINT "article_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_bookings"
    ADD CONSTRAINT "assignment_bookings_assignment_id_booking_id_key" UNIQUE ("assignment_id", "booking_id");



ALTER TABLE ONLY "public"."assignment_bookings"
    ADD CONSTRAINT "assignment_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_settings"
    ADD CONSTRAINT "business_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."business_settings"
    ADD CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_assignment_templates"
    ADD CONSTRAINT "class_assignment_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_attendance"
    ADD CONSTRAINT "class_attendance_assignment_id_member_id_key" UNIQUE ("assignment_id", "member_id");



ALTER TABLE ONLY "public"."class_attendance"
    ADD CONSTRAINT "class_attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_bookings"
    ADD CONSTRAINT "class_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_feedback"
    ADD CONSTRAINT "class_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_packages"
    ADD CONSTRAINT "class_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_ratings"
    ADD CONSTRAINT "class_ratings_assignment_id_member_id_key" UNIQUE ("assignment_id", "member_id");



ALTER TABLE ONLY "public"."class_ratings"
    ADD CONSTRAINT "class_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_types"
    ADD CONSTRAINT "class_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_availability"
    ADD CONSTRAINT "instructor_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_rates"
    ADD CONSTRAINT "instructor_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_rates"
    ADD CONSTRAINT "instructor_rates_unique_per_type" UNIQUE ("class_type_id", "package_id", "category", "schedule_type");



ALTER TABLE ONLY "public"."instructor_ratings"
    ADD CONSTRAINT "instructor_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_class_selections"
    ADD CONSTRAINT "manual_class_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_send_logs"
    ADD CONSTRAINT "newsletter_send_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_user_id_email_key" UNIQUE ("user_id", "email");



ALTER TABLE ONLY "public"."newsletters"
    ADD CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_article_id_fingerprint_key" UNIQUE ("article_id", "fingerprint");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."role_modules"
    ADD CONSTRAINT "role_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_classes"
    ADD CONSTRAINT "scheduled_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_metrics"
    ADD CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_packages"
    ADD CONSTRAINT "user_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_user_id_scheduled_class_id_key" UNIQUE ("user_id", "scheduled_class_id");



ALTER TABLE ONLY "public"."yoga_queries"
    ADD CONSTRAINT "yoga_queries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoom_tokens"
    ADD CONSTRAINT "zoom_tokens_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_users_id_idx" ON "public"."admin_users" USING "btree" ("id");



CREATE INDEX "article_views_article_id_idx" ON "public"."article_views" USING "btree" ("article_id");



CREATE INDEX "article_views_fingerprint_idx" ON "public"."article_views" USING "btree" ("fingerprint");



CREATE INDEX "articles_category_idx" ON "public"."articles" USING "btree" ("category");



CREATE INDEX "articles_published_at_idx" ON "public"."articles" USING "btree" ("published_at");



CREATE INDEX "articles_status_idx" ON "public"."articles" USING "btree" ("status");



CREATE INDEX "class_assignments_assigned_at_idx" ON "public"."class_assignments" USING "btree" ("assigned_at");



CREATE INDEX "class_assignments_instructor_id_idx" ON "public"."class_assignments" USING "btree" ("instructor_id");



CREATE INDEX "class_assignments_payment_status_idx" ON "public"."class_assignments" USING "btree" ("payment_status");



CREATE INDEX "class_assignments_scheduled_class_id_idx" ON "public"."class_assignments" USING "btree" ("scheduled_class_id");



CREATE INDEX "class_bookings_booking_status_idx" ON "public"."class_bookings" USING "btree" ("booking_status");



CREATE INDEX "class_bookings_payment_status_idx" ON "public"."class_bookings" USING "btree" ("payment_status");



CREATE INDEX "class_bookings_scheduled_class_id_idx" ON "public"."class_bookings" USING "btree" ("scheduled_class_id");



CREATE INDEX "class_bookings_user_id_idx" ON "public"."class_bookings" USING "btree" ("user_id");



CREATE INDEX "class_feedback_instructor_rating_idx" ON "public"."class_feedback" USING "btree" ("instructor_rating");



CREATE INDEX "class_feedback_scheduled_class_id_idx" ON "public"."class_feedback" USING "btree" ("scheduled_class_id");



CREATE INDEX "idx_article_moderation_logs_article_id" ON "public"."article_moderation_logs" USING "btree" ("article_id", "moderated_at" DESC);



CREATE INDEX "idx_article_moderation_logs_moderated_by" ON "public"."article_moderation_logs" USING "btree" ("moderated_by");



CREATE INDEX "idx_articles_author_id" ON "public"."articles" USING "btree" ("author_id");



CREATE INDEX "idx_articles_status_created_at" ON "public"."articles" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_assignment_bookings_assignment_id" ON "public"."assignment_bookings" USING "btree" ("assignment_id");



CREATE INDEX "idx_assignment_bookings_booking_id" ON "public"."assignment_bookings" USING "btree" ("booking_id");



CREATE INDEX "idx_bookings_booking_id" ON "public"."bookings" USING "btree" ("booking_id");



CREATE INDEX "idx_bookings_created_at" ON "public"."bookings" USING "btree" ("created_at");



CREATE INDEX "idx_bookings_email_status" ON "public"."bookings" USING "btree" ("email", "status");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_user_id_status" ON "public"."bookings" USING "btree" ("user_id", "status");



CREATE UNIQUE INDEX "idx_class_assignments_assignment_code" ON "public"."class_assignments" USING "btree" ("assignment_code");



CREATE INDEX "idx_class_assignments_assignment_method" ON "public"."class_assignments" USING "btree" ("assignment_method");



CREATE INDEX "idx_class_assignments_instructor_date" ON "public"."class_assignments" USING "btree" ("instructor_id", "date");



CREATE INDEX "idx_class_assignments_package_id" ON "public"."class_assignments" USING "btree" ("package_id");



CREATE INDEX "idx_class_assignments_parent_id" ON "public"."class_assignments" USING "btree" ("parent_assignment_id");



CREATE INDEX "idx_class_assignments_recurrence_days" ON "public"."class_assignments" USING "gin" ("recurrence_days");



CREATE INDEX "idx_class_assignments_reschedule_chain" ON "public"."class_assignments" USING "btree" ("rescheduled_from_id", "rescheduled_to_id");



CREATE INDEX "idx_class_assignments_timezone" ON "public"."class_assignments" USING "btree" ("timezone");



CREATE INDEX "idx_class_attendance_assignment" ON "public"."class_attendance" USING "btree" ("assignment_id");



CREATE INDEX "idx_class_attendance_member" ON "public"."class_attendance" USING "btree" ("member_id");



CREATE INDEX "idx_class_attendance_status" ON "public"."class_attendance" USING "btree" ("status");



CREATE INDEX "idx_class_ratings_assignment" ON "public"."class_ratings" USING "btree" ("assignment_id");



CREATE INDEX "idx_class_ratings_member" ON "public"."class_ratings" USING "btree" ("member_id");



CREATE INDEX "idx_class_ratings_rating" ON "public"."class_ratings" USING "btree" ("rating");



CREATE INDEX "idx_class_schedules_unassigned" ON "public"."class_schedules" USING "btree" ("id") WHERE ("instructor_id" IS NULL);



CREATE INDEX "idx_class_types_active_archived" ON "public"."class_types" USING "btree" ("is_active", "is_archived");



CREATE INDEX "idx_class_types_archived" ON "public"."class_types" USING "btree" ("is_archived");



CREATE INDEX "idx_contact_messages_user_id" ON "public"."contact_messages" USING "btree" ("user_id");



CREATE INDEX "idx_manual_selections_batch_id" ON "public"."manual_class_selections" USING "btree" ("assignment_batch_id");



CREATE INDEX "idx_manual_selections_date" ON "public"."manual_class_selections" USING "btree" ("date");



CREATE INDEX "idx_manual_selections_instructor_id" ON "public"."manual_class_selections" USING "btree" ("instructor_id");



CREATE INDEX "idx_newsletter_send_logs_nid" ON "public"."newsletter_send_logs" USING "btree" ("newsletter_id");



CREATE INDEX "idx_newsletter_subscribers_timezone" ON "public"."newsletter_subscribers" USING "btree" ("timezone");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_roles_name" ON "public"."roles" USING "btree" ("name");



CREATE INDEX "idx_templates_instructor_id" ON "public"."class_assignment_templates" USING "btree" ("instructor_id");



CREATE INDEX "idx_templates_is_active" ON "public"."class_assignment_templates" USING "btree" ("is_active");



CREATE INDEX "idx_templates_weekdays" ON "public"."class_assignment_templates" USING "gin" ("weekdays");



CREATE INDEX "idx_transactions_user_email" ON "public"."transactions" USING "btree" ("user_email");



CREATE INDEX "idx_transactions_user_id" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_assigned_by" ON "public"."user_roles" USING "btree" ("assigned_by");



CREATE INDEX "idx_user_roles_role_id" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "instructor_availability_instructor_day_idx" ON "public"."instructor_availability" USING "btree" ("instructor_id", "day_of_week");



CREATE INDEX "newsletter_subscriptions_email_idx" ON "public"."newsletter_subscriptions" USING "btree" ("email");



CREATE INDEX "newsletter_subscriptions_user_id_idx" ON "public"."newsletter_subscriptions" USING "btree" ("user_id");



CREATE INDEX "payment_methods_user_id_idx" ON "public"."payment_methods" USING "btree" ("user_id");



CREATE INDEX "ratings_article_id_idx" ON "public"."ratings" USING "btree" ("article_id");



CREATE INDEX "ratings_fingerprint_idx" ON "public"."ratings" USING "btree" ("fingerprint");



CREATE INDEX "referrals_code_idx" ON "public"."referrals" USING "btree" ("referral_code");



CREATE INDEX "referrals_status_idx" ON "public"."referrals" USING "btree" ("status");



CREATE INDEX "scheduled_classes_instructor_id_idx" ON "public"."scheduled_classes" USING "btree" ("instructor_id");



CREATE INDEX "scheduled_classes_start_time_idx" ON "public"."scheduled_classes" USING "btree" ("start_time");



CREATE INDEX "scheduled_classes_status_idx" ON "public"."scheduled_classes" USING "btree" ("status");



CREATE INDEX "system_metrics_metric_name_idx" ON "public"."system_metrics" USING "btree" ("metric_name");



CREATE INDEX "system_metrics_period_idx" ON "public"."system_metrics" USING "btree" ("period_start", "period_end");



CREATE INDEX "user_activity_activity_type_idx" ON "public"."user_activity" USING "btree" ("activity_type");



CREATE INDEX "user_activity_created_at_idx" ON "public"."user_activity" USING "btree" ("created_at");



CREATE INDEX "user_activity_user_id_idx" ON "public"."user_activity" USING "btree" ("user_id");



CREATE INDEX "user_packages_user_active_idx" ON "public"."user_packages" USING "btree" ("user_id", "is_active");



CREATE INDEX "user_preferences_user_id_idx" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE INDEX "user_roles_role_id_idx" ON "public"."user_roles" USING "btree" ("role_id");



CREATE INDEX "user_roles_user_id_idx" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "user_roles_user_id_role_id_idx" ON "public"."user_roles" USING "btree" ("user_id", "role_id");



CREATE INDEX "waitlist_class_position_idx" ON "public"."waitlist" USING "btree" ("scheduled_class_id", "position");



CREATE OR REPLACE VIEW "public"."instructor_upcoming_classes_v" AS
 SELECT "ca"."id" AS "assignment_id",
    "ca"."instructor_id",
    "ca"."date",
    "ca"."start_time",
    "ca"."end_time",
    "ca"."schedule_type",
    "ca"."class_status",
    "ca"."payment_status",
    "ca"."payment_amount",
    "ca"."override_payment_amount",
    COALESCE("ca"."override_payment_amount", "ca"."payment_amount") AS "final_payment_amount",
    "ca"."timezone",
    "ca"."attendance_locked",
    COALESCE("sum"((("att"."status" = ANY (ARRAY['present'::"public"."attendance_status_enum", 'late'::"public"."attendance_status_enum", 'makeup_completed'::"public"."attendance_status_enum"])))::integer), (0)::bigint) AS "present_count",
    COALESCE("sum"((("att"."status" = 'no_show'::"public"."attendance_status_enum"))::integer), (0)::bigint) AS "no_show_count",
    COALESCE("avg"(NULLIF("cr"."rating", 0)), (0)::numeric) AS "avg_rating",
    "count"("cr"."id") AS "rating_count"
   FROM (("public"."class_assignments" "ca"
     LEFT JOIN "public"."class_attendance" "att" ON (("att"."assignment_id" = "ca"."id")))
     LEFT JOIN "public"."class_ratings" "cr" ON (("cr"."assignment_id" = "ca"."id")))
  WHERE (("ca"."date" >= CURRENT_DATE) AND ("ca"."date" <= (CURRENT_DATE + '60 days'::interval)))
  GROUP BY "ca"."id";



CREATE OR REPLACE VIEW "public"."admin_class_overview_v" AS
 SELECT "ca"."id" AS "assignment_id",
    "ca"."instructor_id",
    "ca"."date",
    "ca"."start_time",
    "ca"."end_time",
    "ca"."class_status",
    "ca"."payment_status",
    COALESCE("ca"."override_payment_amount", "ca"."payment_amount") AS "final_payment_amount",
    "ct"."name" AS "class_type_name",
    "ct"."description" AS "class_type_description",
    "ct"."difficulty_level" AS "class_type_difficulty",
    "ct"."duration_minutes" AS "class_type_duration",
    "ca"."schedule_type",
    "ca"."timezone",
    "count"("att"."id") FILTER (WHERE ("att"."status" = ANY (ARRAY['present'::"public"."attendance_status_enum", 'late'::"public"."attendance_status_enum", 'makeup_completed'::"public"."attendance_status_enum"]))) AS "attended_count",
    "count"("att"."id") FILTER (WHERE ("att"."status" = 'no_show'::"public"."attendance_status_enum")) AS "no_show_count",
    "count"("att"."id") FILTER (WHERE ("att"."status" = ANY (ARRAY['absent_excused'::"public"."attendance_status_enum", 'absent_unexcused'::"public"."attendance_status_enum"]))) AS "absent_count",
    "avg"("cr"."rating") AS "avg_rating",
    "count"("cr"."id") AS "ratings_submitted"
   FROM ((("public"."class_assignments" "ca"
     LEFT JOIN "public"."class_types" "ct" ON (("ca"."class_type_id" = "ct"."id")))
     LEFT JOIN "public"."class_attendance" "att" ON (("att"."assignment_id" = "ca"."id")))
     LEFT JOIN "public"."class_ratings" "cr" ON (("cr"."assignment_id" = "ca"."id")))
  GROUP BY "ca"."id", "ct"."name", "ct"."description", "ct"."difficulty_level", "ct"."duration_minutes";



CREATE OR REPLACE TRIGGER "booking_id_trigger" BEFORE INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_booking_id"();



CREATE OR REPLACE TRIGGER "ensure_article_author_trigger" BEFORE INSERT ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."set_article_author"();



CREATE OR REPLACE TRIGGER "promote_from_waitlist_trigger" AFTER UPDATE ON "public"."class_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."promote_from_waitlist"();



CREATE OR REPLACE TRIGGER "set_user_id_trigger" BEFORE INSERT ON "public"."contact_messages" FOR EACH ROW EXECUTE FUNCTION "public"."set_contact_message_user_id"();



CREATE OR REPLACE TRIGGER "sync_admin_users_trigger" AFTER INSERT OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_admin_users"();



CREATE OR REPLACE TRIGGER "trg_add_to_admin_users" AFTER INSERT ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."add_to_admin_users_on_admin_role"();



CREATE OR REPLACE TRIGGER "trg_class_attendance_updated_at" BEFORE UPDATE ON "public"."class_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."set_class_attendance_updated_at"();



CREATE OR REPLACE TRIGGER "trg_class_ratings_updated_at" BEFORE UPDATE ON "public"."class_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."set_class_ratings_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_admin_users" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_admin_users"();



CREATE OR REPLACE TRIGGER "update_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_article_view_count_trigger" AFTER INSERT ON "public"."article_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_article_view_count"();



CREATE OR REPLACE TRIGGER "update_articles_updated_at" BEFORE UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_class_assignments_updated_at" BEFORE UPDATE ON "public"."class_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_class_assignments_updated_at"();



CREATE OR REPLACE TRIGGER "update_class_bookings_updated_at" BEFORE UPDATE ON "public"."class_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_class_bookings_updated_at"();



CREATE OR REPLACE TRIGGER "update_class_packages_updated_at" BEFORE UPDATE ON "public"."class_packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_class_packages_updated_at"();



CREATE OR REPLACE TRIGGER "update_class_schedules_updated_at" BEFORE UPDATE ON "public"."class_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_class_types_updated_at" BEFORE UPDATE ON "public"."class_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_instructor_availability_updated_at" BEFORE UPDATE ON "public"."instructor_availability" FOR EACH ROW EXECUTE FUNCTION "public"."update_instructor_availability_updated_at"();



CREATE OR REPLACE TRIGGER "update_newsletters_updated_at" BEFORE UPDATE ON "public"."newsletters" FOR EACH ROW EXECUTE FUNCTION "public"."update_newsletters_updated_at"();



CREATE OR REPLACE TRIGGER "update_participant_count_on_delete" AFTER DELETE ON "public"."class_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_class_participant_count"();



CREATE OR REPLACE TRIGGER "update_participant_count_on_insert" AFTER INSERT ON "public"."class_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_class_participant_count"();



CREATE OR REPLACE TRIGGER "update_participant_count_on_update" AFTER UPDATE ON "public"."class_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_class_participant_count"();



CREATE OR REPLACE TRIGGER "update_roles_modtime" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_roles_updated_at"();



CREATE OR REPLACE TRIGGER "update_scheduled_classes_updated_at" BEFORE UPDATE ON "public"."scheduled_classes" FOR EACH ROW EXECUTE FUNCTION "public"."update_scheduled_classes_updated_at"();



CREATE OR REPLACE TRIGGER "update_subscription_plans_updated_at" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transactions_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_packages_updated_at" BEFORE UPDATE ON "public"."user_packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_packages_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_subscriptions_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."article_moderation_logs"
    ADD CONSTRAINT "article_moderation_logs_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_moderation_logs"
    ADD CONSTRAINT "article_moderation_logs_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."article_views"
    ADD CONSTRAINT "article_views_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assignment_bookings"
    ADD CONSTRAINT "assignment_bookings_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."class_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_bookings"
    ADD CONSTRAINT "assignment_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("booking_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_class_package_id_fkey" FOREIGN KEY ("class_package_id") REFERENCES "public"."class_packages"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_class_package_id_fkey" FOREIGN KEY ("class_package_id") REFERENCES "public"."class_packages"("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_class_type_id_fkey" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."class_packages"("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_rescheduled_from_fk" FOREIGN KEY ("rescheduled_from_id") REFERENCES "public"."class_assignments"("id") ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_rescheduled_to_fk" FOREIGN KEY ("rescheduled_to_id") REFERENCES "public"."class_assignments"("id") ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_scheduled_class_id_fkey" FOREIGN KEY ("scheduled_class_id") REFERENCES "public"."class_schedules"("id");



ALTER TABLE ONLY "public"."class_attendance"
    ADD CONSTRAINT "class_attendance_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."class_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_attendance"
    ADD CONSTRAINT "class_attendance_makeup_of_assignment_id_fkey" FOREIGN KEY ("makeup_of_assignment_id") REFERENCES "public"."class_assignments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_attendance"
    ADD CONSTRAINT "class_attendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_bookings"
    ADD CONSTRAINT "class_bookings_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."class_bookings"
    ADD CONSTRAINT "class_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."class_feedback"
    ADD CONSTRAINT "class_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."class_bookings"("id");



ALTER TABLE ONLY "public"."class_feedback"
    ADD CONSTRAINT "class_feedback_scheduled_class_id_fkey" FOREIGN KEY ("scheduled_class_id") REFERENCES "public"."scheduled_classes"("id");



ALTER TABLE ONLY "public"."class_feedback"
    ADD CONSTRAINT "class_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."class_ratings"
    ADD CONSTRAINT "class_ratings_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."class_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_ratings"
    ADD CONSTRAINT "class_ratings_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_class_type_id_fkey" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_types"
    ADD CONSTRAINT "class_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."class_types"
    ADD CONSTRAINT "class_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "fk_class_assignments_assigned_by" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "fk_class_assignments_instructor" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "fk_class_schedules_created_by" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."instructor_rates"
    ADD CONSTRAINT "fk_created_by_auth_users" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_availability"
    ADD CONSTRAINT "instructor_availability_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructor_rates"
    ADD CONSTRAINT "instructor_rates_class_type_id_fkey" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id");



ALTER TABLE ONLY "public"."instructor_rates"
    ADD CONSTRAINT "instructor_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."instructor_rates"
    ADD CONSTRAINT "instructor_rates_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."class_packages"("id");



ALTER TABLE ONLY "public"."instructor_ratings"
    ADD CONSTRAINT "instructor_ratings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."instructor_ratings"
    ADD CONSTRAINT "instructor_ratings_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."instructor_ratings"
    ADD CONSTRAINT "instructor_ratings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("user_id");



ALTER TABLE ONLY "public"."manual_class_selections"
    ADD CONSTRAINT "manual_selections_class_type_fkey" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id");



ALTER TABLE ONLY "public"."manual_class_selections"
    ADD CONSTRAINT "manual_selections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."manual_class_selections"
    ADD CONSTRAINT "manual_selections_instructor_fkey" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."manual_class_selections"
    ADD CONSTRAINT "manual_selections_package_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."class_packages"("id");



ALTER TABLE ONLY "public"."newsletter_subscriptions"
    ADD CONSTRAINT "newsletter_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."newsletters"
    ADD CONSTRAINT "newsletters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."scheduled_classes"
    ADD CONSTRAINT "scheduled_classes_class_type_id_fkey" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id");



ALTER TABLE ONLY "public"."scheduled_classes"
    ADD CONSTRAINT "scheduled_classes_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_assignment_templates"
    ADD CONSTRAINT "templates_class_type_fkey" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id");



ALTER TABLE ONLY "public"."class_assignment_templates"
    ADD CONSTRAINT "templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."class_assignment_templates"
    ADD CONSTRAINT "templates_instructor_fkey" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."class_assignment_templates"
    ADD CONSTRAINT "templates_package_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."class_packages"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_packages"
    ADD CONSTRAINT "user_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."class_packages"("id");



ALTER TABLE ONLY "public"."user_packages"
    ADD CONSTRAINT "user_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_scheduled_class_id_fkey" FOREIGN KEY ("scheduled_class_id") REFERENCES "public"."scheduled_classes"("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can manage all bookings" ON "public"."class_bookings" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage all class assignments" ON "public"."class_assignments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage all class schedules" ON "public"."class_schedules" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all instructor availability" ON "public"."instructor_availability" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage all queries" ON "public"."yoga_queries" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all referrals" ON "public"."referrals" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage all submissions" ON "public"."form_submissions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all templates" ON "public"."class_assignment_templates" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Admins can manage all user packages" ON "public"."user_packages" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage all waitlist entries" ON "public"."waitlist" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage articles" ON "public"."articles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage class types" ON "public"."class_types" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."email" = "auth"."email"()) AND ("admin_users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."email" = "auth"."email"()) AND ("admin_users"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))));



CREATE POLICY "Admins can manage instructor rates" ON "public"."instructor_rates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage newsletter subscribers" ON "public"."newsletter_subscribers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Admins can manage newsletters" ON "public"."newsletters" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage packages" ON "public"."class_packages" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage roles" ON "public"."roles" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage scheduled classes" ON "public"."scheduled_classes" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage subscription plans" ON "public"."subscription_plans" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage subscriptions" ON "public"."user_subscriptions" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage system metrics" ON "public"."system_metrics" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can manage transactions" ON "public"."transactions" TO "authenticated" USING ("public"."check_is_admin"()) WITH CHECK ("public"."check_is_admin"());



CREATE POLICY "Admins can read all activity" ON "public"."user_activity" FOR SELECT TO "authenticated" USING ("public"."check_is_admin"());



CREATE POLICY "Admins can read all feedback" ON "public"."class_feedback" FOR SELECT TO "authenticated" USING ("public"."check_is_admin"());



CREATE POLICY "Admins can read all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Admins can read all subscriptions" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ("public"."check_is_admin"());



CREATE POLICY "Admins can read all transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ("public"."check_is_admin"());



CREATE POLICY "Admins can read article views" ON "public"."article_views" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can read payment methods" ON "public"."payment_methods" FOR SELECT TO "authenticated" USING ("public"."check_is_admin"());



CREATE POLICY "Admins can view all bookings" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Admins can view all manual selections" ON "public"."manual_class_selections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Admins can view all queries" ON "public"."yoga_queries" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all subscriptions" ON "public"."newsletter_subscriptions" FOR SELECT TO "authenticated" USING ("public"."check_is_admin"());



CREATE POLICY "Admins view all roles" ON "public"."user_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) AND ("profiles"."is_active" = true)))));



CREATE POLICY "Allow all users to view class types" ON "public"."class_types" FOR SELECT USING (true);



CREATE POLICY "Allow anon read access to class_types" ON "public"."class_types" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow anon read access to instructor profiles" ON "public"."profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow delete for admin roles" ON "public"."class_schedules" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'instructor'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Allow insert for admin roles" ON "public"."class_schedules" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'instructor'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Allow owner delete for triggers" ON "public"."admin_users" FOR DELETE USING (true);



CREATE POLICY "Allow owner insert for triggers" ON "public"."admin_users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow read for authenticated users" ON "public"."instructor_ratings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read for authenticated users" ON "public"."role_modules" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow update for admin roles" ON "public"."class_schedules" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'instructor'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Anonymous users can create bookings" ON "public"."class_bookings" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Anyone can create yoga queries" ON "public"."yoga_queries" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can insert article views" ON "public"."article_views" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can manage their own ratings" ON "public"."ratings" TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can read active class types" ON "public"."class_types" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can read active packages" ON "public"."class_packages" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Anyone can read active subscription plans" ON "public"."subscription_plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can read business settings" ON "public"."business_settings" FOR SELECT USING (true);



CREATE POLICY "Anyone can read instructor availability" ON "public"."instructor_availability" FOR SELECT TO "authenticated", "anon" USING (("is_available" = true));



CREATE POLICY "Anyone can read published articles" ON "public"."articles" FOR SELECT TO "authenticated", "anon" USING (("status" = 'published'::"text"));



CREATE POLICY "Anyone can read published posts" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"public"."post_status"));



CREATE POLICY "Anyone can read roles" ON "public"."roles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read scheduled classes" ON "public"."scheduled_classes" FOR SELECT TO "authenticated", "anon" USING (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text"])));



CREATE POLICY "Anyone can subscribe to newsletter" ON "public"."newsletter_subscribers" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated Users can manage their own articles" ON "public"."articles" TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authenticated can read admin_users" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authorized roles can delete class types" ON "public"."class_types" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'yoga_acharya'::"text"]))))) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Authorized roles can delete transactions" ON "public"."transactions" FOR DELETE TO "authenticated" USING ("public"."check_user_roles"());



CREATE POLICY "Authorized roles can insert class types" ON "public"."class_types" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'yoga_acharya'::"text"]))))) AND ("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



CREATE POLICY "Authorized roles can insert transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK ("public"."check_user_roles"());



CREATE POLICY "Authorized roles can manage class types" ON "public"."class_types" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Authorized roles can update class types" ON "public"."class_types" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'yoga_acharya'::"text"]))))) OR ("created_by" = "auth"."uid"()))) WITH CHECK ((("created_by" = "auth"."uid"()) AND ("updated_by" = "auth"."uid"())));



CREATE POLICY "Authorized roles can update transactions" ON "public"."transactions" FOR UPDATE TO "authenticated" USING ("public"."check_user_roles"()) WITH CHECK ("public"."check_user_roles"());



CREATE POLICY "Authorized roles can view transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ("public"."check_user_roles"());



CREATE POLICY "Enable delete for users with management roles" ON "public"."class_schedules" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'instructor'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Enable insert for users with management roles" ON "public"."class_schedules" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'instructor'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Enable update for users with management roles" ON "public"."class_schedules" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'instructor'::"text", 'yoga_acharya'::"text"]))))));



CREATE POLICY "Everyone can read roles" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Instructors can manage own assignments" ON "public"."class_assignments" TO "authenticated" USING (("auth"."uid"() = "instructor_id")) WITH CHECK (("auth"."uid"() = "instructor_id"));



CREATE POLICY "Instructors can view own templates" ON "public"."class_assignment_templates" FOR SELECT USING (("instructor_id" = "auth"."uid"()));



CREATE POLICY "Public can read active class schedules" ON "public"."class_schedules" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Public users can create submissions" ON "public"."form_submissions" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Roles are publicly viewable" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Selective assignment visibility" ON "public"."class_assignments" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "instructor_id") OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'yoga_acharya'::"text", 'student_coordinator'::"text"])))))));



CREATE POLICY "Service role can manage admin_users" ON "public"."admin_users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage profiles" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."user_roles" USING (true) WITH CHECK (true);



CREATE POLICY "Super admin can manage business settings" ON "public"."business_settings" TO "authenticated" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Super admins can manage roles" ON "public"."roles" TO "authenticated" USING ("public"."check_can_manage_roles"()) WITH CHECK ("public"."check_can_manage_roles"());



CREATE POLICY "System can insert activity" ON "public"."user_activity" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert user packages" ON "public"."user_packages" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create referrals" ON "public"."referrals" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "referrer_id"));



CREATE POLICY "Users can create submissions" ON "public"."form_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create their own bookings" ON "public"."class_bookings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage own rates" ON "public"."instructor_rates" TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can manage their own feedback" ON "public"."class_feedback" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own payment methods" ON "public"."payment_methods" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own preferences" ON "public"."user_preferences" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own subscriptions" ON "public"."newsletter_subscriptions" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own waitlist entries" ON "public"."waitlist" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own activity" ON "public"."user_activity" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own subscriptions" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bookings" ON "public"."class_bookings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own packages" ON "public"."user_packages" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own manual selections" ON "public"."manual_class_selections" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own bookings" ON "public"."class_bookings" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own packages" ON "public"."user_packages" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view their own queries" ON "public"."yoga_queries" FOR SELECT TO "authenticated" USING (("email" = "auth"."email"()));



CREATE POLICY "Users can view their own referrals" ON "public"."referrals" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referee_id")));



CREATE POLICY "Users can view their own waitlist entries" ON "public"."waitlist" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own roles" ON "public"."user_roles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Yoga Acharyas can manage assignments" ON "public"."class_assignments" TO "authenticated" USING ((("auth"."uid"() = "instructor_id") OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'yoga_acharya'::"text")))))) WITH CHECK ((("auth"."uid"() = "instructor_id") OR (EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'yoga_acharya'::"text"))))));



CREATE POLICY "admin_email_access" ON "public"."contact_messages" TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = 'gourab.master@gmail.com'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = 'gourab.master@gmail.com'::"text"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins_manage_all" ON "public"."bookings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "allow_contact_submissions" ON "public"."contact_messages" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."article_moderation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."article_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_read" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_insert_own" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "authenticated_users_select_own" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "author_select_own_logs" ON "public"."article_moderation_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."articles"
  WHERE (("articles"."id" = "article_moderation_logs"."article_id") AND ("articles"."author_id" = "auth"."uid"())))));



CREATE POLICY "auto_admin_access" ON "public"."contact_messages" TO "authenticated" USING ("public"."check_admin_role"()) WITH CHECK ("public"."check_admin_role"());



ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_assignment_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "del_attendance_admin" ON "public"."class_attendance" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "delete_instructor_rates_policy" ON "public"."instructor_rates" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "delete_newsletters_policy" ON "public"."newsletters" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ins_attendance_instructor" ON "public"."class_attendance" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."class_assignments" "ca"
  WHERE (("ca"."id" = "class_attendance"."assignment_id") AND ("ca"."instructor_id" = "auth"."uid"()) AND ("ca"."attendance_locked" = false)))) OR "public"."is_admin"()));



CREATE POLICY "ins_class_ratings_member" ON "public"."class_ratings" FOR INSERT WITH CHECK ((("member_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."class_assignments" "ca"
  WHERE (("ca"."id" = "class_ratings"."assignment_id") AND (((((("ca"."date")::"text" || ' '::"text") || ("ca"."end_time")::"text"))::timestamp without time zone AT TIME ZONE "ca"."timezone") <= "now"())))) AND (EXISTS ( SELECT 1
   FROM "public"."class_attendance" "att"
  WHERE (("att"."assignment_id" = "class_ratings"."assignment_id") AND ("att"."member_id" = "auth"."uid"()) AND ("att"."status" = ANY (ARRAY['present'::"public"."attendance_status_enum", 'late'::"public"."attendance_status_enum", 'makeup_completed'::"public"."attendance_status_enum"])))))));



CREATE POLICY "insert_instructor_rates_policy" ON "public"."instructor_rates" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "insert_newsletter_send_logs_policy" ON "public"."newsletter_send_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "insert_newsletters_policy" ON "public"."newsletters" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."instructor_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instructor_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_class_selections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mod_ratings_admin" ON "public"."class_ratings" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."newsletter_send_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sangha_guide_insert_logs" ON "public"."article_moderation_logs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
     JOIN "public"."profiles" "p" ON (("ur"."user_id" = "p"."user_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'sangha_guide'::"text") AND ("p"."is_active" = true)))));



CREATE POLICY "sangha_guide_read_all_articles" ON "public"."articles" FOR SELECT USING ("public"."has_role"('sangha_guide'::"text"));



CREATE POLICY "sangha_guide_select_logs" ON "public"."article_moderation_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
     JOIN "public"."profiles" "p" ON (("ur"."user_id" = "p"."user_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = 'sangha_guide'::"text") AND ("p"."is_active" = true)))));



CREATE POLICY "sangha_guide_update_articles" ON "public"."articles" FOR UPDATE USING ("public"."has_role"('sangha_guide'::"text")) WITH CHECK ("public"."has_role"('sangha_guide'::"text"));



ALTER TABLE "public"."scheduled_classes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sel_attendance_instructor" ON "public"."class_attendance" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."class_assignments" "ca"
  WHERE (("ca"."id" = "class_attendance"."assignment_id") AND ("ca"."instructor_id" = "auth"."uid"())))) OR "public"."is_admin"()));



CREATE POLICY "sel_attendance_member" ON "public"."class_attendance" FOR SELECT USING (("member_id" = "auth"."uid"()));



CREATE POLICY "sel_ratings_instructor" ON "public"."class_ratings" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."class_assignments" "ca"
  WHERE (("ca"."id" = "class_ratings"."assignment_id") AND ("ca"."instructor_id" = "auth"."uid"())))) OR "public"."is_admin"() OR ("member_id" = "auth"."uid"())));



CREATE POLICY "select_instructor_rates_policy" ON "public"."instructor_rates" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "select_newsletters_policy" ON "public"."newsletters" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "service_role_access" ON "public"."admin_users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "simple_admin_access" ON "public"."contact_messages" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "upd_attendance_instructor" ON "public"."class_attendance" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."class_assignments" "ca"
  WHERE (("ca"."id" = "class_attendance"."assignment_id") AND ("ca"."instructor_id" = "auth"."uid"()) AND ("ca"."attendance_locked" = false)))) OR "public"."is_admin"())) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."class_assignments" "ca"
  WHERE (("ca"."id" = "class_attendance"."assignment_id") AND ("ca"."instructor_id" = "auth"."uid"()) AND ("ca"."attendance_locked" = false)))) OR "public"."is_admin"()));



CREATE POLICY "upd_class_ratings_member" ON "public"."class_ratings" FOR UPDATE USING ((("member_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."class_attendance" "att"
  WHERE (("att"."assignment_id" = "class_ratings"."assignment_id") AND ("att"."member_id" = "auth"."uid"()) AND ("att"."status" = ANY (ARRAY['present'::"public"."attendance_status_enum", 'late'::"public"."attendance_status_enum", 'makeup_completed'::"public"."attendance_status_enum"]))))))) WITH CHECK ((("member_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."class_attendance" "att"
  WHERE (("att"."assignment_id" = "class_ratings"."assignment_id") AND ("att"."member_id" = "auth"."uid"()) AND ("att"."status" = ANY (ARRAY['present'::"public"."attendance_status_enum", 'late'::"public"."attendance_status_enum", 'makeup_completed'::"public"."attendance_status_enum"])))))));



CREATE POLICY "update_instructor_rates_policy" ON "public"."instructor_rates" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "update_newsletters_policy" ON "public"."newsletters" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("r"."id" = "ur"."role_id")))
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("r"."name" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))));



ALTER TABLE "public"."user_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_own_messages" ON "public"."contact_messages" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("email" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text")));



ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."yoga_queries" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_to_admin_users_on_admin_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_admin_users_on_admin_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_admin_users_on_admin_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_user_roles"("target_user_id" "uuid", "new_role_names" "text"[], "requesting_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_user_roles"("target_user_id" "uuid", "new_role_names" "text"[], "requesting_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_user_roles"("target_user_id" "uuid", "new_role_names" "text"[], "requesting_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_default_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_default_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_default_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_manage_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_admin_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_admin_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_admin_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_admin_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_admin_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_admin_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_admin_role"("check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_admin_role"("check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_admin_role"("check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_can_manage_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_can_manage_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_can_manage_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."convert_assignment_to_timezone"("assignment_date" "date", "assignment_time" time without time zone, "stored_timezone" "text", "target_timezone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."convert_assignment_to_timezone"("assignment_date" "date", "assignment_time" time without time zone, "stored_timezone" "text", "target_timezone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."convert_assignment_to_timezone"("assignment_date" "date", "assignment_time" time without time zone, "stored_timezone" "text", "target_timezone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_after_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_after_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_after_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_and_role_after_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_and_role_after_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_and_role_after_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_user_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_user_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_user_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."diagnose_user_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."diagnose_user_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."diagnose_user_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."fix_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_booking_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_booking_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_booking_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_booking_details"("booking_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_booking_details"("booking_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_booking_details"("booking_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_highest_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_highest_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_highest_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_instructors"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_instructors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_instructors"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profiles_for_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profiles_for_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profiles_for_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_with_roles"("role_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_with_roles"("role_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_with_roles"("role_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_mantra_curator"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_mantra_curator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_mantra_curator"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_super_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_past_class_attendance"() TO "anon";
GRANT ALL ON FUNCTION "public"."lock_past_class_attendance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_past_class_attendance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."promote_from_waitlist"() TO "anon";
GRANT ALL ON FUNCTION "public"."promote_from_waitlist"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_from_waitlist"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."remove_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_article_author"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_article_author"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_article_author"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_booking_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_booking_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_booking_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_class_attendance_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_class_attendance_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_class_attendance_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_class_ratings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_class_ratings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_class_ratings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_contact_message_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_contact_message_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_contact_message_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_admin_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_admin_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_admin_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_missing_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_missing_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_missing_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_add_to_admin_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_add_to_admin_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_add_to_admin_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_article_view_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_article_view_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_article_view_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_class_assignments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_class_assignments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_class_assignments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_class_bookings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_class_bookings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_class_bookings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_class_packages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_class_packages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_class_packages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_class_participant_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_class_participant_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_class_participant_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_instructor_availability_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_instructor_availability_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_instructor_availability_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_newsletters_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_newsletters_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_newsletters_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_roles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_roles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_roles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_scheduled_classes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_scheduled_classes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_scheduled_classes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_packages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_packages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_packages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_attendance"("p_assignment_id" "uuid", "p_member_id" "uuid", "p_status" "public"."attendance_status_enum", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_attendance"("p_assignment_id" "uuid", "p_member_id" "uuid", "p_status" "public"."attendance_status_enum", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_attendance"("p_assignment_id" "uuid", "p_member_id" "uuid", "p_status" "public"."attendance_status_enum", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_class_rating"("p_assignment_id" "uuid", "p_rating" smallint, "p_comment" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_class_rating"("p_assignment_id" "uuid", "p_rating" smallint, "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_class_rating"("p_assignment_id" "uuid", "p_rating" smallint, "p_comment" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."assignment_bookings" TO "anon";
GRANT ALL ON TABLE "public"."assignment_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."class_attendance" TO "anon";
GRANT ALL ON TABLE "public"."class_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."class_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."admin_assignment_roster_v" TO "anon";
GRANT ALL ON TABLE "public"."admin_assignment_roster_v" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_assignment_roster_v" TO "service_role";



GRANT ALL ON TABLE "public"."admin_class_overview_v" TO "anon";
GRANT ALL ON TABLE "public"."admin_class_overview_v" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_class_overview_v" TO "service_role";



GRANT ALL ON TABLE "public"."admin_class_overview_mv" TO "anon";
GRANT ALL ON TABLE "public"."admin_class_overview_mv" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_class_overview_mv" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."article_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."article_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."article_moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."article_views" TO "anon";
GRANT ALL ON TABLE "public"."article_views" TO "authenticated";
GRANT ALL ON TABLE "public"."article_views" TO "service_role";



GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_bookings_view_roster" TO "anon";
GRANT ALL ON TABLE "public"."assignment_bookings_view_roster" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_bookings_view_roster" TO "service_role";



GRANT ALL ON TABLE "public"."class_assignments" TO "anon";
GRANT ALL ON TABLE "public"."class_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."class_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."class_packages" TO "anon";
GRANT ALL ON TABLE "public"."class_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."class_packages" TO "service_role";



GRANT ALL ON TABLE "public"."class_types" TO "anon";
GRANT ALL ON TABLE "public"."class_types" TO "authenticated";
GRANT ALL ON TABLE "public"."class_types" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."assignments_with_timezone" TO "anon";
GRANT ALL ON TABLE "public"."assignments_with_timezone" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments_with_timezone" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."business_settings" TO "anon";
GRANT ALL ON TABLE "public"."business_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."business_settings" TO "service_role";



GRANT ALL ON TABLE "public"."class_assignment_financials" TO "anon";
GRANT ALL ON TABLE "public"."class_assignment_financials" TO "authenticated";
GRANT ALL ON TABLE "public"."class_assignment_financials" TO "service_role";



GRANT ALL ON TABLE "public"."class_assignment_templates" TO "anon";
GRANT ALL ON TABLE "public"."class_assignment_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."class_assignment_templates" TO "service_role";



GRANT ALL ON TABLE "public"."class_bookings" TO "anon";
GRANT ALL ON TABLE "public"."class_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."class_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."class_feedback" TO "anon";
GRANT ALL ON TABLE "public"."class_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."class_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."class_ratings" TO "anon";
GRANT ALL ON TABLE "public"."class_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."class_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."class_schedules" TO "anon";
GRANT ALL ON TABLE "public"."class_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."class_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_availability" TO "anon";
GRANT ALL ON TABLE "public"."instructor_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_availability" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_rates" TO "anon";
GRANT ALL ON TABLE "public"."instructor_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_rates" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_ratings" TO "anon";
GRANT ALL ON TABLE "public"."instructor_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_upcoming_classes_v" TO "anon";
GRANT ALL ON TABLE "public"."instructor_upcoming_classes_v" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_upcoming_classes_v" TO "service_role";



GRANT ALL ON TABLE "public"."manual_class_selections" TO "anon";
GRANT ALL ON TABLE "public"."manual_class_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."manual_class_selections" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_send_logs" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_send_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_send_logs" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."newsletters" TO "anon";
GRANT ALL ON TABLE "public"."newsletters" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletters" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."role_modules" TO "anon";
GRANT ALL ON TABLE "public"."role_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."role_modules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."role_modules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_modules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_modules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_classes" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_classes" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."system_metrics" TO "anon";
GRANT ALL ON TABLE "public"."system_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."system_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."transactions_with_user" TO "anon";
GRANT ALL ON TABLE "public"."transactions_with_user" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions_with_user" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity" TO "anon";
GRANT ALL ON TABLE "public"."user_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity" TO "service_role";



GRANT ALL ON TABLE "public"."user_engagement_metrics" TO "anon";
GRANT ALL ON TABLE "public"."user_engagement_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_engagement_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."user_packages" TO "anon";
GRANT ALL ON TABLE "public"."user_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."user_packages" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."yoga_queries" TO "anon";
GRANT ALL ON TABLE "public"."yoga_queries" TO "authenticated";
GRANT ALL ON TABLE "public"."yoga_queries" TO "service_role";



GRANT ALL ON TABLE "public"."zoom_tokens" TO "anon";
GRANT ALL ON TABLE "public"."zoom_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."zoom_tokens" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























