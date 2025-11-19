-- ========================================
-- RwandaLearn Database Schema Migration (Part 2)
-- Add remaining tables for Khan Academy model
-- ========================================

-- 1. Create classrooms table
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level level_type NOT NULL,
  class_year class_year NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classrooms"
  ON public.classrooms FOR SELECT
  USING (true);

CREATE POLICY "Teachers and admins can manage classrooms"
  ON public.classrooms FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 2. Create classroom_teachers (many-to-many)
CREATE TABLE public.classroom_teachers (
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, teacher_id)
);

ALTER TABLE public.classroom_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their classrooms"
  ON public.classroom_teachers FOR SELECT
  USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and admins can manage classroom assignments"
  ON public.classroom_teachers FOR ALL
  USING (
    auth.uid() = teacher_id OR
    public.has_role(auth.uid(), 'admin')
  );

-- 3. Create enrollments (students to classrooms)
CREATE TABLE public.enrollments (
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, student_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers and admins can manage enrollments"
  ON public.enrollments FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 4. Update subjects table (add level field)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'both' CHECK (level IN ('O', 'A', 'both'));

-- 5. Create skills table (atomic learning objectives)
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills"
  ON public.skills FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage skills"
  ON public.skills FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Create CBC standards table
CREATE TABLE public.cbc_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cbc_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view CBC standards"
  ON public.cbc_standards FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage CBC standards"
  ON public.cbc_standards FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create item_skills (many-to-many linking items to skills)
CREATE TABLE public.item_skills (
  item_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, skill_id)
);

ALTER TABLE public.item_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view item skills"
  ON public.item_skills FOR SELECT
  USING (true);

CREATE POLICY "Teachers and admins can manage item skills"
  ON public.item_skills FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 8. Create item_cbc (many-to-many linking items to CBC standards)
CREATE TABLE public.item_cbc (
  item_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  cbc_id UUID REFERENCES public.cbc_standards(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, cbc_id)
);

ALTER TABLE public.item_cbc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view item CBC mappings"
  ON public.item_cbc FOR SELECT
  USING (true);

CREATE POLICY "Teachers and admins can manage item CBC mappings"
  ON public.item_cbc FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'teacher')
  );

-- 9. Update questions table (add skill_id, hints)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES public.skills(id);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS hints JSONB DEFAULT '[]';

-- 10. Create mastery table (Khan Academy style)
CREATE TABLE public.mastery (
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

ALTER TABLE public.mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own mastery"
  ON public.mastery FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own mastery"
  ON public.mastery FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can modify their own mastery"
  ON public.mastery FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers and admins can view all mastery"
  ON public.mastery FOR SELECT
  USING (
    public.has_role(auth.uid(), 'teacher') OR
    public.has_role(auth.uid(), 'admin')
  );

-- 11. Create teacher_subjects (many-to-many)
CREATE TABLE public.teacher_subjects (
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their subjects"
  ON public.teacher_subjects FOR SELECT
  USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and admins can manage teacher subjects"
  ON public.teacher_subjects FOR ALL
  USING (
    auth.uid() = teacher_id OR
    public.has_role(auth.uid(), 'admin')
  );

-- 12. Update quiz_attempts table (add hints_used)
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0;

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_school_id ON public.classrooms(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_classroom_id ON public.enrollments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_skills_subject_id ON public.skills(subject_id);
CREATE INDEX IF NOT EXISTS idx_mastery_student_id ON public.mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_mastery_skill_id ON public.mastery(skill_id);
CREATE INDEX IF NOT EXISTS idx_questions_skill_id ON public.questions(skill_id);