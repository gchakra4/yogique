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
-- Data for Name: payment_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_links (id, invoice_id, razorpay_link_id, short_url, status, razorpay_response, created_at, updated_at, expires_at) FROM stdin;
e833fb71-a929-42bd-a9b8-1bdc4743d546	7df444f2-cdbb-4351-8417-179ba9f267ea	plink_RtW0oj3vIIhYxG	https://rzp.io/rzp/HeMpHbO	created	{"id": "plink_RtW0oj3vIIhYxG", "notes": {"invoice_id": "7df444f2-cdbb-4351-8417-179ba9f267ea", "booking_ref": "YOG-20251219-1855", "billing_month": "Dec 2025", "invoice_number": "YG-202512-6319"}, "amount": 500000, "notify": {"sms": false, "email": false, "whatsapp": false}, "status": "created", "user_id": "", "currency": "INR", "customer": {"name": "Gourab Chakraborty", "email": "gourab.master@gmail.com", "contact": "9088951685"}, "payments": null, "upi_link": false, "expire_by": 0, "reminders": [], "short_url": "https://rzp.io/rzp/HeMpHbO", "created_at": 1766157181, "expired_at": 0, "updated_at": 1766157181, "amount_paid": 0, "description": "Invoice YG-202512-6319 - Dec 2025", "callback_url": "https://iddvvefpwgwmgpyelzcv.supabase.co/functions/v1/payment-webhook", "cancelled_at": 0, "reference_id": "7df444f2-cdbb-4351-8417-179ba9f267ea", "whatsapp_link": false, "accept_partial": false, "callback_method": "get", "reminder_enable": false, "first_min_partial_amount": 0}	2025-12-19 15:13:01.149585+00	2025-12-19 15:13:01.149585+00	1970-01-01 00:00:00+00
555191bf-4479-463b-955d-8ef137b52d8d	d5e8ca22-063e-4ae0-b2b4-bae7a25b9c7e	plink_RtWkaeomaGcpaD	https://rzp.io/rzp/AB6OZlXD	created	{"id": "plink_RtWkaeomaGcpaD", "notes": {"invoice_id": "d5e8ca22-063e-4ae0-b2b4-bae7a25b9c7e", "booking_ref": "YOG-20251219-1846", "billing_month": "Dec 2025", "invoice_number": "YG-202512-0067"}, "amount": 500000, "notify": {"sms": false, "email": false, "whatsapp": false}, "status": "created", "user_id": "", "currency": "INR", "customer": {"name": "Gullu Charan", "email": "gourab.master@gmail.com", "contact": "9088951674"}, "payments": null, "upi_link": false, "expire_by": 0, "reminders": [], "short_url": "https://rzp.io/rzp/AB6OZlXD", "created_at": 1766159780, "expired_at": 0, "updated_at": 1766159780, "amount_paid": 0, "description": "Invoice YG-202512-0067 - Dec 2025", "callback_url": "https://iddvvefpwgwmgpyelzcv.supabase.co/functions/v1/payment-webhook", "cancelled_at": 0, "reference_id": "d5e8ca22-063e-4ae0-b2b4-bae7a25b9c7e", "whatsapp_link": false, "accept_partial": false, "callback_method": "get", "reminder_enable": false, "first_min_partial_amount": 0}	2025-12-19 15:56:20.724494+00	2025-12-19 15:56:20.724494+00	\N
07d13563-8509-4df0-af15-5f69a951655d	ba26418c-0bf6-4f0f-8e07-39670de99917	plink_RtYUMAvDzuX1gi	https://rzp.io/rzp/iGBQ1ePA	created	{"id": "plink_RtYUMAvDzuX1gi", "notes": {"invoice_id": "ba26418c-0bf6-4f0f-8e07-39670de99917", "booking_ref": "YOG-20251219-6442", "billing_month": "Dec 2025", "invoice_number": "YG-202512-2595"}, "amount": 500000, "notify": {"sms": false, "email": false, "whatsapp": false}, "status": "created", "user_id": "", "currency": "INR", "customer": {"name": "fsefs esfsef", "email": "gourab.master@gmail.com", "contact": "9088951685"}, "payments": null, "upi_link": false, "expire_by": 0, "reminders": [], "short_url": "https://rzp.io/rzp/iGBQ1ePA", "created_at": 1766165901, "expired_at": 0, "updated_at": 1766165901, "amount_paid": 0, "description": "Invoice YG-202512-2595 - Dec 2025", "callback_url": "https://iddvvefpwgwmgpyelzcv.supabase.co/functions/v1/payment-webhook", "cancelled_at": 0, "reference_id": "ba26418c-0bf6-4f0f-8e07-39670de99917", "whatsapp_link": false, "accept_partial": false, "callback_method": "get", "reminder_enable": false, "first_min_partial_amount": 0}	2025-12-19 17:38:21.854421+00	2025-12-19 17:38:21.854421+00	\N
\.


--
-- PostgreSQL database dump complete
--

