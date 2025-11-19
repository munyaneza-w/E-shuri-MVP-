-- ========================================
-- RwandaLearn Database Schema Migration (Part 1)
-- Fix: Update RLS policies before dropping role column
-- ========================================

-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.level_type AS ENUM ('O', 'A');
CREATE TYPE public.class_year AS ENUM ('S1', 'S2', 'S3', 'S4', 'S5');
CREATE TYPE public.a_level_option AS ENUM ('PCB', 'PCM', 'MEG', 'HEG', 'HK', 'LKK');

-- 2. Create user_roles table (SECURITY FIX - roles in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Drop and recreate RLS policies that depend on profiles.role
-- Subjects policies
DROP POLICY IF EXISTS "Teachers can manage subjects" ON public.subjects;
CREATE POLICY "Teachers can manage subjects"
  ON public.subjects FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- Content policies
DROP POLICY IF EXISTS "Teachers can manage their own content" ON public.content;
CREATE POLICY "Teachers can manage their own content"
  ON public.content FOR ALL
  USING (
    auth.uid() = teacher_id AND
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
  );

-- Quizzes policies  
DROP POLICY IF EXISTS "Teachers can manage their own quizzes" ON public.quizzes;
CREATE POLICY "Teachers can manage their own quizzes"
  ON public.quizzes FOR ALL
  USING (
    auth.uid() = teacher_id AND
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
  );

-- Questions policies
DROP POLICY IF EXISTS "Teachers can manage questions for their quizzes" ON public.questions;
CREATE POLICY "Teachers can manage questions for their quizzes"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = questions.quiz_id
      AND q.teacher_id = auth.uid()
      AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Quiz attempts policies
DROP POLICY IF EXISTS "Teachers can view all attempts" ON public.quiz_attempts;
CREATE POLICY "Teachers can view all attempts"
  ON public.quiz_attempts FOR SELECT
  USING (
    public.has_role(auth.uid(), 'teacher') OR
    public.has_role(auth.uid(), 'admin')
  );

-- Storage policies
DROP POLICY IF EXISTS "Teachers can upload their own content files" ON storage.objects;
CREATE POLICY "Teachers can upload their own content files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'content-files' AND
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Teachers can view all submissions" ON storage.objects;
CREATE POLICY "Teachers can view all submissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quiz-submissions' AND
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
  );

-- 7. Now safely drop the role column from profiles
ALTER TABLE public.profiles DROP COLUMN role;

-- 8. Add new fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('rw', 'en'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age BETWEEN 10 AND 30);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level level_type;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_year class_year;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS a_level_option a_level_option;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id UUID;

-- 9. Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  district TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schools"
  ON public.schools FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage schools"
  ON public.schools FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. Add foreign key to profiles after schools table exists
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_school 
  FOREIGN KEY (school_id) REFERENCES public.schools(id);

-- 11. Add constraint for A-level option
ALTER TABLE public.profiles ADD CONSTRAINT check_a_level_option
  CHECK (
    (level = 'A' AND a_level_option IS NOT NULL) OR
    (level = 'O') OR
    (level IS NULL)
  );

-- 12. Update trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User')
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  
  RETURN new;
END;
$$;