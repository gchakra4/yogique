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
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, user_id, phone, channel, provider, code_hash, attempts, expires_at, used, metadata, created_at) FROM stdin;
3bf2d356-f534-488f-a86f-fa34376f0827	\N	+919088951685	whatsapp	meta	762d172fce2ea356a99074f59eb7c024b79c4b8a730d67417440335e395f3da7	0	2025-12-28 12:57:28.475+00	f	{}	2025-12-28 12:47:28.511104+00
fcbff797-a76e-4cd1-a113-962cab43a909	\N	+919088951685	whatsapp	meta	e92fd361019a156254e501ae91eaeaba06c86af7bc2d732b27bfec78f8bc877a	1	2025-12-28 12:59:36.797+00	t	{}	2025-12-28 12:49:36.829826+00
e4d122d9-f7ca-4052-9290-4c593dd911f5	\N	+919088951685	whatsapp	meta	f769bfa1f54625e8a5d4a9f4bfcffd934954bf2c1561d27547b49357ab8941d1	0	2025-12-28 13:09:04.114+00	f	{}	2025-12-28 12:59:04.161156+00
ffbe306e-c209-436c-8bf6-33b17339559c	\N	+919088951685	whatsapp	meta	fc68a047a9d934d1efce349ddb0526d498d32fda9fbaf5f784f295a46ad98f1a	1	2025-12-28 13:41:56.787+00	t	{}	2025-12-28 13:31:56.846836+00
a6172bb9-ad67-4ecf-a021-4f7e5cdbde3a	730d4a10-3e3c-48ab-8f48-e459a972176c	+919088951685	whatsapp	meta	14bcb845c4eed1a1e73cb90440effc892748503c215ce7a1b25cf58bd3e53233	1	2025-12-28 13:52:06.928+00	t	{}	2025-12-28 13:42:06.957716+00
4275d2ff-9b31-4fba-a710-64ccd799c2b6	730d4a10-3e3c-48ab-8f48-e459a972176c	+919088951685	whatsapp	meta	c31aa48e5eff91063ad1a4cb1e7111c3158afb985023586b099753c32b5391da	0	2025-12-28 13:53:13.868+00	f	{}	2025-12-28 13:43:13.898029+00
ade48af9-1256-4d96-90c8-e1f784544c13	730d4a10-3e3c-48ab-8f48-e459a972176c	+919088951685	whatsapp	meta	b6df7c6488a8ccc1051966a610ff3f55e5e2b643cfbbf1ffbf296cfb72051581	1	2025-12-28 14:34:52.908+00	t	{}	2025-12-28 14:24:52.929454+00
\.


--
-- PostgreSQL database dump complete
--

