
CREATE TABLE public.city_status (
  city_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'green' CHECK (status IN ('green','orange','red')),
  notes TEXT NOT NULL DEFAULT '',
  promoters_in_conversation TEXT[] NOT NULL DEFAULT '{}',
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.city_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_status readable by authenticated"
  ON public.city_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "city_status insert by authenticated"
  ON public.city_status FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "city_status update by authenticated"
  ON public.city_status FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.city_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL,
  change_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_city_status_log_city ON public.city_status_log(city_id, changed_at DESC);

ALTER TABLE public.city_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "city_status_log readable by authenticated"
  ON public.city_status_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "city_status_log insert by authenticated"
  ON public.city_status_log FOR INSERT TO authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.city_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_status_log;
ALTER TABLE public.city_status REPLICA IDENTITY FULL;
ALTER TABLE public.city_status_log REPLICA IDENTITY FULL;
