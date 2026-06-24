
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';

-- 2. Faculty enum
DO $$ BEGIN
  CREATE TYPE public.faculty AS ENUM ('business_studies', 'humanities_social_law', 'science_engineering');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Approval status enum
DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS faculty public.faculty,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS batch text,
  ADD COLUMN IF NOT EXISTS student_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 5. Extend campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS faculty public.faculty,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS election_type text,
  ADD COLUMN IF NOT EXISTS cover_image text;

-- 6. Moderator assignments
CREATE TABLE IF NOT EXISTS public.moderator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  faculty public.faculty NOT NULL,
  assigned_by uuid,
  invited_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, faculty)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.moderator_assignments TO authenticated;
GRANT ALL ON public.moderator_assignments TO service_role;
ALTER TABLE public.moderator_assignments ENABLE ROW LEVEL SECURITY;

-- Helper: is moderator of faculty
CREATE OR REPLACE FUNCTION public.is_moderator_of(_user_id uuid, _faculty public.faculty)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.moderator_assignments
    WHERE user_id = _user_id AND faculty = _faculty
  );
$$;

CREATE OR REPLACE FUNCTION public.is_any_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.moderator_assignments WHERE user_id = _user_id);
$$;

-- moderator_assignments policies
DROP POLICY IF EXISTS "admins manage moderator assignments" ON public.moderator_assignments;
CREATE POLICY "admins manage moderator assignments" ON public.moderator_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "moderators read own assignments" ON public.moderator_assignments;
CREATE POLICY "moderators read own assignments" ON public.moderator_assignments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7. Profiles: admins/moderators can update approval_status
DROP POLICY IF EXISTS "admins moderators update profiles" ON public.profiles;
CREATE POLICY "admins moderators update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_any_moderator(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_any_moderator(auth.uid()));

-- 8. Posts: moderators can delete any
DROP POLICY IF EXISTS "admins moderators delete posts" ON public.posts;
CREATE POLICY "admins moderators delete posts" ON public.posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_any_moderator(auth.uid()));

DROP POLICY IF EXISTS "admins moderators delete comments" ON public.post_comments;
CREATE POLICY "admins moderators delete comments" ON public.post_comments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_any_moderator(auth.uid()) OR auth.uid() = user_id);

-- 9. Campaigns: moderators of the campaign's faculty can manage
DROP POLICY IF EXISTS "moderators manage faculty campaigns" ON public.campaigns;
CREATE POLICY "moderators manage faculty campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (faculty IS NOT NULL AND public.is_moderator_of(auth.uid(), faculty))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (faculty IS NOT NULL AND public.is_moderator_of(auth.uid(), faculty))
  );

-- 10. Update handle_new_user to default new users as 'student' role and capture metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, email, display_name, faculty, department, batch, student_id, phone, approval_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'faculty','')::public.faculty,
    NULLIF(NEW.raw_user_meta_data->>'department',''),
    NULLIF(NEW.raw_user_meta_data->>'batch',''),
    NULLIF(NEW.raw_user_meta_data->>'student_id',''),
    NULLIF(NEW.raw_user_meta_data->>'phone',''),
    'pending'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- 11. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
