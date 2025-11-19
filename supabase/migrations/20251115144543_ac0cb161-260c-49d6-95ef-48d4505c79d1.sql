-- Add class codes for easy student enrollment
CREATE TABLE IF NOT EXISTS public.class_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Track individual content item completion (videos, articles, exercises)
CREATE TABLE IF NOT EXISTS public.content_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  progress_type text NOT NULL, -- 'video', 'article', 'exercise'
  completion_percentage integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  last_position text, -- For videos: timestamp, for articles: scroll position
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, content_id)
);

-- Assignments system
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  instructions text,
  points numeric NOT NULL DEFAULT 100,
  due_date timestamp with time zone,
  allow_late_submission boolean DEFAULT true,
  late_penalty_percentage integer DEFAULT 0,
  rubric jsonb,
  attachment_urls text[],
  grading_type text DEFAULT 'manual', -- 'auto', 'manual', 'mixed'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_text text,
  file_paths text[],
  submitted_at timestamp with time zone,
  grade numeric,
  feedback text,
  graded_at timestamp with time zone,
  graded_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'draft', -- 'draft', 'submitted', 'graded'
  is_late boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'assignment_posted', 'assignment_due', 'assignment_graded', 'course_completed', 'achievement'
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Achievements system
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  criteria jsonb NOT NULL, -- Conditions to unlock
  points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Student achievements
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, achievement_id)
);

-- Activity logs for heatmap
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL, -- 'video_watched', 'article_read', 'exercise_completed', 'quiz_taken'
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  energy_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Add energy points and streak tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS energy_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date date;

-- Add class_code to classrooms
ALTER TABLE public.classrooms
ADD COLUMN IF NOT EXISTS class_code text UNIQUE;

-- Add completion tracking to student_courses
ALTER TABLE public.student_courses
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS certificate_url text;

-- Enable RLS on new tables
ALTER TABLE public.class_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_codes
CREATE POLICY "Teachers can manage class codes for their classes"
ON public.class_codes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_teachers ct
    WHERE ct.classroom_id = class_codes.classroom_id
    AND ct.teacher_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Students can view active class codes"
ON public.class_codes FOR SELECT
USING (active = true);

-- RLS Policies for content_progress
CREATE POLICY "Students can manage their own progress"
ON public.content_progress FOR ALL
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view student progress"
ON public.content_progress FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for assignments
CREATE POLICY "Teachers can manage their assignments"
ON public.assignments FOR ALL
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view assignments"
ON public.assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.classroom_id = assignments.classroom_id
    AND e.student_id = auth.uid()
  )
);

-- RLS Policies for assignment_submissions
CREATE POLICY "Students can manage their own submissions"
ON public.assignment_submissions FOR ALL
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view and grade submissions"
ON public.assignment_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
    AND a.teacher_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for notifications
CREATE POLICY "Users can manage their own notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

CREATE POLICY "Admins can manage achievements"
ON public.achievements FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for student_achievements
CREATE POLICY "Students can view their own achievements"
ON public.student_achievements FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can unlock achievements"
ON public.student_achievements FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- RLS Policies for activity_logs
CREATE POLICY "Students can create their own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own activity"
ON public.activity_logs FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all activity"
ON public.activity_logs FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_content_progress_updated_at
BEFORE UPDATE ON public.content_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_progress_student ON public.content_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_content_progress_content ON public.content_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_student ON public.activity_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON public.activity_logs(activity_date);