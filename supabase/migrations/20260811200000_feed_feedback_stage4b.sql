-- =============================================================================
-- Personalized Feed «Для вас» — Stage 4B feedback (PREPARED)
-- =============================================================================
-- Additive. Does NOT create Matching Engine / MATCHES edges / Synthesis.
-- Feedback is persistent; recommendations are computed on-demand.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.feed_feedback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  need_profile_id uuid REFERENCES public.need_profiles (id) ON DELETE SET NULL,
  item_type text NOT NULL
    CHECK (item_type IN (
      'project',
      'opportunity',
      'investment_offer',
      'expert',
      'need_profile',
      'lia_oi',
      'business_graph_node'
    )),
  item_id text NOT NULL,
  action text NOT NULL
    CHECK (action IN (
      'interested',
      'not_interested',
      'saved',
      'open',
      'assigned_to_lia',
      'impression'
    )),
  score numeric,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_feedback_events_user_idx
  ON public.feed_feedback_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feed_feedback_events_item_idx
  ON public.feed_feedback_events (item_type, item_id);
CREATE INDEX IF NOT EXISTS feed_feedback_events_need_idx
  ON public.feed_feedback_events (need_profile_id)
  WHERE need_profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS feed_feedback_events_not_interested_uidx
  ON public.feed_feedback_events (user_id, item_type, item_id)
  WHERE action = 'not_interested';

ALTER TABLE public.feed_feedback_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feed_feedback_events_select ON public.feed_feedback_events;
CREATE POLICY feed_feedback_events_select
  ON public.feed_feedback_events
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
    OR public.is_operator(auth.uid())
  );

DROP POLICY IF EXISTS feed_feedback_events_insert ON public.feed_feedback_events;
CREATE POLICY feed_feedback_events_insert
  ON public.feed_feedback_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.feed_feedback_events IS
  'Stage 4B Feed feedback. Not Matching Engine training data.';
