-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-files', 'content-files', false);

-- Storage policies for content files
CREATE POLICY "Teachers can upload their own content files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-files' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'::user_role
  )
);

CREATE POLICY "Teachers can view their own content files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view content files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'content-files');

-- Add file_path column to content table
ALTER TABLE content ADD COLUMN file_path text;

-- Add quiz_type and deadline to quizzes table
ALTER TABLE quizzes 
ADD COLUMN quiz_type text NOT NULL DEFAULT 'quiz',
ADD COLUMN deadline timestamp with time zone;

-- Add submission_file_path to quiz_attempts for PDF submissions
ALTER TABLE quiz_attempts ADD COLUMN submission_file_path text;

-- Create storage bucket for quiz submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quiz-submissions', 'quiz-submissions', false);

-- Storage policies for quiz submissions
CREATE POLICY "Students can upload their own submissions"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'quiz-submissions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own submissions"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'quiz-submissions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view all submissions"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'quiz-submissions' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'teacher'::user_role
  )
);