-- Drop the old constraint
ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_content_type_check;

-- Add updated constraint with the correct content types
ALTER TABLE public.content ADD CONSTRAINT content_content_type_check 
CHECK (content_type IN ('text', 'file', 'url', 'book'));