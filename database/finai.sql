--
-- PostgreSQL database dump
--

\restrict ZA7NCCHPPlD9Bc05nS5y8FiLDQt6QEfN8TQ1iRx0i4XpwFtkbDHMeKJczlFeNig

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

-- Started on 2026-03-03 04:50:16 +03

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16458)
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_accounts (
    id integer NOT NULL,
    iban text NOT NULL,
    user_id integer NOT NULL,
    bank_name text,
    status text DEFAULT 'active'::text,
    balance numeric(15,2) DEFAULT 0
);


ALTER TABLE public.bank_accounts OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16457)
-- Name: bank_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_accounts_id_seq OWNER TO postgres;

--
-- TOC entry 3505 (class 0 OID 0)
-- Dependencies: 217
-- Name: bank_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_accounts_id_seq OWNED BY public.bank_accounts.id;


--
-- TOC entry 220 (class 1259 OID 16476)
-- Name: saving_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saving_goals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    goal_name text NOT NULL,
    target_amount numeric(15,2) NOT NULL,
    current_amount numeric(15,2) DEFAULT 0,
    priority integer DEFAULT 1
);


ALTER TABLE public.saving_goals OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16475)
-- Name: saving_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saving_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saving_goals_id_seq OWNER TO postgres;

--
-- TOC entry 3506 (class 0 OID 0)
-- Dependencies: 219
-- Name: saving_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saving_goals_id_seq OWNED BY public.saving_goals.id;


--
-- TOC entry 221 (class 1259 OID 16491)
-- Name: saving_targets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saving_targets (
    user_id integer NOT NULL,
    target_amount numeric(15,2) NOT NULL
);


ALTER TABLE public.saving_targets OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16447)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone_number text,
    password text NOT NULL,
    national_id text,
    profile_image text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16446)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3507 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3336 (class 2604 OID 16461)
-- Name: bank_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts ALTER COLUMN id SET DEFAULT nextval('public.bank_accounts_id_seq'::regclass);


--
-- TOC entry 3339 (class 2604 OID 16479)
-- Name: saving_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saving_goals ALTER COLUMN id SET DEFAULT nextval('public.saving_goals_id_seq'::regclass);


--
-- TOC entry 3335 (class 2604 OID 16450)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3347 (class 2606 OID 16469)
-- Name: bank_accounts bank_accounts_iban_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_iban_user_id_key UNIQUE (iban, user_id);


--
-- TOC entry 3349 (class 2606 OID 16467)
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3351 (class 2606 OID 16485)
-- Name: saving_goals saving_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saving_goals
    ADD CONSTRAINT saving_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 3353 (class 2606 OID 16495)
-- Name: saving_targets saving_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saving_targets
    ADD CONSTRAINT saving_targets_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3343 (class 2606 OID 16456)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3345 (class 2606 OID 16454)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3354 (class 2606 OID 16470)
-- Name: bank_accounts bank_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3355 (class 2606 OID 16486)
-- Name: saving_goals saving_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saving_goals
    ADD CONSTRAINT saving_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3356 (class 2606 OID 16496)
-- Name: saving_targets saving_targets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saving_targets
    ADD CONSTRAINT saving_targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-03-03 04:50:16 +03

--
-- PostgreSQL database dump complete
--

\unrestrict ZA7NCCHPPlD9Bc05nS5y8FiLDQt6QEfN8TQ1iRx0i4XpwFtkbDHMeKJczlFeNig

