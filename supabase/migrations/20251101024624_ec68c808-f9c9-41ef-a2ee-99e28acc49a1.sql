-- Create units table for organizing content under subjects by year
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  unit_number INTEGER NOT NULL,
  class_year class_year NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subject_id, class_year, unit_number)
);

-- Enable RLS on units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Anyone can view units
CREATE POLICY "Anyone can view units" 
ON public.units 
FOR SELECT 
USING (true);

-- Teachers and admins can manage units
CREATE POLICY "Teachers can manage units" 
ON public.units 
FOR ALL 
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add unit_id to content table
ALTER TABLE public.content 
ADD COLUMN unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_units_subject_year ON public.units(subject_id, class_year);
CREATE INDEX idx_content_unit ON public.content(unit_id);

-- Update trigger for units
CREATE TRIGGER update_units_updated_at
BEFORE UPDATE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Student enrollments for courses (many-to-many with subjects)
-- Using profiles table as there is no students table
CREATE TABLE public.student_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE(student_id, subject_id)
);

-- Enable RLS on student_courses
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;

-- Students can view their own courses
CREATE POLICY "Students can view their own courses" 
ON public.student_courses 
FOR SELECT 
USING (auth.uid() = student_id);

-- Students can enroll in courses
CREATE POLICY "Students can enroll in courses" 
ON public.student_courses 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Students can update their course progress
CREATE POLICY "Students can update their course progress" 
ON public.student_courses 
FOR UPDATE 
USING (auth.uid() = student_id);

-- Teachers and admins can view all course enrollments
CREATE POLICY "Teachers can view all course enrollments" 
ON public.student_courses 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_student_courses_student ON public.student_courses(student_id);
CREATE INDEX idx_student_courses_subject ON public.student_courses(subject_id);