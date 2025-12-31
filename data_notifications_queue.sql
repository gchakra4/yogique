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
-- Data for Name: notifications_queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications_queue (id, channel, recipient, template_key, template_language, vars, metadata, status, attempts, last_error, run_after, created_at, updated_at, subject, html, bcc, "from") FROM stdin;
12dc4c81-038e-41b4-bc9a-91802749081f	whatsapp	919088951685	class_reminder_zoom	en	{"title": "Test Class", "zoom_link": "https://zoom.us/j/test123", "class_time": "2025-12-30 10:00"}	{"test": true}	sent	2	\N	2025-12-29 09:50:18.638+00	2025-12-29 09:50:02.18825+00	2025-12-29 09:50:48.621+00	\N	\N	\N	\N
f561d2df-2735-4550-8489-eb70d909f2cc	email	gourab.master@gmail.com	\N	en	\N	{"email": {"from": "noreply@dev.yogique.life", "html": "<p>Test email body</p>", "subject": "Test Email"}}	sent	1	\N	2025-12-29 10:15:01.901105+00	2025-12-29 10:15:01.901105+00	2025-12-29 10:15:15.009+00	\N	\N	\N	\N
4d11f591-c0c7-4cb9-b82b-91bcf9e4720e	whatsapp	\N	\N	en	\N	{"test": true, "activity": "class_reminder", "class_id": "59452e8d-aa98-407c-89e4-caf04a8a7462"}	pending	2	func_status=500 body={"error":"templateKey is required for WhatsApp/SMS SUPABASE_SERVICE_ROLE_KEY"}	2025-12-29 10:20:08.18+00	2025-12-29 09:53:05.218797+00	2025-12-29 10:20:06.18+00	\N	\N	\N	\N
e4721126-d448-44ed-b703-89dcba46665f	email	gourab.master@gmail.com	\N	en	\N	\N	sent	1	\N	2025-12-29 10:20:03.652382+00	2025-12-29 10:20:03.652382+00	2025-12-29 10:20:07.936+00	Test with Direct Columns	<h1>Success!</h1><p>This email uses the new direct columns in notifications_queue table.</p>	\N	noreply@dev.yogique.life
\.


--
-- PostgreSQL database dump complete
--

