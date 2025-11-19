-- Add book_cover_url column to content table for storing book cover images
ALTER TABLE public.content
ADD COLUMN book_cover_url TEXT;

COMMENT ON COLUMN public.content.book_cover_url IS 'URL or file path to the book cover image';
