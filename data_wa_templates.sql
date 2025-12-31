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
-- Data for Name: wa_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wa_templates (id, key, meta_name, language, category, status, components, variables, example, has_buttons, button_types, approved, version, created_by, created_at, activities, default_vars) FROM stdin;
4fa85a94-deb7-414e-a511-0a402f693e5e	hello_world	hello_world	en	UTILITY	APPROVED	[]	[]	\N	f	[]	t	1	\N	2025-12-28 17:43:21.72963+00	[]	{}
dece8eeb-df6f-4fc1-9b5d-168e1c0b5400	yogique_booking_confirmation	yogique_booking_confirmation	en	UTILITY	APPROVED	[]	[]	\N	t	["PHONE_NUMBER"]	t	1	\N	2025-12-28 17:43:21.576195+00	["booking_confirmation"]	{}
42561b50-3fc4-4ae5-9056-3fca8de47cd1	yogique_test	yogique_test	en	UTILITY	APPROVED	[]	[]	\N	f	[]	t	1	\N	2025-12-28 17:43:21.651165+00	[]	{}
537d8191-735a-4b74-945f-36024e2141b2	class_reminder_zoom	yogique_class_reminder_zoom	en	MARKETING	APPROVED	[]	[]	\N	f	[]	t	1	\N	2025-12-28 17:43:21.504853+00	["class_reminder"]	{"platform": "zoom"}
a6d256f6-5a4d-4a21-9454-e32524094867	yogique_payment_success	yogique_payment_success	en	UTILITY	APPROVED	[]	[]	\N	f	[]	t	1	\N	2025-12-28 17:43:21.434406+00	["payment_success"]	{}
749cb340-47c1-43d2-9c2a-cd1bbd7ee4e5	yogique_payment_due_reminder	yogique_payment_due_reminder	en	UTILITY	APPROVED	[{"text": "Hi {{1}}, your payment of {{2}} is due on {{3}}. Pay: {{4}}", "type": "body"}, {"type": "buttons", "buttons": [{"type": "URL"}]}]	[]	\N	t	["URL"]	t	1	\N	2025-12-28 17:43:21.360892+00	["payment_due", "payment_overdue"]	{}
f5089c8c-bd91-44f3-89cd-4689958d95ec	yogique_next_class_alerts	yogique_next_class_alerts	en	UTILITY	APPROVED	[]	[]	\N	f	[]	t	1	\N	2025-12-28 17:43:20.962508+00	["class_reminder"]	{"platform": "zoom"}
1c382c65-b338-4a1e-94ac-ab48a8428fcd	yogique_payment_successful	yogique_payment_successful	en	UTILITY	APPROVED	[]	[]	\N	f	[]	t	1	\N	2025-12-28 17:43:21.21746+00	["payment_success"]	{}
4d15d01a-fe14-4050-854e-7113d264b6a8	payment_overdue_reminder	payment_overdue_reminder	en	MARKETING	APPROVED	[]	[]	\N	t	["URL"]	t	1	\N	2025-12-28 17:43:21.286318+00	["payment_due", "payment_overdue"]	{}
240b1a80-54af-4fa8-b2f6-381a4e33c974	yogique_invoice_generated	yogique_invoice_generated	en	MARKETING	APPROVED	[]	[]	\N	t	["URL"]	t	1	\N	2025-12-28 17:43:21.145711+00	["invoice_generated"]	{}
7aca7b4e-26b3-4b2c-9887-e60b0699fb1b	yogique_otp_phone_verification	yogique_otp_phone_verification	en	AUTHENTICATION	APPROVED	[]	[]	\N	t	["URL"]	t	1	\N	2025-12-28 17:43:21.068816+00	["otp_verification"]	{}
\.


--
-- PostgreSQL database dump complete
--

