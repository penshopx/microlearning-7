-- Add missing thumbnail_url column to course_modules
ALTER TABLE course_modules 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Regenerate schema cache
NOTIFY pgrst, 'reload schema';