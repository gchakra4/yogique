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
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, invoice_number, booking_id, user_id, amount, currency, tax_rate, tax_amount, total_amount, billing_period_start, billing_period_end, billing_month, due_date, status, proration_note, created_at, updated_at, paid_at) FROM stdin;
7df444f2-cdbb-4351-8417-179ba9f267ea	YG-202512-6319	3b21cd56-316a-4050-860c-75bd80914197	ec93a28b-5698-49cf-ad9e-ed4c83870094	5000.00	INR	0.00	0.00	5000.00	2025-12-19	2025-12-31	Dec 2025	2025-12-19	pending	First month prorated: 1 classes scheduled out of 1 package classes	2025-12-19 15:12:19.39205+00	2025-12-19 15:12:19.39205+00	\N
d5e8ca22-063e-4ae0-b2b4-bae7a25b9c7e	YG-202512-0067	63f8eaa6-898c-46e5-9e95-cca1e80cc09d	ec93a28b-5698-49cf-ad9e-ed4c83870094	5000.00	INR	0.00	0.00	5000.00	2025-12-23	2025-12-31	Dec 2025	2025-12-23	pending	First month prorated: 1 classes scheduled out of 1 package classes	2025-12-19 15:55:06.513824+00	2025-12-19 15:55:06.513824+00	\N
ba26418c-0bf6-4f0f-8e07-39670de99917	YG-202512-2595	c9c0083c-962a-460b-8c2e-3adf1fc04d52	ec93a28b-5698-49cf-ad9e-ed4c83870094	5000.00	INR	0.00	0.00	5000.00	2025-12-24	2025-12-31	Dec 2025	2025-12-24	pending	First month prorated: 1 classes scheduled out of 1 package classes	2025-12-19 17:37:51.82136+00	2025-12-19 17:37:51.82136+00	\N
\.


--
-- PostgreSQL database dump complete
--

