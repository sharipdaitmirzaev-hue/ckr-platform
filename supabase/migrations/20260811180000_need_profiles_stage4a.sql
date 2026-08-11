-- =============================================================================
-- Need Profile / Universal Intent — Stage 4A (PREPARED)
-- =============================================================================
-- Additive only. Does NOT alter lia_oi_*, marketplace core, or business_graph_*.
-- Matching / Feed / Synthesis / Scheduler are OUT OF SCOPE.
-- Apply to production only after explicit owner confirmation.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.need_profile_intent_catalog (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true
);

INSERT INTO public.need_profile_intent_catalog (code, label, description) VALUES
  ('INVEST', 'Вложить деньги', 'Инвестировать капитал'),
  ('SEEK_INVESTMENT', 'Найти инвестора', 'Привлечь финансирование'),
  ('BUY_BUSINESS', 'Купить бизнес', 'Приобрести готовый бизнес'),
  ('SELL_BUSINESS', 'Продать бизнес', 'Продать действующий бизнес'),
  ('BUY_PROPERTY', 'Купить помещение/землю', 'Приобрести недвижимость/площадку'),
  ('SELL_PROPERTY', 'Продать помещение/землю', 'Продать недвижимость/площадку'),
  ('SEEK_PROJECT', 'Найти проект', 'Найти проект для участия/инвестиций'),
  ('SEEK_PARTNER', 'Найти партнёра', 'Деловое партнёрство / JV'),
  ('SEEK_SUPPLIER', 'Найти поставщика', 'Закупка товара/услуги'),
  ('SEEK_BUYER', 'Найти покупателя', 'Сбыт / дистрибуция'),
  ('SEEK_EXPERT', 'Найти эксперта', 'Экспертиза / услуги'),
  ('SEEK_EQUIPMENT', 'Найти оборудование', 'Покупка/аренда оборудования'),
  ('SELL_EQUIPMENT', 'Продать оборудование', 'Продажа оборудования'),
  ('SEEK_SUPPORT', 'Найти господдержку', 'Гранты / субсидии / льготы'),
  ('SEEK_CONTRACT', 'Найти контракт/заказ', 'Контракт / закупка / оффтейк'),
  ('SUPPLY', 'Предлагаю поставку', 'Предложение supply-side'),
  ('DEMAND', 'Заявляю потребность', 'Общая потребность / спрос')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.need_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_type text NOT NULL
    REFERENCES public.need_profile_intent_catalog (code),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',

  owner_type text NOT NULL
    CHECK (owner_type IN ('user', 'organization', 'project')),
  owner_id uuid NOT NULL,

  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'FULFILLED', 'ARCHIVED')),

  budget_min numeric
    CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max numeric
    CHECK (budget_max IS NULL OR budget_max >= 0),
  currency text NOT NULL DEFAULT 'RUB',

  regions text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',

  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,

  visibility text NOT NULL DEFAULT 'CKR_ONLY'
    CHECK (visibility IN ('PRIVATE', 'CKR_ONLY', 'PUBLIC')),

  priority text
    CHECK (priority IS NULL OR priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  time_horizon text,
  risk_preference text
    CHECK (
      risk_preference IS NULL
      OR risk_preference IN ('LOW', 'MEDIUM', 'HIGH')
    ),

  matching_enabled boolean NOT NULL DEFAULT true,
  last_matched_at timestamptz,

  context_group_id uuid,
  fingerprint text,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'lia_nl', 'onboarding')),

  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CHECK (
    budget_min IS NULL
    OR budget_max IS NULL
    OR budget_max >= budget_min
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS need_profiles_fingerprint_uidx
  ON public.need_profiles (fingerprint)
  WHERE fingerprint IS NOT NULL
    AND fingerprint <> ''
    AND status IN ('DRAFT', 'ACTIVE', 'PAUSED');

CREATE INDEX IF NOT EXISTS need_profiles_owner_idx
  ON public.need_profiles (owner_type, owner_id);
CREATE INDEX IF NOT EXISTS need_profiles_intent_idx
  ON public.need_profiles (intent_type);
CREATE INDEX IF NOT EXISTS need_profiles_status_idx
  ON public.need_profiles (status);
CREATE INDEX IF NOT EXISTS need_profiles_visibility_idx
  ON public.need_profiles (visibility);
CREATE INDEX IF NOT EXISTS need_profiles_created_at_idx
  ON public.need_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS need_profiles_context_group_idx
  ON public.need_profiles (context_group_id)
  WHERE context_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS need_profiles_matching_idx
  ON public.need_profiles (matching_enabled, status)
  WHERE matching_enabled = true AND status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS public.need_profile_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_profile_id uuid NOT NULL
    REFERENCES public.need_profiles (id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN (
      'CREATED',
      'UPDATED',
      'STATUS_CHANGED',
      'CONFIRMED_FROM_NL',
      'GRAPH_BRIDGED',
      'ARCHIVED'
    )),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS need_profile_events_need_idx
  ON public.need_profile_events (need_profile_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Helpers for RLS ownership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_need_profile(
  p_owner_type text,
  p_owner_id uuid,
  p_uid uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_uid IS NULL THEN false
    WHEN public.is_admin(p_uid) OR public.is_operator(p_uid) THEN true
    WHEN p_owner_type = 'user' THEN p_owner_id = p_uid
    WHEN p_owner_type = 'organization' THEN public.is_org_member(p_owner_id, p_uid)
    WHEN p_owner_type = 'project' THEN EXISTS (
      SELECT 1 FROM public.projects pr
      WHERE pr.id = p_owner_id AND pr.owner_id = p_uid
    )
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_need_profile(text, uuid, uuid)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.need_profile_intent_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_profile_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS need_profile_intent_catalog_select ON public.need_profile_intent_catalog;
CREATE POLICY need_profile_intent_catalog_select
  ON public.need_profile_intent_catalog
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS need_profiles_select ON public.need_profiles;
CREATE POLICY need_profiles_select
  ON public.need_profiles
  FOR SELECT TO authenticated
  USING (
    public.can_manage_need_profile(owner_type, owner_id, auth.uid())
    OR visibility = 'PUBLIC'
  );

DROP POLICY IF EXISTS need_profiles_insert ON public.need_profiles;
CREATE POLICY need_profiles_insert
  ON public.need_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_need_profile(owner_type, owner_id, auth.uid())
  );

DROP POLICY IF EXISTS need_profiles_update ON public.need_profiles;
CREATE POLICY need_profiles_update
  ON public.need_profiles
  FOR UPDATE TO authenticated
  USING (public.can_manage_need_profile(owner_type, owner_id, auth.uid()))
  WITH CHECK (public.can_manage_need_profile(owner_type, owner_id, auth.uid()));

DROP POLICY IF EXISTS need_profiles_delete ON public.need_profiles;
CREATE POLICY need_profiles_delete
  ON public.need_profiles
  FOR DELETE TO authenticated
  USING (public.can_manage_need_profile(owner_type, owner_id, auth.uid()));

DROP POLICY IF EXISTS need_profile_events_select ON public.need_profile_events;
CREATE POLICY need_profile_events_select
  ON public.need_profile_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.need_profiles np
      WHERE np.id = need_profile_id
        AND (
          public.can_manage_need_profile(np.owner_type, np.owner_id, auth.uid())
          OR np.visibility = 'PUBLIC'
        )
    )
  );

DROP POLICY IF EXISTS need_profile_events_insert ON public.need_profile_events;
CREATE POLICY need_profile_events_insert
  ON public.need_profile_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.need_profiles np
      WHERE np.id = need_profile_id
        AND public.can_manage_need_profile(np.owner_type, np.owner_id, auth.uid())
    )
  );

COMMENT ON TABLE public.need_profiles IS
  'Stage 4A Universal Intent / Need Profile. Not Matching Engine.';
COMMENT ON COLUMN public.need_profiles.matching_enabled IS
  'Prep for Matching Engine; unused by Stage 4A automation.';
COMMENT ON COLUMN public.need_profiles.criteria IS
  'Type-specific structured criteria (ticket, equity, volume, etc.).';
