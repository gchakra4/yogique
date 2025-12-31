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
-- Data for Name: invoice_emails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_emails (id, invoice_id, recipient_email, email_type, payment_link_id, sent_at, email_provider_id, email_status, metadata, created_at) FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

