-- Stage 4K — Owner Inbox: control client-facing cabinet text
-- Additive only. Do NOT apply to production without explicit confirmation.

ALTER TABLE public.ckr_requests
  ADD COLUMN IF NOT EXISTS public_activity_text text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.ckr_requests.public_activity_text IS
  'Stage 4K — optional CUSTOM «Сейчас ЦКР» text. Empty = AUTO (deterministic Stage 4J).';
