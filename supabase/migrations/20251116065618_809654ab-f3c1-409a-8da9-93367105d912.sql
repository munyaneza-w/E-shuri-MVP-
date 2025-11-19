-- Add class_year to subjects table for year-level courses
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS year_level text;

-- Update existing subjects to have proper year levels
-- We'll need to create separate course entries for each year level

-- Add default avatar URL to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create an admin panel table for system configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system settings
CREATE POLICY "Admins can manage system settings"
ON system_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Anyone can view system settings
CREATE POLICY "Anyone can view system settings"
ON system_settings
FOR SELECT
USING (true);

-- Create index for faster year-level filtering
CREATE INDEX IF NOT EXISTS idx_subjects_year_level ON subjects(year_level);
CREATE INDEX IF NOT EXISTS idx_profiles_class_year ON profiles(class_year);

-- Add trigger for system_settings updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();