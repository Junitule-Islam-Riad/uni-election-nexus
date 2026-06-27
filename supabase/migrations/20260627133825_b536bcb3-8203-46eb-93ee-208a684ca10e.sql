
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  cover_image TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);

CREATE POLICY "Approved members create events" ON public.events FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.community_status = 'approved')
);

CREATE POLICY "Authors admins moderators update events" ON public.events FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin') OR public.is_any_moderator(auth.uid()));

CREATE POLICY "Authors admins moderators delete events" ON public.events FOR DELETE TO authenticated
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin') OR public.is_any_moderator(auth.uid()));

CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Reshare support
ALTER TABLE public.posts
  ADD COLUMN shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN shared_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
