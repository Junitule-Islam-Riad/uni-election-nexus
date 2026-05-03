
-- 1. Community member approval status on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_status text NOT NULL DEFAULT 'pending'
    CHECK (community_status IN ('pending','approved','rejected'));

-- 2. Posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('image','video')),
  poll_options jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by everyone" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Approved members can post" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.user_id = auth.uid() AND p.community_status = 'approved')
  );

CREATE POLICY "Authors or admins update post" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Authors or admins delete post" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Reactions
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('like','love','celebrate','insightful')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone" ON public.post_reactions
  FOR SELECT USING (true);
CREATE POLICY "Auth users react" ON public.post_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own reaction" ON public.post_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own reaction" ON public.post_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 4. Comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone" ON public.post_comments
  FOR SELECT USING (true);
CREATE POLICY "Auth users comment" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author or admin delete comment" ON public.post_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- 5. Poll votes
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll votes viewable by everyone" ON public.poll_votes
  FOR SELECT USING (true);
CREATE POLICY "Auth users vote poll" ON public.poll_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. Storage bucket for media
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-media','community-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community media public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-media');
CREATE POLICY "Approved members upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.user_id = auth.uid() AND p.community_status = 'approved')
  );
CREATE POLICY "Owners delete own media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
