--
-- PostgreSQL database cluster dump
--

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE anon;
ALTER ROLE anon WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticated;
ALTER ROLE authenticated WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticator;
ALTER ROLE authenticator WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:ummk0/Fp6k7H96ASySou4Q==$MxYXZBAspkD/CmAReuPaU69q5QO3D4IEg0DhxMZAxLw=:XBCaMs+Zw+605TnryVn8y42eiunL7DQtYH0b7R+eD2Q=';
CREATE ROLE cli_login_postgres;
ALTER ROLE cli_login_postgres WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Aiaaa/ATbmPFTtO9u4QyRA==$Ma0T7ECrfKcak74D2mZDIScvGotAgie54Zy54QEV7+s=:zw64kp0KS6R3ZC6poURkBpVzWm4jJSLyblpHS6XgfzU=' VALID UNTIL '2025-12-29 12:03:02.354889+00';
CREATE ROLE dashboard_user;
ALTER ROLE dashboard_user WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB NOLOGIN REPLICATION NOBYPASSRLS;
CREATE ROLE pgbouncer;
ALTER ROLE pgbouncer WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:WJ45xuMjiXjNrTzOBXJimw==$0yJnd6t9V6+7bdUDYQWl4Lplkk0CmFTn1lpGwPxLfV4=:kaHyhfXLsBgfuVJphjFP5oG8+tN6eoE3yObYZhFK5Qs=';
CREATE ROLE postgres;
ALTER ROLE postgres WITH NOSUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:8MVuU+VfYp4q+l0qC+nTuw==$WNBdSQydkwvcdbuq8MJGNkaShMbm7OTjSUippKzZrnE=:C5QixqLBQ5h+LZJcWKNvJ+AV705OA+EPniRhxHG1SZU=';
CREATE ROLE service_role;
ALTER ROLE service_role WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION BYPASSRLS;
CREATE ROLE supabase_admin;
ALTER ROLE supabase_admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:MdpdqchA33rjUKrHp3PG/g==$+p1AP98ZB1zA3WPZWb8QXyeqvMG4l/8cJNgoIDEc6/k=:Ed6as2idbS600YZpWd0g9PWkvezWCwIbNkApW4yXBY4=';
CREATE ROLE supabase_auth_admin;
ALTER ROLE supabase_auth_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:DFbB0TTOlVUscIGwy949Yw==$dPob/fW6cmEWI/8NGnO0t5F5JqFT3slhZdxn7OVSuvA=:wHhLpWuJID/suZuYhz/gxQDFKtkYRnUd6g+CTdSS1ok=';
CREATE ROLE supabase_read_only_user;
ALTER ROLE supabase_read_only_user WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:BWj4wscV+ZZAP9XWjqeeVA==$5i961Z9qV4womI7hlaeEj7oEoxnHkZATOlVx6CnxP34=:fMVJcoMgF1LfeP7N1NPV2wC41GyjvQF1WHTEozH63AI=';
CREATE ROLE supabase_realtime_admin;
ALTER ROLE supabase_realtime_admin WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE supabase_replication_admin;
ALTER ROLE supabase_replication_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN REPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:mACLN45QxJMd7+zhFKPN6A==$V4/ebsH6dFH9cRcL/1pAyesV48sAm0X6Mp9WBcJk4Eo=:T3eEAkpWuGYYxawUy8in+nmesRtEky1O5M2obklP/Tg=';
CREATE ROLE supabase_storage_admin;
ALTER ROLE supabase_storage_admin WITH NOSUPERUSER NOINHERIT CREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:7QYE0stG8n57d5zWB2KsCw==$z5qhfI63AdJJtoVtok2/4BGr5IFW/rxOgjmMnLt0fOo=:TWnDgC4WUFPMCc3MjggbYnSTt2GMektUDHyrSIZRfl8=';

--
-- User Configurations
--

--
-- User Config "anon"
--

ALTER ROLE anon SET statement_timeout TO '3s';

--
-- User Config "authenticated"
--

ALTER ROLE authenticated SET statement_timeout TO '8s';

--
-- User Config "authenticator"
--

ALTER ROLE authenticator SET session_preload_libraries TO 'safeupdate';
ALTER ROLE authenticator SET statement_timeout TO '8s';
ALTER ROLE authenticator SET lock_timeout TO '8s';

--
-- User Config "postgres"
--

ALTER ROLE postgres SET search_path TO E'\\$user', 'public', 'extensions';

--
-- User Config "supabase_admin"
--

ALTER ROLE supabase_admin SET search_path TO '$user', 'public', 'auth', 'extensions';
ALTER ROLE supabase_admin SET log_statement TO 'none';

--
-- User Config "supabase_auth_admin"
--

ALTER ROLE supabase_auth_admin SET search_path TO 'auth';
ALTER ROLE supabase_auth_admin SET idle_in_transaction_session_timeout TO '60000';
ALTER ROLE supabase_auth_admin SET log_statement TO 'none';

--
-- User Config "supabase_storage_admin"
--

ALTER ROLE supabase_storage_admin SET search_path TO 'storage';
ALTER ROLE supabase_storage_admin SET log_statement TO 'none';


--
-- Role memberships
--

GRANT anon TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT anon TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticated TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT authenticated TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticator TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT authenticator TO supabase_storage_admin WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT pg_create_subscription TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_monitor TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_monitor TO supabase_read_only_user WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_read_all_data TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_read_all_data TO supabase_read_only_user WITH INHERIT TRUE GRANTED BY supabase_admin;
GRANT pg_signal_backend TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT postgres TO cli_login_postgres WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT service_role TO authenticator WITH INHERIT FALSE GRANTED BY supabase_admin;
GRANT service_role TO postgres WITH ADMIN OPTION, INHERIT TRUE GRANTED BY supabase_admin;
GRANT supabase_realtime_admin TO postgres WITH INHERIT TRUE GRANTED BY supabase_admin;






--
-- PostgreSQL database cluster dump complete
--

